#!/bin/bash

echo "🚀 Building Ienerzy Frontend for Vercel..."

# Check if we're in the right directory
if [ ! -d "client" ]; then
    echo "❌ Error: client directory not found"
    exit 1
fi

# Check if package.json exists in client
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: client/package.json not found"
    exit 1
fi

# Install dependencies (from root directory)
echo "📦 Installing dependencies..."
npm install

# Build the application (from root directory)
echo "🔨 Building React application..."
npm run build

# Check if build was successful
if [ -d "client/build" ]; then
    echo "✅ Build successful! Build directory created."
    echo "📁 Build contents:"
    ls -la client/build/
    
    # Check for index.html
    if [ -f "client/build/index.html" ]; then
        echo "✅ index.html found in build directory"
    else
        echo "❌ index.html not found in build directory"
        exit 1
    fi
else
    echo "❌ Build failed! Build directory not created."
    exit 1
fi

echo "🎉 Frontend build completed successfully!"
echo "🚀 Ready for Vercel deployment!" 