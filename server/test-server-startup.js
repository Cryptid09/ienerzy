const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Test middleware imports
try {
  const { authenticateToken, requireRole } = require('./middleware/auth');
  console.log('✅ Auth middleware imported successfully');
} catch (error) {
  console.error('❌ Auth middleware import failed:', error.message);
}

// Test route imports
try {
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes imported successfully');
} catch (error) {
  console.error('❌ Auth routes import failed:', error.message);
}

try {
  const batteryRoutes = require('./routes/batteries');
  console.log('✅ Battery routes imported successfully');
} catch (error) {
  console.error('❌ Battery routes import failed:', error.message);
}

try {
  const consumerRoutes = require('./routes/consumers');
  console.log('✅ Consumer routes imported successfully');
} catch (error) {
  console.error('❌ Consumer routes import failed:', error.message);
}

try {
  const financeRoutes = require('./routes/finance');
  console.log('✅ Finance routes imported successfully');
} catch (error) {
  console.error('❌ Finance routes import failed:', error.message);
}

try {
  const serviceRoutes = require('./routes/service');
  console.log('✅ Service routes imported successfully');
} catch (error) {
  console.error('❌ Service routes import failed:', error.message);
}

try {
  const messagingRoutes = require('./routes/messaging');
  console.log('✅ Messaging routes imported successfully');
} catch (error) {
  console.error('❌ Messaging routes import failed:', error.message);
}

try {
  const emailRoutes = require('./routes/email');
  console.log('✅ Email routes imported successfully');
} catch (error) {
  console.error('❌ Email routes import failed:', error.message);
}

try {
  const emailOAuthRoutes = require('./routes/email-oauth');
  console.log('✅ Email OAuth routes imported successfully');
} catch (error) {
  console.error('❌ Email OAuth routes import failed:', error.message);
}

try {
  const nbfcRoutes = require('./routes/nbfc');
  console.log('✅ NBFC routes imported successfully');
} catch (error) {
  console.error('❌ NBFC routes import failed:', error.message);
}

try {
  const analyticsRoutes = require('./routes/analytics');
  console.log('✅ Analytics routes imported successfully');
} catch (error) {
  console.error('❌ Analytics routes import failed:', error.message);
}

console.log('\n🎯 Server startup test completed!');
console.log('If all imports are successful, the server should start without errors.'); 