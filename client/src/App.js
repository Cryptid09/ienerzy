import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

// Protected Route Component
function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Public Route Component (redirects if already logged in)
function PublicRoute({ children, user }) {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

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

  // Clean up navigation state when user changes
  useEffect(() => {
    if (user !== null) {
      // Force a small delay to let React Router settle
      const timer = setTimeout(() => {
        // This helps prevent routing conflicts
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user]);

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
          <Routes key={user ? 'authenticated' : 'unauthenticated'}>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicRoute user={user}>
                  <Login onLogin={handleLogin} />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute user={user}>
                  <Login onLogin={handleLogin} />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute user={user}>
                  <Signup onLogin={handleLogin} />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute user={user}>
                  <Dashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/batteries" 
              element={
                <ProtectedRoute user={user}>
                  <Batteries user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/consumers" 
              element={
                <ProtectedRoute user={user}>
                  <Consumers user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/finance" 
              element={
                <ProtectedRoute user={user}>
                  <Finance user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/service" 
              element={
                <ProtectedRoute user={user}>
                  <Service user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/consumer-view" 
              element={
                <ProtectedRoute user={user}>
                  <ConsumerView user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messaging" 
              element={
                <ProtectedRoute user={user}>
                  <MessagingTest user={user} />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                user ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 