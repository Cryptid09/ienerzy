const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000/api';
const TEST_PHONE = '9999999999'; // Admin user from seed data
const TEST_USER_TYPE = 'admin';

async function testOTPFlow() {
  console.log('🧪 Testing OTP Flow...\n');
  
  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: TEST_PHONE,
      userType: TEST_USER_TYPE
    });
    
    console.log('✅ OTP sent successfully');
    console.log('📋 Response:', loginResponse.data);
    
    // Step 2: Verify OTP (using the OTP from response if available)
    console.log('\n🔐 Step 2: Verifying OTP...');
    
    // If OTP is included in response (for demo purposes), use it
    const otp = loginResponse.data.otp || '123456'; // Fallback for testing
    
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: TEST_PHONE,
      otp: otp,
      userType: TEST_USER_TYPE
    });
    
    console.log('✅ OTP verified successfully');
    console.log('🔑 Token received:', verifyResponse.data.token ? 'Yes' : 'No');
    console.log('📋 Response:', verifyResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testOTPFlow(); 