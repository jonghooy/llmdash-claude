import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: string;
  category: 'AUTH' | 'API' | 'ADMIN' | 'SECURITY' | 'DATA' | 'SYSTEM' | 'CONVERSATION' | 'MODEL';
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  details?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    query?: any;
    body?: any;
    response?: {
      status?: number;
      message?: string;
      time?: number;
    };
    error?: {
      message?: string;
      stack?: string;
      code?: string;
    };
  };
  metadata?: {
    conversationId?: string;
    messageId?: string;
    model?: string;
    endpoint?: string;
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
    };
    cost?: number;
    duration?: number;
    sessionId?: string;
    requestId?: string;
  };
  security?: {
    threat?: {
      type?: string;
      level?: string;
      description?: string;
    };
    blocked?: boolean;
    reason?: string;
  };
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
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
    query: Schema.Types.Mixed,
    body: Schema.Types.Mixed,
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
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ 'security.blocked': 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export default auditLogSchema;