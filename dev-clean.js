#!/usr/bin/env node

/**
 * Development script to start clean development environment
 * Prevents service worker caching issues during development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting clean development environment...\n');

// 1. Clean all build artifacts
console.log('📁 Cleaning build artifacts...');
try {
  execSync('npm run clean', { stdio: 'inherit' });
  console.log('✅ Build artifacts cleaned\n');
} catch (error) {
  console.log('⚠️  Clean command not available, continuing...\n');
}

// 2. Clear npm cache
console.log('🗑️  Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ NPM cache cleaned\n');
} catch (error) {
  console.log('⚠️  Could not clear npm cache, continuing...\n');
}

// 3. Remove any potential service worker files
console.log('🛠️  Removing potential service worker files...');
const swFiles = [
  'public/sw.js',
  'public/service-worker.js',
  'public/workbox-*.js',
  'static/sw.js',
  'static/service-worker.js'
];

swFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`   Removed: ${file}`);
  }
});

// 4. Create a robots.txt to prevent caching during development
console.log('🤖 Creating development robots.txt...');
const robotsTxt = `User-agent: *
Disallow: /

# Development environment - no caching
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0`;

fs.writeFileSync('public/robots.txt', robotsTxt);
console.log('✅ Development robots.txt created\n');

// 5. Start development server with specific flags
console.log('🚀 Starting development server...\n');
console.log('📋 To prevent caching issues:');
console.log('   - Open browser in incognito mode');
console.log('   - Or disable cache in DevTools (F12 → Network → Disable cache)');
console.log('   - Or run the clear-cache.js script in browser console\n');

// Start dev server with specific environment variables
process.env.NODE_ENV = 'development';
process.env.NUXT_PUBLIC_SOURCEMAP = 'true';

try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
} 