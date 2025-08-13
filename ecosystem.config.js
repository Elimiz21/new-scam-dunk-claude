module.exports = {
  apps: [
    {
      name: 'scamdunk-web',
      script: 'npm',
      args: 'start',
      cwd: './packages/web',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'scamdunk-api',
      script: './dist/main.js',
      cwd: './packages/api',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'scamdunk-blockchain',
      script: 'npm',
      args: 'start',
      cwd: './packages/blockchain',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 8001
      },
      error_file: './logs/blockchain-error.log',
      out_file: './logs/blockchain-out.log',
      log_file: './logs/blockchain-combined.log',
      time: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'scamdunk.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/scam-dunk.git',
      path: '/var/www/scamdunk',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no'
    }
  }
}