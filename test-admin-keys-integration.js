const mongoose = require('mongoose');
const crypto = require('crypto');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/LibreChat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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

async function checkAdminKeys() {
  try {
    const db = mongoose.connection.db;
    const apiKeysCollection = db.collection('apikeys');
    
    console.log('Checking admin panel API keys...\n');
    
    const apiKeys = await apiKeysCollection.find({}).toArray();
    
    if (apiKeys.length === 0) {
      console.log('No API keys found in admin panel database.');
      return;
    }
    
    for (const key of apiKeys) {
      console.log(`Provider: ${key.provider}`);
      console.log(`  Enabled: ${key.enabled}`);
      console.log(`  Valid: ${key.isValid}`);
      console.log(`  Display Key: ${key.displayKey}`);
      
      if (key.apiKey) {
        const decryptedKey = decrypt(key.apiKey);
        if (decryptedKey) {
          console.log(`  Decrypted Key: ${decryptedKey.slice(0, 10)}...${decryptedKey.slice(-4)}`);
        } else {
          console.log('  Failed to decrypt key');
        }
      }
      console.log('');
    }
    
    // Check enabled and valid keys that would be used by LibreChat
    const activeKeys = await apiKeysCollection.find({ enabled: true, isValid: true }).toArray();
    console.log(`\nActive keys that LibreChat will use:`);
    for (const key of activeKeys) {
      console.log(`  - ${key.provider}: ${key.displayKey}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
mongoose.connection.once('open', checkAdminKeys);