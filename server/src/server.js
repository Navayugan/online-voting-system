/**
 * server.js - process entry point
 */
require('./config/env');
const app = require('./app');

const PORT = parseInt(process.env.PORT || '8000', 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 OVMS Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
