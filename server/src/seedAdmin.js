'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe1!';
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/combot';

  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user.role = 'admin';
      user.isVerified = true;
      await user.save();
      console.log(`✅ Updated existing user "${email}" to ADMIN role!`);
    } else {
      const passwordHash = await User.hashPassword(password);
      user = await User.create({
        name: 'Admin',
        email: email.toLowerCase(),
        passwordHash,
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Created new ADMIN user "${email}" with password "${password}"!`);
    }
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
