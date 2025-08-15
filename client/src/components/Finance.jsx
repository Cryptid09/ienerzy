import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Finance = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [emiDue, setEmiDue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    consumer_id: '',
    battery_id: '',
    amount: ''
  });
  const [consumers, setConsumers] = useState([]);
  const [batteries, setBatteries] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [applicationsRes, emiRes, consumersRes, batteriesRes] = await Promise.all([
        axios.get('/finance/applications'),
        axios.get('/finance/emi-due'),
        axios.get('/consumers'),
        axios.get('/batteries')
      ]);
      
      setApplications(applicationsRes.data);
      setEmiDue(emiRes.data);
      setConsumers(consumersRes.data);
      setBatteries(batteriesRes.data);
    } catch (error) {
      // Error fetching finance data
    } finally {
      setLoading(false);
    }
  };

  const handleAddApplication = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/finance/applications', formData);
      setShowAddModal(false);
      setFormData({ consumer_id: '', battery_id: '', amount: '' });
      fetchData();
    } catch (error) {
      // Error adding application
      alert(error.response?.data?.error || 'Failed to add application');
    }
  };

  const handleEMIPayment = async (emiId, amount) => {
    try {
      await axios.post('/finance/emi-payment', { emi_id: emiId, payment_amount: amount });
      fetchData();
    } catch (error) {
      // Error processing EMI payment
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-inactive';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-xl text-gray-600">Loading finance data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Finance Management</h1>
        <p>Manage loan applications and EMI tracking</p>
      </div>

      <div className="action-bar">
        {/* Only dealers and admins can create loan applications */}
        {(user.role === 'dealer' || user.role === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            + New Loan Application
          </button>
        )}
      </div>

      {/* Loan Applications */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Loan Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Consumer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Battery</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{app.consumer_name}</div>
                      <div className="text-sm text-gray-500">{app.consumer_phone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{app.battery_serial}</td>
                  <td className="py-3 px-4 font-medium">₹{app.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMI Due */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">EMI Due</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Consumer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Battery</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emiDue.map((emi) => (
                <tr key={emi.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{emi.consumer_name}</div>
                      <div className="text-sm text-gray-500">{emi.consumer_phone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{emi.battery_serial}</td>
                  <td className="py-3 px-4">{new Date(emi.due_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-medium">₹{emi.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${emi.status === 'overdue' ? 'status-overdue' : 'status-pending'}`}>
                      {emi.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {/* Only dealers, admins, and consumers can mark EMI as paid */}
                    {emi.status !== 'paid' && (user.role === 'dealer' || user.role === 'admin' || user.role === 'consumer') && (
                      <button
                        onClick={() => handleEMIPayment(emi.id, emi.amount)}
                        className="btn btn-success text-xs"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>New Loan Application</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddApplication}>
              <div className="form-group">
                <label htmlFor="consumer_id" className="form-label">
                  Consumer
                </label>
                <select
                  id="consumer_id"
                  value={formData.consumer_id}
                  onChange={(e) => setFormData({...formData, consumer_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Consumer</option>
                  {consumers.map(consumer => (
                    <option key={consumer.id} value={consumer.id}>
                      {consumer.name} ({consumer.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="battery_id" className="form-label">
                  Battery
                </label>
                <select
                  id="battery_id"
                  value={formData.battery_id}
                  onChange={(e) => setFormData({...formData, battery_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Battery</option>
                  {batteries.map(battery => (
                    <option key={battery.id} value={battery.id}>
                      {battery.serial_number} (Health: {battery.health_score}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="form-input"
                  min="1000"
                  step="1000"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance; 