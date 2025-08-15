const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// Test endpoint for direct database status update
router.post('/:serial/test-status', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    const { status } = req.body;
    
    console.log('=== DIRECT STATUS UPDATE TEST ===');
    console.log('Testing direct status update:', { serial, status });
    
    // Validate status
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: active, inactive, or maintenance' });
    }
    
    // Check current battery
    const currentBattery = await pool.query(
      'SELECT * FROM batteries WHERE serial_number = $1',
      [serial]
    );
    
    if (currentBattery.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    console.log('Current battery:', currentBattery.rows[0]);
    
    // Try direct update
    const result = await pool.query(
      'UPDATE batteries SET status = $1 WHERE serial_number = $2 RETURNING *',
      [status, serial]
    );
    
    console.log('Update result:', result.rows[0]);
    console.log('=== END TEST ===');
    
    res.json({
      success: true,
      message: 'Direct status update test completed',
      previous_status: currentBattery.rows[0].status,
      new_status: result.rows[0].status,
      battery: result.rows[0]
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Test endpoint error',
      details: error.message,
      code: error.code
    });
  }
});

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Batteries route is working', timestamp: new Date().toISOString() });
});

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
      // Include batteries owned by the dealer's consumers OR unassigned batteries
      query += ' WHERE c.dealer_id = $1 OR b.owner_id IS NULL';
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
router.post('/', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
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

// Test endpoint for debugging
router.post('/:serial/test', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    console.log('Test endpoint hit:', { serial, body: req.body, user: req.user });
    res.json({ 
      message: 'Test endpoint working', 
      serial, 
      body: req.body, 
      user: req.user 
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint error' });
  }
});

// POST /batteries/:serial/control - Toggle battery status
router.post('/:serial/control', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    const { action } = req.body;
    
    console.log('=== BATTERY STATUS CONTROL DEBUG ===');
    console.log('Request details:', { 
      serial, 
      action, 
      body: req.body, 
      user: req.user,
      headers: req.headers,
      method: req.method,
      url: req.url
    });
    
    if (!action) {
      console.log('❌ No action provided in request body');
      return res.status(400).json({ error: 'Action is required in request body' });
    }
    
    // Accept both control verbs and direct statuses for flexibility
    const normalized = String(action || '').toLowerCase();
    console.log('Action normalization:', { original: action, normalized });
    
    let newStatus;
    if (['activate', 'active'].includes(normalized)) {
        newStatus = 'active';
        console.log('✅ Action mapped to: active');
    } else if (['deactivate', 'inactive'].includes(normalized)) {
        newStatus = 'inactive';
        console.log('✅ Action mapped to: inactive');
    } else if (normalized === 'maintenance') {
        newStatus = 'maintenance';
        console.log('✅ Action mapped to: maintenance');
    } else {
      console.log('❌ Invalid action received:', { action, normalized });
      return res.status(400).json({ error: 'Invalid action. Use: activate/active, deactivate/inactive, or maintenance' });
    }
    
    console.log('🔄 Updating battery status:', { serial, action, newStatus });
    
    // First, let's check the current battery status
    const currentBattery = await pool.query(
      'SELECT * FROM batteries WHERE serial_number = $1',
      [serial]
    );
    
    if (currentBattery.rows.length === 0) {
      console.log('❌ Battery not found:', serial);
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    console.log('📊 Current battery state:', currentBattery.rows[0]);
    
    // Now update the status
    const result = await pool.query(
      'UPDATE batteries SET status = $1 WHERE serial_number = $2 RETURNING *',
      [newStatus, serial]
    );
    
    console.log('✅ Status updated successfully:', result.rows[0]);
    console.log('=== END DEBUG ===');
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating battery status:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
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

// PUT /batteries/:serial/assign - Assign battery to consumer
router.put('/:serial/assign', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { serial } = req.params;
    const { consumer_id } = req.body;
    
    if (!consumer_id) {
      return res.status(400).json({ error: 'Consumer ID is required' });
    }
    
    // Verify consumer exists and belongs to dealer
    if (req.user.role === 'dealer') {
      const consumerCheck = await pool.query(
        'SELECT id FROM consumers WHERE id = $1 AND dealer_id = $2',
        [consumer_id, req.user.userId]
      );
      
      if (consumerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Consumer not found or access denied' });
      }
    }
    
    const result = await pool.query(
      'UPDATE batteries SET owner_id = $1 WHERE serial_number = $2 RETURNING *',
      [consumer_id, serial]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning battery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /batteries/health-report - Get battery health analytics
router.get('/health-report', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'WHERE c.dealer_id = $1';
      params = [userId];
    }
    
    const query = `
      SELECT 
        b.status,
        COUNT(*) as count,
        AVG(b.health_score) as avg_health,
        MIN(b.health_score) as min_health,
        MAX(b.health_score) as max_health
      FROM batteries b
      LEFT JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      GROUP BY b.status
      ORDER BY b.status
    `;
    
    const result = await pool.query(query, params);
    
    // Calculate fleet health score
    const fleetHealth = result.rows.reduce((acc, row) => {
      acc[row.status] = {
        count: parseInt(row.count),
        avg_health: parseFloat(row.avg_health || 0).toFixed(1),
        min_health: parseInt(row.min_health || 0),
        max_health: parseInt(row.max_health || 0)
      };
      return acc;
    }, {});
    
    res.json({
      fleet_health: fleetHealth,
      total_batteries: Object.values(fleetHealth).reduce((sum, status) => sum + status.count, 0),
      overall_health_score: Object.values(fleetHealth).reduce((sum, status) => sum + (status.count * parseFloat(status.avg_health)), 0) / 
                           Object.values(fleetHealth).reduce((sum, status) => sum + status.count, 0) || 0
    });
  } catch (error) {
    console.error('Error fetching health report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket endpoint preparation (mock for now)
router.get('/:serial/stream', authenticateToken, (req, res) => {
  // This would be implemented with WebSocket in production
  res.json({ 
    message: 'Real-time streaming endpoint - implement with WebSocket',
    battery_serial: req.params.serial,
    note: 'Use WebSocket connection for real-time telemetry data'
  });
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