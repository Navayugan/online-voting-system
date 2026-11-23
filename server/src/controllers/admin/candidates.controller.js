/**
 * controllers/admin/candidates.controller.js
 * Candidate management
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');

async function getCandidates(req, res) {
  const { election_id } = req.query;
  let where = '1=1';
  const params = [];
  if (election_id) { where += ` AND c.election_id = ?`; params.push(election_id); }

  try {
    const [rows] = await db.execute(
      `SELECT c.*, el.title AS election_title, d.department_name, b.branch_name
       FROM candidates c
       LEFT JOIN elections el ON c.election_id = el.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE ${where}
       ORDER BY c.election_id, c.employee_name`,
      params
    );
    return res.json({ success: true, candidates: rows });
  } catch (err) {
    console.error('[getCandidates]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createCandidate(req, res) {
  const { election_id, employee_id, employee_name, department_id, branch_id, location_id, description } = req.body;
  if (!election_id || !employee_id) {
    return res.status(400).json({ success: false, message: 'Election and employee ID are required.' });
  }

  try {
    // 1. Verify election exists
    const [elections] = await db.execute(`SELECT id, status FROM elections WHERE id = ?`, [election_id]);
    if (elections.length === 0) {
      return res.status(404).json({ success: false, message: 'Election not found.' });
    }
    // Integrity check: Candidates cannot be added to a closed or cancelled election
    if (elections[0].status === 'CLOSED' || elections[0].status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot add candidates to a closed or cancelled election.' });
    }

    // Integrity check: Candidates cannot be added once voting has commenced
    const [ballotsTable] = await db.execute("SHOW TABLES LIKE 'ballots'");
    if (ballotsTable.length > 0) {
      const [[{ voteCount }]] = await db.execute(
        `SELECT (
          (SELECT COUNT(*) FROM voter_roll WHERE election_id = ?) +
          (SELECT COUNT(*) FROM ballots WHERE election_id = ?)
        ) AS voteCount`,
        [election_id, election_id]
      );
      if (Number(voteCount) > 0) {
        return res.status(400).json({ success: false, message: 'Cannot add candidates to an election once voting has started.' });
      }
    }

    // 2. Verify employee exists and is active
    const [employees] = await db.execute(
      `SELECT id, employee_id, employee_name, department_id, branch_id, location_id, account_status
       FROM employees WHERE employee_id = ?`,
      [employee_id.trim()]
    );
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    const emp = employees[0];
    if (emp.account_status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Employee is not active.' });
    }

    const candName = (employee_name && employee_name.trim()) || emp.employee_name;
    const candDept = department_id || emp.department_id;
    const candBranch = branch_id || emp.branch_id;
    const candLocation = location_id || emp.location_id;

    const [result] = await db.execute(
      `INSERT INTO candidates (election_id, employee_id, employee_name, department_id, branch_id, location_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [election_id, emp.employee_id, candName, candDept || null, candBranch || null, candLocation || null, description || null]
    );

    await logAction(req.user.id, 'CANDIDATE_CREATED', 'candidates', result.insertId, `Added candidate: ${candName} to election ${election_id}`, req.ip);
    return res.status(201).json({ success: true, message: 'Candidate added.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'This employee is already a candidate in this election.' });
    console.error('[createCandidate]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateCandidate(req, res) {
  const { id } = req.params;
  const { employee_name, department_id, branch_id, description } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE candidates SET
        employee_name = COALESCE(?, employee_name),
        department_id = COALESCE(?, department_id),
        branch_id = COALESCE(?, branch_id),
        description = COALESCE(?, description)
       WHERE id = ?`,
      [
        employee_name ? employee_name.trim() : null,
        department_id !== undefined ? department_id : null,
        branch_id !== undefined ? branch_id : null,
        description !== undefined ? description : null,
        id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    await logAction(req.user.id, 'CANDIDATE_UPDATED', 'candidates', id, `Updated candidate ID ${id}`, req.ip);
    return res.json({ success: true, message: 'Candidate updated.' });
  } catch (err) {
    console.error('[updateCandidate]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function deleteCandidate(req, res) {
  const { id } = req.params;
  try {
    const [result] = await db.execute(`DELETE FROM candidates WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    await logAction(req.user.id, 'CANDIDATE_DELETED', 'candidates', id, `Deleted candidate ID ${id}`, req.ip);
    return res.json({ success: true, message: 'Candidate removed.' });
  } catch (err) {
    console.error('[deleteCandidate]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function bulkCreateCandidates(req, res) {
  const { candidates } = req.body;
  if (!Array.isArray(candidates)) return res.status(400).json({ success: false, message: 'Invalid data.' });
  let added = 0;
  for (const c of candidates) {
    if (!c.election_id || !c.employee_id) continue;
    try {
      await db.execute(
        'INSERT INTO candidates (election_id, employee_id, employee_name, description) VALUES (?, ?, ?, ?)',
        [c.election_id, c.employee_id.trim(), c.employee_name || c.employee_id, c.description || null]
      );
      added++;
    } catch (e) {
      console.error('Skip candidate:', e.message);
    }
  }
  return res.json({ success: true, addedCount: added });
}

module.exports = {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  bulkCreateCandidates
};
