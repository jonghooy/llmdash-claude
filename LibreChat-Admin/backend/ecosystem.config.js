module.exports = {
  apps: [
    {
      name: 'admin-backend',
      script: './dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
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
        HOST: '0.0.0.0',
        watch: ['src'],
        watch_delay: 1000,
        ignore_watch: ['node_modules', 'dist', 'logs'],
      },
      error_file: './logs/pm2/admin-err.log',
      out_file: './logs/pm2/admin-out.log',
      log_file: './logs/pm2/admin-combined.log',
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
    {
      name: 'admin-backend-dev',
      script: 'npm',
      args: 'run dev',
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
    }
  ]
};