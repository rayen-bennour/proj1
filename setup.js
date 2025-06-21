#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 AI Article Generator Setup');
console.log('=============================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log('✅ Node.js version check passed');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
    console.log('⚠️  Please update the .env file with your API keys');
  } else {
    console.log('❌ env.example file not found');
  }
} else {
  console.log('✅ .env file already exists');
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('npm run install-client', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Create necessary directories
const dirs = ['public', 'uploads', 'logs'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created ${dir} directory`);
  }
});

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update the .env file with your API keys');
console.log('2. Start MongoDB (if using local instance)');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Run "npm run client" in another terminal to start the frontend');
console.log('\n📖 For more information, see the README.md file');

// Check if MongoDB is running (optional)
console.log('\n🔍 Checking MongoDB connection...');
try {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient('mongodb://localhost:27017');
  client.connect().then(() => {
    console.log('✅ MongoDB is running');
    client.close();
  }).catch(() => {
    console.log('⚠️  MongoDB is not running or not accessible');
    console.log('   Please start MongoDB or update your MONGODB_URI in .env');
  });
} catch (error) {
  console.log('⚠️  Could not check MongoDB connection');
}

console.log('\n✨ Happy coding!'); 