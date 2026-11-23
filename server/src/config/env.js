/**
 * config/env.js
 * Loads server/.env exactly once. Validates all required environment variables.
 * Require this FIRST in any entry point.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const requiredEnv = [
  { key: 'DB_HOST', name: 'Database Host' },
  { key: 'DB_USER', name: 'Database User' },
  { key: 'DB_PASSWORD', name: 'Database Password' },
  { key: 'JWT_SECRET', name: 'JWT Secret' },
  { key: 'FRONTEND_URL', name: 'Frontend URL' }
];

const missing = [];

for (const envVar of requiredEnv) {
  if (!process.env[envVar.key] || process.env[envVar.key].trim() === '') {
    missing.push(`${envVar.key} (${envVar.name}) is missing`);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  missing.push(`JWT_SECRET must be at least 32 characters long (current length: ${process.env.JWT_SECRET.length})`);
}

if (missing.length > 0) {
  console.error('\n❌ Environment Configuration Error:');
  missing.forEach(msg => console.error(`   - ${msg}`));
  console.error('\nPlease check your server/.env file or environment variables against server/.env.example.\n');
  process.exit(1);
}

module.exports = {
  isConfigured: true
};
