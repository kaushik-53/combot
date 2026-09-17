'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load .env from server dir first, then fallback to root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User     = require('../src/models/User');

async function seed() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const mongoUri = process.env.MONGO_URI;

  if (!email || !password) {
    console.error('[Seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  console.log(`[Seed] Connecting to MongoDB: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
  await mongoose.connect(mongoUri);

  const normalizedEmail = email.toLowerCase().trim();
  let existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.role = 'admin';
    existing.isVerified = true;
    if (password) {
      existing.passwordHash = await User.hashPassword(password);
    }
    await existing.save();
    console.log(`[Seed] ✅ Successfully promoted existing user "${normalizedEmail}" to ADMIN role!`);
  } else {
    // Check if any user exists with name "Ayush Kaushik" or similar
    const passwordHash = await User.hashPassword(password);
    await User.create({
      email: normalizedEmail,
      passwordHash,
      name:       'Admin',
      role:       'admin',
      isVerified: true,
    });
    console.log(`[Seed] ✅ Admin created: ${normalizedEmail}`);
  }

  // Also check if there are other users in DB to print them out
  const allUsers = await User.find({}, 'name email role');
  console.log('[Seed] Current users in DB:', allUsers);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] error:', err);
  process.exit(1);
});
