const mongoose = require('mongoose');
const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Tenant Association
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Team Hierarchy
    parentTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      sparse: true,
    },

    // Leadership
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Members
    members: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['member', 'moderator', 'admin'],
        default: 'member',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    // Team Settings
    settings: {
      visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
      },
      allowMemberInvite: {
        type: Boolean,
        default: false,
      },
      requireApprovalToJoin: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 50,
      },

      // Team-specific Model Access
      allowedModels: [{
        type: String,
        enum: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'claude-sonnet-4-20250514', 'gemini-2.5-flash', 'gemini-2.5-pro'],
      }],

      // Team-specific Features
      allowedFeatures: [{
        type: String,
        enum: ['file_upload', 'memory_agent', 'mcp_servers', 'api_access', 'custom_prompts', 'agents'],
      }],

      // Team Quotas (if different from tenant defaults)
      customQuotas: {
        enabled: {
          type: Boolean,
          default: false,
        },
        monthlyTokens: Number,
        monthlyMessages: Number,
        monthlyFileStorage: Number,
      },
    },

    // Team Usage
    usage: {
      monthlyTokensUsed: {
        type: Number,
        default: 0,
      },
      monthlyMessagesUsed: {
        type: Number,
        default: 0,
      },
      fileStorageUsed: {
        type: Number, // in MB
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Team Resources
    resources: {
      sharedPrompts: [{
        name: String,
        content: String,
        category: String,
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
      sharedAgents: [{
        agentId: {
          type: Schema.Types.ObjectId,
          ref: 'Agent',
        },
        sharedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      sharedFiles: [{
        fileId: {
          type: Schema.Types.ObjectId,
          ref: 'File',
        },
        sharedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      }],
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
    },
    suspendedReason: String,
    suspendedAt: Date,
    deletedAt: Date,

    // Metadata
    tags: [String],
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound index for unique team name within a tenant
teamSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
teamSchema.index({ tenantId: 1, status: 1 });
teamSchema.index({ leaderId: 1 });
teamSchema.index({ 'members.userId': 1 });

// Methods
teamSchema.methods.addMember = async function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.userId.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }

  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Team has reached maximum member limit');
  }

  this.members.push({
    userId,
    role,
    joinedAt: new Date(),
  });

  return this.save();
};

teamSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => m.userId.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('User is not a member of this team');
  }

  this.members.splice(memberIndex, 1);
  return this.save();
};

teamSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  if (!member) {
    throw new Error('User is not a member of this team');
  }

  member.role = newRole;
  return this.save();
};

teamSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.userId.toString() === userId.toString());
};

teamSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member ? member.role : null;
};

teamSchema.methods.resetMonthlyUsage = function() {
  this.usage.monthlyTokensUsed = 0;
  this.usage.monthlyMessagesUsed = 0;
  this.usage.lastResetDate = new Date();
  return this.save();
};

teamSchema.methods.incrementUsage = function(type, amount = 1) {
  switch(type) {
    case 'tokens':
      this.usage.monthlyTokensUsed += amount;
      break;
    case 'messages':
      this.usage.monthlyMessagesUsed += amount;
      break;
    case 'storage':
      this.usage.fileStorageUsed += amount;
      break;
  }
  return this.save();
};

// Static methods
teamSchema.statics.findByTenant = function(tenantId, status = 'active') {
  return this.find({ tenantId, status });
};

teamSchema.statics.findUserTeams = function(userId, tenantId) {
  return this.find({
    tenantId,
    status: 'active',
    $or: [
      { leaderId: userId },
      { 'members.userId': userId }
    ]
  });
};

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);