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

// POST /api/v1/nbfc/webhook-status - Handle NBFC status webhooks
router.post('/webhook-status', async (req, res) => {
  try {
    const { applicationId, status, sanctionedAmount, interestRate, emiAmount, disbursementDate } = req.body;
    
    if (!applicationId || !status) {
      return res.status(400).json({ error: 'Application ID and status are required' });
    }
    
    // Find the application
    const appResult = await pool.query(
      'SELECT * FROM nbfc_applications WHERE id = $1',
      [applicationId]
    );
    
    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = appResult.rows[0];
    
    // Update application status
    let updateQuery = 'UPDATE nbfc_applications SET status = $1';
    let updateParams = [status];
    
    if (status === 'approved' && sanctionedAmount) {
      updateQuery += ', sanctioned_amount = $2, interest_rate = $3, emi_amount = $4';
      updateParams.push(sanctionedAmount, interestRate || 12, emiAmount);
    }
    
    if (status === 'disbursed' && disbursementDate) {
      updateQuery += ', disbursed_amount = $2, disbursement_date = $3';
      updateParams.push(sanctionedAmount || application.amount, disbursementDate);
    }
    
    updateQuery += ' WHERE id = $' + (updateParams.length + 1) + ' RETURNING *';
    updateParams.push(applicationId);
    
    const result = await pool.query(updateQuery, updateParams);
    
    // If disbursed, create EMI schedule
    if (status === 'disbursed' && result.rows[0].tenure_months) {
      const emiAmount = (sanctionedAmount || application.amount) / result.rows[0].tenure_months;
      
      for (let i = 1; i <= result.rows[0].tenure_months; i++) {
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await pool.query(
          'INSERT INTO emi_schedules (application_id, emi_number, due_date, amount, status) VALUES ($1, $2, $3, $4, $5)',
          [applicationId, i, dueDate.toISOString().split('T')[0], emiAmount.toFixed(2), 'pending']
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Error processing NBFC webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/nbfc/portfolio - Get NBFC portfolio analytics
router.get('/portfolio', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'WHERE c.dealer_id = $1';
      params = [userId];
    }
    
    // Portfolio summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN na.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN na.status = 'disbursed' THEN 1 END) as disbursed_count,
        COUNT(CASE WHEN na.status = 'rejected' THEN 1 END) as rejected_count,
        SUM(CASE WHEN na.status = 'disbursed' THEN na.disbursed_amount ELSE 0 END) as total_disbursed,
        AVG(CASE WHEN na.status = 'disbursed' THEN na.interest_rate ELSE NULL END) as avg_interest_rate
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      ${whereClause}
    `;
    
    const summaryResult = await pool.query(summaryQuery, params);
    
    // Monthly disbursement trend
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', na.disbursement_date) as month,
        COUNT(*) as applications,
        SUM(na.disbursed_amount) as amount_disbursed
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      WHERE na.status = 'disbursed' AND na.disbursement_date IS NOT NULL
        ${whereClause ? whereClause.replace('WHERE', 'AND') : ''}
      GROUP BY DATE_TRUNC('month', na.disbursement_date)
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const trendResult = await pool.query(trendQuery, params);
    
    res.json({
      portfolio_summary: summaryResult.rows[0],
      monthly_trend: trendResult.rows,
      portfolio_health: {
        approval_rate: summaryResult.rows[0].total_applications > 0 ? 
          (summaryResult.rows[0].approved_count / summaryResult.rows[0].total_applications * 100).toFixed(1) : 0,
        disbursement_rate: summaryResult.rows[0].total_applications > 0 ? 
          (summaryResult.rows[0].disbursed_count / summaryResult.rows[0].total_applications * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching NBFC portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/nbfc/collection-report - Submit collection report to NBFC
router.post('/collection-report', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { report_date, collection_data } = req.body;
    
    if (!report_date || !collection_data) {
      return res.status(400).json({ error: 'Report date and collection data are required' });
    }
    
    // Mock NBFC API call - in production, this would call actual NBFC API
    const mockNBFCResponse = {
      success: true,
      report_id: `RPT${Date.now()}`,
      status: 'submitted',
      message: 'Collection report submitted successfully to NBFC',
      timestamp: new Date().toISOString()
    };
    
    // Store collection report locally
    const reportQuery = `
      INSERT INTO nbfc_collection_reports (
        dealer_id, report_date, collection_data, nbfc_response, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(reportQuery, [
      req.user.userId,
      report_date,
      JSON.stringify(collection_data),
      JSON.stringify(mockNBFCResponse)
    ]);
    
    res.json({
      success: true,
      message: 'Collection report submitted successfully',
      report: result.rows[0],
      nbfc_response: mockNBFCResponse,
      note: 'This is a mock NBFC integration. In production, implement actual NBFC API calls.'
    });
  } catch (error) {
    console.error('Error submitting collection report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/nbfc/application-status/:id - Get detailed application status
router.get('/application-status/:id', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        na.*,
        c.name as consumer_name,
        c.phone as consumer_phone,
        b.serial_number as battery_serial,
        COUNT(es.id) as total_emis,
        COUNT(CASE WHEN es.status = 'paid' THEN 1 END) as paid_emis,
        COUNT(CASE WHEN es.status = 'pending' THEN 1 END) as pending_emis,
        COUNT(CASE WHEN es.status = 'overdue' THEN 1 END) as overdue_emis
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      JOIN batteries b ON na.battery_id = b.id
      LEFT JOIN emi_schedules es ON na.id = es.application_id
      WHERE na.id = $1
      GROUP BY na.id, c.id, b.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = result.rows[0];
    
    // Get EMI details
    const emiQuery = `
      SELECT * FROM emi_schedules 
      WHERE application_id = $1 
      ORDER BY emi_number
    `;
    
    const emiResult = await pool.query(emiQuery, [id]);
    
    res.json({
      application,
      emi_details: emiResult.rows,
        summary: {
        total_emis: application.total_emis,
        paid_emis: application.paid_emis,
        pending_emis: application.pending_emis,
        overdue_emis: application.overdue_emis,
        collection_rate: application.total_emis > 0 ? 
          (application.paid_emis / application.total_emis * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 