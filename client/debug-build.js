const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Build Directory Structure...\n');

// Show current working directory
console.log('📁 Current working directory:', process.cwd());

// List all files and directories
console.log('\n📋 Directory contents:');
try {
  const items = fs.readdirSync('.');
  items.forEach(item => {
    const stats = fs.statSync(item);
    const type = stats.isDirectory() ? '📁' : '📄';
    console.log(`   ${type} ${item}`);
  });
} catch (error) {
  console.log('❌ Error reading directory:', error.message);
}

// Check public directory specifically
console.log('\n🔍 Checking public directory:');
const publicPath = path.join('.', 'public');
if (fs.existsSync(publicPath)) {
  console.log('✅ public directory exists');
  try {
    const publicItems = fs.readdirSync(publicPath);
    console.log('📋 Public directory contents:');
    publicItems.forEach(item => {
      const stats = fs.statSync(path.join(publicPath, item));
      const type = stats.isDirectory() ? '📁' : '📄';
      console.log(`   ${type} ${item}`);
    });
    
    // Check for index.html
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html found in public directory');
    } else {
      console.log('❌ index.html NOT found in public directory');
    }
  } catch (error) {
    console.log('❌ Error reading public directory:', error.message);
  }
} else {
  console.log('❌ public directory does not exist');
}

// Check package.json
console.log('\n📦 Checking package.json:');
const packagePath = path.join('.', 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json exists');
  try {
    const packageJson = require('./package.json');
    console.log('   Name:', packageJson.name);
    console.log('   Build script:', packageJson.scripts?.build || 'NOT FOUND');
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }
} else {
  console.log('❌ package.json does not exist');
}

// Check vercel.json
console.log('\n🚀 Checking vercel.json:');
const vercelPath = path.join('.', 'vercel.json');
if (fs.existsSync(vercelPath)) {
  console.log('✅ vercel.json exists');
  try {
    const vercelConfig = require('./vercel.json');
    console.log('   Version:', vercelConfig.version);
    console.log('   Builds:', vercelConfig.builds?.length || 0);
    console.log('   Routes:', vercelConfig.routes?.length || 0);
  } catch (error) {
    console.log('❌ Error reading vercel.json:', error.message);
  }
} else {
  console.log('❌ vercel.json does not exist');
}

console.log('\n🎯 Debug Complete');
console.log('\n💡 If index.html is missing, check:');
console.log('1. File exists in public/ directory');
console.log('2. No .vercelignore excluding it');
console.log('3. Build command runs from correct directory'); 