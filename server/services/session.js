const { pool } = require('../database/setup');
const config = require('../config/auth');
const crypto = require('crypto');

class SessionService {
  // Store OTP in database with proper expiration
  async storeOTP(phone, otp, userData, userType) {
    try {
      // Clean up expired OTPs first
      await this.cleanupExpiredOTPs();
      
      // Validate and prepare user data
      let processedUserData;
      if (typeof userData === 'object' && userData !== null) {
        // Ensure we have the required fields
        processedUserData = {
          id: userData.id,
          name: userData.name || 'Unknown User',
          phone: userData.phone || phone,
          role: userData.role || userType
        };
      } else {
        throw new Error('Invalid user data provided');
      }
      
      // Store new OTP
      const result = await pool.query(
        `INSERT INTO otp_storage (phone, otp, user_data, user_type, expires_at, attempts)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (phone) 
         DO UPDATE SET 
           otp = $2, 
           user_data = $3, 
           user_type = $4, 
           expires_at = $5, 
           attempts = $6,
           created_at = NOW()
         RETURNING *`,
        [
          phone, 
          otp, 
          JSON.stringify(processedUserData), 
          userType, 
          new Date(Date.now() + config.OTP_EXPIRES_IN),
          0
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error storing OTP:', error);
      throw error;
    }
  }

  // Verify OTP and increment attempts
  async verifyOTP(phone, otp) {
    try {
      const result = await pool.query(
        `SELECT * FROM otp_storage 
         WHERE phone = $1 AND expires_at > NOW()`,
        [phone]
      );

      if (result.rows.length === 0) {
        return { valid: false, reason: 'OTP_NOT_FOUND' };
      }

      const otpData = result.rows[0];
      
      // Check if max attempts exceeded
      if (otpData.attempts >= config.OTP_MAX_ATTEMPTS) {
        await this.deleteOTP(phone);
        return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
      }

      // Check if OTP matches
      if (otpData.otp !== otp) {
        // Increment attempts
        await pool.query(
          'UPDATE otp_storage SET attempts = attempts + 1 WHERE phone = $1',
          [phone]
        );
        return { valid: false, reason: 'INVALID_OTP' };
      }

      // OTP is valid - delete it and return user data
      await this.deleteOTP(phone);
      
      // Safely parse user data with fallback
      let userData;
      try {
        userData = JSON.parse(otpData.user_data);
      } catch (parseError) {
        console.error('Failed to parse user_data:', otpData.user_data);
        // Fallback: create a basic user object from the raw data
        if (typeof otpData.user_data === 'object' && otpData.user_data !== null) {
          userData = otpData.user_data;
        } else {
          throw new Error('Invalid user data format in OTP storage');
        }
      }
      
      return {
        valid: true,
        userData: userData,
        userType: otpData.user_type
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  // Delete OTP
  async deleteOTP(phone) {
    try {
      await pool.query('DELETE FROM otp_storage WHERE phone = $1', [phone]);
    } catch (error) {
      console.error('Error deleting OTP:', error);
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    try {
      const result = await pool.query('DELETE FROM otp_storage WHERE expires_at <= NOW()');
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} expired OTPs`);
      }
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      // Don't throw error as this is cleanup operation
    }
  }

  // Clean up old rate limit entries
  async cleanupOldRateLimits() {
    try {
      const result = await pool.query('DELETE FROM rate_limits WHERE last_attempt <= NOW() - INTERVAL \'1 hour\'');
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} old rate limit entries`);
      }
    } catch (error) {
      console.error('Error cleaning up old rate limits:', error);
    }
  }

  // Update session with new tokens
  async updateSession(sessionId, newToken, newRefreshToken) {
    try {
      const result = await pool.query(
        `UPDATE user_sessions 
         SET token_hash = $1, refresh_token_hash = $2, last_activity = NOW()
         WHERE id = $3
         RETURNING *`,
        [
          this.hashToken(newToken),
          this.hashToken(newRefreshToken),
          sessionId
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  // Store user session
  async createSession(userId, token, refreshToken) {
    try {
      const result = await pool.query(
        `INSERT INTO user_sessions (user_id, token_hash, refresh_token_hash, expires_at, last_activity)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [
          userId,
          this.hashToken(token),
          this.hashToken(refreshToken),
          new Date(Date.now() + this.parseJWTExpiry(config.JWT_EXPIRES_IN))
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Validate session
  async validateSession(token) {
    try {
      const tokenHash = this.hashToken(token);
      const result = await pool.query(
        `SELECT us.*, u.role, u.phone, u.name
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         WHERE us.token_hash = $1 AND us.expires_at > NOW()`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Update last activity
      await pool.query(
        'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1',
        [result.rows[0].id]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  // Refresh session
  async refreshSession(refreshToken) {
    try {
      const tokenHash = this.hashToken(refreshToken);
      const result = await pool.query(
        `SELECT * FROM user_sessions 
         WHERE refresh_token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }

  // Invalidate session (logout)
  async invalidateSession(token) {
    try {
      const tokenHash = this.hashToken(token);
      await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  // Blacklist token (for logout)
  async blacklistToken(token) {
    try {
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + config.TOKEN_BLACKLIST_TTL);
      
      await pool.query(
        `INSERT INTO token_blacklist (token_hash, expires_at)
         VALUES ($1, $2)
         ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, expiresAt]
      );
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      const tokenHash = this.hashToken(token);
      const result = await pool.query(
        `SELECT * FROM token_blacklist 
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  // Clean up expired sessions and blacklisted tokens
  async cleanupExpiredSessions() {
    try {
      await pool.query('DELETE FROM user_sessions WHERE expires_at <= NOW()');
      await pool.query('DELETE FROM token_blacklist WHERE expires_at <= NOW()');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // Get active sessions for a user
  async getUserSessions(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM user_sessions 
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_activity DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Revoke all sessions for a user (force logout from all devices)
  async revokeAllUserSessions(userId) {
    try {
      await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    } catch (error) {
      console.error('Error revoking user sessions:', error);
    }
  }

  // Hash token for secure storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Parse JWT expiry string to milliseconds
  parseJWTExpiry(expiry) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * units[unit];
    }
    
    return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
}

module.exports = new SessionService(); 