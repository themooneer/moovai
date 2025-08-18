#!/usr/bin/env node

// Test script to verify environment variables
console.log('🧪 Testing environment variables...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

// Test if we can access the dev server
const http = require('http');

if (process.env.VITE_DEV_SERVER_URL) {
  const url = new URL(process.env.VITE_DEV_SERVER_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: '/',
    method: 'GET'
  };

  console.log('\n🔍 Testing dev server connection...');
  const req = http.request(options, (res) => {
    console.log(`✅ Dev server is running! Status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    console.log(`❌ Dev server connection failed: ${err.message}`);
  });

  req.end();
} else {
  console.log('\n❌ VITE_DEV_SERVER_URL is not set');
}

console.log('\n📋 To fix environment issues, try:');
console.log('1. Stop all processes');
console.log('2. Run: pnpm install');
console.log('3. Run: pnpm dev');
