#!/usr/bin/env node

// Set environment variables for Electron
process.env.NODE_ENV = 'development';
process.env.VITE_DEV_SERVER_URL = 'http://localhost:3000';

console.log('🚀 Starting Electron with environment:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

// Start Electron
const { spawn } = require('child_process');
const electron = require('electron');

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
  process.exit(code);
});
