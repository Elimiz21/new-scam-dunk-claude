#!/bin/bash
set -e

echo "🚀 Starting Scam Dunk Development Environment Setup..."

# Ensure we're in the workspace directory
cd /workspace

# Initialize pnpm workspace
echo "📦 Initializing pnpm workspace..."
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
EOF

# Create root package.json
echo "📄 Creating root package.json..."
cat > package.json << EOF
{
  "name": "scam-dunk",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "turbo run type-check",
    "db:migrate": "cd packages/api && pnpm prisma migrate dev",
    "db:push": "cd packages/api && pnpm prisma db push",
    "db:seed": "cd packages/api && pnpm prisma db seed",
    "db:studio": "cd packages/api && pnpm prisma studio",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "clean": "find . -name 'node_modules' -type d -prune -exec rm -rf '{}' + && find . -name 'dist' -type d -prune -exec rm -rf '{}' + && find . -name '.next' -type d -prune -exec rm -rf '{}' +"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.12.0"
}
EOF

# Create turbo.json
echo "🔧 Configuring Turbo..."
cat > turbo.json << EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
EOF

# Create .prettierrc
echo "💅 Setting up Prettier..."
cat > .prettierrc << EOF
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
EOF

# Create .eslintrc.json
echo "🔍 Setting up ESLint..."
cat > .eslintrc.json << EOF
{
  "root": true,
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "ignorePatterns": ["dist", "build", ".next", "node_modules"]
}
EOF

# Create tsconfig.json
echo "📘 Setting up TypeScript..."
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@scam-dunk/core": ["packages/core/src"],
      "@scam-dunk/shared": ["packages/shared/src"],
      "@scam-dunk/api": ["packages/api/src"],
      "@scam-dunk/web": ["packages/web/src"],
      "@scam-dunk/mobile": ["packages/mobile/src"],
      "@scam-dunk/ai": ["packages/ai/src"]
    }
  },
  "exclude": ["node_modules", "dist", "build", ".next"]
}
EOF

# Install root dependencies
echo "📦 Installing root dependencies..."
pnpm install

# Initialize packages
echo "🏗️ Initializing packages..."

# Create shared package
mkdir -p packages/shared/src
cd packages/shared
cat > package.json << EOF
{
  "name": "@scam-dunk/shared",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
EOF

# Create core package
cd /workspace
mkdir -p packages/core/src
cd packages/core
cat > package.json << EOF
{
  "name": "@scam-dunk/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@scam-dunk/shared": "workspace:*",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.7",
    "jest": "^29.7.0",
    "typescript": "^5.3.0"
  }
}
EOF

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432 -U scamdunk; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Set permissions to allow everything in devcontainer (as requested)
echo "🔓 Setting permissive permissions in devcontainer..."
sudo chmod -R 777 /workspace
sudo chmod -R 777 /home/vscode

echo "✅ Post-create setup complete!"
echo "🎉 Scam Dunk development environment is ready!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to start all services"
echo "2. Access the web app at http://localhost:3000"
echo "3. Access the API at http://localhost:4000"
echo "4. Access Prisma Studio at http://localhost:5555"