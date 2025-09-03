const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');

/**
 * 헬스체크 엔드포인트
 * PM2, Docker, Kubernetes 등에서 사용
 */
router.get('/health', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Redis 연결 상태 확인 (redis가 설정된 경우)
    let redisStatus = 'not configured';
    if (process.env.USE_REDIS === 'true') {
      try {
        const { getLogStores } = require('~/cache');
        const cache = getLogStores();
        if (cache) {
          await cache.get('health_check');
          redisStatus = 'connected';
        }
      } catch (error) {
        redisStatus = 'error';
      }
    }
    
    // 시스템 메트릭
    const metrics = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        used: process.memoryUsage(),
        total: os.totalmem(),
        free: os.freemem()
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform
      },
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      }
    };
    
    // 모든 서비스가 정상인지 확인
    const isHealthy = mongoStatus === 'connected';
    
    if (isHealthy) {
      res.status(200).json({
        status: 'healthy',
        ...metrics
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        ...metrics
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 간단한 liveness 체크
 * 단순히 서버가 응답하는지만 확인
 */
router.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness 체크
 * 서버가 요청을 처리할 준비가 되었는지 확인
 */
router.get('/health/readiness', async (req, res) => {
  try {
    // MongoDB 연결 확인
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        status: 'not_ready', 
        reason: 'MongoDB not connected' 
      });
    }
    
    // Redis 확인 (설정된 경우)
    if (process.env.USE_REDIS === 'true') {
      try {
        const { getLogStores } = require('~/cache');
        const cache = getLogStores();
        if (!cache) {
          return res.status(503).json({ 
            status: 'not_ready', 
            reason: 'Redis not available' 
          });
        }
      } catch (error) {
        return res.status(503).json({ 
          status: 'not_ready', 
          reason: 'Redis connection error' 
        });
      }
    }
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message 
    });
  }
});

/**
 * 메트릭 엔드포인트 (Prometheus 호환)
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  const cpuUsage = process.cpuUsage();
  
  const metrics = [
    `# HELP nodejs_heap_size_total_bytes Process heap size from Node.js.`,
    `# TYPE nodejs_heap_size_total_bytes gauge`,
    `nodejs_heap_size_total_bytes ${memUsage.heapTotal}`,
    `# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js.`,
    `# TYPE nodejs_heap_size_used_bytes gauge`,
    `nodejs_heap_size_used_bytes ${memUsage.heapUsed}`,
    `# HELP nodejs_external_memory_bytes Process external memory from Node.js.`,
    `# TYPE nodejs_external_memory_bytes gauge`,
    `nodejs_external_memory_bytes ${memUsage.external}`,
    `# HELP process_uptime_seconds Process uptime in seconds.`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${uptime}`,
    `# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.`,
    `# TYPE process_cpu_user_seconds_total counter`,
    `process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`,
    `# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.`,
    `# TYPE process_cpu_system_seconds_total counter`,
    `process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`,
  ].join('\n');
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

module.exports = router;