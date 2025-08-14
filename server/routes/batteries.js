const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// GET /batteries - List all batteries for dealer
router.get('/', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let query = `
      SELECT b.*, c.name as consumer_name, c.phone as consumer_phone
      FROM batteries b
      LEFT JOIN consumers c ON b.owner_id = c.id
    `;
    
    let params = [];
    
    if (req.user.role === 'dealer') {
      query += ' WHERE c.dealer_id = $1';
      params.push(userId);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batteries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /batteries - Add new battery
router.post('/', authenticateToken, requireRole(['dealer']), async (req, res) => {
  try {
    const { serial_number, health_score } = req.body;
    const dealerId = req.user.userId;
    
    if (!serial_number) {
      return res.status(400).json({ error: 'Serial number is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO batteries (serial_number, health_score, owner_id) VALUES ($1, $2, NULL) RETURNING *',
      [serial_number, health_score || 100]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding battery:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Battery with this serial number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /batteries/:serial - Get battery details with telemetry
router.get('/:serial', authenticateToken, async (req, res) => {
  try {
    const { serial } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM batteries WHERE serial_number = $1',
      [serial]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    const battery = result.rows[0];
    
    // Generate mock telemetry data
    const telemetry = {
      voltage: (Math.random() * 10 + 40).toFixed(2), // 40-50V
      current: (Math.random() * 5 + 10).toFixed(2),  // 10-15A
      soc: Math.floor(Math.random() * 30 + 70),      // 70-100%
      location: {
        lat: (Math.random() * 0.1 + 12.9716).toFixed(6),  // Bangalore area
        lng: (Math.random() * 0.1 + 77.5946).toFixed(6)
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      battery,
      telemetry
    });
  } catch (error) {
    console.error('Error fetching battery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /batteries/:serial/control - Toggle battery status
router.post('/:serial/control', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    const { action } = req.body;
    
    if (!['activate', 'deactivate', 'maintenance'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use: activate, deactivate, or maintenance' });
    }
    
    let newStatus;
    switch (action) {
      case 'activate':
        newStatus = 'active';
        break;
      case 'deactivate':
        newStatus = 'inactive';
        break;
      case 'maintenance':
        newStatus = 'maintenance';
        break;
    }
    
    const result = await pool.query(
      'UPDATE batteries SET status = $1 WHERE serial_number = $2 RETURNING *',
      [newStatus, serial]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating battery status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /batteries/:serial - Update battery details
router.put('/:serial', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    const { health_score, status } = req.body;
    
    const result = await pool.query(
      'UPDATE batteries SET health_score = COALESCE($1, health_score), status = COALESCE($2, status) WHERE serial_number = $3 RETURNING *',
      [health_score, status, serial]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating battery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /batteries/:serial - Delete battery
router.delete('/:serial', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    
    const result = await pool.query(
      'DELETE FROM batteries WHERE serial_number = $1 RETURNING *',
      [serial]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    res.json({ message: 'Battery deleted successfully' });
  } catch (error) {
    console.error('Error deleting battery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 