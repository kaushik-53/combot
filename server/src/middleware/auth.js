'use strict';

const jwt = require('jsonwebtoken');

/**
 * requireAuth — verifies the access JWT from the Authorization header.
 * Attaches the decoded payload to req.user.
 *
 * Access tokens are short-lived (15m) and kept in memory on the client,
 * so we validate on every request rather than maintaining a server-side
 * session or allowlist.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Access token required' },
    });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, email, role, iat, exp }
    next();
  } catch (err) {
    // Let the central error handler format the JWT error consistently
    next(err);
  }
}

/**
 * requireAdmin — must be used AFTER requireAuth (or as a standalone that
 * calls requireAuth internally). Authorization lives server-side; hiding
 * a button in React is not access control.
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
