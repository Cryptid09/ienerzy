import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Batteries from './components/Batteries';
import Consumers from './components/Consumers';
import Finance from './components/Finance';
import Service from './components/Service';
import ConsumerView from './components/ConsumerView';
import MessagingTest from './components/MessagingTest';
import './App.css';

// Set API base URL for Render backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ienerzy.onrender.com';
axios.defaults.baseURL = `${API_BASE_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Render routes based on authentication state
  const renderRoutes = () => {
    if (!user) {
      return (
        <Routes>
          <Route path="/" element={<Login onLogin={handleLogin} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }

    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/batteries" element={<Batteries user={user} />} />
        <Route path="/consumers" element={<Consumers user={user} />} />
        <Route path="/finance" element={<Finance user={user} />} />
        <Route path="/service" element={<Service user={user} />} />
        <Route path="/consumer-view" element={<ConsumerView user={user} />} />
        <Route path="/messaging" element={<MessagingTest user={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };

  // Handle navigation errors
  const handleNavigationError = (error) => {
    console.log('Navigation error:', error);
    // Fallback to dashboard on navigation errors
    if (user) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <div className="main-content">
          {renderRoutes()}
        </div>
      </div>
    </Router>
  );
}

export default App; 