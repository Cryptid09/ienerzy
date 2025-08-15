# 🚀 Development Setup Guide

This guide will help you set up the Ienerzy system for local development.

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🗄️ Database Setup

1. **Install PostgreSQL** on your system
2. **Create a database**:
   ```sql
   CREATE DATABASE ienerzy_mvp;
   ```
3. **Set up environment variables** in `server/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ienerzy_mvp
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

## 🔧 Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Test server startup** (optional):
   ```bash
   npm run test-startup
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

## 🎨 Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API URL**:
   - The frontend is already configured to use `http://localhost:5000` in development
   - For production, set `REACT_APP_API_URL` environment variable

4. **Start the development server**:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## 🌐 Development Workflow

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm start
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔐 Default Users

The system creates default users on first run:

- **Admin**: Phone: 9999999999, Role: admin
- **Dealer**: Phone: 8888888888, Role: dealer  
- **NBFC**: Phone: 7777777777, Role: nbfc

## 🐛 Troubleshooting

### Server Won't Start
1. Check database connection
2. Verify environment variables
3. Run `npm run test-startup` to check imports

### Frontend Can't Connect to Backend
1. Ensure backend is running on port 5000
2. Check browser console for CORS errors
3. Verify API_BASE_URL configuration

### Database Issues
1. Check PostgreSQL service is running
2. Verify database credentials
3. Check database exists and is accessible

## 📚 API Documentation

- **Authentication**: `/api/auth/*`
- **Batteries**: `/api/batteries/*`
- **Consumers**: `/api/consumers/*`
- **Finance**: `/api/finance/*`
- **Service**: `/api/service/*`
- **NBFC**: `/api/nbfc/*`
- **Analytics**: `/api/analytics/*`

## 🎯 Role-Based Access

- **Consumer**: View own battery data, make EMI payments
- **Dealer**: Manage consumers, batteries, submit NBFC applications
- **NBFC**: Approve applications, manage portfolio, record disbursements
- **Admin**: Full system access

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd ienerzy

# Install all dependencies
npm run install

# Start development servers
npm run dev
```

This will start both backend and frontend servers automatically. 