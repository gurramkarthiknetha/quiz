/**
 * Script to add all admin emails from .env ADMIN_EMAILS to the database
 * 
 * Usage: npm run addadmins
 * 
 * This script reads ADMIN_EMAILS from .env (comma-separated) and:
 * - Creates admin accounts if they don't exist
 * - Promotes existing users to admin role
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { User, ROLES, APPROVAL_STATUS } = require('../models');

const addAdmins = async () => {
  const adminEmails = process.env.ADMIN_EMAILS;

  if (!adminEmails) {
    console.error('❌ ADMIN_EMAILS not found in .env file');
    console.log('Add ADMIN_EMAILS=email1@example.com,email2@example.com to your .env file');
    process.exit(1);
  }

  // Parse comma-separated emails and clean them
  const emails = adminEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  if (emails.length === 0) {
    console.error('❌ No valid emails found in ADMIN_EMAILS');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('          Admin Setup Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Found ${emails.length} email(s) to process\n`);

  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let created = 0;
    let promoted = 0;
    let alreadyAdmin = 0;
    let errors = 0;

    for (const email of emails) {
      try {
        console.log(`Processing: ${email}`);
        
        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
          // User exists
          if (user.role === ROLES.ADMIN) {
            console.log(`  ℹ️  Already an admin\n`);
            alreadyAdmin++;
          } else {
            // Promote to admin
            const previousRole = user.role;
            user.role = ROLES.ADMIN;
            user.approvalStatus = APPROVAL_STATUS.APPROVED;
            await user.save();
            console.log(`  ✅ Promoted from ${previousRole} to admin\n`);
            promoted++;
          }
        } else {
          // Create new admin user with a random password (they'll use Google OAuth)
          const randomPassword = crypto.randomBytes(32).toString('hex');
          user = await User.create({
            name: email.split('@')[0], // Use email prefix as name
            email: email,
            password: randomPassword, // Random password - user will login via Google
            role: ROLES.ADMIN,
            approvalStatus: APPROVAL_STATUS.APPROVED,
            authProvider: 'google', // Assume Google login
            isEmailVerified: true,
            isActive: true,
          });
          console.log(`  ✅ Created new admin account\n`);
          created++;
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}\n`);
        errors++;
      }
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📝 Total emails processed: ${emails.length}`);
    console.log(`  ✨ New admins created:     ${created}`);
    console.log(`  ⬆️  Users promoted:         ${promoted}`);
    console.log(`  ℹ️  Already admins:         ${alreadyAdmin}`);
    if (errors > 0) {
      console.log(`  ❌ Errors:                 ${errors}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n💡 These admins can now log in via Google OAuth');
    console.log('   and will have full admin access.\n');

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

addAdmins();
