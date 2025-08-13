const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

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
    
    const result = await global.db.query(query, params);
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
    
    const result = await global.db.query(
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
    
    const result = await global.db.query(query, params);
    
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
    
    const result = await global.db.query(query, params);
    
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
    
    const result = await global.db.query(query, params);
    
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
    
    const result = await global.db.query(query, params);
    
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

module.exports = router; 