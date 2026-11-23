/**
 * controllers/admin/profile.controller.js
 * Logged-in admin profile & password
 */
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');
const { BCRYPT_ROUNDS } = require('../../config/constants');

async function getAdminProfile(req, res) {
  try {
    const [rows] = await db.execute(`SELECT id, username, email, full_name, last_login, created_at FROM admins WHERE id = ?`, [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found.' });
    return res.json({ success: true, admin: rows[0] });
  } catch (err) {
    console.error('[getAdminProfile]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateAdminProfile(req, res) {
  const { full_name, email } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE admins SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ?`,
      [full_name || null, email || null, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    await logAction(req.user.id, 'ADMIN_PROFILE_UPDATED', 'admins', req.user.id, 'Admin updated profile details', req.ip);
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    console.error('[updateAdminProfile]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function changeAdminPassword(req, res) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'Valid current and new password (min 6 chars) required.' });
  }
  try {
    const [rows] = await db.execute(`SELECT password_hash FROM admins WHERE id = ?`, [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found.' });

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    // Increment token_version to invalidate old tokens
    await db.execute(`UPDATE admins SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`, [hash, req.user.id]);
    await logAction(req.user.id, 'ADMIN_PASSWORD_CHANGED', 'admins', req.user.id, 'Admin changed their password', req.ip);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[changeAdminPassword]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword
};
