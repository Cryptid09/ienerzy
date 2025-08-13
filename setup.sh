#!/bin/bash

# Ienerzy MVP Setup Script
# This script will set up the database, environment, and install dependencies

set -e  # Exit on any error

echo "🚀 Starting Ienerzy MVP Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is installed
check_postgres() {
    print_status "Checking PostgreSQL installation..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        PSQL_VERSION=$(psql --version | cut -d' ' -f3)
        echo "   Version: $PSQL_VERSION"
    else
        print_error "PostgreSQL is not installed. Please install it first:"
        echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "   macOS: brew install postgresql"
        echo "   CentOS/RHEL: sudo yum install postgresql postgresql-server"
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        print_success "Node.js is installed"
        NODE_VERSION=$(node --version)
        echo "   Version: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install it first:"
        echo "   Visit: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        print_success "npm is installed"
        NPM_VERSION=$(npm --version)
        echo "   Version: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install it first:"
        echo "   Visit: https://nodejs.org/"
        exit 1
    fi
}

# Setup PostgreSQL database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Check if database already exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw ienerzy_mvp; then
        print_warning "Database 'ienerzy_mvp' already exists"
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            dropdb -U postgres ienerzy_mvp
        else
            print_status "Using existing database"
            return
        fi
    fi
    
    # Create database
    print_status "Creating database 'ienerzy_mvp'..."
    createdb -U postgres ienerzy_mvp
    
    if [ $? -eq 0 ]; then
        print_success "Database 'ienerzy_mvp' created successfully"
    else
        print_error "Failed to create database. Please check PostgreSQL permissions."
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ -f "server/.env" ]; then
        print_warning "Environment file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing environment file"
            return
        fi
    fi
    
    # Copy example environment file
    cp server/env.example server/.env
    
    # Get database password from user
    read -p "Enter PostgreSQL password for user 'postgres': " DB_PASSWORD
    echo
    
    # Update environment file with actual password
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/DB_PASSWORD=password/DB_PASSWORD=$DB_PASSWORD/" server/.env
    else
        # Linux - use temporary file approach
        sed "s/DB_PASSWORD=password/DB_PASSWORD=$DB_PASSWORD/" server/.env > server/.env.tmp && mv server/.env.tmp server/.env
    fi
    
    print_success "Environment file configured"
}

  # Install dependencies
  install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    
    print_success "All dependencies installed successfully"
  }

# Setup database schema
setup_schema() {
    print_status "Setting up database schema..."
    
    cd server
    npm run setup-db
    cd ..
    
    print_success "Database schema setup completed"
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    cd server
    node -e "
    require('dotenv').config();
    const { Pool } = require('pg');
    
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'ienerzy_mvp',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    });
    
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('❌ Database connection failed:', err.message);
            process.exit(1);
        } else {
            console.log('✅ Database connection successful');
            console.log('   Current time:', res.rows[0].now);
            pool.end();
        }
    });
    "
    cd ..
}

# Start services
start_services() {
    print_status "Starting services..."
    
    echo
    print_success "Setup completed successfully! 🎉"
    echo
    echo "Next steps:"
    echo "1. Start the application: npm run dev"
    echo "2. Open http://localhost:3000 in your browser"
    echo "3. Login with:"
    echo "   - Dealer: 8888888888"
    echo "   - Admin: 9999999999"
    echo "   (Check console for OTP codes)"
    echo
    echo "Available commands:"
    echo "  npm run dev          - Start both servers"
    echo "  npm run server       - Start backend only"
    echo "  npm run client       - Start frontend only"
    echo "  npm run setup-db     - Reset database schema"
    echo
}

# Main setup function
main() {
    echo "=========================================="
    echo "    Ienerzy MVP Setup Script"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_postgres
    check_node
    check_npm
    
    echo
    
    # Setup database and environment
    setup_database
    setup_environment
    
    echo
    
    # Install dependencies
    install_dependencies
    
    echo
    
    # Setup database schema
    setup_schema
    
    echo
    
    # Test connection
    test_connection
    
    echo
    
    # Start services
    start_services
}

# Run main function
main "$@" 