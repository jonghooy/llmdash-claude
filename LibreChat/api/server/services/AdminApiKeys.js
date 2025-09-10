const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption helpers - must match admin panel
const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me'.padEnd(32, '0').slice(0, 32);

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
    return null;
  }
}

// Cache for API keys to avoid frequent DB queries
let apiKeysCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get API keys from admin panel database
 * @returns {Promise<{openai?: string, google?: string, anthropic?: string}>}
 */
async function getAdminApiKeys() {
  try {
    // Check cache first
    if (apiKeysCache && cacheExpiry && Date.now() < cacheExpiry) {
      return apiKeysCache;
    }

    // Connect to admin database if needed
    const db = mongoose.connection.db;
    if (!db) {
      console.log('Admin API Keys: Database not connected');
      return {};
    }

    const apiKeysCollection = db.collection('apikeys');
    const apiKeys = await apiKeysCollection.find({ enabled: true, isValid: true }).toArray();
    
    const result = {};
    
    for (const key of apiKeys) {
      if (key.apiKey) {
        const decryptedKey = decrypt(key.apiKey);
        if (decryptedKey) {
          switch (key.provider) {
            case 'openai':
              result.openai = decryptedKey;
              break;
            case 'google':
              result.google = decryptedKey;
              break;
            case 'anthropic':
              result.anthropic = decryptedKey;
              break;
          }
        }
      }
    }
    
    // Update cache
    apiKeysCache = result;
    cacheExpiry = Date.now() + CACHE_DURATION;
    
    console.log('Admin API Keys loaded:', Object.keys(result).join(', '));
    if (Object.keys(result).length > 0) {
      console.log('Successfully loaded API keys from admin panel database');
      for (const [provider, key] of Object.entries(result)) {
        console.log(`  - ${provider}: ${key.slice(0, 10)}...${key.slice(-4)}`);
      }
    }
    return result;
  } catch (error) {
    console.error('Error loading admin API keys:', error);
    return {};
  }
}

/**
 * Clear the API keys cache
 */
function clearApiKeysCache() {
  apiKeysCache = null;
  cacheExpiry = null;
  console.log('Admin API Keys cache cleared');
}

module.exports = {
  getAdminApiKeys,
  clearApiKeysCache
};