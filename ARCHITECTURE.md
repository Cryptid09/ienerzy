# 🏗️ Ienerzy MVP Architecture

## 📁 Project Structure

```
ienerzy/
├── 📁 server/                 # Backend API (Node.js + Express)
│   ├── 📁 routes/            # API endpoints
│   ├── 📁 middleware/        # Authentication & authorization
│   ├── 📁 database/          # Database setup & migrations
│   ├── 📄 package.json       # Backend dependencies
│   ├── 📄 index.js           # Server entry point
│   └── 📄 .env               # Backend environment variables
├── 📁 client/                 # Frontend (React + Tailwind CSS)
│   ├── 📁 src/               # React components & logic
│   ├── 📁 public/            # Static assets
│   ├── 📄 package.json       # Frontend dependencies
│   └── 📄 tailwind.config.js # Tailwind configuration
├── 📄 package.json            # Root orchestration scripts
├── 📄 dev.sh                  # Development server script
├── 📄 SETUP.md                 # Setup guide
└── 📄 README.md               # Project documentation
```

## 🔧 Dependency Management

### **Why No Root Dependencies?**

The root `package.json` is intentionally **minimal** and serves as an **orchestrator** rather than a dependency manager:

#### ✅ **What Root Contains:**
- **Scripts**: Commands to run both servers
- **No Dependencies**: Keeps the root clean
- **Orchestration**: Coordinates between server and client

#### ✅ **What Each Folder Contains:**
- **`server/`**: All backend dependencies (Express, PostgreSQL, JWT, etc.)
- **`client/`**: All frontend dependencies (React, Tailwind, Axios, etc.)

### **Benefits of This Architecture:**

1. **🎯 Clear Separation**: Backend and frontend are completely independent
2. **🚀 Faster Installs**: No unnecessary root dependencies
3. **🔧 Easier Maintenance**: Each folder manages its own packages
4. **📦 Cleaner Builds**: No confusion about where dependencies come from
5. **🐳 Docker Ready**: Each service can be containerized independently

## 🚀 Development Workflow

### **Starting Development:**

#### **Option 1: NPM Script (Recommended)**
```bash
npm run dev           # Starts both servers cleanly
```

#### **Option 2: Individual Services**
```bash
npm run server        # Start backend only
npm run client        # Start frontend only
```

#### **Option 3: Manual**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm start
```

### **Installing Dependencies:**

```bash
# All dependencies (recommended)
npm run install

# Or install separately:
cd server && npm install
cd client && npm install
```

## 🗄️ Database Architecture

### **PostgreSQL Setup:**
- **Database**: `ienerzy_mvp`
- **User**: `postgres`
- **Port**: `5432`
- **Schema**: Auto-created on first run

### **Tables:**
- `users` - User accounts and roles
- `batteries` - Battery inventory
- `consumers` - Customer information
- `finance_applications` - Loan applications
- `emi_schedules` - EMI payment schedules
- `service_tickets` - Service requests

## 🔐 Authentication Flow

### **JWT + OTP System:**
1. **Login**: User enters phone number
2. **OTP Generation**: Mock OTP sent (check console)
3. **Verification**: User enters OTP
4. **JWT Issuance**: Token with role-based permissions
5. **API Access**: All subsequent requests use JWT

### **Role Hierarchy:**
- **Admin**: Full system access
- **Dealer**: Manage own batteries/consumers
- **NBFC**: Finance operations only

## 🌐 API Architecture

### **RESTful Endpoints:**
- **Authentication**: `/api/auth/*`
- **Batteries**: `/api/batteries/*`
- **Consumers**: `/api/consumers/*`
- **Finance**: `/api/finance/*`
- **Service**: `/api/service/*`

### **Middleware Stack:**
1. **CORS**: Cross-origin requests
2. **JSON Parser**: Request body parsing
3. **Authentication**: JWT verification
4. **Authorization**: Role-based access control

## 🎨 Frontend Architecture

### **React Components:**
- **App.js**: Main application with routing
- **Navbar**: Navigation and user info
- **Dashboard**: Overview and statistics
- **Batteries**: Battery management interface
- **Consumers**: Consumer onboarding
- **Finance**: Loan and EMI management
- **Service**: Ticket management
- **ConsumerView**: Consumer dashboard

### **State Management:**
- **Local State**: React hooks for component state
- **API Calls**: Axios for backend communication
- **Routing**: React Router for navigation

## 🔄 Data Flow

### **Real-time Updates:**
1. **WebSocket**: Server broadcasts telemetry updates
2. **Mock Data**: Simulated BMS data every 5 seconds
3. **Client Updates**: React components re-render with new data

### **API Communication:**
1. **Frontend Request**: React component makes API call
2. **Backend Processing**: Express route handles request
3. **Database Query**: PostgreSQL executes query
4. **Response**: JSON data returned to frontend
5. **UI Update**: React component updates with new data

## 🐳 Docker Architecture

### **Multi-Service Setup:**
- **PostgreSQL**: Database container
- **Backend**: Node.js API server
- **Frontend**: React development server

### **Benefits:**
- **Isolation**: Each service runs independently
- **Consistency**: Same environment across machines
- **Scalability**: Easy to scale individual services
- **Deployment**: Ready for production deployment

## 🚀 Production Considerations

### **Current State (MVP):**
- Mock integrations (OTP, NBFC, payments)
- Development-focused configuration
- Local database setup

### **Production Ready:**
- Real SMS gateway integration
- Actual NBFC API connections
- Production database setup
- Environment-specific configurations
- SSL/TLS encryption
- Rate limiting and security headers

## 📊 Performance Characteristics

### **Backend:**
- **Response Time**: < 100ms for most operations
- **Database**: Optimized queries with indexes
- **Caching**: Ready for Redis integration

### **Frontend:**
- **Bundle Size**: Optimized with Tailwind CSS
- **Loading**: Lazy loading ready
- **Responsiveness**: Mobile-first design

## 🔍 Monitoring & Debugging

### **Development Tools:**
- **Backend**: Console logging, nodemon auto-restart
- **Frontend**: React DevTools, browser console
- **Database**: PostgreSQL logs, query monitoring

### **Production Tools:**
- **Logging**: Structured logging ready
- **Metrics**: Performance monitoring ready
- **Health Checks**: Endpoint health monitoring

---

## 🎯 **Why This Architecture?**

This clean separation provides:

1. **🎯 Focus**: Each folder has a single responsibility
2. **🚀 Speed**: No unnecessary dependencies or installations
3. **🔧 Maintainability**: Easy to modify backend or frontend independently
4. **📦 Clarity**: Clear understanding of what each part does
5. **🐳 Scalability**: Ready for microservices and containerization

**Perfect for hackathons and production alike!** 🚀 