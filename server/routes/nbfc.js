const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// POST /api/v1/nbfc/submit-application - Submit to NBFC
router.post('/submit-application', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { consumer_id, battery_id, amount, tenure_months, interest_rate } = req.body;
    const dealerId = req.user.userId;
    
    if (!consumer_id || !battery_id || !amount || !tenure_months) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify consumer belongs to dealer
    if (req.user.role === 'dealer') {
      const consumerCheck = await pool.query(
        'SELECT id FROM consumers WHERE id = $1 AND dealer_id = $2',
        [consumer_id, dealerId]
      );
      
      if (consumerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Consumer not found or access denied' });
      }
    }
    
    // Create NBFC application
    const result = await pool.query(`
      INSERT INTO nbfc_applications (
        consumer_id, battery_id, amount, tenure_months, interest_rate, 
        dealer_id, status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW())
      RETURNING *
    `, [consumer_id, battery_id, amount, tenure_months, interest_rate || 12, dealerId]);
    
    res.status(201).json({
      success: true,
      application: result.rows[0],
      message: 'Application submitted to NBFC successfully'
    });
  } catch (error) {
    console.error('NBFC application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/nbfc/applications - List NBFC applications
router.get('/applications', authenticateToken, requireRole(['dealer', 'admin', 'nbfc']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let query = `
      SELECT na.*, c.name as consumer_name, c.phone as consumer_phone,
             b.serial_number as battery_serial, u.name as dealer_name
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      JOIN batteries b ON na.battery_id = b.id
      JOIN users u ON na.dealer_id = u.id
    `;
    
    let params = [];
    let whereClause = '';
    
    // Dealers can only see their own applications
    if (req.user.role === 'dealer') {
      whereClause = 'WHERE na.dealer_id = $1';
      params.push(userId);
    }
    
    query += whereClause + ' ORDER BY na.submitted_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      applications: result.rows
    });
  } catch (error) {
    console.error('NBFC applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/nbfc/application-status - Check NBFC status
router.get('/application-status/:id', authenticateToken, requireRole(['dealer', 'admin', 'nbfc']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    let query = `
      SELECT na.*, c.name as consumer_name, c.phone as consumer_phone,
             b.serial_number as battery_serial, u.name as dealer_name
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      JOIN batteries b ON na.battery_id = b.id
      JOIN users u ON na.dealer_id = u.id
      WHERE na.id = $1
    `;
    
    let params = [id];
    
    // Dealers can only see their own applications
    if (req.user.role === 'dealer') {
      query += ' AND na.dealer_id = $2';
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({
      success: true,
      application: result.rows[0]
    });
  } catch (error) {
    console.error('NBFC status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/nbfc/disbursement - Record disbursement
router.post('/disbursement', authenticateToken, requireRole(['nbfc', 'admin']), async (req, res) => {
  try {
    const { application_id, disbursed_amount, disbursement_date, loan_account_number } = req.body;
    
    if (!application_id || !disbursed_amount || !loan_account_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update application status
    await pool.query(`
      UPDATE nbfc_applications 
      SET status = 'disbursed', disbursed_amount = $1, disbursement_date = $2, 
          loan_account_number = $3, updated_at = NOW()
      WHERE id = $4
    `, [disbursed_amount, disbursement_date, loan_account_number, application_id]);
    
    // Create EMI schedule
    const appResult = await pool.query(
      'SELECT * FROM nbfc_applications WHERE id = $1',
      [application_id]
    );
    
    if (appResult.rows.length > 0) {
      const app = appResult.rows[0];
      const monthlyEMI = (disbursed_amount * (1 + app.interest_rate / 100)) / app.tenure_months;
      
      // Create EMI schedule entries
      for (let i = 1; i <= app.tenure_months; i++) {
        const dueDate = new Date(disbursement_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await pool.query(`
          INSERT INTO emi_schedules (
            application_id, emi_number, amount, due_date, status
          ) VALUES ($1, $2, $3, $4, 'pending')
        `, [application_id, i, monthlyEMI, dueDate]);
      }
    }
    
    res.json({
      success: true,
      message: 'Disbursement recorded successfully'
    });
  } catch (error) {
    console.error('NBFC disbursement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/nbfc/portfolio - Portfolio analytics
router.get('/portfolio', authenticateToken, requireRole(['nbfc', 'admin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE na.submitted_at BETWEEN $1 AND $2';
      params = [start_date, end_date];
    }
    
    const portfolioQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN na.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN na.status = 'disbursed' THEN 1 END) as disbursed_count,
        COUNT(CASE WHEN na.status = 'rejected' THEN 1 END) as rejected_count,
        SUM(CASE WHEN na.status = 'disbursed' THEN na.disbursed_amount ELSE 0 END) as total_disbursed,
        AVG(CASE WHEN na.status = 'disbursed' THEN na.tenure_months ELSE NULL END) as avg_tenure
      FROM nbfc_applications na
      ${dateFilter}
    `;
    
    const portfolioResult = await pool.query(portfolioQuery, params);
    
    // Get monthly disbursement trends
    const trendsQuery = `
      SELECT 
        DATE_TRUNC('month', na.disbursement_date) as month,
        COUNT(*) as disbursements,
        SUM(na.disbursed_amount) as amount
      FROM nbfc_applications na
      WHERE na.status = 'disbursed' AND na.disbursement_date IS NOT NULL
      GROUP BY DATE_TRUNC('month', na.disbursement_date)
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const trendsResult = await pool.query(trendsQuery);
    
    res.json({
      success: true,
      portfolio: portfolioResult.rows[0],
      trends: trendsResult.rows
    });
  } catch (error) {
    console.error('NBFC portfolio error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/nbfc/collection-report - Collection reporting
router.post('/collection-report', authenticateToken, requireRole(['nbfc', 'admin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const collectionQuery = `
      SELECT 
        es.application_id,
        na.loan_account_number,
        c.name as consumer_name,
        c.phone as consumer_phone,
        es.emi_number,
        es.amount,
        es.due_date,
        es.status,
        es.payment_date,
        es.payment_amount
      FROM emi_schedules es
      JOIN nbfc_applications na ON es.application_id = na.id
      JOIN consumers c ON na.consumer_id = c.id
      WHERE es.due_date BETWEEN $1 AND $2
      ORDER BY es.due_date, na.loan_account_number
    `;
    
    const collectionResult = await pool.query(collectionQuery, [start_date, end_date]);
    
    // Calculate collection metrics
    const totalEMIs = collectionResult.rows.length;
    const paidEMIs = collectionResult.rows.filter(row => row.status === 'paid').length;
    const overdueEMIs = collectionResult.rows.filter(row => 
      row.status === 'pending' && new Date(row.due_date) < new Date()
    ).length;
    
    const totalAmount = collectionResult.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
    const collectedAmount = collectionResult.rows
      .filter(row => row.status === 'paid')
      .reduce((sum, row) => sum + parseFloat(row.payment_amount || 0), 0);
    
    res.json({
      success: true,
      report: {
        period: { start_date, end_date },
        summary: {
          total_emis: totalEMIs,
          paid_emis: paidEMIs,
          overdue_emis: overdueEMIs,
          collection_rate: totalEMIs > 0 ? ((paidEMIs / totalEMIs) * 100).toFixed(2) : 0,
          total_amount: totalAmount,
          collected_amount: collectedAmount,
          outstanding_amount: totalAmount - collectedAmount
        },
        details: collectionResult.rows
      }
    });
  } catch (error) {
    console.error('NBFC collection report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 