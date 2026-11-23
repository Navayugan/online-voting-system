/**
 * utils/asyncHandler.js
 * Wraps async route handlers to pass rejections to central error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
