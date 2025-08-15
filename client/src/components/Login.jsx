import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('consumer');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [smsStatus, setSmsStatus] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSmsStatus('');

    try {
      const response = await axios.post('/auth/login', { phone, userType });
      
      if (response.data.smsSid) {
        setSuccess('OTP sent successfully via SMS!');
        setSmsStatus('SMS delivered');
        setShowOTP(true);
      } else if (response.data.otp) {
        setSuccess(`OTP sent! Check console for: ${response.data.otp}`);
        setSmsStatus('Console fallback');
        setShowOTP(true);
      } else {
        setError('Failed to send OTP');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/verify-otp', { phone, otp, userType });
      
      if (response.data.token && response.data.refreshToken) {
        // Store both tokens
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        // Set default Authorization header immediately
        try {
          axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
        } catch (_) {}
        
        onLogin(response.data.user);
        setSuccess('Login successful!');
      } else {
        setError('Invalid OTP');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/auth/resend-otp', { phone, userType });
      
      if (response.data.smsSid) {
        setSuccess('OTP resent successfully!');
        setSmsStatus('SMS delivered');
      } else if (response.data.otp) {
        setSuccess(`OTP resent! Check console for: ${response.data.otp}`);
        setSmsStatus('Console fallback');
      } else {
        setError('Failed to resend OTP');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Ienerzy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Battery Management System
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {!showOTP ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="consumer">Consumer</option>
                  <option value="dealer">Dealer</option>
                  <option value="admin">Admin</option>
                  <option value="nbfc">NBFC</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={userType === 'consumer' ? '9340968955' : '8888888888'}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Resend
                </button>
              </div>
            </form>
          )}

          {!showOTP && (
            <div className="text-center">
              <a
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Don't have an account? Sign up here
              </a>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
              {smsStatus && (
                <div className="text-sm text-green-600 mt-1">
                  Status: {smsStatus}
                </div>
              )}
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            <p>Demo Credentials:</p>
            <p><strong>Consumer:</strong> 9340968955</p>
            <p><strong>Dealer:</strong> 8888888888</p>
            <p><strong>Admin:</strong> 9999999999</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 