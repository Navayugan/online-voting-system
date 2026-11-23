const rateLimit = require('express-rate-limit');

// General API rate limiter: 300 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Auth endpoint rate limiter: 5 attempts per 5 seconds per IP + username
const authLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const username = (req.body && (req.body.username || req.body.employeeId)) || '';
    return `${ip}_${username}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
