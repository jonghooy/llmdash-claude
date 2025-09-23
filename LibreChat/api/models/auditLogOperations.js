const AuditLog = require('./AuditLog');

/**
 * Check if dbGateway is enabled
 */
function isDbGatewayEnabled() {
  return process.env.USE_DB_GATEWAY === 'true';
}

/**
 * Get the dbGateway lazily to avoid circular dependencies
 */
function getLazyGateway() {
  return require('../server/services/dbGateway');
}

/**
 * Log an audit event
 */
async function logAuditEvent(auditData) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.log(auditData);
  }
  // Fallback to Mongoose
  const log = new AuditLog(auditData);
  return await log.save();
}

/**
 * Get logs for a specific user
 */
async function getUserLogs(userId, limit = 100, offset = 0) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getUserLogs(userId, limit, offset);
  }
  // Fallback to Mongoose
  return await AuditLog.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
}

/**
 * Get logs by category
 */
async function getLogsByCategory(category, since = null, limit = 100) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getLogsByCategory(category, since, limit);
  }
  // Fallback to Mongoose
  const query = { category };
  if (since) {
    query.timestamp = { $gte: since };
  }
  return await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get logs by severity
 */
async function getLogsBySeverity(severity, since = null, limit = 100) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getLogsBySeverity(severity, since, limit);
  }
  // Fallback to Mongoose
  const query = { severity };
  if (since) {
    query.timestamp = { $gte: since };
  }
  return await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get security events
 */
async function getSecurityEvents(hours = 24) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getSecurityEvents(hours);
  }
  // Fallback to Mongoose static method
  return await AuditLog.getSecurityEvents(hours);
}

/**
 * Get user activity
 */
async function getUserActivity(userId, days = 30) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getUserActivity(userId, days);
  }
  // Fallback to Mongoose static method
  return await AuditLog.getUserActivity(userId, days);
}

/**
 * Get failed authentication attempts
 */
async function getFailedAuthentications(hours = 24) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getFailedAuthentications(hours);
  }
  // Fallback to Mongoose static method
  return await AuditLog.getFailedAuthentications(hours);
}

/**
 * Get system errors
 */
async function getSystemErrors(hours = 24) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getSystemErrors(hours);
  }
  // Fallback to Mongoose static method
  return await AuditLog.getSystemErrors(hours);
}

/**
 * Clean old logs
 */
async function cleanOldLogs(daysToKeep = 90) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.cleanOldLogs(daysToKeep);
  }
  // Fallback to Mongoose
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  const result = await AuditLog.deleteMany({
    timestamp: { $lt: cutoffDate },
    severity: { $nin: ['ERROR', 'CRITICAL'] }, // Keep error logs longer
  });
  return result.deletedCount || 0;
}

/**
 * Get logs by time range
 */
async function getLogsByTimeRange(startDate, endDate) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.getLogsByTimeRange(startDate, endDate);
  }
  // Fallback to Mongoose
  return await AuditLog.find({
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .sort({ timestamp: -1 })
    .lean();
}

/**
 * Count logs by criteria
 */
async function countLogs(criteria) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.countLogs(criteria);
  }
  // Fallback to Mongoose
  return await AuditLog.countDocuments(criteria);
}

/**
 * Create an audit log entry
 */
async function createAuditLog(data) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.create(data);
  }
  // Fallback to Mongoose
  const log = new AuditLog(data);
  return await log.save();
}

/**
 * Find audit logs matching criteria
 */
async function findAuditLogs(criteria, options = {}) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.find(criteria, options);
  }
  // Fallback to Mongoose
  let query = AuditLog.find(criteria);

  if (options.sort) {
    query = query.sort(options.sort);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.skip) {
    query = query.skip(options.skip);
  }

  return await query.lean();
}

/**
 * Delete an audit log by ID
 */
async function deleteAuditLog(id) {
  if (isDbGatewayEnabled()) {
    const { getRepository } = getLazyGateway();
    const auditLogRepo = await getRepository('AuditLog');
    return await auditLogRepo.delete(id);
  }
  // Fallback to Mongoose
  return await AuditLog.findByIdAndDelete(id);
}

module.exports = {
  logAuditEvent,
  getUserLogs,
  getLogsByCategory,
  getLogsBySeverity,
  getSecurityEvents,
  getUserActivity,
  getFailedAuthentications,
  getSystemErrors,
  cleanOldLogs,
  getLogsByTimeRange,
  countLogs,
  createAuditLog,
  findAuditLogs,
  deleteAuditLog,
};