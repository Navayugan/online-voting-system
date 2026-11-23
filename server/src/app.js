/**
 * app.js - builds the Express application
 */
require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
require('./config/db'); // connect to DB on startup

const app = express();

// Trust proxy configurable via environment variable
const trustProxy = process.env.TRUST_PROXY || 1;
app.set('trust proxy', trustProxy);

// Disable x-powered-by header
app.disable('x-powered-by');

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:'],
      imgSrc: ["'self'", 'data:' ],
      connectSrc: ["'self'", 'http://127.0.0.1:8000'],
    },
  },
}));

// CORS configuration supporting comma-separated FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Apply general rate limiting across all /api routes
app.use('/api', generalLimiter);

// Mount main routes
app.use('/api', routes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
