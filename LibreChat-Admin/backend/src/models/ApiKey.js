const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption helpers
const algorithm = 'aes-256-gcm';
// Use a fixed default key if not provided (in production, always set ENCRYPTION_KEY env var)
const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me'.padEnd(32, '0').slice(0, 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16); // Generate new IV for each encryption
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid encrypted text');
    }
    const parts = text.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'utf8'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw error;
  }
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
    set: encrypt
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
});

// Update timestamp on save
ApiKeySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // displayKey should be set by the route, not here
  // because at this point apiKey is already encrypted
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
  if (!this.apiKey) {
    return null;
  }
  try {
    return decrypt(this.apiKey);
  } catch (error) {
    console.error('Error decrypting API key:', error.message);
    return null;
  }
};

module.exports = mongoose.model('ApiKey', ApiKeySchema);