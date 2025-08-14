import React, { useState } from 'react';

const Signup = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'dealer',
    password: '',
    confirmPassword: '',
    dealerPhone: '',
    pan: '',
    aadhar: ''
  });
  const [userType, setUserType] = useState('staff'); // 'staff' or 'consumer'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (userType === 'staff') {
        // Staff user signup
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            password: formData.password
          })
        });
      } else {
        // Consumer signup
        response = await fetch('/api/auth/signup-consumer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            dealerPhone: formData.dealerPhone,
            pan: formData.pan || null,
            aadhar: formData.aadhar || null
          })
        });
      }

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Auto-login after successful signup
        if (onSignup && data.token) {
          localStorage.setItem('token', data.token);
          onSignup(data.user);
        }
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      role: 'dealer',
      password: '',
      confirmPassword: '',
      dealerPhone: '',
      pan: '',
      aadhar: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Ienerzy Battery Management System
          </p>
        </div>

        {/* User Type Selector */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setUserType('staff')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
              userType === 'staff'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Staff User
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Staff-specific fields */}
            {userType === 'staff' && (
              <>
                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="dealer">Dealer</option>
                    <option value="admin">Admin</option>
                    <option value="nbfc">NBFC Partner</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm password"
                  />
                </div>
              </>
            )}

            {/* Consumer-specific fields */}
            {userType === 'consumer' && (
              <>
                {/* Dealer Phone */}
                <div>
                  <label htmlFor="dealerPhone" className="block text-sm font-medium text-gray-700">
                    Dealer Phone Number
                  </label>
                  <input
                    id="dealerPhone"
                    name="dealerPhone"
                    type="tel"
                    required
                    value={formData.dealerPhone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter dealer's phone number"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the phone number of the dealer who will manage your account
                  </p>
                </div>

                {/* PAN (Optional) */}
                <div>
                  <label htmlFor="pan" className="block text-sm font-medium text-gray-700">
                    PAN Number (Optional)
                  </label>
                  <input
                    id="pan"
                    name="pan"
                    type="text"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter PAN number"
                  />
                </div>

                {/* Aadhar (Optional) */}
                <div>
                  <label htmlFor="aadhar" className="block text-sm font-medium text-gray-700">
                    Aadhar Number (Optional)
                  </label>
                  <input
                    id="aadhar"
                    name="aadhar"
                    type="text"
                    value={formData.aadhar}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Aadhar number"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">{success}</div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 