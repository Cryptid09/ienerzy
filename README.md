# Ienerzy Dealer & Battery Management MVP

A minimal but functional Dealer & Battery Management system built for a 24-hour hackathon, featuring real-time telemetry, consumer onboarding, finance management, and service ticketing.

## 🚀 Features

### Core Functionality
- **Authentication & Role Management**: OTP-based login with JWT tokens and role-based access control
- **Dealer Dashboard**: Comprehensive overview with statistics and quick actions
- **Battery Management**: CRUD operations, real-time telemetry, and status control
- **Consumer Onboarding**: KYC management with document verification (mocked)
- **Finance Workflow**: Loan applications, EMI scheduling, and payment tracking
- **Service Management**: Ticket creation, technician assignment, and status tracking
- **Consumer View**: Battery health monitoring and EMI payment interface

### Technical Features
- **Real-time Telemetry**: Mock BMS data with WebSocket support
- **Mock Integrations**: NBFC API, payment gateway, and KYC verification
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Role-based Access**: Dealer, Admin, and NBFC user roles
- **Database**: PostgreSQL with automatic setup and seed data

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **WebSocket** - Real-time communication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (recommended)
npm run install

# Or install separately:
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ienerzy_mvp

# Or use psql
psql -U postgres
CREATE DATABASE ienerzy_mvp;
\q
```

### 3. Environment Configuration

```bash
# Copy environment file
cp server/env.example server/.env

# Edit with your database credentials
nano server/.env
```

### 4. Start the Application

```bash
# Start both servers (recommended)
npm run dev

# Or start separately:
npm run server    # Backend only
npm run client    # Frontend only
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔐 Demo Credentials

### Login Credentials
- **Dealer**: `8888888888` (Check console for OTP)
- **Admin**: `9999999999` (Check console for OTP)

### Sample Data
The system comes pre-loaded with:
- Sample batteries (BAT001, BAT002, BAT003)
- Sample consumers (John Doe, Jane Smith)
- Mock technicians and service tickets

## 📱 User Roles & Permissions

### Dealer
- Manage batteries and consumers
- Create loan applications
- Handle service tickets
- View EMI due lists

### Admin
- Full system access
- View all dealers' data
- System-wide management

### NBFC
- Finance application processing
- EMI management

## 🔋 Battery Management

### Features
- Add/Edit/Delete batteries
- Real-time telemetry monitoring
- Status control (active/inactive/maintenance)
- Health score tracking

### Telemetry Data
- Voltage (40-50V)
- Current (10-15A)
- State of Charge (70-100%)
- GPS coordinates (Bangalore area)

## 👥 Consumer Management

### Onboarding Process
1. Add consumer details (name, phone, PAN, Aadhaar)
2. Automatic KYC verification (mocked)
3. Assign to dealer
4. Link with batteries

### KYC Status
- **Pending**: Initial state
- **Verified**: Auto-verified (mocked)
- **Rejected**: Manual rejection

## 💰 Finance Management

### Loan Application Flow
1. Select consumer and battery
2. Enter loan amount
3. Mock NBFC approval (2-second delay)
4. Automatic EMI schedule generation (12 months)

### EMI Management
- Monthly payment tracking
- Due date monitoring
- Payment status updates
- Overdue detection

## 🛠️ Service Management

### Ticket Creation
- Select battery and issue category
- Add description and location
- Automatic technician assignment
- Status tracking

### Issue Categories
- Low Performance
- Charging Issues
- Physical Damage
- Software Error
- Other

## 🔧 Development

### Project Structure
```
ienerzy/
├── server/                 # Backend API
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth middleware
│   ├── database/          # Database setup
│   └── index.js           # Server entry point
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app
│   │   └── index.js       # Entry point
│   └── public/            # Static assets
├── package.json           # Root dependencies
└── README.md             # This file
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Generate OTP
- `POST /api/auth/verify-otp` - Verify OTP and get JWT
- `GET /api/auth/me` - Get current user info

#### Batteries
- `GET /api/batteries` - List batteries
- `POST /api/batteries` - Add battery
- `GET /api/batteries/:serial` - Get battery with telemetry
- `POST /api/batteries/:serial/control` - Control battery status

#### Consumers
- `GET /api/consumers` - List consumers
- `POST /api/consumers` - Add consumer
- `POST /api/consumers/:id/kyc-verify` - Verify KYC

#### Finance
- `POST /api/finance/applications` - Create loan application
- `GET /api/finance/applications` - List applications
- `POST /api/finance/emi-payment` - Process EMI payment

#### Service
- `POST /api/service/tickets` - Create service ticket
- `GET /api/service/tickets` - List tickets
- `PUT /api/service/tickets/:id/status` - Update ticket status

### Database Schema

#### Core Tables
- `users` - User accounts and roles
- `batteries` - Battery inventory
- `consumers` - Customer information
- `finance_applications` - Loan applications
- `emi_schedules` - EMI payment schedules
- `service_tickets` - Service requests

## 🎨 UI Components

### Design System
- **Tailwind CSS** for styling
- **Responsive grid** layouts
- **Status badges** with color coding
- **Modal dialogs** for forms
- **Data tables** with sorting
- **Progress bars** for health scores

### Color Scheme
- **Primary**: Blue tones for main actions
- **Success**: Green for positive states
- **Warning**: Yellow for maintenance
- **Danger**: Red for inactive/overdue
- **Neutral**: Gray for secondary elements

## 🚀 Deployment

### Local Development
```bash
# Start both servers (recommended)
npm run dev

# Or start individually
npm run server       # Backend only
npm run client       # Frontend only
```

### Production Build
```bash
cd client
npm run build        # Build React app
cd ../server
npm start            # Start production server
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :5000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

#### Dependencies
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Logs
- **Backend**: Check terminal output
- **Frontend**: Check browser console
- **Database**: Check PostgreSQL logs

## 📝 API Documentation

### Authentication Headers
```javascript
// Include JWT token in requests
headers: {
  'Authorization': 'Bearer <your-jwt-token>'
}
```

### Response Format
```javascript
// Success response
{
  "message": "Operation successful",
  "data": { ... }
}

// Error response
{
  "error": "Error description"
}
```

## 🤝 Contributing

This is a hackathon MVP. For production use, consider:

- **Security**: Implement proper password hashing, rate limiting
- **Validation**: Add input validation and sanitization
- **Testing**: Add unit and integration tests
- **Monitoring**: Add logging and error tracking
- **Deployment**: Use environment-specific configurations

## 📄 License

MIT License - Feel free to use this code for learning and development.

## 🎯 Hackathon Goals Met

✅ **Authentication & Role Management** - OTP + JWT + RBAC  
✅ **Dealer Dashboard** - React with Tailwind CSS  
✅ **Battery CRUD** - PostgreSQL with mock telemetry  
✅ **Consumer Onboarding** - KYC forms and verification  
✅ **EMI Tracking** - Finance workflow with mock NBFC  
✅ **Service Tickets** - Technician assignment system  
✅ **Consumer View** - Battery health and EMI management  
✅ **Real-time Updates** - WebSocket and mock telemetry  
✅ **Complete Flow** - End-to-end user journeys  

**Time to Complete**: 24 hours  
**Priority**: MVP functionality over perfect styling  
**Status**: ✅ Ready for demo and testing 