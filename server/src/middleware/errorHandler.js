/**
 * middleware/errorHandler.js
 * Central error handling middleware.
 * Ensures all errors are returned as JSON { success: false, message, code? }
 * Maps DB and validation errors to appropriate HTTP status codes.
 * Never leaks stack traces in production.
 */
function errorHandler(err, req, res, _next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return _next(err);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      code: 'VALIDATION_ERROR',
      errors: err.errors ? err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : []
    });
  }

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record already exists.',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist.',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    return res.status(400).json({
      success: false,
      message: 'Data exceeds maximum allowed length.',
      code: 'DATA_TOO_LONG'
    });
  }

  if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.code === 'ER_WRONG_VALUE') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format provided.',
      code: 'INVALID_VALUE'
    });
  }

  // Custom status error
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600
    ? err.status
    : 500;

  if (status === 500) {
    console.error('[UNHANDLED_SERVER_ERROR]', req.method, req.originalUrl, err);
  }

  const message = status === 500
    ? 'Internal server error.'
    : (err.message || 'An error occurred.');

  res.status(status).json({
    success: false,
    message,
    ...(err.code ? { code: err.code } : {})
  });
}

module.exports = errorHandler;
