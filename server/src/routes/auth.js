'use strict';

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const asyncWrapper = require('../middleware/asyncWrapper');
const { requireAuth } = require('../middleware/auth');
const authController  = require('../controllers/auth');

const router = express.Router();

// Rate limiter for sensitive auth actions (login, signup, password reset)
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
  // Skip rate limiting in development and test environments to allow smooth testing & hot-reloading
  skip: () => process.env.NODE_ENV !== 'production',
});

// Generous rate limiter for session refresh and me checks
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many refresh requests.' } },
  skip: () => process.env.NODE_ENV !== 'production',
});

router.post('/signup',          strictAuthLimiter, asyncWrapper(authController.signup));
router.post('/verify-email',    strictAuthLimiter, asyncWrapper(authController.verifyEmail));
router.post('/login',           strictAuthLimiter, asyncWrapper(authController.login));
router.post('/refresh',         sessionLimiter,    asyncWrapper(authController.refresh));
router.post('/logout',          asyncWrapper(authController.logout));
router.post('/forgot-password', strictAuthLimiter, asyncWrapper(authController.forgotPassword));
router.post('/reset-password',  strictAuthLimiter, asyncWrapper(authController.resetPassword));
router.get( '/me',              requireAuth,       asyncWrapper(authController.me));

module.exports = router;
