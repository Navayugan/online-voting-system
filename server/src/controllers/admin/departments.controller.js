/**
 * controllers/admin/departments.controller.js
 * Departments CRUD
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');

async function getDepartments(req, res) {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.account_status = 'ACTIVE' AND e.deleted_at IS NULL
      GROUP BY d.id
      ORDER BY d.department_name
    `);
    return res.json({ success: true, departments: rows });
  } catch (err) {
    console.error('[getDepartments]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createDepartment(req, res) {
  const { department_code, department_name, description } = req.body;
  if (!department_code || !department_name) {
    return res.status(400).json({ success: false, message: 'Department code and name are required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO departments (department_code, department_name, description) VALUES (?, ?, ?)`,
      [department_code.trim().toUpperCase(), department_name.trim(), description || null]
    );
    await logAction(req.user.id, 'DEPARTMENT_CREATED', 'departments', result.insertId, `Created department: ${department_name}`, req.ip);
    return res.status(201).json({ success: true, message: 'Department created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Department code already exists.' });
    console.error('[createDepartment]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateDepartment(req, res) {
  const { id } = req.params;
  const { department_code, department_name, description, is_active } = req.body;
  try {
    // Notice: is_active is only changed when explicitly provided (do not default to true)
    const [result] = await db.execute(
      `UPDATE departments SET
        department_code = COALESCE(?, department_code),
        department_name = COALESCE(?, department_name),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        department_code ? department_code.trim().toUpperCase() : null,
        department_name ? department_name.trim() : null,
        description !== undefined ? description : null,
        is_active !== undefined ? is_active : null,
        id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    await logAction(req.user.id, 'DEPARTMENT_UPDATED', 'departments', id, `Updated department: ${department_name || id}`, req.ip);
    return res.json({ success: true, message: 'Department updated.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Department code already exists.' });
    console.error('[updateDepartment]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function deleteDepartment(req, res) {
  const { id } = req.params;
  const { permanent } = req.query;
  try {
    if (permanent === 'true') {
      // Unlink employees from this department so deletion succeeds cleanly
      await db.execute(`UPDATE employees SET department_id = NULL WHERE department_id = ?`, [id]);
      await db.execute(`UPDATE candidates SET department_id = NULL WHERE department_id = ?`, [id]);
      await db.execute(`UPDATE designations SET department_id = NULL WHERE department_id = ?`, [id]);
      await db.execute(`DELETE FROM election_eligibility WHERE department_id = ?`, [id]);
      const [result] = await db.execute(`DELETE FROM departments WHERE id = ?`, [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Department not found.' });
      }
      await logAction(req.user.id, 'DEPARTMENT_DELETED', 'departments', id, 'Department permanently deleted', req.ip);
      return res.json({ success: true, message: 'Department permanently deleted.' });
    }

    const [result] = await db.execute(`UPDATE departments SET is_active = FALSE WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    await logAction(req.user.id, 'DEPARTMENT_DEACTIVATED', 'departments', id, 'Department deactivated', req.ip);
    return res.json({ success: true, message: 'Department deactivated.' });
  } catch (err) {
    console.error('[deleteDepartment]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function bulkCreateDepartments(req, res) {
  const { departments } = req.body;
  if (!Array.isArray(departments)) return res.status(400).json({ success: false, message: 'Invalid data.' });
  let added = 0;
  for (const d of departments) {
    if (!d.department_code || !d.department_name) continue;
    try {
      await db.execute('INSERT INTO departments (department_code, department_name, description) VALUES (?, ?, ?)', [d.department_code.trim().toUpperCase(), d.department_name.trim(), d.description || null]);
      added++;
    } catch (e) { console.error('Skip dept:', e.message); }
  }
  return res.json({ success: true, addedCount: added });
}

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  bulkCreateDepartments
};
