const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// GET /consumers - List all consumers for dealer
router.get('/', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = 'SELECT * FROM consumers';
    let params = [];
    
    if (dealerId) {
      query += ' WHERE dealer_id = $1';
      params.push(dealerId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching consumers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /consumers - Add new consumer
router.post('/', authenticateToken, requireRole(['dealer']), async (req, res) => {
  try {
    const { name, phone, pan, aadhar } = req.body;
    const dealerId = req.user.userId;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    // Mock KYC verification - always returns verified
    const kycStatus = 'verified';
    
    const result = await pool.query(
      'INSERT INTO consumers (name, phone, pan, aadhar, kyc_status, dealer_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, phone, pan, aadhar, kycStatus, dealerId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding consumer:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Consumer with this phone number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /consumers/:id - Get consumer details
router.get('/:id', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = 'SELECT * FROM consumers WHERE id = $1';
    let params = [id];
    
    if (dealerId) {
      query += ' AND dealer_id = $2';
      params.push(dealerId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching consumer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /consumers/:id - Update consumer details
router.put('/:id', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, pan, aadhar, kyc_status } = req.body;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = 'UPDATE consumers SET name = COALESCE($1, name), phone = COALESCE($2, phone), pan = COALESCE($3, pan), aadhar = COALESCE($4, aadhar), kyc_status = COALESCE($5, kyc_status) WHERE id = $6';
    let params = [name, phone, pan, aadhar, kyc_status, id];
    
    if (dealerId) {
      query += ' AND dealer_id = $7';
      params.push(dealerId);
    }
    
    query += ' RETURNING *';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating consumer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /consumers/:id - Delete consumer
router.delete('/:id', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = 'DELETE FROM consumers WHERE id = $1';
    let params = [id];
    
    if (dealerId) {
      query += ' AND dealer_id = $2';
      params.push(dealerId);
    }
    
    query += ' RETURNING *';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    res.json({ message: 'Consumer deleted successfully' });
  } catch (error) {
    console.error('Error deleting consumer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /consumers/:id/kyc-verify - Mock KYC verification
router.post('/:id/kyc-verify', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = 'UPDATE consumers SET kyc_status = $1 WHERE id = $2';
    let params = ['verified', id];
    
    if (dealerId) {
      query += ' AND dealer_id = $3';
      params.push(dealerId);
    }
    
    query += ' RETURNING *';
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    res.json({ 
      message: 'KYC verification completed',
      consumer: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /consumers/:id/kyc - Update KYC status
router.put('/:id/kyc', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { kyc_status, pan, aadhar } = req.body;
    
    if (!kyc_status || !['pending', 'verified', 'rejected'].includes(kyc_status)) {
      return res.status(400).json({ error: 'Valid KYC status is required' });
    }
    
    // Verify consumer belongs to dealer
    if (req.user.role === 'dealer') {
      const consumerCheck = await pool.query(
        'SELECT id FROM consumers WHERE id = $1 AND dealer_id = $2',
        [id, req.user.userId]
      );
      
      if (consumerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Consumer not found or access denied' });
      }
    }
    
    const result = await pool.query(
      'UPDATE consumers SET kyc_status = $1, pan = COALESCE($2, pan), aadhar = COALESCE($3, aadhar) WHERE id = $4 RETURNING *',
      [kyc_status, pan, aadhar, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating KYC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /consumers/:id/emi-due - Get EMI due for specific consumer
router.get('/:id/emi-due', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT es.*, fa.amount as total_amount, b.serial_number as battery_serial
      FROM emi_schedules es
      JOIN finance_applications fa ON es.finance_id = fa.id
      JOIN batteries b ON fa.battery_id = b.id
      WHERE fa.consumer_id = $1 AND es.status IN ('pending', 'overdue')
      ORDER BY es.due_date ASC
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching consumer EMI due:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /consumers/:id/batteries - Get batteries owned by specific consumer
router.get('/:id/batteries', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT b.*, c.name as consumer_name, c.phone as consumer_phone
      FROM batteries b
      LEFT JOIN consumers c ON b.owner_id = c.id
      WHERE c.id = $1
      ORDER BY b.serial_number ASC
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching consumer batteries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /consumers/:id/finance - Get consumer finance details
router.get('/:id/finance', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify consumer belongs to dealer
    if (req.user.role === 'dealer') {
      const consumerCheck = await pool.query(
        'SELECT id FROM consumers WHERE id = $1 AND dealer_id = $2',
        [id, req.user.userId]
      );
      
      if (consumerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Consumer not found or access denied' });
      }
    }
    
    // Get NBFC applications
    const applicationsQuery = `
      SELECT na.*, b.serial_number as battery_serial
      FROM nbfc_applications na
      JOIN batteries b ON na.battery_id = b.id
      WHERE na.consumer_id = $1
      ORDER BY na.submitted_at DESC
    `;
    
    const applicationsResult = await pool.query(applicationsQuery, [id]);
    
    // Get EMI schedules
    const emiQuery = `
      SELECT es.*, na.amount as loan_amount, na.tenure_months
      FROM emi_schedules es
      JOIN nbfc_applications na ON es.application_id = na.id
      WHERE na.consumer_id = $1
      ORDER BY es.due_date
    `;
    
    const emiResult = await pool.query(emiQuery, [id]);
    
    res.json({
      applications: applicationsResult.rows,
      emi_schedules: emiResult.rows,
      total_applications: applicationsResult.rows.length,
      total_emi_due: emiResult.rows.filter(emi => emi.status === 'pending').length
    });
  } catch (error) {
    console.error('Error fetching finance details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /consumers/:id/documents - Upload documents (mock implementation)
router.post('/:id/documents', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { document_type, document_url, document_number } = req.body;
    
    if (!document_type || !document_url) {
      return res.status(400).json({ error: 'Document type and URL are required' });
    }
    
    // Verify consumer belongs to dealer
    if (req.user.role === 'dealer') {
      const consumerCheck = await pool.query(
        'SELECT id FROM consumers WHERE id = $1 AND dealer_id = $2',
        [id, req.user.userId]
      );
      
      if (consumerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Consumer not found or access denied' });
      }
    }
    
    // Mock document storage - in production, this would save to cloud storage
    const document = {
      id: Date.now(),
      consumer_id: id,
      document_type,
      document_url,
      document_number,
      uploaded_at: new Date().toISOString(),
      status: 'pending_verification'
    };
    
    res.status(201).json({
      message: 'Document uploaded successfully',
      document,
      note: 'This is a mock implementation. In production, implement cloud storage integration.'
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /consumers/:id/profile - Get complete consumer profile
router.get('/:id/profile', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify consumer belongs to dealer
    if (req.user.role === 'dealer') {
      const consumerCheck = await pool.query(
        'SELECT id FROM consumers WHERE id = $1 AND dealer_id = $2',
        [id, req.user.userId]
      );
      
      if (consumerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Consumer not found or access denied' });
      }
    }
    
    // Get consumer details
    const consumerQuery = `
      SELECT c.*, u.name as dealer_name
      FROM consumers c
      LEFT JOIN users u ON c.dealer_id = u.id
      WHERE c.id = $1
    `;
    
    const consumerResult = await pool.query(consumerQuery, [id]);
    
    if (consumerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consumer not found' });
    }
    
    const consumer = consumerResult.rows[0];
    
    // Get consumer's batteries
    const batteriesQuery = `
      SELECT b.*, 
             COUNT(st.id) as service_tickets_count,
             COUNT(CASE WHEN st.status != 'resolved' THEN 1 END) as active_tickets_count
      FROM batteries b
      LEFT JOIN service_tickets st ON b.id = st.battery_id
      WHERE b.owner_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
    
    const batteriesResult = await pool.query(batteriesQuery, [id]);
    
    // Get recent service tickets
    const ticketsQuery = `
      SELECT st.*, b.serial_number as battery_serial
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      WHERE b.owner_id = $1
      ORDER BY st.created_at DESC
      LIMIT 5
    `;
    
    const ticketsResult = await pool.query(ticketsQuery, [id]);
    
    res.json({
      consumer,
      batteries: batteriesResult.rows,
      recent_tickets: ticketsResult.rows,
      summary: {
        total_batteries: batteriesResult.rows.length,
        active_batteries: batteriesResult.rows.filter(b => b.status === 'active').length,
        total_service_tickets: ticketsResult.rows.length,
        active_service_tickets: ticketsResult.rows.filter(t => t.status !== 'resolved').length
      }
    });
  } catch (error) {
    console.error('Error fetching consumer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 