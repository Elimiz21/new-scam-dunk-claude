FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build || echo "Build script not found, skipping..."

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]