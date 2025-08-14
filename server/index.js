const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const batteryRoutes = require('./routes/batteries');
const consumerRoutes = require('./routes/consumers');
const financeRoutes = require('./routes/finance');
const serviceRoutes = require('./routes/service');
const messagingRoutes = require('./routes/messaging');
const emailRoutes = require('./routes/email');
const emailOAuthRoutes = require('./routes/email-oauth');
const { setupDatabase } = require('./database/setup');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batteries', batteryRoutes);
app.use('/api/consumers', consumerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email/oauth', emailOAuthRoutes);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for all non-API routes (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await setupDatabase();
    console.log('Database setup completed');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.NODE_ENV === 'production') {
        console.log('Production mode: Serving React build');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 