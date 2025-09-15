const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    maxlength: 255
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  category: {
    type: String,
    default: 'general',
    index: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'team', 'organization', 'admin'],
    default: 'public'
  },
  organizationId: {
    type: String,
    index: true
  },
  teamId: {
    type: String,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    lastAccessed: Date,
    accessCount: {
      type: Number,
      default: 0
    },
    createdBy: String,
    updatedBy: String
  },
  expiresAt: {
    type: Date,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// TTL index for automatic deletion of expired memories
MemorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for efficient queries
MemorySchema.index({ category: 1, isActive: 1 });
MemorySchema.index({ organizationId: 1, isActive: 1 });
MemorySchema.index({ teamId: 1, isActive: 1 });
MemorySchema.index({ tags: 1 });

// Virtual for value display
MemorySchema.virtual('displayValue').get(function() {
  if (this.type === 'object' || this.type === 'array') {
    return JSON.stringify(this.value, null, 2);
  }
  return String(this.value);
});

// Method to update access metadata
MemorySchema.methods.recordAccess = function() {
  this.metadata.lastAccessed = new Date();
  this.metadata.accessCount += 1;
  return this.save();
};

// Static method to get memory by key with access recording
MemorySchema.statics.getByKey = async function(key, recordAccess = true) {
  const memory = await this.findOne({ key, isActive: true });
  if (memory && recordAccess) {
    await memory.recordAccess();
  }
  return memory;
};

// Static method to bulk upsert memories
MemorySchema.statics.bulkUpsert = async function(memories) {
  const bulkOps = memories.map(memory => ({
    updateOne: {
      filter: { key: memory.key },
      update: { $set: memory },
      upsert: true
    }
  }));
  return this.bulkWrite(bulkOps);
};

module.exports = mongoose.model('Memory', MemorySchema);