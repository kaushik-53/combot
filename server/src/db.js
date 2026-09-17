'use strict';

const mongoose = require('mongoose');

// Retry connection on failure so transient network blips don't kill startup
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in environment');

  await mongoose.connect(uri, {
    // Mongoose 8 uses the unified topology by default; no deprecated options needed
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] connection error:', err);
  });

  console.log(`[MongoDB] connected to ${mongoose.connection.name}`);
}

module.exports = { connectDB };
