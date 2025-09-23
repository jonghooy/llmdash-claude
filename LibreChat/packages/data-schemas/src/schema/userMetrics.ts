import { Schema, Types } from 'mongoose';

export interface IUserMetrics {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  metrics: {
    messageCount: number;
    conversationCount: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    modelUsage: Map<string, {
      count: number;
      tokens: number;
      cost: number;
    }>;
    apiCalls: number;
    errors: number;
    responseTime: {
      avg: number;
      min: number;
      max: number;
      count: number;
    };
    costBreakdown: {
      total: number;
      byModel: Map<string, number>;
    };
  };
  limits?: {
    dailyTokenLimit?: number;
    dailyMessageLimit?: number;
    monthlyBudget?: number;
    concurrentRequests?: number;
  };
  usage?: {
    dailyTokens: number;
    dailyMessages: number;
    monthlySpent: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const userMetricsSchema = new Schema<IUserMetrics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    messageCount: { type: Number, default: 0 },
    conversationCount: { type: Number, default: 0 },
    tokenUsage: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    modelUsage: {
      type: Map,
      of: {
        count: { type: Number, default: 0 },
        tokens: { type: Number, default: 0 },
        cost: { type: Number, default: 0 }
      }
    },
    apiCalls: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    responseTime: {
      avg: { type: Number, default: 0 },
      min: { type: Number, default: Number.MAX_VALUE },
      max: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    costBreakdown: {
      total: { type: Number, default: 0 },
      byModel: {
        type: Map,
        of: Number
      }
    }
  },
  limits: {
    dailyTokenLimit: { type: Number },
    dailyMessageLimit: { type: Number },
    monthlyBudget: { type: Number },
    concurrentRequests: { type: Number, default: 5 }
  },
  usage: {
    dailyTokens: { type: Number, default: 0 },
    dailyMessages: { type: Number, default: 0 },
    monthlySpent: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  // MongoDB Time Series Collection for efficient metrics storage
  timeseries: {
    timeField: 'date',
    metaField: 'userId',
    granularity: 'hours'
  }
});

// Indexes for efficient querying
userMetricsSchema.index({ userId: 1, date: -1 });
userMetricsSchema.index({ 'metrics.tokenUsage.total': -1 });
userMetricsSchema.index({ 'metrics.costBreakdown.total': -1 });

export default userMetricsSchema;