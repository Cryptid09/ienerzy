#!/bin/bash

echo "🚀 Starting Ienerzy MVP Development Servers..."
echo "=============================================="

# Function to start server
start_server() {
    echo "🔧 Starting backend server..."
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    echo "✅ Backend server started (PID: $SERVER_PID)"
}

# Function to start client
start_client() {
    echo "🌐 Starting frontend client..."
    cd client
    npm start &
    CLIENT_PID=$!
    cd ..
    echo "✅ Frontend client started (PID: $CLIENT_PID)"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ Backend server stopped"
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null
        echo "✅ Frontend client stopped"
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start servers
start_server
start_client

echo ""
echo "🎉 Both servers are running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop
wait 