module.exports = {
  apps: [{
    name: 'librechat',
    script: './api/server/index.js',
    instances: 4, // 4개의 워커 프로세스
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
    error_file: './logs/pm2/err.log',
    out_file: './logs/pm2/out.log',
    log_file: './logs/pm2/combined.log',
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
  }]
};