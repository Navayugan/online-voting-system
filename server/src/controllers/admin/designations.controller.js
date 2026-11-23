/**
 * controllers/admin/designations.controller.js
 * Designations management
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');

async function getDesignations(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT des.*, d.department_name FROM designations des LEFT JOIN departments d ON des.department_id = d.id WHERE des.is_active = TRUE ORDER BY des.designation_name`
    );
    return res.json({ success: true, designations: rows });
  } catch (err) {
    console.error('[getDesignations]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createDesignation(req, res) {
  const { designation_name, department_id, designation_code } = req.body;
  if (!designation_name || !designation_name.trim()) {
    return res.status(400).json({ success: false, message: 'Designation name is required.' });
  }

  const name = designation_name.trim();

  try {
    // Check if designation with the same name already exists
    const [existing] = await db.execute(
      `SELECT id, designation_code, designation_name, department_id FROM designations WHERE LOWER(designation_name) = LOWER(?) LIMIT 1`,
      [name]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Designation already exists.',
        designation: existing[0],
        id: existing[0].id
      });
    }

    // Generate unique code if not supplied
    let code = designation_code ? designation_code.trim().toUpperCase() : null;
    if (!code) {
      const slug = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() || 'DES';
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `${slug}_${rand}`;
    }

    const [result] = await db.execute(
      `INSERT INTO designations (designation_code, designation_name, department_id, is_active) VALUES (?, ?, ?, TRUE)`,
      [code, name, department_id || null]
    );

    const newDes = {
      id: result.insertId,
      designation_code: code,
      designation_name: name,
      department_id: department_id || null
    };

    if (req.user && req.user.id) {
      await logAction(req.user.id, 'DESIGNATION_CREATED', 'designations', result.insertId, `Created designation: ${name}`, req.ip);
    }

    return res.status(201).json({
      success: true,
      message: 'Designation created successfully.',
      designation: newDes,
      id: result.insertId
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Designation code already exists.' });
    }
    console.error('[createDesignation]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getDesignations,
  createDesignation
};
