const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    const admins = db.collection('adminusers');
    
    const newPassword = 'admin123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await admins.updateOne(
      { email: 'admin@librechat.local' },
      { 
        $set: { 
          password: hashedPassword,
          name: 'Admin',
          role: 'admin',
          isActive: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      console.log('✅ Created admin user with password: admin123456');
    } else if (result.modifiedCount > 0) {
      console.log('✅ Reset admin password to: admin123456');
    } else {
      console.log('ℹ️ Admin password unchanged');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

resetPassword();