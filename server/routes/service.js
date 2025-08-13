const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// Mock technician list
const mockTechnicians = [
  { id: 1, name: 'Tech One', location: 'Bangalore Central', status: 'available' },
  { id: 2, name: 'Tech Two', location: 'Bangalore North', status: 'available' },
  { id: 3, name: 'Tech Three', location: 'Bangalore South', status: 'available' }
];

// Find nearest available technician
function findNearestTechnician(location) {
  // Mock logic - randomly assign technician
  const availableTechs = mockTechnicians.filter(t => t.status === 'available');
  if (availableTechs.length === 0) return null;
  
  return availableTechs[Math.floor(Math.random() * availableTechs.length)];
}

// POST /service/tickets - Create service ticket
router.post('/tickets', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { battery_id, issue_category, description, location } = req.body;
    
    if (!battery_id || !issue_category) {
      return res.status(400).json({ error: 'Battery ID and issue category are required' });
    }
    
    // Verify battery exists and belongs to dealer
    const batteryResult = await global.db.query(
      'SELECT * FROM batteries WHERE id = $1',
      [battery_id]
    );
    
    if (batteryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    // Auto-assign to nearest technician
    const assignedTechnician = findNearestTechnician(location);
    
    if (!assignedTechnician) {
      return res.status(503).json({ error: 'No technicians available' });
    }
    
    // Create service ticket
    const result = await global.db.query(
      'INSERT INTO service_tickets (battery_id, issue_category, description, assigned_to, status, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [battery_id, issue_category, description, assignedTechnician.id, 'assigned', location]
    );
    
    const ticket = result.rows[0];
    
    res.status(201).json({
      ticket,
      assigned_technician: assignedTechnician
    });
  } catch (error) {
    console.error('Error creating service ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /service/tickets - List service tickets
router.get('/tickets', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = `
      SELECT st.*, b.serial_number as battery_serial, b.status as battery_status,
             c.name as consumer_name, c.phone as consumer_phone
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      LEFT JOIN consumers c ON b.owner_id = c.id
    `;
    
    let params = [];
    
    if (dealerId) {
      query += ' WHERE c.dealer_id = $1';
      params.push(dealerId);
    }
    
    query += ' ORDER BY st.created_at DESC';
    
    const result = await global.db.query(query, params);
    
    // Add technician info to tickets
    const tickets = result.rows.map(ticket => ({
      ...ticket,
      technician: mockTechnicians.find(t => t.id === ticket.assigned_to) || null
    }));
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching service tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /service/tickets/:id - Get service ticket details
router.get('/tickets/:id', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    let query = `
      SELECT st.*, b.serial_number as battery_serial, b.status as battery_status,
             c.name as consumer_name, c.phone as consumer_phone
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      LEFT JOIN consumers c ON b.owner_id = c.id
      WHERE st.id = $1
    `;
    
    let params = [id];
    
    if (dealerId) {
      query += ' AND c.dealer_id = $2';
      params.push(dealerId);
    }
    
    const result = await global.db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    const ticket = result.rows[0];
    ticket.technician = mockTechnicians.find(t => t.id === ticket.assigned_to) || null;
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching service ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /service/tickets/:id/status - Update ticket status
router.put('/tickets/:id/status', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status || !['open', 'assigned', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    const result = await global.db.query(
      'UPDATE service_tickets SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    const ticket = result.rows[0];
    ticket.technician = mockTechnicians.find(t => t.id === ticket.assigned_to) || null;
    
    res.json({
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /service/technicians - List available technicians
router.get('/technicians', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    res.json(mockTechnicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /service/tickets/:id/reassign - Reassign ticket to different technician
router.post('/tickets/:id/reassign', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;
    
    if (!technician_id) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }
    
    const technician = mockTechnicians.find(t => t.id === technician_id);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    const result = await global.db.query(
      'UPDATE service_tickets SET assigned_to = $1, status = $2 WHERE id = $3 RETURNING *',
      [technician_id, 'assigned', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    const ticket = result.rows[0];
    ticket.technician = technician;
    
    res.json({
      message: 'Ticket reassigned successfully',
      ticket
    });
  } catch (error) {
    console.error('Error reassigning ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 