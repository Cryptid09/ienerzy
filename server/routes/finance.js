const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

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
    const consumerResult = await global.db.query(
      'SELECT * FROM consumers WHERE id = $1 AND dealer_id = $2',
      [consumer_id, dealerId]
    );
    
    if (consumerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    // Create finance application
    const applicationResult = await global.db.query(
      'INSERT INTO finance_applications (consumer_id, battery_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [consumer_id, battery_id, amount, 'pending']
    );
    
    const application = applicationResult.rows[0];
    
    // Mock NBFC approval
    const nbfcResponse = await mockNBFCApproval({ amount });
    
    if (nbfcResponse.approved) {
      // Update application status
      await global.db.query(
        'UPDATE finance_applications SET status = $1 WHERE id = $2',
        ['approved', application.id]
      );
      
      // Generate EMI schedule
      const emiSchedule = generateEMISchedule(application.id, amount, 12);
      
      for (const emi of emiSchedule) {
        await global.db.query(
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
    
    const result = await global.db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching finance applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /finance/applications/:id - Get finance application details
router.get('/applications/:id', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
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
    
    const result = await global.db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Finance application not found' });
    }
    
    const application = result.rows[0];
    
    // Get EMI schedule
    const emiResult = await global.db.query(
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

// POST /finance/emi-payment - Mark EMI as paid
router.post('/emi-payment', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { emi_id, payment_amount } = req.body;
    
    if (!emi_id || !payment_amount) {
      return res.status(400).json({ error: 'EMI ID and payment amount are required' });
    }
    
    // Mock payment gateway - always successful
    const paymentStatus = 'success';
    
    if (paymentStatus === 'success') {
      const result = await global.db.query(
        'UPDATE emi_schedules SET status = $1 WHERE id = $2 RETURNING *',
        ['paid', emi_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'EMI not found' });
      }
      
      res.json({
        message: 'EMI payment successful',
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
    
    const result = await global.db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching EMI due list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 