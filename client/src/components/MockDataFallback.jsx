import React from 'react';

const MockDataFallback = ({ type, onRefresh }) => {
  const mockData = {
    batteries: [
      { id: 1, serial_number: 'BAT001', status: 'active', health_score: 95, consumer_name: 'Original Contact', created_at: new Date().toISOString() },
      { id: 2, serial_number: 'BAT002', status: 'active', health_score: 87, consumer_name: 'Original Contact', created_at: new Date().toISOString() },
      { id: 3, serial_number: 'BAT003', status: 'maintenance', health_score: 45, consumer_name: 'Unassigned', created_at: new Date().toISOString() }
    ],
    consumers: [
      { id: 1, name: 'Original Contact', phone: '9340968955', kyc_status: 'verified', dealer_id: 2, created_at: new Date().toISOString() }
    ],
    finance: [
      { id: 1, consumer_id: 1, battery_id: 1, amount: 50000, status: 'approved', created_at: new Date().toISOString() }
    ],
    emi: [
      { id: 1, finance_id: 1, due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 4167, status: 'pending' },
      { id: 2, finance_id: 1, due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 4167, status: 'pending' },
      { id: 3, finance_id: 1, due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 4167, status: 'pending' }
    ],
    tickets: [
      { id: 1, battery_id: 3, issue_category: 'Maintenance Required', status: 'assigned', assigned_to: 1, created_at: new Date().toISOString() }
    ]
  };

  const getMockData = () => {
    return mockData[type] || [];
  };

  const getMockStats = () => {
    switch (type) {
      case 'dashboard':
        return {
          totalBatteries: 3,
          activeBatteries: 2,
          totalConsumers: 1,
          pendingEMIs: 3,
          openTickets: 1
        };
      default:
        return {};
    }
  };

  if (type === 'dashboard') {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔋</div>
        <h3 className="text-xl font-semibold mb-2">Demo Mode Active</h3>
        <p className="text-gray-600 mb-4">Showing mock data for presentation purposes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl font-bold mb-2">3</div>
            <div className="text-blue-100">Total Batteries</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl font-bold mb-2">2</div>
            <div className="text-green-100">Active Batteries</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl font-bold mb-2">1</div>
            <div className="text-purple-100">Total Consumers</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl font-bold mb-2">3</div>
            <div className="text-yellow-100">Pending EMIs</div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-3xl font-bold mb-2">1</div>
            <div className="text-red-100">Open Tickets</div>
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-primary">
            Try Real Data
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-lg font-semibold mb-2">Demo Data</h3>
      <p className="text-gray-600 mb-4">Showing sample data for presentation</p>
      {onRefresh && (
        <button onClick={onRefresh} className="btn btn-primary">
          Refresh
        </button>
      )}
    </div>
  );
};

export default MockDataFallback;
export { MockDataFallback as mockDataFallback }; 