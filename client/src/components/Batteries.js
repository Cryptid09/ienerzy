import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Batteries = ({ user }) => {
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [formData, setFormData] = useState({
    serial_number: '',
    health_score: 100
  });

  useEffect(() => {
    fetchBatteries();
  }, []);

  const fetchBatteries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/batteries');
      setBatteries(response.data);
    } catch (error) {
      console.error('Error fetching batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBattery = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/batteries', formData);
      setShowAddModal(false);
      setFormData({ serial_number: '', health_score: 100 });
      fetchBatteries();
    } catch (error) {
      console.error('Error adding battery:', error);
      alert(error.response?.data?.error || 'Failed to add battery');
    }
  };

  const handleStatusChange = async (serial, action) => {
    try {
      await axios.post(`/batteries/${serial}/control`, { action });
      fetchBatteries();
    } catch (error) {
      console.error('Error updating battery status:', error);
    }
  };

  const handleViewTelemetry = async (serial) => {
    try {
      const response = await axios.get(`/batteries/${serial}`);
      setSelectedBattery(response.data.battery);
      setTelemetry(response.data.telemetry);
      setShowTelemetryModal(true);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'maintenance':
        return 'status-maintenance';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-xl text-gray-600">Loading batteries...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Battery Management</h1>
        <p>Manage your battery inventory and monitor their status</p>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search batteries..."
            className="form-input"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            + Add Battery
          </button>
          <a
            href="/service"
            className="btn btn-secondary"
          >
            📋 Service Tickets
          </a>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Serial Number</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Health Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Consumer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batteries.map((battery) => (
                <tr key={battery.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{battery.serial_number}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${getStatusColor(battery.status)}`}>
                      {battery.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${battery.health_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{battery.health_score}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {battery.consumer_name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewTelemetry(battery.serial_number)}
                        className="btn btn-secondary text-xs"
                      >
                        Telemetry
                      </button>
                      <select
                        value={battery.status}
                        onChange={(e) => handleStatusChange(battery.serial_number, e.target.value)}
                        className="form-input text-xs py-1"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Battery Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Battery</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddBattery}>
              <div className="form-group">
                <label htmlFor="serial_number" className="form-label">
                  Serial Number
                </label>
                <input
                  type="text"
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="health_score" className="form-label">
                  Initial Health Score
                </label>
                <input
                  type="number"
                  id="health_score"
                  value={formData.health_score}
                  onChange={(e) => setFormData({...formData, health_score: parseInt(e.target.value)})}
                  className="form-input"
                  min="0"
                  max="100"
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
                  Add Battery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telemetry Modal */}
      {showTelemetryModal && selectedBattery && telemetry && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Battery Telemetry - {selectedBattery.serial_number}</h2>
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Battery Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 status-badge ${getStatusColor(selectedBattery.status)}`}>
                    {selectedBattery.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Health Score:</span>
                  <span className="ml-2 font-medium">{selectedBattery.health_score}%</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Real-time Telemetry</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{telemetry.voltage}V</div>
                  <div className="text-sm text-gray-600">Voltage</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{telemetry.current}A</div>
                  <div className="text-sm text-gray-600">Current</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{telemetry.soc}%</div>
                  <div className="text-sm text-gray-600">State of Charge</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {telemetry.location.lat}, {telemetry.location.lng}
                  </div>
                  <div className="text-sm text-gray-600">Location</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batteries; 