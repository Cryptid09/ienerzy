const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// Mock NBFC API response
async function mockNBFCApproval(applicationData) {
  // Simulate 2-second delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Always approve for demo
  return {
    approved: true,
    loanId: `LOAN${Date.now()}`,
    amount: applicationData.amount,
    interestRate: 12.5,
    tenure: 12,
    monthlyEMI: (applicationData.amount * 1.125) / 12
  };
}

// Generate EMI schedule
function generateEMISchedule(financeId, amount, tenure) {
  const monthlyEMI = amount / tenure;
  const schedule = [];
  
  for (let i = 1; i <= tenure; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      finance_id: financeId,
      due_date: dueDate.toISOString().split('T')[0],
      amount: monthlyEMI,
      status: 'pending'
    });
  }
  
  return schedule;
}

// POST /finance/applications - Create finance application
router.post('/applications', authenticateToken, requireRole(['dealer']), async (req, res) => {
  try {
    const { consumer_id, battery_id, amount } = req.body;
    const dealerId = req.user.userId;
    
    if (!consumer_id || !battery_id || !amount) {
      return res.status(400).json({ error: 'Consumer ID, battery ID, and amount are required' });
    }
    
    // Verify consumer belongs to dealer
    const consumerResult = await pool.query(
      'SELECT * FROM consumers WHERE id = $1 AND dealer_id = $2',
      [consumer_id, dealerId]
    );
    
    if (consumerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    // Create finance application
    const applicationResult = await pool.query(
      'INSERT INTO finance_applications (consumer_id, battery_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [consumer_id, battery_id, amount, 'pending']
    );
    
    const application = applicationResult.rows[0];
    
    // Mock NBFC approval
    const nbfcResponse = await mockNBFCApproval({ amount });
    
    if (nbfcResponse.approved) {
      // Update application status
      await pool.query(
        'UPDATE finance_applications SET status = $1 WHERE id = $2',
        ['approved', application.id]
      );
      
      // Generate EMI schedule
      const emiSchedule = generateEMISchedule(application.id, amount, 12);
      
      for (const emi of emiSchedule) {
        await pool.query(
          'INSERT INTO emi_schedules (finance_id, due_date, amount, status) VALUES ($1, $2, $3, $4)',
          [emi.finance_id, emi.due_date, emi.amount, emi.status]
        );
      }
      
      application.status = 'approved';
      application.emi_schedule = emiSchedule;
    }
    
    res.status(201).json({
      application,
      nbfc_response: nbfcResponse
    });
  } catch (error) {
    console.error('Error creating finance application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /finance/applications - List finance applications
router.get('/applications', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = `
      SELECT fa.*, c.name as consumer_name, c.phone as consumer_phone,
             b.serial_number as battery_serial
      FROM finance_applications fa
      JOIN consumers c ON fa.consumer_id = c.id
      JOIN batteries b ON fa.battery_id = b.id
    `;
    
    let params = [];
    
    if (dealerId) {
      query += ' WHERE c.dealer_id = $1';
      params.push(dealerId);
    }
    
    query += ' ORDER BY fa.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching finance applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /finance/applications/:id - Get finance application details
router.get('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = `
      SELECT fa.*, c.name as consumer_name, c.phone as consumer_phone,
             b.serial_number as battery_serial
      FROM finance_applications fa
      JOIN consumers c ON fa.consumer_id = c.id
      JOIN batteries b ON fa.battery_id = b.id
      WHERE fa.id = $1
    `;
    
    let params = [id];
    
    if (dealerId) {
      query += ' AND c.dealer_id = $2';
      params.push(dealerId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Finance application not found' });
    }
    
    const application = result.rows[0];
    
    // Get EMI schedule
    const emiResult = await pool.query(
      'SELECT * FROM emi_schedules WHERE finance_id = $1 ORDER BY due_date',
      [id]
    );
    
    application.emi_schedule = emiResult.rows;
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching finance application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /finance/emi-payment - Process EMI payment
router.post('/emi-payment', authenticateToken, async (req, res) => {
  try {
    const { emi_id, payment_amount } = req.body;
    
    if (!emi_id || !payment_amount) {
      return res.status(400).json({ error: 'EMI ID and payment amount are required' });
    }

    // Mock payment gateway response
    const paymentStatus = 'success'; // Always success for demo
    
    if (paymentStatus === 'success') {
      const result = await pool.query(
        'UPDATE emi_schedules SET status = $1 WHERE id = $2 RETURNING *',
        ['paid', emi_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'EMI not found' });
      }
      
      res.json({
        success: true,
        message: 'EMI payment processed successfully',
        emi: result.rows[0]
      });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error processing EMI payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /finance/emi-due - Get EMI due list
router.get('/emi-due', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = `
      SELECT es.*, fa.amount as total_amount, c.name as consumer_name, c.phone as consumer_phone,
             b.serial_number as battery_serial
      FROM emi_schedules es
      JOIN finance_applications fa ON es.finance_id = fa.id
      JOIN consumers c ON fa.consumer_id = c.id
      JOIN batteries b ON fa.battery_id = b.id
      WHERE es.status IN ('pending', 'overdue')
    `;
    
    let params = [];
    
    if (dealerId) {
      query += ' AND c.dealer_id = $1';
      params.push(dealerId);
    }
    
    query += ' ORDER BY es.due_date ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching EMI due list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /finance/applications/:id/approve - Approve/reject finance application
router.put('/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_amount, interest_rate, tenure_months } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    if (status === 'approved' && (!approved_amount || !interest_rate || !tenure_months)) {
      return res.status(400).json({ error: 'Approved amount, interest rate, and tenure are required for approval' });
    }
    
    const result = await pool.query(
      'UPDATE finance_applications SET status = $1, approved_amount = $2, interest_rate = $3, tenure_months = $4 WHERE id = $5 RETURNING *',
      [status, approved_amount, interest_rate, tenure_months, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // If approved, create EMI schedule
    if (status === 'approved') {
      const emiAmount = (approved_amount / tenure_months).toFixed(2);
      
      for (let i = 1; i <= tenure_months; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await pool.query(
          'INSERT INTO emi_schedules (finance_id, emi_number, due_date, amount, status) VALUES ($1, $2, $3, $4, $5)',
          [id, i, dueDate.toISOString().split('T')[0], emiAmount, 'pending']
        );
      }
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /finance/overdue - Get overdue accounts
router.get('/overdue', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'AND c.dealer_id = $2';
      params = [userId];
    }
    
    const query = `
      SELECT 
        es.*,
        na.amount as loan_amount,
        na.tenure_months,
        c.name as consumer_name,
        c.phone as consumer_phone,
        b.serial_number as battery_serial,
        EXTRACT(DAYS FROM CURRENT_DATE - es.due_date) as overdue_days
      FROM emi_schedules es
      JOIN nbfc_applications na ON es.application_id = na.id
      JOIN consumers c ON na.consumer_id = c.id
      JOIN batteries b ON na.battery_id = b.id
      WHERE es.status = 'pending' 
        AND es.due_date < CURRENT_DATE
        ${whereClause}
      ORDER BY es.due_date ASC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      overdue_accounts: result.rows,
      total_overdue: result.rows.length,
      total_overdue_amount: result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0)
    });
  } catch (error) {
    console.error('Error fetching overdue accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /finance/auto-disable - Trigger battery disable for overdue accounts
router.post('/auto-disable', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { overdue_days_threshold = 7 } = req.body;
    
    // Find batteries with overdue EMIs beyond threshold
    const overdueQuery = `
      SELECT DISTINCT b.id, b.serial_number, b.owner_id
      FROM batteries b
      JOIN nbfc_applications na ON b.id = na.battery_id
      JOIN emi_schedules es ON na.id = es.application_id
      WHERE es.status = 'pending' 
        AND es.due_date < CURRENT_DATE - INTERVAL '${overdue_days_threshold} days'
        AND b.status = 'active'
    `;
    
    const overdueResult = await pool.query(overdueQuery);
    
    if (overdueResult.rows.length === 0) {
      return res.json({ 
        message: 'No batteries to disable',
        disabled_count: 0 
      });
    }
    
    // Disable batteries
    const batteryIds = overdueResult.rows.map(row => row.id);
    await pool.query(
      'UPDATE batteries SET status = $1 WHERE id = ANY($2)',
      ['inactive', batteryIds]
    );
    
    // Update EMI status to overdue
    await pool.query(`
      UPDATE emi_schedules 
      SET status = 'overdue' 
      WHERE application_id IN (
        SELECT na.id FROM nbfc_applications na 
        WHERE na.battery_id = ANY($1)
      ) AND status = 'pending' AND due_date < CURRENT_DATE
    `, [batteryIds]);
    
    res.json({
      message: 'Batteries disabled successfully',
      disabled_count: overdueResult.rows.length,
      disabled_batteries: overdueResult.rows.map(row => row.serial_number)
    });
  } catch (error) {
    console.error('Error auto-disabling batteries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /finance/collection-report - Get collection analytics
router.get('/collection-report', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start_date, end_date } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'AND c.dealer_id = $1';
      params = [userId];
    }
    
    if (start_date && end_date) {
      whereClause += ` AND es.payment_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(start_date, end_date);
    }
    
    const query = `
      SELECT 
        DATE(es.payment_date) as collection_date,
        COUNT(*) as collections_count,
        SUM(es.payment_amount) as total_collected,
        AVG(es.payment_amount) as avg_collection
      FROM emi_schedules es
      JOIN nbfc_applications na ON es.application_id = na.id
      JOIN consumers c ON na.consumer_id = c.id
      WHERE es.status = 'paid' AND es.payment_date IS NOT NULL
        ${whereClause}
      GROUP BY DATE(es.payment_date)
      ORDER BY collection_date DESC
      LIMIT 30
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      collection_report: result.rows,
      summary: {
        total_collections: result.rows.length,
        total_amount_collected: result.rows.reduce((sum, row) => sum + parseFloat(row.total_collected), 0),
        avg_daily_collection: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_collection), 0) / result.rows.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching collection report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 