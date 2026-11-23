/**
 * controllers/admin/audit.controller.js
 * Audit log viewer
 */
const db = require('../../config/db');

async function getAuditLogs(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const [rows] = await db.execute(
      `SELECT al.*, a.username FROM audit_logs al LEFT JOIN admins a ON al.admin_id = a.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM audit_logs`);
    return res.json({ success: true, logs: rows, total });
  } catch (err) {
    console.error('[getAuditLogs]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getAuditLogs
};
