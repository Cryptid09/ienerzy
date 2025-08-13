const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ienerzy_mvp',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Make pool available globally
global.db = pool;

async function setupDatabase() {
  try {
    // Create tables
    await createTables();
    
    // Insert seed data
    await insertSeedData();
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

async function createTables() {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('dealer', 'admin', 'nbfc')),
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Batteries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS batteries (
        id SERIAL PRIMARY KEY,
        serial_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Consumers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS consumers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        pan VARCHAR(10),
        aadhar VARCHAR(12),
        kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
        dealer_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Finance applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS finance_applications (
        id SERIAL PRIMARY KEY,
        consumer_id INTEGER REFERENCES consumers(id),
        battery_id INTEGER REFERENCES batteries(id),
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // EMI schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS emi_schedules (
        id SERIAL PRIMARY KEY,
        finance_id INTEGER REFERENCES finance_applications(id),
        due_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Service tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_tickets (
        id SERIAL PRIMARY KEY,
        battery_id INTEGER REFERENCES batteries(id),
        issue_category VARCHAR(50) NOT NULL,
        description TEXT,
        assigned_to INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved')),
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully');
  } finally {
    client.release();
  }
}

async function insertSeedData() {
  const client = await pool.connect();
  
  try {
    // Insert admin user
    const adminResult = await client.query(`
      INSERT INTO users (name, phone, role, password_hash) 
      VALUES ('Admin User', '9999999999', 'admin', '$2a$10$dummy.hash.for.admin')
      ON CONFLICT (phone) DO NOTHING RETURNING id
    `);

    // Insert dealer user
    const dealerResult = await client.query(`
      INSERT INTO users (name, phone, role, password_hash) 
      VALUES ('Dealer One', '8888888888', 'dealer', '$2a$10$dummy.hash.for.dealer')
      ON CONFLICT (phone) DO NOTHING RETURNING id
    `);

    // Insert NBFC user
    await client.query(`
      INSERT INTO users (name, phone, role, password_hash) 
      VALUES ('NBFC Partner', '7777777777', 'nbfc', '$2a$10$dummy.hash.for.nbfc')
      ON CONFLICT (phone) DO NOTHING
    `);

    // Insert sample batteries
    await client.query(`
      INSERT INTO batteries (serial_number, status, health_score, owner_id) 
      VALUES 
        ('BAT001', 'active', 95, ${dealerResult.rows[0]?.id || 2}),
        ('BAT002', 'active', 87, ${dealerResult.rows[0]?.id || 2}),
        ('BAT003', 'maintenance', 45, ${dealerResult.rows[0]?.id || 2})
      ON CONFLICT (serial_number) DO NOTHING
    `);

    // Get consumer ID for linking
    const consumerResult = await client.query(`
      SELECT id FROM consumers WHERE phone = '7777777777'
    `);

    if (consumerResult.rows.length > 0) {
      const consumerId = consumerResult.rows[0].id;
      
      // Link some batteries to the consumer
      await client.query(`
        UPDATE batteries 
        SET owner_id = $1 
        WHERE serial_number IN ('BAT001', 'BAT002')
      `, [consumerId]);

      // Create a finance application for the consumer
      const financeResult = await client.query(`
        INSERT INTO finance_applications (consumer_id, battery_id, amount, status) 
        VALUES ($1, (SELECT id FROM batteries WHERE serial_number = 'BAT001'), 50000, 'approved')
        RETURNING id
      `, [consumerId]);

      if (financeResult.rows.length > 0) {
        const financeId = financeResult.rows[0].id;
        
        // Create EMI schedule for the consumer
        await client.query(`
          INSERT INTO emi_schedules (finance_id, due_date, amount, status) 
          VALUES 
            ($1, CURRENT_DATE + INTERVAL '1 month', 4167, 'pending'),
            ($1, CURRENT_DATE + INTERVAL '2 months', 4167, 'pending'),
            ($1, CURRENT_DATE + INTERVAL '3 months', 4167, 'pending')
        `, [financeId]);
      }
    }

    // Insert sample consumers
    await client.query(`
      INSERT INTO consumers (name, phone, pan, aadhar, kyc_status, dealer_id) 
      VALUES 
        ('John Doe', '1111111111', 'ABCDE1234F', '123456789012', 'verified', ${dealerResult.rows[0]?.id || 2}),
        ('Jane Smith', '2222222222', 'FGHIJ5678K', '987654321098', 'verified', ${dealerResult.rows[0]?.id || 2}),
        ('Consumer Demo', '7777777777', 'DEMO1234C', '777777777777', 'verified', ${dealerResult.rows[0]?.id || 2})
      ON CONFLICT (phone) DO NOTHING
    `);

    console.log('Seed data inserted successfully');
  } finally {
    client.release();
  }
}

module.exports = { setupDatabase, pool }; 