/**
 * controllers/admin/elections.controller.js
 * Election management
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');
const { getEffectiveStatus, isValidTransition } = require('../../services/electionState');

async function getElections(req, res) {
  let { status, page = 1, limit = 20 } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let where = '1=1';
  const params = [];
  if (status) { where += ` AND e.status = ?`; params.push(status); }

  try {
    const [ballotsTable] = await db.execute("SHOW TABLES LIKE 'ballots'");
    const hasBallots = ballotsTable.length > 0;
    const votesSubquery = hasBallots
      ? `(SELECT COUNT(*) FROM ballots b WHERE b.election_id = e.id)`
      : `(SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id)`;

    const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM elections e WHERE ${where}`, params);
    const [rows] = await db.execute(
      `SELECT e.*,
              ${votesSubquery} AS total_votes,
              (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.id) AS candidate_count
       FROM elections e
       WHERE ${where}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );

    // Derive effective status on read (e.g. past end_date is reported as CLOSED, not ACTIVE)
    const formatted = rows.map(e => ({
      ...e,
      status: getEffectiveStatus(e),
      raw_status: e.status
    }));

    return res.json({ success: true, elections: formatted, total, page: p, limit: l });
  } catch (err) {
    console.error('[getElections]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * GET /api/admin/elections/options
 * Returns lightweight unpaginated list of elections (for dropdowns/filters)
 */
