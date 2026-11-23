/**
 * controllers/employeeController.js
 * Employee-only operations: profile, elections, voting
 */
const crypto = require('crypto');
const db = require('../config/db');
const { checkEligibility } = require('../services/eligibility');
const { logAction } = require('../services/auditLog');

/**
 * GET /api/employee/profile
 */
async function getProfile(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.employee_id, e.employee_name, e.gender, e.official_email, e.phone_number,
              e.employee_type, e.joining_date, e.account_status,
              d.department_name, b.branch_name, l.location_name, des.designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE e.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    return res.json({ success: true, employee: rows[0] });
  } catch (err) {
    console.error('[getProfile]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * GET /api/employee/elections
 * Returns elections where this employee is eligible
 * Query param: scope = 'active' | 'upcoming' | 'closed' | 'all' (defaults to 'all' or active if not specified)
 */
async function getEligibleElections(req, res) {
  const emp = req.user;
  const { scope } = req.query;
  try {
    // Check if voter_roll table exists
    const [rollTable] = await db.execute("SHOW TABLES LIKE 'voter_roll'");
    const hasVoterRoll = rollTable.length > 0;

    const hasVotedSubquery = hasVoterRoll
      ? `(SELECT COUNT(*) FROM voter_roll vr WHERE vr.election_id = el.id AND vr.employee_id = ?)`
      : `(SELECT COUNT(*) FROM votes v WHERE v.election_id = el.id AND v.employee_id = ?)`;

    // Only non-draft non-cancelled elections are eligible for employees
    const [elections] = await db.execute(
      `SELECT el.*,
        ${hasVotedSubquery} AS has_voted,
        (SELECT COUNT(*) FROM candidates c WHERE c.election_id = el.id) AS candidate_count
       FROM elections el
       WHERE el.status NOT IN ('DRAFT', 'CANCELLED')
       ORDER BY el.start_date DESC`,
      [emp.id]
    );

    const { getEffectiveStatus } = require('../services/electionState');

    // Filter using single source of truth eligibility check and scope
    const eligibleElections = [];
    for (const rawEl of elections) {
      const el = {
        ...rawEl,
        status: getEffectiveStatus(rawEl)
      };

      if (scope) {
        const s = scope.toLowerCase();
        if (s === 'active' && el.status !== 'ACTIVE') continue;
        if (s === 'upcoming' && el.status !== 'UPCOMING') continue;
        if (s === 'closed' && el.status !== 'CLOSED') continue;
      }

      const { eligible } = await checkEligibility(emp.id, el.id);
      if (eligible) {
        eligibleElections.push(el);
      }
    }

    return res.json({ success: true, elections: eligibleElections });
  } catch (err) {
    console.error('[getEligibleElections]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * GET /api/employee/elections/:id
 */
async function getElectionDetails(req, res) {
  const { id } = req.params;
  const { eligible, election, isDraft } = await checkEligibility(req.user.id, id);

  if (isDraft || !election) {
    return res.status(404).json({ success: false, message: 'Election not found.' });
  }
  if (!eligible) {
    return res.status(403).json({ success: false, message: 'You are not eligible for this election.' });
  }

  return res.json({ success: true, election });
}

/**
 * GET /api/employee/elections/:id/candidates
 */
async function getCandidates(req, res) {
  const { id } = req.params;
  const { eligible, election, isDraft } = await checkEligibility(req.user.id, id);

  if (isDraft || !election) {
    return res.status(404).json({ success: false, message: 'Election not found.' });
  }
  if (!eligible) {
    return res.status(403).json({ success: false, message: 'You are not eligible for this election.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT c.id, c.employee_name, c.employee_id, c.description, c.profile_image,
              d.department_name, b.branch_name
       FROM candidates c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE c.election_id = ?
       ORDER BY c.employee_name`,
      [id]
    );
    return res.json({ success: true, candidates: rows });
  } catch (err) {
    console.error('[getCandidates]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * GET /api/employee/elections/:id/vote-status
 */
async function getVoteStatus(req, res) {
  const { id } = req.params;
  const { eligible, election, isDraft } = await checkEligibility(req.user.id, id);

  if (isDraft || !election) {
    return res.status(404).json({ success: false, message: 'Election not found.' });
  }
  if (!eligible) {
    return res.status(403).json({ success: false, message: 'You are not eligible for this election.' });
  }

  try {
    const [rollTable] = await db.execute("SHOW TABLES LIKE 'voter_roll'");
    const hasVoterRoll = rollTable.length > 0;

    let hasVoted = false;
    if (hasVoterRoll) {
      const [rows] = await db.execute(
        `SELECT id FROM voter_roll WHERE election_id = ? AND employee_id = ?`,
        [id, req.user.id]
      );
      hasVoted = rows.length > 0;
    } else {
      const [rows] = await db.execute(
        `SELECT id FROM votes WHERE election_id = ? AND employee_id = ?`,
        [id, req.user.id]
      );
      hasVoted = rows.length > 0;
    }

    return res.json({ success: true, hasVoted });
  } catch (err) {
    console.error('[getVoteStatus]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * POST /api/employee/elections/:id/vote
 * Transactional secret vote submission
 */
async function submitVote(req, res) {
  const { id: electionId } = req.params;
  const { candidateId } = req.body;
  const employeeId = req.user.id;

  if (!candidateId) {
    return res.status(400).json({ success: false, message: 'Candidate selection is required.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock employee row and verify active
    const [[emp]] = await conn.execute(
      `SELECT id, account_status, department_id, branch_id, location_id FROM employees WHERE id = ? FOR UPDATE`,
      [employeeId]
    );
    if (!emp || emp.account_status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Your account is not active.' });
    }

    // 2. Verify election is active
    const [[election]] = await conn.execute(
      `SELECT * FROM elections WHERE id = ? AND status = 'ACTIVE'`,
      [electionId]
    );
    if (!election) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'This election is not currently active.' });
    }

    // 3. Verify single source of truth eligibility
    const { eligible } = await checkEligibility(employeeId, electionId);
    if (!eligible) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'You are not eligible to vote in this election.' });
    }

    // Check if voter_roll table exists
    const [rollTable] = await conn.execute("SHOW TABLES LIKE 'voter_roll'");
    const hasVoterRoll = rollTable.length > 0;

    // 4. Check duplicate vote
    if (hasVoterRoll) {
      const [existing] = await conn.execute(
        `SELECT id FROM voter_roll WHERE election_id = ? AND employee_id = ? FOR UPDATE`,
        [electionId, employeeId]
      );
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(409).json({ success: false, message: 'You have already voted in this election.' });
      }
    } else {
      const [existing] = await conn.execute(
        `SELECT id FROM votes WHERE election_id = ? AND employee_id = ? FOR UPDATE`,
        [electionId, employeeId]
      );
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(409).json({ success: false, message: 'You have already voted in this election.' });
      }
    }

    // 5. Verify candidate belongs to election
    const [[cand]] = await conn.execute(
      `SELECT id FROM candidates WHERE id = ? AND election_id = ?`,
      [candidateId, electionId]
    );
    if (!cand) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Invalid candidate.' });
    }

    // 6. Record vote
    if (hasVoterRoll) {
      // Record voter participation without candidate
      await conn.execute(
        `INSERT INTO voter_roll (election_id, employee_id) VALUES (?, ?)`,
        [electionId, employeeId]
      );

      // Record secret ballot with random UUID v4 and minute-rounded timestamp
      const ballotId = crypto.randomUUID();
      const now = new Date();
      now.setSeconds(0, 0); // round to minute
      const castAt = now.toISOString().slice(0, 19).replace('T', ' ');

      await conn.execute(
        `INSERT INTO ballots (id, election_id, candidate_id, cast_at) VALUES (?, ?, ?, ?)`,
        [ballotId, electionId, candidateId, castAt]
      );
    } else {
      await conn.execute(
        `INSERT INTO votes (election_id, employee_id, candidate_id) VALUES (?, ?, ?)`,
        [electionId, employeeId, candidateId]
      );
    }

    // 8. Log vote cast in audit_logs (ELECTION ONLY, NEVER CANDIDATE ID)
    await logAction(null, 'VOTE_CAST', 'elections', electionId, `Employee cast a vote in election ID ${electionId}`, req.ip, conn);

    await conn.commit();
    return res.json({ success: true, message: 'Your vote has been successfully recorded!' });

  } catch (err) {
    await conn.rollback();
    if (['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(err.code)) {
      return res.status(409).json({ success: false, message: 'You have already voted in this election.' });
    }
    console.error('[submitVote]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
}

module.exports = { getProfile, getEligibleElections, getElectionDetails, getCandidates, getVoteStatus, submitVote };
