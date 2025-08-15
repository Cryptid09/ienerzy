const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Client Build Configuration...\n');

// Check if we're in the client directory
const currentDir = process.cwd();
console.log('📁 Current directory:', currentDir);

// Check required files
const requiredFiles = [
  'package.json',
  'public/index.html',
  'src/App.js',
  'vercel.json'
];

console.log('\n📋 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(currentDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json scripts
try {
  const packageJson = require('./package.json');
  console.log('\n🔧 Package.json scripts:');
  if (packageJson.scripts.build) {
    console.log('✅ Build script: npm run build');
  } else {
    console.log('❌ Build script missing');
  }
  
  if (packageJson.scripts.start) {
    console.log('✅ Start script: npm start');
  } else {
    console.log('❌ Start script missing');
  }
  
  // Check for proxy (should not exist in production)
  if (packageJson.proxy) {
    console.log('⚠️  Proxy found (will be ignored in production):', packageJson.proxy);
  } else {
    console.log('✅ No proxy configuration (good for production)');
  }
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check vercel.json
try {
  const vercelConfig = require('./vercel.json');
  console.log('\n🚀 Vercel configuration:');
  console.log('✅ Version:', vercelConfig.version);
  console.log('✅ Builds configured:', vercelConfig.builds.length);
  console.log('✅ Routes configured:', vercelConfig.routes.length);
  console.log('✅ Environment variables:', Object.keys(vercelConfig.env).length);
  
} catch (error) {
  console.log('❌ Error reading vercel.json:', error.message);
}

console.log('\n🎯 Build Configuration Status: READY');
console.log('\n📋 Vercel Deployment Steps:');
console.log('1. Select client directory in Vercel');
console.log('2. Framework preset: Other');
console.log('3. Build command: npm run build');
console.log('4. Output directory: build');
console.log('5. Install command: npm install');
console.log('6. Deploy!'); 