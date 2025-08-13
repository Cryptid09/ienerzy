# 🚀 Quick Setup Guide

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v12 or higher)

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm run install
```

### 2. Setup Database
```bash
# Create database
createdb ienerzy_mvp

# Setup schema
npm run setup-db
```

### 3. Start Development
```bash
npm run dev
```

## 🔧 Manual Setup

### Database Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ienerzy_mvp;

# Exit
\q
```

### Environment Configuration
```bash
# Copy environment file
cp server/env.example server/.env

# Edit with your database credentials
nano server/.env
```

### Individual Service Installation
```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

## 🐳 Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🎯 Available Commands

```bash
npm run dev          # Start both servers
npm run server       # Backend only
npm run client       # Frontend only
npm run build        # Build frontend
npm run install      # Install dependencies
npm run setup-db     # Setup database
```

## 🔐 Demo Credentials

- **Dealer**: `8888888888` (Check console for OTP)
- **Admin**: `9999999999` (Check console for OTP)

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🚨 Troubleshooting

### Port Conflicts
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5000

# Kill processes if needed
kill -9 <PID>
```

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l
```

### Dependencies
```bash
# Clear cache
npm cache clean --force

# Reinstall
npm run install
```

---

**That's it! Simple and clean setup.** 🎉 