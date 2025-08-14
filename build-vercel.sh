#!/bin/bash

# Vercel build script for Scam Dunk
echo "Starting Vercel build for Scam Dunk web package..."

# Navigate to web package
cd packages/web

# Install dependencies
echo "Installing web package dependencies..."
npm install --legacy-peer-deps

# Build the Next.js app
echo "Building Next.js application..."
npm run build

echo "Build complete!"