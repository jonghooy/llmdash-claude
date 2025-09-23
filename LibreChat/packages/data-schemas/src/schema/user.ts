import { Schema } from 'mongoose';
import { SystemRoles } from 'librechat-data-provider';
import { IUser } from '~/types';

// Session sub-schema
const SessionSchema = new Schema(
  {
    refreshToken: {
      type: String,
      default: '',
    },
  },
  { _id: false },
);

// Backup code sub-schema
const BackupCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
    },
    username: {
      type: String,
      lowercase: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, "can't be blank"],
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
    },
    // Multi-tenancy fields
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
      sparse: true,  // Allow null for super admin
    },
    saasRole: {
      type: String,
      enum: ['super_admin', 'customer_admin', 'team_leader', 'user'],
      default: 'user',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      sparse: true,
    },
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
      currentPeriodEnd: Date,
      monthlyQuota: {
        tokens: { type: Number, default: 100000 },
        messages: { type: Number, default: 1000 },
      },
      usage: {
        tokens: { type: Number, default: 0 },
        messages: { type: Number, default: 0 },
      },
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      maxlength: 128,
      select: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      required: true,
      default: 'local',
    },
    role: {
      type: String,
      default: SystemRoles.USER,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    openidId: {
      type: String,
      unique: true,
      sparse: true,
    },
    samlId: {
      type: String,
      unique: true,
      sparse: true,
    },
    ldapId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    discordId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    plugins: {
      type: Array,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    totpSecret: {
      type: String,
      select: false,
    },
    backupCodes: {
      type: [BackupCodeSchema],
      select: false,
    },
    refreshToken: {
      type: [SessionSchema],
    },
    expiresAt: {
      type: Date,
      expires: 604800, // 7 days in seconds
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    personalization: {
      type: {
        memories: {
          type: Boolean,
          default: true,
        },
      },
      default: {},
    },
    /** Field for external source identification (for consistency with TPrincipal schema) */
    idOnTheSource: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true },
);

export default userSchema;
