'use strict';

const authService = require('../services/auth');

// Controllers are thin: validate shape → call service → send response.
// All async errors propagate via asyncWrapper → errorHandler.

async function signup(req, res) {
  const { name, email, password } = req.body;
  const result = await authService.signup({ name, email, password });
  // 201 Created; include verifyLink in dev so reviewers can test without email infra
  res.status(201).json(result);
}

async function verifyEmail(req, res) {
  const { token } = req.query;
  const result = await authService.verifyEmail({ token });
  res.json(result);
}

async function login(req, res) {
  const { email, password } = req.body;
  // Pass res so the service can set the refresh cookie
  const { accessToken, user } = await authService.login({ email, password }, res);
  res.json({ accessToken, user });
}

async function refresh(req, res) {
  const { accessToken, user } = await authService.refresh(req, res);
  res.json({ accessToken, user });
}

async function logout(req, res) {
  const result = await authService.logout(req, res);
  res.json(result);
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const result = await authService.forgotPassword({ email });
  res.json(result);
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const result = await authService.resetPassword({ token, password });
  res.json(result);
}

async function me(req, res) {
  // req.user.sub is set by requireAuth middleware
  const result = await authService.me(req.user.sub);
  res.json(result);
}

module.exports = { signup, verifyEmail, login, refresh, logout, forgotPassword, resetPassword, me };
