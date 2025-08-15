import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalBatteries: 0,
    activeBatteries: 0,
    totalConsumers: 0,
    pendingEMIs: 0,
    openTickets: 0
  });
  const [recentBatteries, setRecentBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch batteries
      const batteriesResponse = await axios.get('/batteries');
      const batteries = batteriesResponse.data;
      
      // Fetch consumers
      const consumersResponse = await axios.get('/consumers');
      const consumers = consumersResponse.data;
      
      // Fetch EMI due
      const emiResponse = await axios.get('/finance/emi-due');
      const pendingEMIs = emiResponse.data;
      
      // Fetch service tickets
      const ticketsResponse = await axios.get('/service/tickets');
      const tickets = ticketsResponse.data;
      
      // Calculate stats
      const totalBatteries = batteries.length;
      const activeBatteries = batteries.filter(b => b.status === 'active').length;
      const totalConsumers = consumers.length;
      const pendingEMICount = pendingEMIs.length;
      const openTicketsCount = tickets.filter(t => t.status !== 'resolved').length;
      
      setStats({
        totalBatteries,
        activeBatteries,
        totalConsumers,
        pendingEMIs: pendingEMICount,
        openTickets: openTicketsCount
      });
      
      // Get recent batteries
      setRecentBatteries(batteries.slice(0, 5));
      
    } catch (error) {
      // Error fetching dashboard data
    } finally {
      setLoading(false);
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
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user.name}!</h1>
        <p>Here's an overview of your battery management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats.totalBatteries}</div>
          <div className="text-blue-100">Total Batteries</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats.activeBatteries}</div>
          <div className="text-green-100">Active Batteries</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats.totalConsumers}</div>
          <div className="text-purple-100">Total Consumers</div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats.pendingEMIs}</div>
          <div className="text-yellow-100">Pending EMIs</div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats.openTickets}</div>
          <div className="text-red-100">Open Tickets</div>
        </div>
      </div>

      {/* Recent Batteries */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Batteries</h2>
        {recentBatteries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Serial Number</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Health Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Consumer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentBatteries.map((battery) => (
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
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(battery.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No batteries found. Add your first battery to get started.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div 
          className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/batteries')}
        >
          <div className="text-4xl mb-3">🔋</div>
          <h3 className="text-lg font-semibold mb-2">Add Battery</h3>
          <p className="text-gray-600 text-sm">Register a new battery in your system</p>
        </div>
        
        <div 
          className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/consumers')}
        >
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-lg font-semibold mb-2">Add Consumer</h3>
          <p className="text-gray-600 text-sm">Onboard a new consumer customer</p>
        </div>
        
        <div 
          className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/service')}
        >
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold mb-2">Create Ticket</h3>
          <p className="text-gray-600 text-sm">Open a new service ticket</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 