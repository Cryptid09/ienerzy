import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Consumers = ({ user }) => {
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pan: '',
    aadhar: ''
  });

  useEffect(() => {
    fetchConsumers();
  }, []);

  const fetchConsumers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/consumers');
      setConsumers(response.data);
    } catch (error) {
      // Error fetching consumers
    } finally {
      setLoading(false);
    }
  };

  const handleAddConsumer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/consumers', formData);
      setShowAddModal(false);
      setFormData({ name: '', phone: '', pan: '', aadhar: '' });
      fetchConsumers();
    } catch (error) {
      // Error adding consumer
      alert(error.response?.data?.error || 'Failed to add consumer');
    }
  };

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'verified':
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
        <div className="text-xl text-gray-600">Loading consumers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Consumer Management</h1>
        <p>Manage your consumer customers and their KYC status</p>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search consumers..."
            className="form-input"
          />
        </div>
        {/* Only dealers and admins can add consumers */}
        {(user.role === 'dealer' || user.role === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            + Add Consumer
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">PAN</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Aadhaar</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">KYC Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {consumers.map((consumer) => (
                <tr key={consumer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{consumer.name}</td>
                  <td className="py-3 px-4 font-mono text-sm">{consumer.phone}</td>
                  <td className="py-3 px-4 font-mono text-sm">{consumer.pan || '-'}</td>
                  <td className="py-3 px-4 font-mono text-sm">{consumer.aadhar || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${getKYCStatusColor(consumer.kyc_status)}`}>
                      {consumer.kyc_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(consumer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Consumer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Consumer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddConsumer}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pan" className="form-label">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    id="pan"
                    value={formData.pan}
                    onChange={(e) => setFormData({...formData, pan: e.target.value})}
                    className="form-input"
                    maxLength="10"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aadhar" className="form-label">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    id="aadhar"
                    value={formData.aadhar}
                    onChange={(e) => setFormData({...formData, aadhar: e.target.value})}
                    className="form-input"
                    maxLength="12"
                  />
                </div>
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
                  Add Consumer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consumers; 