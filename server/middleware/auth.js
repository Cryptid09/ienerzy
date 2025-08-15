const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const sessionService = require('../services/session');

// Middleware to authenticate JWT token
async function authenticateToken(req, res, next) {
  console.log('authenticateToken middleware hit:', { 
    url: req.url, 
    method: req.method,
    authHeader: req.headers['authorization'] 
  });
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token found in authenticateToken middleware');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Check if token is blacklisted
    const isBlacklisted = await sessionService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.log('Token is blacklisted');
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Validate session
    const session = await sessionService.validateSession(token);
    if (!session) {
      console.log('Session validation failed');
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Set user info from session
    req.user = {
      userId: session.user_id,
      phone: session.phone,
      role: session.role,
      name: session.name
    };

    console.log('Token verified successfully, user:', req.user);
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please refresh your token or login again'
      });
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Middleware to check role permissions
function requireRole(allowedRoles) {
  return (req, res, next) => {
    console.log('requireRole middleware hit:', { 
      url: req.url, 
      method: req.method, 
      user: req.user, 
      allowedRoles 
    });
    
    if (!req.user) {
      console.log('No user found in requireRole middleware');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log('User role not allowed:', { userRole: req.user.role, allowedRoles });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    console.log('Role check passed, proceeding to route');
    next();
  };
}

// Middleware to check if user is consumer
function requireConsumer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isConsumer) {
    return res.status(403).json({ error: 'Consumer access required' });
  }
  
  next();
}

// Middleware to check if user owns the resource
function requireOwnership(table, idField = 'id') {
  return async (req, res, next) => {
    try {
      const { pool } = require('../database/setup');
      const resourceId = req.params[idField];
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check ownership
      const query = `SELECT * FROM ${table} WHERE ${idField} = $1`;
      const result = await pool.query(query, [resourceId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      const resource = result.rows[0];
      
      // For dealers, check if they own the consumer
      if (req.user.role === 'dealer' && table === 'consumers') {
        if (resource.dealer_id !== req.user.userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      // For consumers, check if they own the resource
      if (req.user.isConsumer) {
        if (resource.owner_id !== req.user.userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Middleware to check if user can access battery
function requireBatteryAccess() {
  return async (req, res, next) => {
    try {
      const { pool } = require('../database/setup');
      const { serial } = req.params;
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get battery details
      const batteryQuery = `
        SELECT b.*, c.dealer_id 
        FROM batteries b
        LEFT JOIN consumers c ON b.owner_id = c.id
        WHERE b.serial_number = $1
      `;
      
      const batteryResult = await pool.query(batteryQuery, [serial]);
      
      if (batteryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Battery not found' });
      }
      
      const battery = batteryResult.rows[0];
      
      // Dealers can access batteries they own or unassigned batteries
      if (req.user.role === 'dealer') {
        if (battery.owner_id && battery.dealer_id !== req.user.userId) {
          return res.status(403).json({ error: 'Access denied to this battery' });
        }
      }
      
      // Consumers can only access their own batteries
      if (req.user.isConsumer) {
        if (battery.owner_id !== req.user.userId) {
          return res.status(403).json({ error: 'Access denied to this battery' });
        }
      }
      
      next();
    } catch (error) {
      console.error('Battery access check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  requireConsumer,
  requireOwnership,
  requireBatteryAccess
}; 