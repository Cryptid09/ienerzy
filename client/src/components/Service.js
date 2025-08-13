import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Service = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    battery_id: '',
    issue_category: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, batteriesRes] = await Promise.all([
        axios.get('/service/tickets'),
        axios.get('/batteries')
      ]);
      
      setTickets(ticketsRes.data);
      setBatteries(batteriesRes.data);
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/service/tickets', formData);
      setShowAddModal(false);
      setFormData({ battery_id: '', issue_category: '', description: '', location: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding ticket:', error);
      alert(error.response?.data?.error || 'Failed to add ticket');
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await axios.put(`/service/tickets/${ticketId}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'status-pending';
      case 'assigned':
        return 'status-maintenance';
      case 'in_progress':
        return 'status-maintenance';
      case 'resolved':
        return 'status-active';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-xl text-gray-600">Loading service tickets...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Service Management</h1>
        <p>Manage service tickets and technician assignments</p>
      </div>

      <div className="action-bar">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + Create Service Ticket
        </button>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Service Tickets</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Battery</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Issue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Technician</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">#{ticket.id}</td>
                  <td className="py-3 px-4 font-mono text-sm">{ticket.battery_serial}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{ticket.issue_category}</div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500">{ticket.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {ticket.technician ? (
                      <div>
                        <div className="font-medium">{ticket.technician.name}</div>
                        <div className="text-sm text-gray-500">{ticket.technician.location}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                      className="form-input text-xs py-1"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Service Ticket</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddTicket}>
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
                <label htmlFor="issue_category" className="form-label">
                  Issue Category
                </label>
                <select
                  id="issue_category"
                  value={formData.issue_category}
                  onChange={(e) => setFormData({...formData, issue_category: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Issue Category</option>
                  <option value="Low Performance">Low Performance</option>
                  <option value="Charging Issues">Charging Issues</option>
                  <option value="Physical Damage">Physical Damage</option>
                  <option value="Software Error">Software Error</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input"
                  rows="3"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="form-input"
                  placeholder="Enter location for service"
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
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service; 