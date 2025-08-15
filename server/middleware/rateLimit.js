const { pool } = require('../database/setup');
const config = require('../config/auth');

class RateLimiter {
  constructor() {
    this.limits = {
      login: { max: config.LOGIN_RATE_LIMIT, window: 60 * 1000 }, // 5 per minute
      otp: { max: config.OTP_RATE_LIMIT, window: 60 * 1000 },     // 3 per minute
      api: { max: 100, window: 60 * 1000 }                        // 100 per minute
    };
  }

  // Check rate limit for a specific action
  async checkLimit(identifier, action) {
    try {
      const limit = this.limits[action] || this.limits.api;
      const now = new Date();
      const windowStart = new Date(now.getTime() - limit.window);

      // Get current rate limit data
      const result = await pool.query(
        `SELECT * FROM rate_limits 
         WHERE identifier = $1 AND action = $2`,
        [identifier, action]
      );

      if (result.rows.length === 0) {
        // First attempt
        await pool.query(
          `INSERT INTO rate_limits (identifier, action, attempts, first_attempt, last_attempt)
           VALUES ($1, $2, 1, $3, $3)`,
          [identifier, action, now]
        );
        return { allowed: true, remaining: limit.max - 1 };
      }

      const rateLimit = result.rows[0];
      
      // Check if window has passed
      if (rateLimit.last_attempt < windowStart) {
        // Reset counter
        await pool.query(
          `UPDATE rate_limits 
           SET attempts = 1, first_attempt = $1, last_attempt = $1
           WHERE identifier = $2 AND action = $3`,
          [now, identifier, action]
        );
        return { allowed: true, remaining: limit.max - 1 };
      }

      // Check if limit exceeded
      if (rateLimit.attempts >= limit.max) {
        return { 
          allowed: false, 
          remaining: 0,
          resetTime: new Date(rateLimit.first_attempt.getTime() + limit.window)
        };
      }

      // Increment counter
      await pool.query(
        `UPDATE rate_limits 
         SET attempts = attempts + 1, last_attempt = $1
         WHERE identifier = $2 AND action = $3`,
        [now, identifier, action]
      );

      return { 
        allowed: true, 
        remaining: limit.max - rateLimit.attempts - 1 
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining: 999 };
    }
  }

  // Get client identifier (IP address or phone number)
  getIdentifier(req) {
    // For login/OTP, use phone number
    if (req.body && req.body.phone) {
      return req.body.phone;
    }
    
    // For other requests, use IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  // Rate limiting middleware factory
  createMiddleware(action) {
    return async (req, res, next) => {
      try {
        const identifier = this.getIdentifier(req);
        const result = await this.checkLimit(identifier, action);

        if (!result.allowed) {
          const resetTime = result.resetTime;
          const retryAfter = Math.ceil((resetTime - new Date()) / 1000);
          
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Too many ${action} attempts. Please try again later.`,
            retryAfter,
            resetTime: resetTime.toISOString()
          });
        }

        // Add rate limit info to response headers
        res.set({
          'X-RateLimit-Limit': this.limits[action]?.max || this.limits.api.max,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': new Date(Date.now() + (this.limits[action]?.window || this.limits.api.window)).toISOString()
        });

        next();
      } catch (error) {
        console.error('Rate limiting middleware error:', error);
        // Fail open - allow request if rate limiting fails
        next();
      }
    };
  }
}

const rateLimiter = new RateLimiter();

// Export middleware functions
module.exports = {
  loginLimit: rateLimiter.createMiddleware('login'),
  otpLimit: rateLimiter.createMiddleware('otp'),
  apiLimit: rateLimiter.createMiddleware('api'),
  rateLimiter
}; 