const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },

  // Agent Type and Category
  type: {
    type: String,
    enum: ['assistant', 'specialist', 'workflow', 'custom'],
    default: 'assistant'
  },
  category: {
    type: String,
    enum: ['general', 'coding', 'writing', 'analysis', 'creative', 'research', 'support', 'automation'],
    default: 'general'
  },

  // Instructions and Behavior
  systemPrompt: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  temperature: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 2
  },
  maxTokens: {
    type: Number,
    default: 4000
  },

  // Model Configuration
  model: {
    type: String,
    required: true,
    default: 'gpt-4'
  },
  fallbackModel: {
    type: String,
    default: null
  },

  // Connected Resources
  prompts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prompt'
  }],
  mcpServers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MCPServer'
  }],
  tools: [{
    name: String,
    enabled: Boolean,
    config: mongoose.Schema.Types.Mixed
  }],

  // Memory Configuration
  useOrgMemory: {
    type: Boolean,
    default: true
  },
  memoryKeys: [{
    type: String
  }],
  contextWindow: {
    type: Number,
    default: 8000
  },

  // Capabilities
  capabilities: {
    codeExecution: {
      type: Boolean,
      default: false
    },
    fileAccess: {
      type: Boolean,
      default: false
    },
    webSearch: {
      type: Boolean,
      default: false
    },
    imageGeneration: {
      type: Boolean,
      default: false
    },
    dataAnalysis: {
      type: Boolean,
      default: false
    }
  },

  // Access Control
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 100
  },
  avgResponseTime: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: null
  },

  // Ratings and Feedback
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },

  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: String,
    default: '1.0.0'
  },
  changelog: [{
    version: String,
    changes: String,
    date: Date
  }],

  // Advanced Configuration
  config: {
    autoSave: {
      type: Boolean,
      default: true
    },
    streamResponse: {
      type: Boolean,
      default: true
    },
    enableLogging: {
      type: Boolean,
      default: true
    },
    retryOnError: {
      type: Boolean,
      default: true
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    timeout: {
      type: Number,
      default: 30000
    }
  },

  // Workflow Configuration (for workflow type)
  workflow: {
    steps: [{
      order: Number,
      action: String,
      config: mongoose.Schema.Types.Mixed,
      nextStep: mongoose.Schema.Types.Mixed
    }],
    triggers: [{
      type: String,
      condition: mongoose.Schema.Types.Mixed
    }]
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
agentSchema.index({ name: 1, organization: 1 });
agentSchema.index({ category: 1, isPublic: 1 });
agentSchema.index({ tags: 1 });
agentSchema.index({ isActive: 1, isPublic: 1 });

// Virtual for full configuration
agentSchema.virtual('fullConfig').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    systemPrompt: this.systemPrompt,
    model: this.model,
    temperature: this.temperature,
    maxTokens: this.maxTokens,
    tools: this.tools,
    capabilities: this.capabilities,
    mcpServers: this.mcpServers,
    prompts: this.prompts
  };
});

// Methods
agentSchema.methods.incrementUsage = async function(tokensUsed = 0) {
  this.usageCount += 1;
  this.totalTokens += tokensUsed;
  this.lastUsed = new Date();
  return this.save();
};

agentSchema.methods.updateRating = async function(newRating) {
  const totalRating = this.rating * this.ratingCount;
  this.ratingCount += 1;
  this.rating = (totalRating + newRating) / this.ratingCount;
  return this.save();
};

agentSchema.methods.duplicate = async function(newName) {
  const Agent = this.constructor;
  const agentData = this.toObject();
  delete agentData._id;
  delete agentData.createdAt;
  delete agentData.updatedAt;
  agentData.name = newName || `${this.name} (Copy)`;
  agentData.usageCount = 0;
  agentData.totalTokens = 0;
  agentData.rating = 0;
  agentData.ratingCount = 0;
  agentData.lastUsed = null;

  return Agent.create(agentData);
};

// Static methods
agentSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true, isPublic: true });
};

agentSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ usageCount: -1, rating: -1 })
    .limit(limit);
};

agentSchema.statics.findByOrganization = function(orgId) {
  return this.find({ organization: orgId, isActive: true });
};

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;