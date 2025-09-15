/**
 * PM2 통합 설정 파일
 * 모든 서비스를 한 번에 관리할 수 있는 통합 설정
 */

module.exports = {
  apps: [
    // ===== LibreChat Backend Service =====
    {
      name: 'librechat-backend',
      script: './api/server/index.js',
      cwd: './LibreChat',
      instances: 4,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3080,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3080,
        HOST: '0.0.0.0'
      },
      error_file: './logs/pm2/backend-err.log',
      out_file: './logs/pm2/backend-out.log',
      log_file: './logs/pm2/backend-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      wait_ready: true,
      exp_backoff_restart_delay: 100
    },
    
    // ===== LibreChat Backend Dev Mode =====
    {
      name: 'librechat-backend-dev',
      script: 'npm',
      args: 'run backend:dev',
      cwd: './LibreChat',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3080
      },
      error_file: './logs/pm2/backend-dev-err.log',
      out_file: './logs/pm2/backend-dev-out.log',
      time: true
    },

    // ===== LibreChat Frontend (Production) =====
    {
      name: 'librechat-frontend',
      script: './client/static-server.cjs',
      cwd: './LibreChat',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3095
      },
      error_file: './logs/pm2/frontend-err.log',
      out_file: './logs/pm2/frontend-out.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000
    },

    // ===== LibreChat Frontend Dev Mode =====
    {
      name: 'librechat-frontend-dev',
      script: 'npm',
      args: 'run frontend:dev',
      cwd: './LibreChat',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3090
      },
      error_file: './logs/pm2/frontend-dev-err.log',
      out_file: './logs/pm2/frontend-dev-out.log',
      time: true
    },

    // ===== LibreChat-Admin Backend =====
    {
      name: 'admin-backend',
      script: 'npm',
      args: 'run dev',
      cwd: './LibreChat-Admin/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5001,
        HOST: '0.0.0.0'
      },
      error_file: './logs/pm2/admin-backend-err.log',
      out_file: './logs/pm2/admin-backend-out.log',
      log_file: './logs/pm2/admin-backend-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      wait_ready: true,
      exp_backoff_restart_delay: 100
    },

    // ===== LibreChat-Admin Backend Dev Mode =====
    {
      name: 'admin-backend-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './LibreChat-Admin/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      error_file: './logs/pm2/admin-dev-err.log',
      out_file: './logs/pm2/admin-dev-out.log',
      time: true
    },

    // ===== LibreChat-Admin Frontend (Production) =====
    {
      name: 'admin-frontend',
      script: 'serve',
      args: '-s dist -l 3091',
      cwd: './LibreChat-Admin/frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 3091,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      error_file: './logs/pm2/admin-frontend-err.log',
      out_file: './logs/pm2/admin-frontend-out.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000
    },

    // ===== LibreChat-Admin Frontend Dev Mode =====
    {
      name: 'admin-frontend-dev',
      script: 'npm',
      args: 'start',
      cwd: './LibreChat-Admin/frontend',
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
    },

    // ===== API Relay Server =====
    {
      name: 'api-relay',
      script: './dist/index.js',
      cwd: './api-relay-server',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
        HOST: '0.0.0.0'
      },
      error_file: './logs/pm2/relay-err.log',
      out_file: './logs/pm2/relay-out.log',
      log_file: './logs/pm2/relay-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      wait_ready: true,
      exp_backoff_restart_delay: 100
    },

    // ===== API Relay Server Dev Mode =====
    {
      name: 'api-relay-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './api-relay-server',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      error_file: './logs/pm2/relay-dev-err.log',
      out_file: './logs/pm2/relay-dev-out.log',
      time: true
    }
  ],

  // Deploy 설정 (옵션)
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/librechat',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};