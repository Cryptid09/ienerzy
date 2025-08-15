const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
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

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('Token verified successfully, user:', user);
    req.user = user;
    next();
  });
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
        if (resource.owner_id !== req.user.userId && resource.consumer_id !== req.user.userId) {
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

module.exports = {
  authenticateToken,
  requireRole,
  requireConsumer,
  requireOwnership
}; 