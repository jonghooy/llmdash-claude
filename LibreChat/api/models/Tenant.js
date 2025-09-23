const mongoose = require('mongoose');
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true,
    },
    logo: {
      type: String,
    },

    // Contact Information
    contactInfo: {
      email: {
        type: String,
        required: true,
      },
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },

    // Subscription Information
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'cancelled', 'suspended'],
        default: 'trial',
      },
      trialEndsAt: Date,
      billingPeriod: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
      },
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      canceledAt: Date,
      paymentMethod: {
        type: String,
        enum: ['card', 'invoice', 'bank_transfer'],
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },

    // Usage Limits & Quotas
    limits: {
      maxUsers: {
        type: Number,
        default: 5,
      },
      maxTeams: {
        type: Number,
        default: 1,
      },
      monthlyTokens: {
        type: Number,
        default: 100000,
      },
      monthlyMessages: {
        type: Number,
        default: 1000,
      },
      monthlyFileStorage: {
        type: Number, // in MB
        default: 100,
      },
      allowedModels: [{
        type: String,
        enum: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'claude-sonnet-4-20250514', 'gemini-2.5-flash', 'gemini-2.5-pro'],
      }],
      allowedFeatures: [{
        type: String,
        enum: ['file_upload', 'memory_agent', 'mcp_servers', 'api_access', 'custom_prompts', 'agents'],
      }],
    },

    // Current Usage
    usage: {
      currentUsers: {
        type: Number,
        default: 0,
      },
      currentTeams: {
        type: Number,
        default: 0,
      },
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

    // Settings
    settings: {
      allowSelfSignup: {
        type: Boolean,
        default: false,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      requireAdminApproval: {
        type: Boolean,
        default: true,
      },
      defaultUserRole: {
        type: String,
        default: 'user',
      },
      ssoEnabled: {
        type: Boolean,
        default: false,
      },
      ssoProvider: String,
      ssoConfig: Schema.Types.Mixed,
      customBranding: {
        primaryColor: String,
        secondaryColor: String,
        customCss: String,
      },
      notificationSettings: {
        usageAlerts: {
          type: Boolean,
          default: true,
        },
        alertThreshold: {
          type: Number,
          default: 80, // percentage
        },
        alertEmails: [String],
      },
    },

    // Status & Metadata
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
    },
    suspendedReason: String,
    suspendedAt: Date,
    deletedAt: Date,

    // Owner Information
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Billing Information
    billing: {
      companyName: String,
      taxId: String,
      billingEmail: String,
      invoicePrefix: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ ownerId: 1 });

// Methods
tenantSchema.methods.isWithinLimits = function(limitType) {
  switch(limitType) {
    case 'users':
      return this.usage.currentUsers < this.limits.maxUsers;
    case 'teams':
      return this.usage.currentTeams < this.limits.maxTeams;
    case 'tokens':
      return this.usage.monthlyTokensUsed < this.limits.monthlyTokens;
    case 'messages':
      return this.usage.monthlyMessagesUsed < this.limits.monthlyMessages;
    case 'storage':
      return this.usage.fileStorageUsed < this.limits.monthlyFileStorage;
    default:
      return false;
  }
};

tenantSchema.methods.resetMonthlyUsage = function() {
  this.usage.monthlyTokensUsed = 0;
  this.usage.monthlyMessagesUsed = 0;
  this.usage.lastResetDate = new Date();
  return this.save();
};

tenantSchema.methods.incrementUsage = function(type, amount = 1) {
  switch(type) {
    case 'users':
      this.usage.currentUsers += amount;
      break;
    case 'teams':
      this.usage.currentTeams += amount;
      break;
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
tenantSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'active' });
};

tenantSchema.statics.findByDomain = function(domain) {
  return this.findOne({ domain, status: 'active' });
};

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);