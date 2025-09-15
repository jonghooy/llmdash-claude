module.exports = {
  apps: [
    {
      name: 'librechat-backend',
      script: './api/server/index.js',
      instances: 4, // 4개의 워커 프로세스
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3080,
        HOST: '0.0.0.0',
        ENABLE_ORG_MEMORY: 'true',
        ADMIN_API_URL: 'http://localhost:5001'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3080,
        HOST: '0.0.0.0',
        ENABLE_ORG_MEMORY: 'true',
        ADMIN_API_URL: 'http://localhost:5001'
      },
      error_file: './logs/pm2/backend-err.log',
      out_file: './logs/pm2/backend-out.log',
      log_file: './logs/pm2/backend-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true,
      // 자동 재시작 설정
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      // CPU 사용률 기반 자동 스케일링 (선택사항)
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      // 그레이스풀 종료
      wait_ready: true,
      // 네트워크 오류 시 재시작
      exp_backoff_restart_delay: 100
    },
    {
      name: 'librechat-backend-dev',
      script: 'npm',
      args: 'run backend:dev',
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
    {
      name: 'librechat-frontend',
      script: 'serve',
      args: '-s client/dist -l 3090',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: './client/dist',
        PM2_SERVE_PORT: 3090,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      error_file: './logs/pm2/frontend-err.log',
      out_file: './logs/pm2/frontend-out.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000
    },
    {
      name: 'librechat-frontend-dev',
      script: 'npm',
      args: 'run frontend:dev',
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
    }
  ]
};