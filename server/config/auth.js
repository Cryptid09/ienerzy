const crypto = require('crypto');

module.exports = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // OTP Configuration
  OTP_LENGTH: 6,
  OTP_EXPIRES_IN: 5 * 60 * 1000, // 5 minutes in milliseconds
  OTP_MAX_ATTEMPTS: 3,
  
  // Rate Limiting
  LOGIN_RATE_LIMIT: 5, // attempts per minute
  OTP_RATE_LIMIT: 3,   // attempts per minute
  
  // Session Configuration
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  MAX_SESSIONS_PER_USER: 3,
  
  // Security
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_SPECIAL: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  
  // Token Blacklist (for logout)
  TOKEN_BLACKLIST_TTL: 24 * 60 * 60 * 1000, // 24 hours
}; 