'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Fallback to current working directory

const app = require('./app');
const { connectDB } = require('./db');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] failed to start:', err);
  process.exit(1);
});
