import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Analytics = ({ user }) => {
  const [dealerDashboard, setDealerDashboard] = useState(null);
  const [nbfcPortfolio, setNbfcPortfolio] = useState(null);
  const [batteryHealth, setBatteryHealth] = useState(null);
  const [serviceMetrics, setServiceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dealer');

  useEffect(() => {
    fetchAnalytics();
  }, [user.role]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch dealer dashboard data
      if (user.role === 'dealer' || user.role === 'admin') {
        const dealerResponse = await axios.get('/analytics/dealer-dashboard');
        setDealerDashboard(dealerResponse.data.dashboard);
      }
      
      // Fetch NBFC portfolio data
      if (user.role === 'nbfc' || user.role === 'admin') {
        const nbfcResponse = await axios.get('/analytics/nbfc-portfolio');
        setNbfcPortfolio(nbfcResponse.data);
      }
      
      // Fetch battery health data
      if (user.role === 'dealer' || user.role === 'admin') {
        const healthResponse = await axios.get('/analytics/battery-health');
        setBatteryHealth(healthResponse.data);
      }
      
      // Fetch service metrics
      if (user.role === 'dealer' || user.role === 'admin') {
        const serviceResponse = await axios.get('/analytics/service-metrics');
        setServiceMetrics(serviceResponse.data);
      }
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDealerDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Consumers</h3>
          <p className="text-3xl font-bold text-blue-600">{dealerDashboard?.consumers?.total_consumers || 0}</p>
          <p className="text-sm text-gray-500">
            {dealerDashboard?.consumers?.verified_consumers || 0} verified
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Batteries</h3>
          <p className="text-3xl font-bold text-green-600">{dealerDashboard?.batteries?.total_batteries || 0}</p>
          <p className="text-sm text-gray-500">
            {dealerDashboard?.batteries?.active_batteries || 0} active
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Finance Applications</h3>
          <p className="text-3xl font-bold text-purple-600">{dealerDashboard?.finance?.total_applications || 0}</p>
          <p className="text-sm text-gray-500">
            ₹{(dealerDashboard?.finance?.total_disbursed || 0).toLocaleString()} disbursed
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Service Tickets</h3>
          <p className="text-3xl font-bold text-orange-600">{dealerDashboard?.service?.total_tickets || 0}</p>
          <p className="text-sm text-gray-500">
            {dealerDashboard?.service?.resolved_tickets || 0} resolved
          </p>
        </div>
      </div>

      {/* Monthly Trends */}
      {dealerDashboard?.trends && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Monthly Trends</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4">Month</th>
                  <th className="text-left py-2 px-4">New Consumers</th>
                  <th className="text-left py-2 px-4">New Batteries</th>
                </tr>
              </thead>
              <tbody>
                {dealerDashboard.trends.map((trend, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-4">
                      {new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2 px-4">{trend.new_consumers}</td>
                    <td className="py-2 px-4">{trend.new_batteries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderNBFCPortfolio = () => (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
          <p className="text-3xl font-bold text-blue-600">{nbfcPortfolio?.portfolio?.total_applications || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Disbursed</h3>
          <p className="text-3xl font-bold text-green-600">{nbfcPortfolio?.portfolio?.disbursed || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Disbursed</h3>
          <p className="text-3xl font-bold text-purple-600">
            ₹{(nbfcPortfolio?.portfolio?.total_disbursed || 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Avg Interest Rate</h3>
          <p className="text-3xl font-bold text-orange-600">
            {(nbfcPortfolio?.portfolio?.avg_interest_rate || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Risk Analysis */}
      {nbfcPortfolio?.risk_analysis && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Risk Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Active Loans</p>
              <p className="text-2xl font-bold">{nbfcPortfolio.risk_analysis.total_active_loans}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loans with Overdue</p>
              <p className="text-2xl font-bold text-red-600">{nbfcPortfolio.risk_analysis.loans_with_overdue}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{(nbfcPortfolio.risk_analysis.total_overdue_amount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Overdue per Loan</p>
              <p className="text-2xl font-bold">
                {(nbfcPortfolio.risk_analysis.avg_overdue_per_loan || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collection Efficiency */}
      {nbfcPortfolio?.collection_efficiency && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Collection Efficiency</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4">Month</th>
                  <th className="text-left py-2 px-4">Total EMIs</th>
                  <th className="text-left py-2 px-4">Paid EMIs</th>
                  <th className="text-left py-2 px-4">Collection Rate</th>
                  <th className="text-left py-2 px-4">Amount Collected</th>
                </tr>
              </thead>
              <tbody>
                {nbfcPortfolio.collection_efficiency.map((month, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-4">
                      {new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2 px-4">{month.total_emis}</td>
                    <td className="py-2 px-4">{month.paid_emis}</td>
                    <td className="py-2 px-4">{month.collection_rate}%</td>
                    <td className="py-2 px-4">₹{month.collected_amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderBatteryHealth = () => (
    <div className="space-y-6">
      {/* Health Distribution */}
      {batteryHealth?.health_distribution && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Battery Health Distribution</h3>
          <div className="space-y-3">
            {batteryHealth.health_distribution.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.health_category}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full" 
                      style={{ width: `${(category.battery_count / (batteryHealth.health_distribution.reduce((sum, cat) => sum + cat.battery_count, 0))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {category.battery_count} batteries
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Alerts */}
      {batteryHealth?.maintenance_alerts && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Maintenance Alerts</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4">Battery</th>
                  <th className="text-left py-2 px-4">Consumer</th>
                  <th className="text-left py-2 px-4">Health Score</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Alert Level</th>
                </tr>
              </thead>
              <tbody>
                {batteryHealth.maintenance_alerts.map((alert, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-4 font-mono">{alert.serial_number}</td>
                    <td className="py-2 px-4">{alert.consumer_name}</td>
                    <td className="py-2 px-4">
                      <span className={`font-medium ${alert.health_score < 60 ? 'text-red-600' : alert.health_score < 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {alert.health_score}%
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`status-badge ${alert.status === 'maintenance' ? 'status-maintenance' : 'status-active'}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-600">{alert.alert_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderServiceMetrics = () => (
    <div className="space-y-6">
      {/* Ticket Metrics */}
      {serviceMetrics?.ticket_metrics && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Service Ticket Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceMetrics.ticket_metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold text-blue-600">{metric.count}</p>
                <p className="text-sm text-gray-600 capitalize">{metric.status.replace('_', ' ')}</p>
                {metric.avg_resolution_hours && (
                  <p className="text-xs text-gray-500">
                    Avg: {metric.avg_resolution_hours.toFixed(1)}h
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Analysis */}
      {serviceMetrics?.resolution_analysis && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Resolution Time Analysis</h3>
          <div className="space-y-3">
            {serviceMetrics.resolution_analysis.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.resolution_category}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full" 
                      style={{ width: `${(category.ticket_count / (serviceMetrics.resolution_analysis.reduce((sum, cat) => sum + cat.ticket_count, 0))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-20 text-right">
                    {category.ticket_count} tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Analytics & Reporting</h1>
        <p>Comprehensive insights into your business performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(user.role === 'dealer' || user.role === 'admin') && (
              <button
                onClick={() => setActiveTab('dealer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dealer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dealer Dashboard
              </button>
            )}
            {(user.role === 'nbfc' || user.role === 'admin') && (
              <button
                onClick={() => setActiveTab('nbfc')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nbfc'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                NBFC Portfolio
              </button>
            )}
            {(user.role === 'dealer' || user.role === 'admin') && (
              <>
                <button
                  onClick={() => setActiveTab('battery')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'battery'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Battery Health
                </button>
                <button
                  onClick={() => setActiveTab('service')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'service'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Service Metrics
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'dealer' && dealerDashboard && renderDealerDashboard()}
        {activeTab === 'nbfc' && nbfcPortfolio && renderNBFCPortfolio()}
        {activeTab === 'battery' && batteryHealth && renderBatteryHealth()}
        {activeTab === 'service' && serviceMetrics && renderServiceMetrics()}
      </div>
    </div>
  );
};

export default Analytics; 