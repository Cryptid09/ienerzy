import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Batteries from './components/Batteries';
import Consumers from './components/Consumers';
import Finance from './components/Finance';
import Service from './components/Service';
import ConsumerView from './components/ConsumerView';
import './App.css';

// Set default axios base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone) => {
    try {
      const response = await axios.post('/auth/login', { phone });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      const response = await axios.post('/auth/verify-otp', { phone, otp });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'OTP verification failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={login} onVerifyOTP={verifyOTP} />;
  }

  return (
    <div className="App">
      <Navbar user={user} onLogout={logout} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/batteries" element={<Batteries user={user} />} />
          <Route path="/consumers" element={<Consumers user={user} />} />
          <Route path="/finance" element={<Finance user={user} />} />
          <Route path="/service" element={<Service user={user} />} />
          <Route path="/consumer-view" element={<ConsumerView user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App; 