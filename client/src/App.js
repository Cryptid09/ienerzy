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

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <div className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/signup" 
              element={
                user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user ? <Dashboard user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/batteries" 
              element={
                user ? <Batteries user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/consumers" 
              element={
                user ? <Consumers user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/finance" 
              element={
                user ? <Finance user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/service" 
              element={
                user ? <Service user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/consumer-view" 
              element={
                user ? <ConsumerView user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/messaging" 
              element={
                user ? <MessagingTest user={user} /> : <Navigate to="/login" />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 