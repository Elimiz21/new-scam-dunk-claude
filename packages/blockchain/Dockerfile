FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build || echo "Build script not found, skipping..."

# Expose port
EXPOSE 3002

# Start the application
CMD ["npm", "start"]