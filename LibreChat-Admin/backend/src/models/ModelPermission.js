const mongoose = require('mongoose');

const ModelPermissionSchema = new mongoose.Schema({
  modelId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  provider: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  enabledBy: {
    type: String,
    default: 'admin'
  },
  disabledReason: {
    type: String,
    default: ''
  },
  restrictions: {
    maxTokens: {
      type: Number,
      default: null
    },
    maxRequestsPerDay: {
      type: Number,
      default: null
    },
    allowedUsers: {
      type: [String],
      default: []
    },
    blockedUsers: {
      type: [String],
      default: []
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
ModelPermissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ModelPermission', ModelPermissionSchema);