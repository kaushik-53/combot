'use strict';

const mongoose = require('mongoose');

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/combot';

async function connectDB() {
  const uri = process.env.MONGO_URI || LOCAL_FALLBACK_URI;

  try {
    console.log(`[MongoDB] Attempting connection to: ${uri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout before trying fallback
    });
    console.log(`[MongoDB] Connected successfully to "${mongoose.connection.name}" database`);
  } catch (err) {
    if (uri !== LOCAL_FALLBACK_URI) {
      console.warn(`[MongoDB] Primary connection failed (${err.message}). Attempting fallback to local MongoDB...`);
      try {
        await mongoose.connect(LOCAL_FALLBACK_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[MongoDB] Connected successfully to local database "${mongoose.connection.name}"`);
        return;
      } catch (fallbackErr) {
        console.error('[MongoDB] Local fallback connection also failed:', fallbackErr.message);
      }
    }
    throw err;
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] runtime connection error:', err);
  });
}

module.exports = { connectDB };
