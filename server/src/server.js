/**
 * server.js - process entry point
 */
require('./config/env');
const app = require('./app');

const PORT = parseInt(process.env.PORT || '8000', 10);

app.listen(PORT, () => {
  console.log(`🚀 OVMS Server running on http://localhost:${PORT}`);
});
