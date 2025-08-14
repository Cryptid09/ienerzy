-- Database initialization script for Ienerzy MVP
-- This script will be run when the PostgreSQL container starts

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('dealer', 'admin', 'nbfc')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create batteries table
CREATE TABLE IF NOT EXISTS batteries (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create consumers table
CREATE TABLE IF NOT EXISTS consumers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    pan VARCHAR(10),
    aadhar VARCHAR(12),
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    dealer_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create finance applications table
CREATE TABLE IF NOT EXISTS finance_applications (
    id SERIAL PRIMARY KEY,
    consumer_id INTEGER REFERENCES consumers(id),
    battery_id INTEGER REFERENCES batteries(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create EMI schedules table
CREATE TABLE IF NOT EXISTS emi_schedules (
    id SERIAL PRIMARY KEY,
    finance_id INTEGER REFERENCES finance_applications(id),
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create service tickets table
CREATE TABLE IF NOT EXISTS service_tickets (
    id SERIAL PRIMARY KEY,
    battery_id INTEGER REFERENCES batteries(id),
    issue_category VARCHAR(50) NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved')),
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data
INSERT INTO users (name, phone, role, password_hash) VALUES 
    ('Admin User', '9999999999', 'admin', '$2a$10$dummy.hash.for.admin'),
    ('Dealer One', '8888888888', 'dealer', '$2a$10$dummy.hash.for.dealer'),
    ('NBFC Partner', '7777777777', 'nbfc', '$2a$10$dummy.hash.for.nbfc')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample batteries
INSERT INTO batteries (serial_number, status, health_score, owner_id) VALUES 
    ('BAT001', 'active', 95, 2),
    ('BAT002', 'active', 87, 2),
    ('BAT003', 'maintenance', 45, 2)
ON CONFLICT (serial_number) DO NOTHING;

-- Insert sample consumers
INSERT INTO consumers (name, phone, pan, aadhar, kyc_status, dealer_id) VALUES 
    ('John Doe', '1111111111', 'ABCDE1234F', '123456789012', 'verified', 2),
    ('Jane Smith', '2222222222', 'FGHIJ5678K', '987654321098', 'verified', 2),
    ('Original Contact', '8827270123', 'ORIG1234C', '882727012345', 'verified', 2)
ON CONFLICT (phone) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_batteries_serial ON batteries(serial_number);
CREATE INDEX IF NOT EXISTS idx_batteries_owner ON batteries(owner_id);
CREATE INDEX IF NOT EXISTS idx_consumers_dealer ON consumers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_finance ON emi_schedules(finance_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_battery ON service_tickets(battery_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres; 