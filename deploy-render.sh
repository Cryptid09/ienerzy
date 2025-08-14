#!/bin/bash

echo "🚀 Deploying to Render (No Docker Required)"

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Make sure you're in the project root."
    exit 1
fi

# Check if Docker files exist (they shouldn't)
if [ -f "Dockerfile" ] || [ -f "docker-compose.yml" ]; then
    echo "❌ Error: Docker files found. Please remove them first."
    exit 1
fi

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ Error: server directory not found."
    exit 1
fi

# Check if package.json exists in server
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: server/package.json not found."
    exit 1
fi

echo "✅ Project structure verified"
echo "✅ No Docker files detected"
echo "✅ Node.js application ready"

echo ""
echo "📋 Deployment Steps:"
echo "1. Push this code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for Render deployment - No Docker'"
echo "   git push origin main"
echo ""
echo "2. Go to Render.com and:"
echo "   - Create new Web Service"
echo "   - Connect to your GitHub repo"
echo "   - Environment: Node"
echo "   - Build Command: cd server && npm install --production"
echo "   - Start Command: cd server && npm start"
echo ""
echo "3. Set environment variables in Render dashboard"
echo "4. Deploy!"
echo ""
echo "🎯 Your app will be deployed as a native Node.js application"
echo "🚫 No Docker containers will be used" 