const mongoose = require('mongoose');

const ModelRegistrySchema = new mongoose.Schema({
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
  enabled: {
    type: Boolean,
    default: true
  },
  defaultEnabled: {
    type: Boolean,
    default: false
  },
  userSelectable: {
    type: Boolean,
    default: true
  },
  maxTokens: {
    type: Number,
    default: null
  },
  contextWindow: {
    type: Number,
    default: null
  },
  capabilities: {
    chat: {
      type: Boolean,
      default: true
    },
    vision: {
      type: Boolean,
      default: false
    },
    tools: {
      type: Boolean,
      default: false
    },
    streaming: {
      type: Boolean,
      default: true
    },
    systemPrompt: {
      type: Boolean,
      default: true
    }
  },
  pricing: {
    prompt: {
      type: Number,
      default: 0
    },
    completion: {
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
    }
  },
  restrictions: {
    maxUsagePerUser: {
      type: Number,
      default: null
    },
    maxUsagePerDay: {
      type: Number,
      default: null
    },
    allowedRoles: [{
      type: String,
      enum: ['user', 'premium', 'admin']
    }],
    requiresApproval: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    description: String,
    tags: [String],
    version: String,
    releaseDate: Date,
    deprecationDate: Date
  }
}, {
  timestamps: true,
  collection: 'modelregistries'
});

// Indexes for better query performance
ModelRegistrySchema.index({ provider: 1 });
ModelRegistrySchema.index({ enabled: 1 });
ModelRegistrySchema.index({ userSelectable: 1 });

module.exports = mongoose.model('ModelRegistry', ModelRegistrySchema);