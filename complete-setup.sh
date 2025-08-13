#!/bin/bash

echo "🔧 Completing Ienerzy MVP Setup..."
echo "=================================="

# Go to root directory
cd /home/cryptid/D:/Ienerzy

# Create environment file
echo "📝 Creating environment file..."
cat > server/.env << EOF
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ienerzy_mvp
DB_PASSWORD=123
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=5000

# Environment
NODE_ENV=development
EOF

echo "✅ Environment file created"

# Setup database schema
echo "🗄️  Setting up database schema..."
cd server
npm run setup-db
cd ..

echo ""
echo "🎉 Setup completed! You can now:"
echo "1. Start the application: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Login with:"
echo "   - Dealer: 8888888888"
echo "   - Admin: 9999999999"
echo "   (Check console for OTP codes)" 