const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { pool } = require('../database/setup');
const messagingService = require('../services/messaging');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Real OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Generate real OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/login - Generate OTP and send via SMS
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
      const consumerResult = await pool.query(
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
      const userResult = await pool.query(
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
    
    // Generate real OTP
    const otp = generateOTP();
    
    // Store OTP with expiration
    otpStorage.set(phone, {
      otp,
      user,
      isConsumer,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    try {
      // Send OTP via Twilio SMS
      const smsResult = await messagingService.sendOTP(phone, otp);
      
      console.log(`OTP sent via SMS to ${userType} ${phone}: ${otp}`);
      console.log('SMS Result:', smsResult);

      res.json({ 
        success: true,
        message: 'OTP sent successfully via SMS',
        phone,
        expiresIn: '5 minutes',
        smsSid: smsResult.sid
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      
      // Fallback: still store OTP but inform user about SMS failure
    res.json({ 
      success: true,
        message: 'OTP generated but SMS delivery failed. Please check your phone number.',
      phone,
      expiresIn: '5 minutes',
        otp, // Include OTP for demo purposes if SMS fails
        smsError: smsError.message
    });
    }
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

    const otpData = otpStorage.get(phone);
    
    if (!otpData) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(phone);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // OTP is valid - generate JWT token
    const token = jwt.sign(
      { 
        userId: otpData.user.id, 
        phone: otpData.user.phone, 
        role: otpData.user.role,
        isConsumer: otpData.isConsumer
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Clean up OTP
    otpStorage.delete(phone);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: otpData.user.id,
        name: otpData.user.name,
        phone: otpData.user.phone,
        role: otpData.user.role,
        isConsumer: otpData.isConsumer
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/resend-otp - Resend OTP via SMS
router.post('/resend-otp', async (req, res) => {
  try {
    const { phone, userType } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if user exists
    let user = null;
    let isConsumer = false;

    if (userType === 'consumer') {
      const consumerResult = await pool.query(
        'SELECT id, name, phone, "kyc_status" as status FROM consumers WHERE phone = $1',
        [phone]
      );

      if (consumerResult.rows.length > 0) {
        user = consumerResult.rows[0];
        isConsumer = true;
        user.role = 'consumer';
      }
    } else {
      const userResult = await pool.query(
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

    // Generate new OTP
    const otp = generateOTP();
    
    // Update OTP storage with new OTP
    otpStorage.set(phone, {
      otp,
      user,
      isConsumer,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    try {
      // Send new OTP via Twilio SMS
      const smsResult = await messagingService.sendOTP(phone, otp);
      
      console.log(`OTP resent via SMS to ${userType} ${phone}: ${otp}`);
      console.log('SMS Result:', smsResult);

      res.json({ 
        success: true,
        message: 'OTP resent successfully via SMS',
        phone,
        expiresIn: '5 minutes',
        smsSid: smsResult.sid
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      
      // Fallback: still store OTP but inform user about SMS failure
      res.json({ 
        success: true,
        message: 'OTP regenerated but SMS delivery failed. Please check your phone number.',
        phone,
        expiresIn: '5 minutes',
        otp, // Include OTP for demo purposes if SMS fails
        smsError: smsError.message
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/signup - User registration
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;
    
    if (!name || !phone || !role || !password) {
      return res.status(400).json({ error: 'Name, phone, role, and password are required' });
    }

    // Validate role
    if (!['dealer', 'admin', 'nbfc'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be dealer, admin, or nbfc' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (name, phone, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, phone, role',
      [name, phone, role, passwordHash]
    );

    const newUser = result.rows[0];

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        phone: newUser.phone, 
        role: newUser.role,
        isConsumer: false
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/signup-consumer - Consumer registration
router.post('/signup-consumer', async (req, res) => {
  try {
    const { name, phone, dealerPhone, pan, aadhar } = req.body;
    
    if (!name || !phone || !dealerPhone) {
      return res.status(400).json({ error: 'Name, phone, and dealer phone are required' });
    }

    // Check if consumer already exists
    const existingConsumer = await pool.query(
      'SELECT id FROM consumers WHERE phone = $1',
      [phone]
    );

    if (existingConsumer.rows.length > 0) {
      return res.status(400).json({ error: 'Consumer with this phone number already exists' });
    }

    // Find dealer by phone
    const dealerResult = await pool.query(
      'SELECT id FROM users WHERE phone = $1 AND role = $2',
      [dealerPhone, 'dealer']
    );

    if (dealerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Dealer not found with the provided phone number' });
    }

    const dealerId = dealerResult.rows[0].id;

    // Create new consumer
    const result = await pool.query(
      'INSERT INTO consumers (name, phone, pan, aadhar, kyc_status, dealer_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, phone, kyc_status, dealer_id',
      [name, phone, pan || null, aadhar || null, 'pending', dealerId]
    );

    const newConsumer = result.rows[0];

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { 
        userId: newConsumer.id, 
        phone: newConsumer.phone, 
        role: 'consumer',
        isConsumer: true
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Consumer registered successfully',
      token,
      user: {
        id: newConsumer.id,
        name: newConsumer.name,
        phone: newConsumer.phone,
        role: 'consumer',
        kyc_status: newConsumer.kyc_status
      }
    });

  } catch (error) {
    console.error('Consumer signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login-password - Password-based login for staff users
router.post('/login-password', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Check users table for staff login
    const userResult = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role,
        isConsumer: false
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.userId,
    phone: req.user.phone,
    role: req.user.role
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