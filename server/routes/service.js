const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// Mock technician list - these are separate from users table
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
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { battery_id, issue_category, description, location } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (!battery_id || !issue_category) {
      return res.status(400).json({ error: 'Battery ID and issue category are required' });
    }
    
    // Verify battery exists and check access permissions
    let batteryQuery = `
      SELECT b.*, c.dealer_id, c.id as consumer_id
      FROM batteries b
      LEFT JOIN consumers c ON b.owner_id = c.id
      WHERE b.id = $1
    `;
    
    const batteryResult = await pool.query(batteryQuery, [battery_id]);
    
    if (batteryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    const battery = batteryResult.rows[0];
    
    // Check access permissions based on user role
    if (userRole === 'consumer') {
      // Consumers can only create tickets for their own batteries
      if (battery.consumer_id !== userId) {
        return res.status(403).json({ error: 'You can only create tickets for your own batteries' });
      }
    } else if (userRole === 'dealer') {
      // Dealers can create tickets for batteries owned by their consumers
      if (battery.dealer_id !== userId) {
        return res.status(403).json({ error: 'Access denied to this battery' });
      }
    }
    // Admins can create tickets for any battery
    
    // Auto-assign to nearest technician (using mock technician ID)
    const assignedTechnician = findNearestTechnician(location);
    
    if (!assignedTechnician) {
      return res.status(503).json({ error: 'No technicians available' });
    }
    
    // Create service ticket with mock technician ID
    const result = await pool.query(
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
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let query = `
      SELECT st.*, b.serial_number as battery_serial, b.status as battery_status,
             c.name as consumer_name, c.phone as consumer_phone
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      LEFT JOIN consumers c ON b.owner_id = c.id
    `;
    
    let params = [];
    
    if (userRole === 'consumer') {
      // Consumers can only see tickets for their own batteries
      query += ' WHERE c.id = $1';
      params.push(userId);
    } else if (userRole === 'dealer') {
      // Dealers can see tickets for batteries owned by their consumers
      query += ' WHERE c.dealer_id = $1';
      params.push(userId);
    }
    // Admins can see all tickets (no WHERE clause needed)
    
    query += ' ORDER BY st.created_at DESC';
    
    const result = await pool.query(query, params);
    
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
    
    const result = await pool.query(query, params);
    
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
    
    const result = await pool.query(
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
    
    const result = await pool.query(
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

// GET /service/battery/:id/tickets - Get all tickets for a specific battery
router.get('/battery/:id/tickets', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.role === 'dealer' ? req.user.userId : null;
    
    // Verify battery access
    let batteryQuery = `
      SELECT b.*, c.dealer_id 
      FROM batteries b
      LEFT JOIN consumers c ON b.owner_id = c.id
      WHERE b.id = $1
    `;
    
    const batteryResult = await pool.query(batteryQuery, [id]);
    
    if (batteryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Battery not found' });
    }
    
    const battery = batteryResult.rows[0];
    
    // Check if dealer has access to this battery
    if (dealerId && battery.dealer_id !== dealerId) {
      return res.status(403).json({ error: 'Access denied to this battery' });
    }
    
    // Get all tickets for this battery
    const ticketsResult = await pool.query(
      'SELECT * FROM service_tickets WHERE battery_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    // Add technician info to tickets
    const tickets = ticketsResult.rows.map(ticket => ({
      ...ticket,
      technician: mockTechnicians.find(t => t.id === ticket.assigned_to) || null
    }));
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching battery tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /service/tickets/active - Get active tickets
router.get('/tickets/active', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
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
        st.*,
        b.serial_number as battery_serial,
        c.name as consumer_name,
        c.phone as consumer_phone,
        u.name as technician_name
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      JOIN consumers c ON b.owner_id = c.id
      LEFT JOIN users u ON st.assigned_to = u.id
      WHERE st.status IN ('open', 'assigned', 'in_progress')
        ${whereClause}
      ORDER BY st.created_at DESC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      active_tickets: result.rows,
      count: result.rows.length,
      summary: {
        open: result.rows.filter(t => t.status === 'open').length,
        assigned: result.rows.filter(t => t.status === 'assigned').length,
        in_progress: result.rows.filter(t => t.status === 'in_progress').length
      }
    });
  } catch (error) {
    console.error('Error fetching active tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /service/tickets/:id/assign - Assign ticket to technician
router.put('/:id/assign', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id, priority = 'medium' } = req.body;
    
    if (!technician_id) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }
    
    // Verify technician exists
    const techCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [technician_id, 'technician']
    );
    
    if (techCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    // Update ticket assignment
    const result = await pool.query(
      'UPDATE service_tickets SET assigned_to = $1, status = $2, priority = $3 WHERE id = $4 RETURNING *',
      [technician_id, 'assigned', priority, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      message: 'Ticket assigned successfully',
      ticket: result.rows[0],
      assigned_technician: techCheck.rows[0]
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /service/tickets/:id/update - Update ticket status and details
router.post('/:id/update', authenticateToken, requireRole(['dealer', 'admin', 'technician']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, description, resolution_notes, parts_used, labor_hours } = req.body;
    
    if (!status || !['open', 'assigned', 'in_progress', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    // Build update query dynamically
    let updateFields = ['status = $1'];
    let updateParams = [status];
    let paramIndex = 2;
    
    if (description) {
      updateFields.push(`description = $${paramIndex++}`);
      updateParams.push(description);
    }
    
    if (resolution_notes) {
      updateFields.push(`resolution_notes = $${paramIndex++}`);
      updateParams.push(resolution_notes);
    }
    
    if (parts_used) {
      updateFields.push(`parts_used = $${paramIndex++}`);
      updateParams.push(parts_used);
    }
    
    if (labor_hours) {
      updateFields.push(`labor_hours = $${paramIndex++}`);
      updateParams.push(labor_hours);
    }
    
    if (status === 'resolved') {
      updateFields.push(`resolved_at = $${paramIndex++}`);
      updateParams.push(new Date().toISOString());
    }
    
    const updateQuery = `UPDATE service_tickets SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    updateParams.push(id);
    
    const result = await pool.query(updateQuery, updateParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      message: 'Ticket updated successfully',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /service/technicians/available - Get available technicians with scoring
router.get('/technicians/available', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { location, skill_required } = req.query;
    
    // Mock technician data with enhanced scoring
    const technicians = [
      { 
        id: 1, 
        name: 'Tech One', 
        location: 'Bangalore Central', 
        status: 'available',
        skills: ['battery_maintenance', 'electrical'],
        rating: 4.5,
        experience_years: 3,
        current_load: 2
      },
      { 
        id: 2, 
        name: 'Tech Two', 
        location: 'Bangalore North', 
        status: 'available',
        skills: ['battery_maintenance', 'mechanical'],
        rating: 4.2,
        experience_years: 2,
        current_load: 1
      },
      { 
        id: 3, 
        name: 'Tech Three', 
        location: 'Bangalore South', 
        status: 'available',
        skills: ['electrical', 'diagnostics'],
        rating: 4.8,
        experience_years: 5,
        current_load: 0
      }
    ];
    
    // Filter by location if specified
    let availableTechs = technicians.filter(t => t.status === 'available');
    
    if (location) {
      availableTechs = availableTechs.filter(t => 
        t.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Filter by skills if specified
    if (skill_required) {
      availableTechs = availableTechs.filter(t => 
        t.skills.includes(skill_required)
      );
    }
    
    // Calculate availability score
    availableTechs = availableTechs.map(tech => ({
      ...tech,
      availability_score: calculateTechnicianScore(tech, location)
    }));
    
    // Sort by availability score
    availableTechs.sort((a, b) => b.availability_score - a.availability_score);
    
    res.json({
      available_technicians: availableTechs,
      count: availableTechs.length,
      scoring_algorithm: 'Based on location proximity, skills match, rating, experience, and current workload'
    });
  } catch (error) {
    console.error('Error fetching available technicians:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate technician score
function calculateTechnicianScore(technician, location) {
  let score = 0;
  
  // Base score from rating (0-50 points)
  score += technician.rating * 10;
  
  // Experience bonus (0-20 points)
  score += Math.min(technician.experience_years * 4, 20);
  
  // Workload bonus - less load = higher score (0-20 points)
  score += Math.max(20 - technician.current_load * 5, 0);
  
  // Location proximity bonus (0-10 points)
  if (location && technician.location.toLowerCase().includes(location.toLowerCase())) {
    score += 10;
  }
  
  return score;
}

// POST /service/auto-assign - Auto-assign ticket using smart algorithm
router.post('/auto-assign', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const { ticket_id, location, priority = 'medium', skill_required } = req.body;
    
    if (!ticket_id || !location) {
      return res.status(400).json({ error: 'Ticket ID and location are required' });
    }
    
    // Get available technicians
    const availableTechs = await getAvailableTechnicians(location, skill_required);
    
    if (availableTechs.length === 0) {
      return res.status(503).json({ error: 'No technicians available for auto-assignment' });
    }
    
    // Score and rank technicians
    const scoredTechs = availableTechs.map(tech => ({
      ...tech,
      score: calculateTechnicianScore(tech, location)
    }));
    
    scoredTechs.sort((a, b) => b.score - a.score);
    const bestTech = scoredTechs[0];
    
    // Assign ticket to best technician
    const result = await pool.query(
      'UPDATE service_tickets SET assigned_to = $1, status = $2, priority = $3 WHERE id = $4 RETURNING *',
      [bestTech.id, 'assigned', priority, ticket_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      message: 'Ticket auto-assigned successfully',
      ticket: result.rows[0],
      assigned_technician: bestTech,
      assignment_reason: `Selected based on highest score: ${bestTech.score}`,
      other_candidates: scoredTechs.slice(1, 4).map(t => ({ id: t.id, name: t.name, score: t.score }))
    });
  } catch (error) {
    console.error('Error auto-assigning ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get available technicians
async function getAvailableTechnicians(location, skillRequired) {
  // Mock implementation - in production, this would query the database
  const mockTechnicians = [
    { 
      id: 1, 
      name: 'Tech One', 
      location: 'Bangalore Central', 
      status: 'available',
      skills: ['battery_maintenance', 'electrical'],
      rating: 4.5,
      experience_years: 3,
      current_load: 2
    },
    { 
      id: 2, 
      name: 'Tech Two', 
      location: 'Bangalore North', 
      status: 'available',
      skills: ['battery_maintenance', 'mechanical'],
      rating: 4.2,
      experience_years: 2,
      current_load: 1
    },
    { 
      id: 3, 
      name: 'Tech Three', 
      location: 'Bangalore South', 
      status: 'available',
      skills: ['electrical', 'diagnostics'],
      rating: 4.8,
      experience_years: 5,
      current_load: 0
    }
  ];
  
  let availableTechs = mockTechnicians.filter(t => t.status === 'available');
  
  if (skillRequired) {
    availableTechs = availableTechs.filter(t => t.skills.includes(skillRequired));
  }
  
  return availableTechs;
}

module.exports = router; 