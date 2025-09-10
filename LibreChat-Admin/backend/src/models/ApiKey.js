const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption helpers
const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'utf8'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const ApiKeySchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'google', 'anthropic'],
    unique: true
  },
  apiKey: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt
  },
  displayKey: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: false
  },
  lastTested: {
    type: Date,
    default: null
  },
  testResult: {
    type: String,
    default: ''
  },
  enabled: {
    type: Boolean,
    default: true
  },
  modelAccess: {
    type: [String],
    default: []
  },
  usageLimit: {
    daily: {
      type: Number,
      default: null
    },
    monthly: {
      type: Number,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'admin'
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Update timestamp on save
ApiKeySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Mask the API key for display (show only first 6 and last 4 characters)
  if (this.isModified('apiKey')) {
    const rawKey = this.apiKey;
    if (rawKey && rawKey.length > 10) {
      this.displayKey = rawKey.slice(0, 6) + '...' + rawKey.slice(-4);
    } else {
      this.displayKey = 'Key set';
    }
  }
  next();
});

// Don't return the encrypted key in queries by default
ApiKeySchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.apiKey;
  return obj;
};

// Method to get decrypted API key
ApiKeySchema.methods.getDecryptedKey = function() {
  return decrypt(this.apiKey);
};

module.exports = mongoose.model('ApiKey', ApiKeySchema);