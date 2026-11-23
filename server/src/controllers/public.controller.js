/**
 * controllers/public.controller.js
 * Unauthenticated endpoints used for branding on the login/landing pages.
 */
const db = require('../config/db');

async function getOrganization(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT org_name, org_code, gstn_number, org_type, logo_url, primary_color, secondary_color, website, is_setup_complete FROM organizations LIMIT 1`
    );
    return res.json({ success: true, organization: rows[0] || null });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getBranches(req, res) {
  try {
    const [rows] = await db.execute(`SELECT id, branch_name, branch_code FROM branches WHERE is_active = TRUE ORDER BY branch_name`);
    return res.json({ success: true, branches: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { getOrganization, getBranches };
