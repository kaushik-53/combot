'use strict';

/**
 * Central error handler — must be the LAST middleware registered in app.js.
 * Normalises all errors to { error: { code, message, details? } } so clients
 * can rely on a single shape regardless of error origin.
 */
function errorHandler(err, req, res, _next) {
  // Log stack in non-production for developer visibility
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  // Mongoose validation error — field-level detail is safe to return
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    });
  }

  // Mongoose CastError — typically a malformed ObjectId in a URL param
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'INVALID_ID', message: `Invalid value for field: ${err.path}` },
    });
  }

  // MongoDB duplicate key (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? 'field';
    return res.status(409).json({
      error: { code: 'DUPLICATE_KEY', message: `${field} already exists` },
    });
  }

  // JWT errors surfaced from the auth middleware
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Authentication token is invalid or expired' },
    });
  }

  // Application-level errors thrown with an explicit status code
  const status = err.status || err.statusCode || 500;
  const code   = err.code   || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;

  return res.status(status).json({ error: { code, message } });
}

module.exports = errorHandler;
