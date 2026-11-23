/**
 * controllers/admin/branches.controller.js
 * Branches CRUD
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');

async function getBranches(req, res) {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, l.location_name, COUNT(e.id) AS employee_count
      FROM branches b
      LEFT JOIN locations l ON b.location_id = l.id
      LEFT JOIN employees e ON e.branch_id = b.id AND e.account_status = 'ACTIVE' AND e.deleted_at IS NULL
      GROUP BY b.id
      ORDER BY b.branch_name
    `);
    return res.json({ success: true, branches: rows });
  } catch (err) {
    console.error('[getBranches]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createBranch(req, res) {
  const { branch_code, branch_name, location_id, address, description } = req.body;
  if (!branch_code || !branch_name) {
    return res.status(400).json({ success: false, message: 'Branch code and name are required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO branches (branch_code, branch_name, location_id, address, description) VALUES (?, ?, ?, ?, ?)`,
      [branch_code.trim().toUpperCase(), branch_name.trim(), location_id || null, address ? address.trim() : null, description || null]
    );
    await logAction(req.user.id, 'BRANCH_CREATED', 'branches', result.insertId, `Created branch: ${branch_name}`, req.ip);
    return res.status(201).json({ success: true, message: 'Branch created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Branch code already exists.' });
    console.error('[createBranch]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateBranch(req, res) {
  const { id } = req.params;
  const { branch_code, branch_name, location_id, address, description, is_active } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE branches SET
        branch_code = COALESCE(?, branch_code),
        branch_name = COALESCE(?, branch_name),
        location_id = COALESCE(?, location_id),
        address = COALESCE(?, address),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        branch_code ? branch_code.trim().toUpperCase() : null,
        branch_name ? branch_name.trim() : null,
        location_id !== undefined ? location_id : null,
        address !== undefined ? (address ? address.trim() : null) : null,
        description !== undefined ? description : null,
        is_active !== undefined ? is_active : null,
        id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }
    await logAction(req.user.id, 'BRANCH_UPDATED', 'branches', id, `Updated branch: ${branch_name || id}`, req.ip);
    return res.json({ success: true, message: 'Branch updated.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Branch code already exists.' });
    console.error('[updateBranch]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function bulkCreateBranches(req, res) {
  const { branches } = req.body;
  if (!Array.isArray(branches)) return res.status(400).json({ success: false, message: 'Invalid data.' });
  let added = 0;
  for (const b of branches) {
    if (!b.branch_code || !b.branch_name) continue;
    try {
      await db.execute('INSERT INTO branches (branch_code, branch_name, location_id, address, description) VALUES (?, ?, ?, ?, ?)', [
        b.branch_code.trim().toUpperCase(),
        b.branch_name.trim(),
        b.location_id || null,
        b.address ? b.address.trim() : null,
        b.description || null
      ]);
      added++;
    } catch (e) { console.error('Skip branch:', e.message); }
  }
  return res.json({ success: true, addedCount: added });
}

async function deleteBranch(req, res) {
  const { id } = req.params;
  const { permanent } = req.query;
  try {
    if (permanent === 'true') {
      // Unlink employees, candidates, and eligibility from this branch
      await db.execute(`UPDATE employees SET branch_id = NULL WHERE branch_id = ?`, [id]);
      await db.execute(`UPDATE candidates SET branch_id = NULL WHERE branch_id = ?`, [id]);
      await db.execute(`DELETE FROM election_eligibility WHERE branch_id = ?`, [id]);
      const [result] = await db.execute(`DELETE FROM branches WHERE id = ?`, [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Branch not found.' });
      }
      await logAction(req.user.id, 'BRANCH_DELETED', 'branches', id, 'Branch permanently deleted', req.ip);
      return res.json({ success: true, message: 'Branch permanently deleted.' });
    }

    const [result] = await db.execute(`UPDATE branches SET is_active = FALSE WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }
    await logAction(req.user.id, 'BRANCH_DEACTIVATED', 'branches', id, 'Branch deactivated', req.ip);
    return res.json({ success: true, message: 'Branch deactivated.' });
  } catch (err) {
    console.error('[deleteBranch]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  bulkCreateBranches
};

