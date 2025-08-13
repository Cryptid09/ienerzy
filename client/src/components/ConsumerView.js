import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConsumerView = ({ user }) => {
  const [batteries, setBatteries] = useState([]);
  const [emiDue, setEmiDue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    fetchConsumerData();
  }, []);

  const fetchConsumerData = async () => {
    try {
      setLoading(true);
      
      if (user.role === 'consumer') {
        // For consumer users, fetch their specific data
        const [batteriesRes, emiRes] = await Promise.all([
          axios.get(`/consumers/${user.id}/batteries`),
          axios.get(`/consumers/${user.id}/emi-due`)
        ]);
        
        setBatteries(batteriesRes.data);
        setEmiDue(emiRes.data);
      } else {
        // For dealer/admin users, show all data (existing behavior)
        const [batteriesRes, emiRes] = await Promise.all([
          axios.get('/batteries'),
          axios.get('/finance/emi-due')
        ]);
        
        setBatteries(batteriesRes.data);
        setEmiDue(emiRes.data);
      }
    } catch (error) {
      console.error('Error fetching consumer data:', error);
      // If specific consumer endpoints don't exist, fall back to showing all data
      try {
        const [batteriesRes, emiRes] = await Promise.all([
          axios.get('/batteries'),
          axios.get('/finance/emi-due')
        ]);
        
        setBatteries(batteriesRes.data);
        setEmiDue(emiRes.data);
      } catch (fallbackError) {
        console.error('Fallback data fetch failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewBattery = async (battery) => {
    try {
      const response = await axios.get(`/batteries/${battery.serial_number}`);
      setSelectedBattery(response.data.battery);
      setTelemetry(response.data.telemetry);
    } catch (error) {
      console.error('Error fetching battery details:', error);
    }
  };

  const handleEMIPayment = async (emiId, amount) => {
    try {
      await axios.post('/finance/emi-payment', { emi_id: emiId, payment_amount: amount });
      fetchConsumerData();
      alert('EMI payment successful!');
    } catch (error) {
      console.error('Error processing EMI payment:', error);
      alert('Payment failed. Please try again.');
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
        <div className="text-xl text-gray-600">Loading consumer data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Consumer Dashboard</h1>
        <p>Monitor your battery health and manage EMI payments</p>
      </div>

      {/* Battery Overview */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Batteries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batteries.map((battery) => (
            <div key={battery.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{battery.serial_number}</h3>
                <span className={`status-badge ${getStatusColor(battery.status)}`}>
                  {battery.status}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Health Score</span>
                  <span className="font-medium">{battery.health_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      battery.health_score > 80 ? 'bg-green-500' : 
                      battery.health_score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${battery.health_score}%` }}
                  ></div>
                </div>
              </div>
              
              <button
                onClick={() => handleViewBattery(battery)}
                className="btn btn-primary w-full text-sm"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* EMI Due */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">EMI Due</h2>
        {emiDue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
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
                    <td className="py-3 px-4 font-mono text-sm">{emi.battery_serial}</td>
                    <td className="py-3 px-4">{new Date(emi.due_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium">₹{emi.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${emi.status === 'overdue' ? 'status-overdue' : 'status-pending'}`}>
                        {emi.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {emi.status !== 'paid' && (
                        <button
                          onClick={() => handleEMIPayment(emi.id, emi.amount)}
                          className="btn btn-success text-xs"
                        >
                          Pay EMI
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No EMI payments due at the moment.
          </div>
        )}
      </div>

      {/* Battery Details Modal */}
      {selectedBattery && telemetry && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Battery Details - {selectedBattery.serial_number}</h2>
              <button
                onClick={() => setSelectedBattery(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Battery Status</h3>
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
                onClick={() => setSelectedBattery(null)}
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

export default ConsumerView; 