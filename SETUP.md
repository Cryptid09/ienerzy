# 🚀 Ienerzy MVP Setup Guide

This guide provides multiple ways to set up and run the Ienerzy Battery Management MVP.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

## 🎯 Quick Setup Options

### Option 1: Automated Setup Scripts (Recommended)

#### For Linux/macOS:
```bash
# Make script executable
chmod +x setup.sh

# Run setup script
./setup.sh
```

#### For Windows:
```cmd
# Run setup script
setup.bat
```

The automated scripts will:
- ✅ Check prerequisites
- ✅ Create PostgreSQL database
- ✅ Configure environment
- ✅ Install all dependencies
- ✅ Setup database schema
- ✅ Test database connection

### Option 2: Docker Setup (Containerized)

#### Prerequisites:
- **Docker** - [Download here](https://www.docker.com/products/docker-desktop)
- **Docker Compose** - [Download here](https://docs.docker.com/compose/install/)

#### Setup:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Docker Services:
- **PostgreSQL**: `localhost:5432`
- **Backend API**: `localhost:5000`
- **Frontend**: `localhost:3000`

### Option 3: Manual Setup

#### Step 1: Database Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ienerzy_mvp;

# Exit psql
\q
```

#### Step 2: Environment Configuration
```bash
# Copy environment file
cp server/env.example server/.env

# Edit with your database credentials
nano server/.env
```

#### Step 3: Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

#### Step 4: Setup Database Schema
```bash
cd server
npm run setup-db
cd ..
```

## 🔧 Environment Configuration

### Required Environment Variables

Create `server/.env` file with:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ienerzy_mvp
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=5000

# Environment
NODE_ENV=development
```

### Database Connection Details

| Parameter | Value | Description |
|-----------|-------|-------------|
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_HOST` | `localhost` | Database host |
| `DB_NAME` | `ienerzy_mvp` | Database name |
| `DB_PASSWORD` | `your_password` | Your PostgreSQL password |
| `DB_PORT` | `5432` | PostgreSQL port |

## 🚀 Running the Application

### Development Mode (Recommended)
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run server    # Backend only
npm run client    # Frontend only
```

### Production Mode
```bash
# Build frontend
cd client && npm run build && cd ..

# Start production server
cd server && npm start
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5000 | Express server |
| **Database** | localhost:5432 | PostgreSQL |

## 🔐 Login Credentials

### Demo Users
| Role | Phone | Description |
|------|-------|-------------|
| **Dealer** | `8888888888` | Main dealer account |
| **Admin** | `9999999999` | System administrator |
| **NBFC** | `7777777777` | Finance partner |

### OTP Verification
- OTP codes are displayed in the **server console**
- Check the terminal where you ran `npm run server`
- OTPs expire after 5 minutes

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l

# Check environment variables
cat server/.env
```

#### 2. Port Already in Use
```bash
# Check port usage
lsof -i :5000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Dependencies Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### 4. Permission Denied (PostgreSQL)
```bash
# Check PostgreSQL user permissions
sudo -u postgres psql

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ienerzy_mvp TO postgres;
```

### Docker Issues

#### Container Won't Start
```bash
# Check container logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Issues
```bash
# Check PostgreSQL container
docker-compose logs postgres

# Restart services
docker-compose restart
```

## 📊 Database Management

### Reset Database
```bash
# Drop and recreate
cd server
npm run setup-db
cd ..
```

### Backup Database
```bash
# Create backup
pg_dump -U postgres ienerzy_mvp > backup.sql

# Restore backup
psql -U postgres ienerzy_mvp < backup.sql
```

### View Database
```bash
# Connect to database
psql -U postgres -d ienerzy_mvp

# List tables
\dt

# View data
SELECT * FROM users;
SELECT * FROM batteries;
SELECT * FROM consumers;

# Exit
\q
```

## 🔄 Development Workflow

### Making Changes
1. **Backend**: Edit files in `server/` directory
2. **Frontend**: Edit files in `client/` directory
3. **Database**: Use `npm run setup-db` to reset schema

### Hot Reload
- **Backend**: Automatically restarts on file changes
- **Frontend**: React hot reload enabled
- **Database**: Schema changes require manual reset

### Testing Changes
1. Make code changes
2. Save files
3. Check browser/console for errors
4. Test functionality
5. Commit changes

## 📱 Available Commands

### Root Level
```bash
npm run dev          # Start both servers
npm run server       # Start backend only
npm run client       # Start frontend only
npm run install-all  # Install all dependencies
npm run setup-db     # Reset database schema
```

### Server Directory
```bash
cd server
npm run dev          # Start with nodemon
npm start            # Start production
npm run setup-db     # Setup database
```

### Client Directory
```bash
cd client
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

## 🎯 Next Steps After Setup

1. **Start the application**: `npm run dev`
2. **Open browser**: Navigate to http://localhost:3000
3. **Login**: Use demo credentials (check console for OTP)
4. **Explore features**: Test all modules
5. **Customize**: Modify code as needed

## 📞 Support

If you encounter issues:

1. **Check logs**: Server console and browser console
2. **Verify setup**: Follow troubleshooting steps above
3. **Check prerequisites**: Ensure all software is installed
4. **Database connection**: Verify PostgreSQL is running

## 🎉 Success!

Once everything is running, you should see:
- ✅ Database connection successful
- ✅ Server running on port 5000
- ✅ React app running on port 3000
- ✅ Login page accessible
- ✅ All features working

**Happy coding! 🚀** 