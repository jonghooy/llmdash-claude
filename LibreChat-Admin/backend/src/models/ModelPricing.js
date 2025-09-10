const mongoose = require('mongoose');

const ModelPricingSchema = new mongoose.Schema({
  modelId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  modelName: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'other']
  },
  pricing: {
    prompt: {
      type: Number,
      required: true,
      default: 0
    },
    completion: {
      type: Number,
      required: true,
      default: 0
    },
    image: {
      type: Number,
      default: 0
    },
    audio: {
      type: Number,
      default: 0
    },
    video: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    unit: {
      type: String,
      default: '1M tokens'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  quotas: {
    dailyLimit: {
      type: Number,
      default: null
    },
    monthlyLimit: {
      type: Number,
      default: null
    },
    perUserLimit: {
      type: Number,
      default: null
    },
    rateLimitRpm: {
      type: Number,
      default: null
    },
    rateLimitTpm: {
      type: Number,
      default: null
    }
  },
  features: {
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    supportLevel: {
      type: String,
      enum: ['community', 'standard', 'priority'],
      default: 'standard'
    },
    slaUptime: {
      type: Number,
      default: 99.9
    }
  },
  status: {
    type: String,
    enum: ['active', 'deprecated', 'beta', 'maintenance'],
    default: 'active'
  },
  billingConfig: {
    minimumBill: {
      type: Number,
      default: 0
    },
    freeUsageLimit: {
      type: Number,
      default: 0
    },
    billingCycle: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      default: 'monthly'
    }
  },
  discounts: [{
    type: {
      type: String,
      enum: ['volume', 'loyalty', 'promotional']
    },
    threshold: Number,
    discount: Number,
    validUntil: Date
  }]
}, {
  timestamps: true,
  collection: 'modelpricings'
});

// Indexes for better query performance
ModelPricingSchema.index({ provider: 1 });
ModelPricingSchema.index({ status: 1 });
ModelPricingSchema.index({ 'features.tier': 1 });

module.exports = mongoose.model('ModelPricing', ModelPricingSchema);