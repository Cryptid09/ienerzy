const { Pool } = require('pg');

console.log('🔍 Quick Database Connection Test\n');

// Get database credentials from environment
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('📋 Database Configuration:');
console.log(`   Host: ${dbConfig.host || 'NOT SET'}`);
console.log(`   Database: ${dbConfig.database || 'NOT SET'}`);
console.log(`   User: ${dbConfig.user || 'NOT SET'}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);

// Check if we have the minimum required variables
if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
  console.log('\n❌ Missing required database variables!');
  console.log('\n💡 Set these in Render dashboard:');
  console.log('   DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
  process.exit(1);
}

console.log('\n🔧 Testing connection...');

// Create pool and test
const pool = new Pool(dbConfig);

pool.query('SELECT NOW() as time, current_database() as db, current_user as user', (err, result) => {
  if (err) {
    console.log('❌ Connection failed:', err.message);
    console.log('   Error code:', err.code);
  } else {
    console.log('✅ Connection successful!');
    console.log(`   Time: ${result.rows[0].time}`);
    console.log(`   Database: ${result.rows[0].db}`);
    console.log(`   User: ${result.rows[0].user}`);
    console.log('\n🎯 Database is ready!');
  }
  
  pool.end();
}); 