const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const batteryRoutes = require('./routes/batteries');
const consumerRoutes = require('./routes/consumers');
const financeRoutes = require('./routes/finance');
const serviceRoutes = require('./routes/service');
const { setupDatabase } = require('./database/setup');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batteries', batteryRoutes);
app.use('/api/consumers', consumerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/service', serviceRoutes);

// WebSocket for real-time telemetry
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Store WebSocket connections for broadcasting
global.wss = wss;

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await setupDatabase();
    console.log('Database setup completed');
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 