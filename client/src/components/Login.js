import React, { useState } from 'react';

const Login = ({ onLogin, onVerifyOTP }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('dealer'); // 'dealer' or 'consumer'

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await onLogin(phone, userType);
      if (response.success) {
        setShowOTP(true);
        console.log(`OTP for ${userType}: ${response.otp}`);
      }
    } catch (error) {
      setError(error.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerifyOTP(phone, otp, userType);
    } catch (error) {
      setError(error.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setOtp('');
    setShowOTP(false);
    setError('');
    setUserType('dealer');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Ienerzy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Battery Management System
          </p>
        </div>

        {/* User Type Selector */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setUserType('dealer')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
              userType === 'dealer'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Dealer/Admin
          </button>
          <button
            type="button"
            onClick={() => setUserType('consumer')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border ${
              userType === 'consumer'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Consumer
          </button>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {!showOTP ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={userType === 'dealer' ? '8888888888' : '7777777777'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {userType === 'dealer' 
                    ? 'Demo: 8888888888 (Dealer) or 9999999999 (Admin)'
                    : 'Demo: 7777777777 (Consumer)'
                  }
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
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
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456"
                  maxLength="6"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Check console for OTP code
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {userType === 'dealer' 
              ? 'Login as dealer or admin to manage batteries and consumers'
              : 'Login as consumer to view battery health and manage EMIs'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 