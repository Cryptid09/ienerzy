#!/bin/bash

echo "🔄 Restarting Ienerzy server with OTP verification fixes..."

# Kill any existing node processes on port 5000
echo "📱 Stopping existing server..."
pkill -f "node.*index.js" || true

# Wait a moment
sleep 2

# Start the server
echo "🚀 Starting server with fixes..."
cd server
node index.js &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Server is running successfully with fixes!"
    echo "🔗 API available at: http://localhost:5000/api"
    echo "🏥 Health check: http://localhost:5000/api/health"
    echo ""
    echo "📋 OTP verification should now work correctly!"
    echo ""
    echo "🧪 To test the fixes:"
    echo "1. cd server && npm install axios"
    echo "2. node ../test-fixes.js"
    echo ""
    echo "📱 Or test from your React frontend"
else
    echo "❌ Server failed to start. Check the logs above."
fi

echo ""
echo "📊 Server logs will appear above. Press Ctrl+C to stop." 