async function getElectionOptions(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, status, start_date, end_date
       FROM elections
       ORDER BY created_at DESC
       LIMIT 500`
    );
    const elections = rows.map(e => ({
      ...e,
      status: getEffectiveStatus(e)
    }));
    return res.json({ success: true, elections });
  } catch (err) {
    console.error('[getElectionOptions]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getElection(req, res) {
  const { id } = req.params;
  try {
    const [ballotsTable] = await db.execute("SHOW TABLES LIKE 'ballots'");
    const hasBallots = ballotsTable.length > 0;
    const votesSubquery = hasBallots
      ? `(SELECT COUNT(*) FROM ballots b WHERE b.election_id = e.id)`
      : `(SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id)`;

    const [rows] = await db.execute(
      `SELECT e.*,
              ${votesSubquery} AS total_votes,
              (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.id) AS candidate_count
       FROM elections e WHERE e.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Election not found.' });

    const [eligibility] = await db.execute(
      `SELECT ee.*, d.department_name, b.branch_name, l.location_name
       FROM election_eligibility ee
       LEFT JOIN departments d ON ee.department_id = d.id
       LEFT JOIN branches b ON ee.branch_id = b.id
       LEFT JOIN locations l ON ee.location_id = l.id
       WHERE ee.election_id = ?`,
      [id]
    );

    const election = {
      ...rows[0],
      status: getEffectiveStatus(rows[0]),
      raw_status: rows[0].status
    };

    return res.json({ success: true, election, eligibility });
  } catch (err) {
    console.error('[getElection]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createElection(req, res) {
  const { title, description, election_type, start_date, end_date, status, department_id, branch_id, location_id } = req.body;
  if (!title || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Title, start date, and end date are required.' });
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return res.status(400).json({ success: false, message: 'End date must be after start date.' });
  }
  const validStatuses = ['DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO elections (title, description, election_type, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, election_type || null, start_date, end_date, status || 'DRAFT', req.user.id]
    );
    const eid = result.insertId;

    if (department_id || branch_id || location_id) {
      await db.execute(
        `INSERT INTO election_eligibility (election_id, department_id, branch_id, location_id) VALUES (?, ?, ?, ?)`,
        [eid, department_id || null, branch_id || null, location_id || null]
      );
    }

    await logAction(req.user.id, 'ELECTION_CREATED', 'elections', eid, `Created election: ${title}`, req.ip);
    return res.status(201).json({ success: true, message: 'Election created.', id: eid });
  } catch (err) {
    console.error('[createElection]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateElection(req, res) {
  const { id } = req.params;
  const { title, description, election_type, start_date, end_date, status, department_id, branch_id, location_id } = req.body;

  try {
    const [existing] = await db.execute(`SELECT * FROM elections WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Election not found.' });

    const newStart = start_date || existing[0].start_date;
    const newEnd = end_date || existing[0].end_date;
    if (new Date(newEnd) <= new Date(newStart)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }

    // If election is currently ACTIVE, locked fields cannot be modified
    if (existing[0].status === 'ACTIVE') {
      if (department_id !== undefined || branch_id !== undefined || location_id !== undefined) {
        return res.status(409).json({ success: false, message: 'Eligibility cannot be changed while election is active.' });
      }
    }

    await db.execute(
      `UPDATE elections SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        election_type = COALESCE(?, election_type),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        description !== undefined ? description : null,
        election_type !== undefined ? election_type : null,
        start_date || null,
        end_date || null,
        status || null,
        id
      ]
    );

    if (department_id !== undefined || branch_id !== undefined || location_id !== undefined) {
      await db.execute(`DELETE FROM election_eligibility WHERE election_id = ?`, [id]);
      if (department_id || branch_id || location_id) {
        await db.execute(
          `INSERT INTO election_eligibility (election_id, department_id, branch_id, location_id) VALUES (?, ?, ?, ?)`,
          [id, department_id || null, branch_id || null, location_id || null]
        );
      }
    }

    await logAction(req.user.id, 'ELECTION_UPDATED', 'elections', id, `Updated election: ${title || id}`, req.ip);
    return res.json({ success: true, message: 'Election updated.' });
  } catch (err) {
    console.error('[updateElection]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateElectionStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['DRAFT','UPCOMING','ACTIVE','CLOSED','CANCELLED'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

  try {
    const [existing] = await db.execute(`SELECT * FROM elections WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Election not found.' });

    const el = existing[0];
    if (!isValidTransition(el.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${el.status} to ${status}.`
      });
    }

    // Activation checks
    if (status === 'ACTIVE') {
      const [[{ candCount }]] = await db.execute(`SELECT COUNT(*) AS candCount FROM candidates WHERE election_id = ?`, [id]);
      if (candCount === 0) {
        return res.status(400).json({ success: false, message: 'Cannot activate an election with zero candidates.' });
      }
    }

    await db.execute(`UPDATE elections SET status = ? WHERE id = ?`, [status, id]);
    await logAction(req.user.id, 'ELECTION_STATUS_CHANGED', 'elections', id, `Election status changed to ${status}`, req.ip);
    return res.json({ success: true, message: `Election status updated to ${status}.` });
  } catch (err) {
    console.error('[updateElectionStatus]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function cancelElection(req, res) {
  const { id } = req.params;
  try {
    const [existing] = await db.execute(`SELECT * FROM elections WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Election not found.' });
    
    if (existing[0].status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already closed election.' });
    }

    await db.execute(`UPDATE elections SET status = 'CANCELLED' WHERE id = ?`, [id]);
    await logAction(req.user.id, 'ELECTION_CANCELLED', 'elections', id, `Cancelled election ID ${id}`, req.ip);
    return res.json({ success: true, message: 'Election cancelled.' });
  } catch (err) {
    console.error('[cancelElection]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function deleteElection(req, res) {
  const { id } = req.params;
  try {
    const [existing] = await db.execute(`SELECT * FROM elections WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Election not found.' });

    if (existing[0].status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only DRAFT elections can be deleted.' });
    }

    await db.execute(`DELETE FROM elections WHERE id = ?`, [id]);
    await logAction(req.user.id, 'ELECTION_DELETED', 'elections', id, `Deleted draft election ID ${id}`, req.ip);
    return res.json({ success: true, message: 'Election deleted.' });
  } catch (err) {
    console.error('[deleteElection]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getElections,
  getElectionOptions,
  getElection,
  createElection,
  updateElection,
  updateElectionStatus,
  cancelElection,
  deleteElection
};
