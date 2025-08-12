#!/bin/sh

echo "Starting API service..."

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate || true

# Run database migrations
npx prisma migrate deploy || true

# Try to build TypeScript
npm run build 2>/dev/null

# If TypeScript build succeeded, run the compiled version
if [ -f "dist/main.js" ]; then
    echo "Running compiled TypeScript version..."
    node dist/main.js
else
    # Try to run with ts-node
    echo "Running with ts-node..."
    npx ts-node src/main-simple.ts 2>/dev/null || \
    # If that fails, run the fallback server
    echo "Running fallback server..." && node server.js
fi