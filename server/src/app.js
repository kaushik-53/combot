'use strict';

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const authRoutes  = require('./routes/auth');
const postsRoutes = require('./routes/posts');

const app = express();

// ─── Security middleware ──────────────────────────────────────────────────────

app.use(helmet());

app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true, // Required so the browser sends the httpOnly refresh cookie
}));

// ─── Body / cookie parsing ────────────────────────────────────────────────────

app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',  authRoutes);
app.use('/api/posts', postsRoutes);

// Health check — useful for Docker / CI readiness probes
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404 for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Central error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
