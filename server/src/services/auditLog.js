/**
 * services/auditLog.js
 * Writes actions to the audit_logs table. Never throws.
 */
const db = require('../config/db');

async function logAction(adminId, action, entityType, entityId, description, ip, connection = null) {
  try {
    const executor = connection || db;
    await executor.execute(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId || null, action, entityType || null, entityId || null, description || null, ip || null]
    );
  } catch (e) {
    console.error('[auditLog error]', e.message);
  }
}

module.exports = { logAction };
