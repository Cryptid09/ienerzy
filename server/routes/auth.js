const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock OTP storage (in production, use Redis or database)
const mockOTPs = new Map();

// Mock OTP generation
function generateMockOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/login - Generate OTP
router.post('/login', async (req, res) => {
  try {
    const { phone, userType } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let user = null;
    let isConsumer = false;

    if (userType === 'consumer') {
      // Check consumers table for consumer login
      const consumerResult = await global.db.query(
        'SELECT id, name, phone, "kyc_status" as status FROM consumers WHERE phone = $1',
        [phone]
      );

      if (consumerResult.rows.length > 0) {
        user = consumerResult.rows[0];
        isConsumer = true;
        // Add role for consumers
        user.role = 'consumer';
      }
    } else {
      // Check users table for dealer/admin login
      const userResult = await global.db.query(
        'SELECT * FROM users WHERE phone = $1',
        [phone]
      );

      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      }
    }

    if (!user) {
      return res.status(404).json({ 
        error: userType === 'consumer' ? 'Consumer not found' : 'User not found' 
      });
    }
    
    // Generate mock OTP
    const otp = generateMockOTP();
    mockOTPs.set(phone, {
      otp,
      user,
      isConsumer,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    console.log(`Mock OTP for ${userType} ${phone}: ${otp}`);

    res.json({ 
      success: true,
      message: 'OTP sent successfully',
      phone,
      expiresIn: '5 minutes',
      otp // Include OTP for demo purposes
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/verify-otp - Verify OTP and issue JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, userType } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const otpData = mockOTPs.get(phone);
    
    if (!otpData) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > otpData.expiresAt) {
      mockOTPs.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Clear OTP after successful verification
    mockOTPs.delete(phone);

    const user = otpData.user;
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role,
        isConsumer: otpData.isConsumer
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      phone: req.user.phone,
      role: req.user.role
    }
  });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check role permissions
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

module.exports = router; 