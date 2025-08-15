const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { pool } = require('../database/setup');
const messagingService = require('../services/messaging');
const sessionService = require('../services/session');
const config = require('../config/auth');
const { loginLimit, otpLimit } = require('../middleware/rateLimit');

// Generate secure OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/login - Generate OTP and send via SMS
router.post('/login', loginLimit, async (req, res) => {
  try {
    const { phone, userType } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!['dealer', 'admin', 'consumer'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
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
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in database
    await sessionService.storeOTP(phone, otp, user, userType);

    try {
      // Send OTP via SMS
      const smsResult = await messagingService.sendOTP(phone, otp);
      
      console.log(`OTP sent via SMS to ${userType} ${phone}: ${otp}`);

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
router.post('/verify-otp', otpLimit, async (req, res) => {
  try {
    const { phone, otp, userType } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    if (!userType) {
      return res.status(400).json({ error: 'User type is required' });
    }

    // Verify OTP
    let otpResult;
    try {
      otpResult = await sessionService.verifyOTP(phone, otp);
    } catch (verifyError) {
      console.error('OTP verification error:', verifyError);
      return res.status(500).json({ 
        error: 'OTP verification failed. Please try again or request a new OTP.',
        details: verifyError.message
      });
    }
    
    if (!otpResult.valid) {
      let errorMessage = 'Invalid OTP';
      if (otpResult.reason === 'OTP_NOT_FOUND') {
        errorMessage = 'OTP expired or not found';
      } else if (otpResult.reason === 'MAX_ATTEMPTS_EXCEEDED') {
        errorMessage = 'Too many failed attempts. Please request a new OTP.';
      }
      
      return res.status(400).json({ error: errorMessage });
    }

    const user = otpResult.userData;
    
    // Generate JWT token and refresh token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role,
        isConsumer: otpResult.userType === 'consumer'
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        type: 'refresh'
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Create session
    await sessionService.createSession(user.id, token, refreshToken);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isConsumer: otpResult.userType === 'consumer'
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    console.error('Request body:', req.body);
    console.error('User agent:', req.get('User-Agent'));
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(400).json({ error: 'Invalid refresh token' });
    }

    // Validate session
    const session = await sessionService.refreshSession(refreshToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newToken = jwt.sign(
      { 
        userId: session.user_id, 
        phone: session.phone, 
        role: session.role,
        isConsumer: false
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const newRefreshToken = jwt.sign(
      { 
        userId: session.user_id, 
        type: 'refresh'
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Update session
    await sessionService.updateSession(session.id, newToken, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout - Logout and invalidate session
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Blacklist token
      await sessionService.blacklistToken(token);
      
      // Invalidate session
      await sessionService.invalidateSession(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout-all - Logout from all devices
router.post('/logout-all', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Verify token to get user ID
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Revoke all sessions for user
      await sessionService.revokeAllUserSessions(decoded.userId);
      
      // Blacklist current token
      await sessionService.blacklistToken(token);
    }

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/sessions - Get active sessions for current user
router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const sessions = await sessionService.getUserSessions(decoded.userId);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        created_at: session.created_at,
        last_activity: session.last_activity,
        expires_at: session.expires_at
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/resend-otp - Resend OTP via SMS
router.post('/resend-otp', otpLimit, async (req, res) => {
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
    
    // Store new OTP
    await sessionService.storeOTP(phone, otp, user, userType);

    try {
      // Send OTP via SMS
      const smsResult = await messagingService.sendOTP(phone, otp);
      
      console.log(`OTP resent via SMS to ${userType} ${phone}: ${otp}`);

      res.json({ 
        success: true,
        message: 'OTP resent successfully',
        phone,
        expiresIn: '5 minutes',
        smsSid: smsResult.sid
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      
      res.json({ 
        success: true,
        message: 'OTP resent but SMS delivery failed. Please check your phone number.',
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
router.post('/signup', loginLimit, async (req, res) => {
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
      config.JWT_SECRET, 
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { 
        userId: newUser.id, 
        type: 'refresh'
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Create session
    await sessionService.createSession(newUser.id, token, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      refreshToken,
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
router.post('/signup-consumer', loginLimit, async (req, res) => {
  try {
    const { name, phone, pan, aadhar, dealer_id } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Check if consumer already exists
    const existingConsumer = await pool.query(
      'SELECT id FROM consumers WHERE phone = $1',
      [phone]
    );

    if (existingConsumer.rows.length > 0) {
      return res.status(400).json({ error: 'Consumer with this phone number already exists' });
    }

    // Create new consumer
    const result = await pool.query(
      'INSERT INTO consumers (name, phone, pan, aadhar, dealer_id, kyc_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, phone, pan, aadhar, dealer_id, 'pending']
    );

    const newConsumer = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Consumer registered successfully',
      consumer: {
        id: newConsumer.id,
        name: newConsumer.name,
        phone: newConsumer.phone,
        pan: newConsumer.pan,
        aadhar: newConsumer.aadhar,
        kyc_status: newConsumer.kyc_status,
        dealer_id: newConsumer.dealer_id
      }
    });

  } catch (error) {
    console.error('Consumer signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login-password - Password-based login for staff
router.post('/login-password', loginLimit, async (req, res) => {
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
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        type: 'refresh'
      }, 
      config.JWT_SECRET, 
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    // Create session
    await sessionService.createSession(user.id, token, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
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
router.get('/me', async (req, res) => {
  try {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Get user info from database
    let user;
    if (decoded.isConsumer) {
      const result = await pool.query(
        'SELECT id, name, phone, "kyc_status" as status FROM consumers WHERE id = $1',
        [decoded.userId]
      );
      if (result.rows.length > 0) {
        user = { ...result.rows[0], role: 'consumer', isConsumer: true };
      }
    } else {
      const result = await pool.query(
        'SELECT id, name, phone, role FROM users WHERE id = $1',
        [decoded.userId]
      );
      if (result.rows.length > 0) {
        user = { ...result.rows[0], isConsumer: false };
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isConsumer: user.isConsumer
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router; 