FROM mcr.microsoft.com/devcontainers/typescript-node:1-18-bullseye

# Install Python and additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        python3.11 \
        python3-pip \
        python3.11-venv \
        postgresql-client \
        redis-tools \
        curl \
        wget \
        git \
    && apt-get autoremove -y && apt-get clean -y

# Install global npm packages
RUN npm install -g turbo@latest @nestjs/cli@latest

# Create Python virtual environment
RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /workspace

# Switch to vscode user
USER vscode