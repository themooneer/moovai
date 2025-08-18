#!/usr/bin/env node

// Test script to verify development environment
console.log('🧪 Testing development environment...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

// Test cross-env
const { spawn } = require('child_process');

console.log('\n🚀 Testing cross-env...');
const child = spawn('npx', ['cross-env', 'NODE_ENV=development', 'VITE_DEV_SERVER_URL=http://localhost:3000', 'node', '-e', 'console.log("NODE_ENV:", process.env.NODE_ENV, "VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL)'], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`\n✅ Test completed with code ${code}`);
});
