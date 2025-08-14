const { Pool } = require('pg');

console.log('🔍 Environment Variables Check\n');

// Check required environment variables
const requiredVars = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_PORT',
  'NODE_ENV', 'PORT'
];

console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? '***SET***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 Database Connection Test:');

// Try to create a pool with current environment
try {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ienerzy_mvp',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  console.log('📡 Attempting database connection...');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'ienerzy_mvp'}`);
  console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`   Port: ${process.env.DB_PORT || 5432}`);

  // Test connection
  pool.query('SELECT NOW() as current_time', (err, result) => {
    if (err) {
      console.log('❌ Database connection failed:');
      console.log(`   Error: ${err.message}`);
      console.log(`   Code: ${err.code}`);
      
      if (err.code === 'ECONNREFUSED') {
        console.log('\n💡 Solution:');
        console.log('1. Create PostgreSQL database in Render dashboard');
        console.log('2. Set environment variables in Web Service');
        console.log('3. Redeploy with "Clear build cache & deploy"');
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log(`   Server time: ${result.rows[0].current_time}`);
    }
    
    pool.end();
  });

} catch (error) {
  console.log('❌ Failed to create database pool:');
  console.log(`   Error: ${error.message}`);
}

console.log('\n📱 Render Dashboard Steps:');
console.log('1. Go to your Web Service dashboard');
console.log('2. Click "Environment" tab');
console.log('3. Add missing environment variables');
console.log('4. Click "Manual Deploy" → "Clear build cache & deploy"'); 