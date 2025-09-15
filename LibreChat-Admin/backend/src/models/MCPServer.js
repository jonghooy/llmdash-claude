const mongoose = require('mongoose');

const mcpServerSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },

  // Connection Configuration
  connectionType: {
    type: String,
    enum: ['stdio', 'sse', 'websocket'],
    required: true,
    default: 'stdio'
  },

  // Stdio configuration
  command: {
    type: String,
    required: function() { return this.connectionType === 'stdio'; }
  },
  args: [{
    type: String
  }],
  env: {
    type: Map,
    of: String
  },

  // SSE/WebSocket configuration
  url: {
    type: String,
    required: function() { return this.connectionType === 'sse' || this.connectionType === 'websocket'; }
  },
  headers: {
    type: Map,
    of: String
  },

  // OAuth configuration (optional)
  oauth: {
    enabled: {
      type: Boolean,
      default: false
    },
    clientId: String,
    clientSecret: String,
    authorizationUrl: String,
    tokenUrl: String,
    scope: String
  },

  // Tools and Resources
  tools: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    inputSchema: {
      type: mongoose.Schema.Types.Mixed
    },
    category: {
      type: String,
      enum: ['file', 'search', 'web', 'database', 'api', 'system', 'other'],
      default: 'other'
    }
  }],

  resources: [{
    uri: String,
    name: String,
    description: String,
    mimeType: String
  }],

  prompts: [{
    name: String,
    description: String,
    arguments: [{
      name: String,
      description: String,
      required: Boolean
    }]
  }],

  // Access Control
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
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
  stats: {
    totalConnections: {
      type: Number,
      default: 0
    },
    successfulConnections: {
      type: Number,
      default: 0
    },
    failedConnections: {
      type: Number,
      default: 0
    },
    totalToolCalls: {
      type: Number,
      default: 0
    },
    lastConnected: Date,
    lastError: String,
    lastErrorTime: Date
  },

  // Health Check
  healthCheck: {
    enabled: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 300000 // 5 minutes
    },
    lastCheck: Date,
    status: {
      type: String,
      enum: ['healthy', 'unhealthy', 'unknown'],
      default: 'unknown'
    },
    responseTime: Number // in ms
  },

  // Configuration
  config: {
    maxConcurrentConnections: {
      type: Number,
      default: 10
    },
    timeout: {
      type: Number,
      default: 30000 // 30 seconds
    },
    retryAttempts: {
      type: Number,
      default: 3
    },
    retryDelay: {
      type: Number,
      default: 1000 // 1 second
    },
    autoReconnect: {
      type: Boolean,
      default: true
    }
  },

  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['productivity', 'development', 'research', 'creative', 'data', 'communication', 'utility', 'custom'],
    default: 'custom'
  },
  icon: String,
  documentation: String,

  // System fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
mcpServerSchema.index({ name: 1, organization: 1 }, { unique: true });
mcpServerSchema.index({ isActive: 1, isPublic: 1 });
mcpServerSchema.index({ 'stats.lastConnected': -1 });
mcpServerSchema.index({ 'healthCheck.status': 1 });
mcpServerSchema.index({ tags: 1 });
mcpServerSchema.index({ category: 1 });
mcpServerSchema.index({ deletedAt: 1 });

// Virtual for connection string
mcpServerSchema.virtual('connectionString').get(function() {
  if (this.connectionType === 'stdio') {
    return `${this.command} ${this.args?.join(' ') || ''}`;
  }
  return this.url;
});

// Virtual for tool count
mcpServerSchema.virtual('toolCount').get(function() {
  return this.tools?.length || 0;
});

// Virtual for resource count
mcpServerSchema.virtual('resourceCount').get(function() {
  return this.resources?.length || 0;
});

// Methods
mcpServerSchema.methods.incrementConnectionStats = function(success = true) {
  this.stats.totalConnections++;
  if (success) {
    this.stats.successfulConnections++;
    this.stats.lastConnected = new Date();
  } else {
    this.stats.failedConnections++;
  }
  return this.save();
};

mcpServerSchema.methods.incrementToolCalls = function(count = 1) {
  this.stats.totalToolCalls += count;
  return this.save();
};

mcpServerSchema.methods.updateHealthStatus = function(status, responseTime) {
  this.healthCheck.lastCheck = new Date();
  this.healthCheck.status = status;
  if (responseTime !== undefined) {
    this.healthCheck.responseTime = responseTime;
  }
  return this.save();
};

mcpServerSchema.methods.recordError = function(error) {
  this.stats.lastError = error.message || error;
  this.stats.lastErrorTime = new Date();
  return this.save();
};

// Static methods
mcpServerSchema.statics.findActive = function() {
  return this.find({ isActive: true, deletedAt: null });
};

mcpServerSchema.statics.findPublic = function() {
  return this.find({ isActive: true, isPublic: true, deletedAt: null });
};

mcpServerSchema.statics.findByOrganization = function(organizationId) {
  return this.find({
    organization: organizationId,
    isActive: true,
    deletedAt: null
  });
};

mcpServerSchema.statics.findByTeam = function(teamId) {
  return this.find({
    teams: teamId,
    isActive: true,
    deletedAt: null
  });
};

mcpServerSchema.statics.findAccessibleByUser = function(userId, organizationId, teamIds = []) {
  return this.find({
    isActive: true,
    deletedAt: null,
    $or: [
      { isPublic: true },
      { organization: organizationId },
      { teams: { $in: teamIds } },
      { allowedUsers: userId }
    ]
  });
};

// Soft delete
mcpServerSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Pre-save middleware
mcpServerSchema.pre('save', function(next) {
  // Clean up tools array
  if (this.tools) {
    this.tools = this.tools.filter(tool => tool && tool.name);
  }

  // Clean up resources array
  if (this.resources) {
    this.resources = this.resources.filter(resource => resource && resource.uri);
  }

  // Clean up prompts array
  if (this.prompts) {
    this.prompts = this.prompts.filter(prompt => prompt && prompt.name);
  }

  next();
});

module.exports = mongoose.model('MCPServer', mcpServerSchema);