FROM mcr.microsoft.com/devcontainers/typescript-node:18-bullseye

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    nodemon \
    ts-node \
    typescript \
    concurrently \
    pm2

# Create workspace directory
WORKDIR /workspace

# Set up permissions workaround for development
ENV DANGEROUSLY_SKIP_PERMISSIONS=true

# Expose ports
EXPOSE 3000 3001 3002 27017 6379

# Set node user
USER node