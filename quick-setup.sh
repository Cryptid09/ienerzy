#!/bin/bash

echo "🚀 Quick Setup for Ienerzy MVP"
echo "================================"

# Check if .env exists, if not create it
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment file..."
    cp server/env.example server/.env
    echo "✅ Environment file created"
    echo "⚠️  Please edit server/.env with your database password"
else
    echo "✅ Environment file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
echo "✅ Dependencies installed"

# Setup database schema
echo "🗄️  Setting up database schema..."
cd server
npm run setup-db
cd ..
echo "✅ Database schema ready"

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Edit server/.env with your PostgreSQL password"
echo "2. Start the app: npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "Demo credentials:"
echo "  Dealer: 8888888888"
echo "  Admin: 9999999999"
echo "  (Check console for OTP codes)" 