/**
 * Script to promote a user to admin role
 * 
 * Usage: node scripts/makeAdmin.js <email>
 * Example: node scripts/makeAdmin.js karthikbtechcse2006@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, ROLES, APPROVAL_STATUS } = require('../models');

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.log('\nDo you want to see all users? Run: node scripts/listUsers.js');
      process.exit(1);
    }

    // Check if already admin
    if (user.role === ROLES.ADMIN) {
      console.log(`ℹ️  User "${user.name}" (${user.email}) is already an admin`);
      process.exit(0);
    }

    // Update to admin
    const previousRole = user.role;
    user.role = ROLES.ADMIN;
    user.approvalStatus = APPROVAL_STATUS.APPROVED;
    await user.save();

    console.log('\n✅ Successfully promoted user to admin!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Name:          ${user.name}`);
    console.log(`   Email:         ${user.email}`);
    console.log(`   Previous Role: ${previousRole}`);
    console.log(`   New Role:      ${user.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Also add to ADMIN_EMAILS env reminder
    console.log('\n💡 Remember to add this email to ADMIN_EMAILS in .env:');
    console.log(`   ADMIN_EMAILS=${email}`);
    console.log('   (or append with comma if you have multiple admins)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

makeAdmin();
