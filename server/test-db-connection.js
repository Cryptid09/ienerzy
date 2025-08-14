const { Pool } = require('pg');

console.log('🔍 Testing Database Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
const envVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_PORT'];
envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? '***SET***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 Database Connection Test:');

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT NOW() as current_time, version() as db_version', (err, result) => {
  if (err) {
    console.log('❌ Database connection failed:');
    console.log(`   Error: ${err.message}`);
    console.log(`   Code: ${err.code}`);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution:');
      console.log('1. Create PostgreSQL database in Render dashboard');
      console.log('2. Set environment variables in Web Service');
      console.log('3. Redeploy with "Clear build cache & deploy"');
    } else if (err.code === 'ENOTFOUND') {
      console.log('\n💡 Solution:');
      console.log('1. Check DB_HOST is correct');
      console.log('2. Verify database service is running');
    } else if (err.code === '28P01') {
      console.log('\n💡 Solution:');
      console.log('1. Check DB_USER and DB_PASSWORD');
      console.log('2. Verify database credentials');
    }
  } else {
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].current_time}`);
    console.log(`   Database: ${result.rows[0].db_version.split(' ')[0]}`);
    
    // Test table creation
    console.log('\n🔨 Testing table creation...');
    pool.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err, result) => {
      if (err) {
        console.log('❌ Table creation failed:', err.message);
      } else {
        console.log('✅ Table creation successful');
        
        // Clean up test table
        pool.query('DROP TABLE test_connection', (err) => {
          if (err) {
            console.log('⚠️  Could not clean up test table:', err.message);
          } else {
            console.log('✅ Test table cleaned up');
          }
          
          console.log('\n🎯 Database is ready for your application!');
          pool.end();
        });
      }
    });
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
}); 