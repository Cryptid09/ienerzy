#!/bin/bash

echo "🔄 Restarting Ienerzy server to apply OTP verification fixes..."

# Kill any existing node processes on port 5000
echo "📱 Stopping existing server..."
pkill -f "node.*5000" || true

# Wait a moment
sleep 2

# Start the server
echo "🚀 Starting server..."
cd server
npm start &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Server is running successfully!"
    echo "🔗 API available at: http://localhost:5000/api"
    echo ""
    echo "📋 To test OTP verification:"
    echo "1. Send OTP: POST /api/auth/login"
    echo "2. Verify OTP: POST /api/auth/verify-otp"
    echo ""
    echo "📝 Make sure to include:"
    echo "- phone: your phone number"
    echo "- otp: the 6-digit code"
    echo "- userType: 'consumer', 'dealer', or 'admin'"
else
    echo "❌ Server failed to start. Check the logs above."
fi

echo ""
echo "📊 Server logs will appear above. Press Ctrl+C to stop." 