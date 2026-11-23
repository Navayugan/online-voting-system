/**
 * config/db.js
 * ---------------------------------------------------------
 * Creates and exports a mysql2 connection pool.
 * All database queries throughout the application use
 * this shared pool instead of creating individual connections.
 * ---------------------------------------------------------
 */

require('./env');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host               : process.env.DB_HOST     || 'localhost',
  port               : parseInt(process.env.DB_PORT || '3306', 10),
  user               : process.env.DB_USER     || 'root',
  password           : process.env.DB_PASSWORD || '',
  database           : process.env.DB_NAME     || 'employee_voting_system',
  waitForConnections : true,
  connectionLimit    : 10,
  queueLimit         : 0,
  charset            : 'utf8mb4',
  dateStrings        : true,
  timezone           : '+00:00',
});

// Verify connection on startup and ensure token_version columns exist
pool.getConnection()
  .then(async conn => {
    console.log(`✅ MySQL connected — host: ${process.env.DB_HOST}, db: ${process.env.DB_NAME}`);
    try {
      const [adminCols] = await conn.execute("SHOW COLUMNS FROM admins LIKE 'token_version'");
      if (adminCols.length === 0) {
        await conn.execute("ALTER TABLE admins ADD COLUMN token_version INT NOT NULL DEFAULT 1");
      }
      const [empCols] = await conn.execute("SHOW COLUMNS FROM employees LIKE 'token_version'");
      if (empCols.length === 0) {
        await conn.execute("ALTER TABLE employees ADD COLUMN token_version INT NOT NULL DEFAULT 1");
      }
      const [locCols] = await conn.execute("SHOW COLUMNS FROM locations LIKE 'district'");
      if (locCols.length === 0) {
        await conn.execute("ALTER TABLE locations ADD COLUMN district VARCHAR(100) NULL AFTER location_name");
      }
      const [branchCols] = await conn.execute("SHOW COLUMNS FROM branches LIKE 'address'");
      if (branchCols.length === 0) {
        await conn.execute("ALTER TABLE branches ADD COLUMN address TEXT NULL AFTER location_id");
      }
      const [delCols] = await conn.execute("SHOW COLUMNS FROM employees LIKE 'deleted_at'");
      if (delCols.length === 0) {
        await conn.execute("ALTER TABLE employees ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL");
      }
    } catch (e) {
      console.warn('⚠️ Auto-migration check:', e.message);
    } finally {
      conn.release();
    }
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
