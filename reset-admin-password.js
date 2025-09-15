#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/LibreChat';

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the Admin collection
    const Admin = mongoose.connection.collection('admins');
    
    // Find the admin user
    const admin = await Admin.findOne({ email: 'admin@librechat.local' });
    
    if (!admin) {
      console.log('Admin user not found. Creating new admin user...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('Admin123456', 10);
      
      await Admin.insertOne({
        email: 'admin@librechat.local',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✓ Admin user created with password: Admin123456');
    } else {
      console.log('Admin user found. Resetting password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash('Admin123456', 10);
      
      await Admin.updateOne(
        { email: 'admin@librechat.local' },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✓ Admin password reset to: Admin123456');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the reset
resetAdminPassword();