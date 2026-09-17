'use strict';

/**
 * Wraps an async route handler so errors propagate to Express's next()
 * without a try/catch in every controller.
 */
const asyncWrapper = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncWrapper;
