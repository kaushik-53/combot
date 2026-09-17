'use strict';

const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { hashToken, generateToken, signAccessToken } = require('./token');

// Refresh token TTL (7 days in ms) — mirrors the cookie max-age
const REFRESH_TTL_MS      = parseInt(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_MS, 10) || 7 * 24 * 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours
const RESET_TOKEN_TTL_MS  = 10 * 60 * 1000;        // 10 minutes

/**
 * Issue a new access + refresh token pair for a user.
 * Stores the hashed refresh token and the family UUID in the DB.
 * Returns { accessToken, refreshTokenRaw }.
 */
async function issueTokenPair(user, family = uuidv4()) {
  const accessToken = signAccessToken({
    sub:   user._id.toString(),
    email: user.email,
    role:  user.role,
  });

  const { raw: randomRaw } = generateToken(32);
  const refreshTokenRaw  = `${user._id}.${family}.${randomRaw}`;
  const refreshTokenHash = hashToken(refreshTokenRaw);

  // Overwrite stored hash — old token is immediately invalid after rotation
  await User.updateOne(
    { _id: user._id },
    { refreshTokenHash, refreshTokenFamily: family }
  );

  return { accessToken, refreshTokenRaw };
}

// ─── Signup ──────────────────────────────────────────────────────────────────

async function signup({ name, email, password }) {
  // Check for existing email before hashing (cheap short-circuit)
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    err.code   = 'EMAIL_EXISTS';
    throw err;
  }

  const passwordHash = await User.hashPassword(password);
  const { raw: verifyRaw, hashed: verifyTokenHash } = generateToken(32);
  const verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  const user = await User.create({
    name, email, passwordHash,
    verifyTokenHash, verifyTokenExpires,
  });

  // Link exposed in dev only — no SMTP required per the brief
  const verifyLink = `/api/auth/verify-email?token=${verifyRaw}`;
  console.log('[AUTH] verify link:', verifyLink);

  return {
    user,
    // Only returned outside production so reviewers can test without email infra
    ...(process.env.NODE_ENV !== 'production' && { verifyLink }),
  };
}

// ─── Verify email ─────────────────────────────────────────────────────────────

async function verifyEmail({ token }) {
  const hashed = hashToken(token);
  const user   = await User.findOne({
    verifyTokenHash:    hashed,
    verifyTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    const err = new Error('Verification token is invalid or has expired');
    err.status = 400;
    err.code   = 'INVALID_TOKEN';
    throw err;
  }

  // Clear the token fields so it cannot be replayed
  await User.updateOne(
    { _id: user._id },
    {
      isVerified:         true,
      $unset: { verifyTokenHash: '', verifyTokenExpires: '' },
    }
  );

  return { message: 'Email verified successfully' };
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function login({ email, password }, res) {
  // Explicitly select passwordHash since it's excluded by default
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code   = 'INVALID_CREDENTIALS';
    throw err;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code   = 'INVALID_CREDENTIALS';
    throw err;
  }

  const { accessToken, refreshTokenRaw } = await issueTokenPair(user);

  // Set refresh cookie scoped to the refresh endpoint only so it isn't sent
  // on every API request — minimises the exposure window
  setRefreshCookie(res, refreshTokenRaw);

  return { accessToken, user };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

async function refresh(req, res) {
  const raw = req.cookies?.refreshToken;
  if (!raw) {
    const err = new Error('Refresh token not found');
    err.status = 401;
    err.code   = 'UNAUTHENTICATED';
    throw err;
  }

  const hashed = hashToken(raw);

  // Select the hidden fields we need to validate
  const user = await User.findOne({ refreshTokenHash: hashed }).select(
    '+refreshTokenHash +refreshTokenFamily'
  );

  if (!user) {
    // Reuse detection — check if raw token has user ID and family embedded
    const parts = raw.split('.');
    if (parts.length === 3) {
      const [userId, family] = parts;
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const victim = await User.findById(userId).select('+refreshTokenFamily +refreshTokenHash');
        if (victim && victim.refreshTokenFamily === family) {
          // Stolen/replayed token from active family! Revoke all tokens for this family.
          await User.updateOne(
            { _id: victim._id },
            { $unset: { refreshTokenHash: '', refreshTokenFamily: '' } }
          );
        }
      }
    }

    clearRefreshCookie(res);
    const err = new Error('Refresh token is invalid or has already been used');
    err.status = 401;
    err.code   = 'TOKEN_REUSE';
    throw err;
  }

  // Token matched — issue a new pair under the same family UUID
  const family = user.refreshTokenFamily;
  const { accessToken, refreshTokenRaw: newRaw } = await issueTokenPair(user, family);

  setRefreshCookie(res, newRaw);

  return { accessToken, user };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout(req, res) {
  const raw = req.cookies?.refreshToken;
  if (raw) {
    const hashed = hashToken(raw);
    // Null the stored hash; don't error if it's already gone (idempotent logout)
    await User.updateOne(
      { refreshTokenHash: hashed },
      { $unset: { refreshTokenHash: '', refreshTokenFamily: '' } }
    );
  }
  clearRefreshCookie(res);
  return { message: 'Logged out successfully' };
}

// ─── Forgot password ──────────────────────────────────────────────────────────

async function forgotPassword({ email }) {
  const user = await User.findOne({ email });

  // Always return a generic message — never confirm whether an email is registered
  const generic = { message: 'If that email is registered you will receive a reset link' };

  if (!user) return generic;

  const { raw: resetRaw, hashed: resetTokenHash } = generateToken(32);
  const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await User.updateOne({ _id: user._id }, { resetTokenHash, resetTokenExpires });

  const resetLink = `/reset-password?token=${resetRaw}`;
  console.log('[AUTH] reset link:', resetLink);

  return {
    ...generic,
    ...(process.env.NODE_ENV !== 'production' && { resetLink }),
  };
}

// ─── Reset password ───────────────────────────────────────────────────────────

async function resetPassword({ token, password }) {
  const hashed = hashToken(token);
  const user   = await User.findOne({
    resetTokenHash:    hashed,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    const err = new Error('Reset token is invalid or has expired');
    err.status = 400;
    err.code   = 'INVALID_TOKEN';
    throw err;
  }

  const passwordHash = await User.hashPassword(password);

  // Clear reset token and invalidate any active sessions (force re-login)
  await User.updateOne(
    { _id: user._id },
    {
      passwordHash,
      $unset: {
        resetTokenHash:     '',
        resetTokenExpires:  '',
        refreshTokenHash:   '',
        refreshTokenFamily: '',
      },
    }
  );

  return { message: 'Password reset successfully. Please log in.' };
}

// ─── Me ───────────────────────────────────────────────────────────────────────

async function me(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code   = 'NOT_FOUND';
    throw err;
  }
  return { user };
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   isProd,
    // 'strict' is appropriate when client and server share the same origin.
    // Switch to 'none' + secure:true if deploying client on a separate domain.
    sameSite: 'strict',
    // Scoped to the refresh endpoint so the browser doesn't send it on every request
    path:     '/api/auth/refresh',
    maxAge:   REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
}

module.exports = { signup, verifyEmail, login, refresh, logout, forgotPassword, resetPassword, me };
