module.exports = {
  apps: [
    {
      name: 'api-relay-server',
      script: './dist/index.js',
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
      kill_timeout: 3000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      merge_logs: true
    },
    {
      name: 'api-relay-dev',
      script: 'npm',
      args: 'run dev',
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
  ]
};