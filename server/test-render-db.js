const { Pool } = require('pg');

console.log('🔍 Testing Render Database Connection...\n');

// Check if we're in production
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Check environment variables
console.log('📋 Database Environment Variables:');
const dbVars = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_PORT'
];

let missingVars = [];
dbVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? '***SET***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('\n🚨 Missing Variables:', missingVars.join(', '));
  console.log('\n💡 Solution:');
  console.log('1. Go to your Web Service dashboard');
  console.log('2. Click "Environment" tab');
  console.log('3. Look for "Linked Services" section');
  console.log('4. Click "Link" next to your PostgreSQL database');
  console.log('5. Or manually set the missing variables');
  process.exit(1);
}

console.log('\n🔧 Testing Database Connection...');

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test basic connection
pool.query('SELECT NOW() as current_time, version() as db_version', (err, result) => {
  if (err) {
    console.log('❌ Database connection failed:');
    console.log(`   Error: ${err.message}`);
    console.log(`   Code: ${err.code}`);
    
    if (err.code === 'ENOTFOUND') {
      console.log('\n💡 Solution:');
      console.log('1. Check if database service is running');
      console.log('2. Verify DB_HOST is correct');
      console.log('3. Check network connectivity');
    } else if (err.code === '28P01') {
      console.log('\n💡 Solution:');
      console.log('1. Check DB_USER and DB_PASSWORD');
      console.log('2. Verify database credentials');
      console.log('3. Check if user has access to database');
    } else if (err.code === '3D000') {
      console.log('\n💡 Solution:');
      console.log('1. Check DB_NAME is correct');
      console.log('2. Verify database exists');
      console.log('3. Check if user has access to database');
    }
  } else {
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].current_time}`);
    console.log(`   Database: ${result.rows[0].db_version.split(' ')[0]}`);
    
    console.log('\n🎯 Database is ready! Your app should work now.');
    console.log('\n📋 Next steps:');
    console.log('1. Redeploy your web service');
    console.log('2. Test the health endpoint: /health');
    console.log('3. Test login with demo credentials');
  }
  
  pool.end();
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
}); 