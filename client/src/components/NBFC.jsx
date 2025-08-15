import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NBFC = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [formData, setFormData] = useState({
    consumer_id: '',
    battery_id: '',
    amount: '',
    tenure_months: 12,
    interest_rate: 12.0
  });
  const [disbursementData, setDisbursementData] = useState({
    application_id: '',
    disbursed_amount: '',
    disbursement_date: '',
    loan_account_number: ''
  });

  useEffect(() => {
    fetchApplications();
    if (user.role === 'nbfc' || user.role === 'admin') {
      fetchPortfolio();
    }
  }, [user.role]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // For dealers, we'll need to fetch their applications
      // For NBFC and admin, fetch all applications
      const response = await axios.get('/nbfc/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('/analytics/nbfc-portfolio');
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/nbfc/submit-application', formData);
      setShowApplicationModal(false);
      setFormData({ consumer_id: '', battery_id: '', amount: '', tenure_months: 12, interest_rate: 12.0 });
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit application');
    }
  };

  const handleDisbursement = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/nbfc/disbursement', disbursementData);
      setShowDisbursementModal(false);
      setDisbursementData({ application_id: '', disbursed_amount: '', disbursement_date: '', loan_account_number: '' });
      fetchApplications();
      fetchPortfolio();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to record disbursement');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'status-pending';
      case 'approved':
        return 'status-active';
      case 'rejected':
        return 'status-inactive';
      case 'disbursed':
        return 'status-active';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-xl text-gray-600">Loading NBFC data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>NBFC Management</h1>
        <p>Manage finance applications and portfolio analytics</p>
      </div>

      {/* Portfolio Overview for NBFC and Admin */}
      {(user.role === 'nbfc' || user.role === 'admin') && portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-blue-600">{portfolio.portfolio.total_applications}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Disbursed</h3>
            <p className="text-3xl font-bold text-green-600">{portfolio.portfolio.disbursed}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Total Disbursed</h3>
            <p className="text-3xl font-bold text-purple-600">
              ₹{(portfolio.portfolio.total_disbursed || 0).toLocaleString()}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Avg Interest Rate</h3>
            <p className="text-3xl font-bold text-orange-600">
              {(portfolio.portfolio.avg_interest_rate || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <div className="action-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search applications..."
            className="form-input"
          />
        </div>
        <div className="flex gap-3">
          {/* Only dealers can submit applications */}
          {user.role === 'dealer' && (
            <button
              onClick={() => setShowApplicationModal(true)}
              className="btn btn-primary"
            >
              + Submit Application
            </button>
          )}
          {/* Only NBFC and admin can record disbursements */}
          {(user.role === 'nbfc' || user.role === 'admin') && (
            <button
              onClick={() => setShowDisbursementModal(true)}
              className="btn btn-secondary"
            >
              + Record Disbursement
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Application ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Consumer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Battery</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tenure</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">#{app.id}</td>
                  <td className="py-3 px-4 text-sm">
                    <div>
                      <div className="font-medium">{app.consumer_name}</div>
                      <div className="text-gray-500">{app.consumer_phone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono">{app.battery_serial}</td>
                  <td className="py-3 px-4 text-sm">₹{parseFloat(app.amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">{app.tenure_months} months</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedApplication(app);
                          // Show application details or status
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        View
                      </button>
                      {/* Only NBFC and admin can approve/reject */}
                      {(user.role === 'nbfc' || user.role === 'admin') && app.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => {
                              // Handle approval
                            }}
                            className="btn btn-success text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              // Handle rejection
                            }}
                            className="btn btn-danger text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Submit NBFC Application</h2>
            <form onSubmit={handleSubmitApplication}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consumer ID
                </label>
                <input
                  type="number"
                  value={formData.consumer_id}
                  onChange={(e) => setFormData({...formData, consumer_id: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Battery ID
                </label>
                <input
                  type="number"
                  value={formData.battery_id}
                  onChange={(e) => setFormData({...formData, battery_id: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenure (months)
                </label>
                <input
                  type="number"
                  value={formData.tenure_months}
                  onChange={(e) => setFormData({...formData, tenure_months: e.target.value})}
                  className="form-input w-full"
                  min="1"
                  max="60"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                  className="form-input w-full"
                  step="0.1"
                  min="0"
                  max="30"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disbursement Modal */}
      {showDisbursementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Record Disbursement</h2>
            <form onSubmit={handleDisbursement}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application ID
                </label>
                <input
                  type="number"
                  value={disbursementData.application_id}
                  onChange={(e) => setDisbursementData({...disbursementData, application_id: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disbursed Amount (₹)
                </label>
                <input
                  type="number"
                  value={disbursementData.disbursed_amount}
                  onChange={(e) => setDisbursementData({...disbursementData, disbursed_amount: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disbursement Date
                </label>
                <input
                  type="date"
                  value={disbursementData.disbursement_date}
                  onChange={(e) => setDisbursementData({...disbursementData, disbursement_date: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Account Number
                </label>
                <input
                  type="text"
                  value={disbursementData.loan_account_number}
                  onChange={(e) => setDisbursementData({...disbursementData, loan_account_number: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Record Disbursement
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisbursementModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NBFC; 