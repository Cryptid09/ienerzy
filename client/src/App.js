import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import NBFC from './components/NBFC';
import Analytics from './components/Analytics';
import './App.css';

// Set API base URL - use localhost in development, Render in production
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://ienerzy.onrender.com');
axios.defaults.baseURL = `${API_BASE_URL}/api`;

// Attach JWT token from localStorage to every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

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
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && refreshToken) {
      // Verify token with backend
      axios.get('/auth/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(async (error) => {
          if (error.response?.status === 401) {
            // Try to refresh token
            try {
              const refreshResponse = await axios.post('/auth/refresh', { refreshToken });
              const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;
              
              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              // Get user info with new token
              const userResponse = await axios.get('/auth/me');
              setUser(userResponse.data);
            } catch (refreshError) {
              // Refresh failed, clear tokens
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            }
          } else {
            // Other error, clear tokens
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          }
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

  const handleLogout = async () => {
    try {
      // Call logout endpoint to invalidate session
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      try {
        delete axios.defaults.headers.common.Authorization;
      } catch (_) {}
    }
  };

  const handleLogoutAll = async () => {
    try {
      // Call logout-all endpoint to invalidate all sessions
      await axios.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      try {
        delete axios.defaults.headers.common.Authorization;
      } catch (_) {}
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {user && <Navbar user={user} onLogout={handleLogout} onLogoutAll={handleLogoutAll} />}
      
      <div className="container mx-auto px-4 py-8">
        <Routes>
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
            path="/nbfc" 
            element={
              <ProtectedRoute user={user}>
                <NBFC user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute user={user}>
                <Analytics user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/consumer/:id" 
            element={
              <ProtectedRoute user={user}>
                <ConsumerView user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messaging-test" 
            element={
              <ProtectedRoute user={user}>
                <MessagingTest user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App; 