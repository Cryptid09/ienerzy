import React, { useState } from 'react';
import axios from 'axios';

const MessagingTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

  // Test data for different message types
  const [batteryData, setBatteryData] = useState({
    id: 'BAT001',
    status: 'Normal',
    voltage: '48.5',
    temperature: '25'
  });

  const [ticketData, setTicketData] = useState({
    id: 'TKT001',
    status: 'Open',
    priority: 'High',
    description: 'Battery malfunction reported'
  });

  const [paymentData, setPaymentData] = useState({
    amount: '5000',
    description: 'Monthly EMI',
    dueDate: '2024-02-15'
  });

  const checkServiceStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/messaging/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setServiceStatus(response.data.data);
      setResult({ message: 'Service status retrieved successfully', data: response.data.data });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check service status');
    } finally {
      setLoading(false);
    }
  };

  const sendCustomSMS = async () => {
    if (!phoneNumber || !message) {
      setError('Phone number and message are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messaging/send-sms', {
        phoneNumber,
        message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber || !otp) {
      setError('Phone number and OTP are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messaging/send-otp', {
        phoneNumber,
        otp
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendBatteryStatus = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messaging/battery-status', {
        phoneNumber,
        batteryData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send battery status notification');
    } finally {
      setLoading(false);
    }
  };

  const sendServiceNotification = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messaging/service-notification', {
        phoneNumber,
        ticketData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send service notification');
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentReminder = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messaging/payment-reminder', {
        phoneNumber,
        paymentData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send payment reminder');
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messaging/test', {
        phoneNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test SMS');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Twilio Messaging Service Test</h2>
      
      {/* Service Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Service Status</h3>
        <button
          onClick={checkServiceStatus}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Service Status'}
        </button>
        
        {serviceStatus && (
          <div className="mt-3 p-3 bg-white rounded border">
            <p><strong>Available:</strong> {serviceStatus.available ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Provider:</strong> {serviceStatus.provider}</p>
            <p><strong>Phone Number:</strong> {serviceStatus.phoneNumber || 'Not configured'}</p>
            <p><strong>Initialized:</strong> {serviceStatus.initialized ? '✅ Yes' : '❌ No'}</p>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number (with country code, e.g., +919876543210)
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+919876543210"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Format: +[country code][number] (e.g., +91 for India, +1 for US)
        </p>
      </div>

      {/* Test SMS */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Test SMS</h3>
        <button
          onClick={sendTestSMS}
          disabled={loading || !phoneNumber}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test SMS'}
        </button>
        <p className="text-sm text-green-600 mt-2">
          Sends a test message to verify the service is working
        </p>
      </div>

      {/* Custom SMS */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">Custom SMS</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your custom message here..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
        />
        <button
          onClick={sendCustomSMS}
          disabled={loading || !phoneNumber || !message}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Custom SMS'}
        </button>
      </div>

      {/* OTP SMS */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">OTP SMS</h3>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-3"
        />
        <button
          onClick={sendOTP}
          disabled={loading || !phoneNumber || !otp}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send OTP SMS'}
        </button>
      </div>

      {/* Predefined Message Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Battery Status */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Battery Status</h3>
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={batteryData.id}
              onChange={(e) => setBatteryData({...batteryData, id: e.target.value})}
              placeholder="Battery ID"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={batteryData.status}
              onChange={(e) => setBatteryData({...batteryData, status: e.target.value})}
              placeholder="Status"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={batteryData.voltage}
              onChange={(e) => setBatteryData({...batteryData, voltage: e.target.value})}
              placeholder="Voltage"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={batteryData.temperature}
              onChange={(e) => setBatteryData({...batteryData, temperature: e.target.value})}
              placeholder="Temperature"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={sendBatteryStatus}
            disabled={loading || !phoneNumber}
            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            Send Battery Status
          </button>
        </div>

        {/* Service Notification */}
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Service Ticket</h3>
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={ticketData.id}
              onChange={(e) => setTicketData({...ticketData, id: e.target.value})}
              placeholder="Ticket ID"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={ticketData.status}
              onChange={(e) => setTicketData({...ticketData, status: e.target.value})}
              placeholder="Status"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={ticketData.priority}
              onChange={(e) => setTicketData({...ticketData, priority: e.target.value})}
              placeholder="Priority"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={ticketData.description}
              onChange={(e) => setTicketData({...ticketData, description: e.target.value})}
              placeholder="Description"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={sendServiceNotification}
            disabled={loading || !phoneNumber}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
          >
            Send Service Notification
          </button>
        </div>

        {/* Payment Reminder */}
        <div className="p-4 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-2">Payment Reminder</h3>
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
              placeholder="Amount"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              value={paymentData.description}
              onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
              placeholder="Description"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="date"
              value={paymentData.dueDate}
              onChange={(e) => setPaymentData({...paymentData, dueDate: e.target.value})}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={sendPaymentReminder}
            disabled={loading || !phoneNumber}
            className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
          >
            Send Payment Reminder
          </button>
        </div>
      </div>

      {/* Results */}
      {(result || error) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Results</h3>
            <button
              onClick={clearResults}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Clear
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Success:</p>
              <p className="text-green-600">{result.message}</p>
              {result.data && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Setup Instructions */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Sign up for a free Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">twilio.com</a></li>
          <li>Get your Account SID and Auth Token from the Twilio Console</li>
          <li>Get a Twilio phone number (free tier includes one number)</li>
          <li>Add these to your <code className="bg-gray-200 px-1 rounded">.env</code> file:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><code>TWILIO_ACCOUNT_SID=your_account_sid</code></li>
              <li><code>TWILIO_AUTH_TOKEN=your_auth_token</code></li>
              <li><code>TWILIO_PHONE_NUMBER=your_twilio_number</code></li>
            </ul>
          </li>
          <li>Restart your server</li>
          <li>Test with a real phone number (free tier can only send to verified numbers initially)</li>
        </ol>
      </div>
    </div>
  );
};

export default MessagingTest; 