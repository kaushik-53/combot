'use strict';

const crypto = require('crypto');
const jwt    = require('jsonwebtoken');

/**
 * Hash a raw token before storing it in the database.
 * Rationale: a stolen database must not yield working links or sessions.
 * SHA-256 is appropriate here because the input is a 32-byte random value —
 * brute-forcing a random token is infeasible regardless of hash speed.
 * (bcrypt is reserved for passwords, which have low entropy.)
 */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Generate a cryptographically random URL-safe token.
 * Returns { raw, hashed } — store hashed, send raw.
 */
function generateToken(byteLength = 32) {
  const raw    = crypto.randomBytes(byteLength).toString('hex');
  const hashed = hashToken(raw);
  return { raw, hashed };
}

/**
 * Sign a short-lived access JWT (15 minutes).
 * Access tokens are validated on every request; they are never stored
 * server-side, so revocation happens naturally at expiry.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

/**
 * Verify an access JWT. Throws on invalid or expired token —
 * caller (requireAuth middleware) catches and forwards to errorHandler.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { hashToken, generateToken, signAccessToken, verifyAccessToken };
