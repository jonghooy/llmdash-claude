const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true 
  },
  action: { 
    type: String, 
    required: true,
    index: true 
  },
  category: {
    type: String,
    enum: ['AUTH', 'API', 'ADMIN', 'SECURITY', 'DATA', 'SYSTEM', 'CONVERSATION', 'MODEL'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    default: 'INFO',
    index: true
  },
  details: {
    ip: String,
    userAgent: String,
    method: String,
    path: String,
    query: Object,
    body: Object,
    response: {
      status: Number,
      message: String,
      time: Number
    },
    error: {
      message: String,
      stack: String,
      code: String
    }
  },
  metadata: {
    conversationId: String,
    messageId: String,
    model: String,
    endpoint: String,
    tokens: {
      input: Number,
      output: Number,
      total: Number
    },
    cost: Number,
    duration: Number,
    sessionId: String,
    requestId: String
  },
  security: {
    threat: {
      type: String,
      level: String,
      description: String
    },
    blocked: Boolean,
    reason: String
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
}, {
  timestamps: false
});

// Compound indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ 'security.blocked': 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static methods for analysis
AuditLogSchema.statics.getSecurityEvents = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        $or: [
          { category: 'SECURITY' },
          { severity: { $in: ['WARNING', 'ERROR', 'CRITICAL'] } },
          { 'security.blocked': true }
        ]
      }
    },
    {
      $group: {
        _id: {
          hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } },
          category: '$category',
          severity: '$severity'
        },
        count: { $sum: 1 },
        users: { $addToSet: '$userId' }
      }
    },
    {
      $sort: { '_id.hour': -1 }
    }
  ]);
};

AuditLogSchema.statics.getUserActivity = async function(userId, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    userId: mongoose.Types.ObjectId(userId),
    timestamp: { $gte: since }
  })
  .sort({ timestamp: -1 })
  .limit(1000);
};

AuditLogSchema.statics.getFailedAuthentications = async function(hours = 1) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        category: 'AUTH',
        'details.response.status': { $in: [401, 403] }
      }
    },
    {
      $group: {
        _id: '$details.ip',
        attempts: { $sum: 1 },
        users: { $addToSet: '$userId' },
        lastAttempt: { $max: '$timestamp' }
      }
    },
    {
      $match: {
        attempts: { $gte: 3 }
      }
    },
    {
      $sort: { attempts: -1 }
    }
  ]);
};

AuditLogSchema.statics.getSystemErrors = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        severity: { $in: ['ERROR', 'CRITICAL'] }
      }
    },
    {
      $group: {
        _id: {
          error: '$details.error.message',
          path: '$details.path'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
        affectedUsers: { $addToSet: '$userId' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 50
    }
  ]);
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);