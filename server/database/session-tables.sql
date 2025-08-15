-- OTP Storage Table
CREATE TABLE IF NOT EXISTS otp_storage (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL UNIQUE,
  otp VARCHAR(10) NOT NULL,
  user_data JSONB NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Token Blacklist Table (for logout)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(100) NOT NULL, -- phone number or IP
  action VARCHAR(50) NOT NULL, -- login, otp, etc.
  attempts INTEGER DEFAULT 1,
  first_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(identifier, action)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_storage_phone ON otp_storage(phone);
CREATE INDEX IF NOT EXISTS idx_otp_storage_expires ON otp_storage(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON rate_limits(action);

-- Clean up expired data function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_storage WHERE expires_at <= NOW();
  DELETE FROM user_sessions WHERE expires_at <= NOW();
  DELETE FROM token_blacklist WHERE expires_at <= NOW();
  
  -- Clean up old rate limit entries (older than 1 hour)
  DELETE FROM rate_limits WHERE last_attempt <= NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-data', '*/15 * * * *', 'SELECT cleanup_expired_data();'); 