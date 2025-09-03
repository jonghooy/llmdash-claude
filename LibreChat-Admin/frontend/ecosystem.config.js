const path = require('path');

module.exports = {
  apps: [
    {
      name: 'admin-frontend',
      script: 'serve',
      args: '-s dist -l 3091',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3091,
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 3091,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3091
      },
      error_file: './logs/pm2/admin-frontend-err.log',
      out_file: './logs/pm2/admin-frontend-out.log',
      log_file: './logs/pm2/admin-frontend-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      merge_logs: true,
      wait_ready: true,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'admin-frontend-dev',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3091
      },
      error_file: './logs/pm2/admin-frontend-dev-err.log',
      out_file: './logs/pm2/admin-frontend-dev-out.log',
      time: true
    }
  ]
};