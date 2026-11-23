/**
 * controllers/admin/results.controller.js
 * Results & participation reporting
 */
const db = require('../../config/db');
const { getEffectiveStatus } = require('../../services/electionState');
const { buildEligibilityWhere, getEligibleCount } = require('../../services/eligibility');

async function getResults(req, res) {
  const { electionId } = req.params;
  try {
    const [[election]] = await db.execute(`SELECT * FROM elections WHERE id = ?`, [electionId]);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });

    const effectiveStatus = getEffectiveStatus(election);
    const isProvisional = effectiveStatus === 'ACTIVE';

    // Check if ballots table exists, otherwise fallback to votes
    const [ballotsTable] = await db.execute("SHOW TABLES LIKE 'ballots'");
    const hasBallots = ballotsTable.length > 0;

    let candidates;
    if (hasBallots) {
      [candidates] = await db.execute(
        `SELECT c.id, c.employee_name, c.employee_id,
                COUNT(bal.id) AS vote_count,
                d.department_name, br.branch_name
         FROM candidates c
         LEFT JOIN ballots bal ON bal.candidate_id = c.id AND bal.election_id = ?
         LEFT JOIN departments d ON c.department_id = d.id
         LEFT JOIN branches br ON c.branch_id = br.id
         WHERE c.election_id = ?
         GROUP BY c.id
         ORDER BY vote_count DESC`,
        [electionId, electionId]
      );
    } else {
      [candidates] = await db.execute(
        `SELECT c.id, c.employee_name, c.employee_id,
                COUNT(v.id) AS vote_count,
                d.department_name, br.branch_name
         FROM candidates c
         LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = ?
         LEFT JOIN departments d ON c.department_id = d.id
         LEFT JOIN branches br ON c.branch_id = br.id
         WHERE c.election_id = ?
         GROUP BY c.id
         ORDER BY vote_count DESC`,
        [electionId, electionId]
      );
    }

    const totalVotes = candidates.reduce((s, c) => s + Number(c.vote_count), 0);
    const results = candidates.map(c => ({
      ...c,
      vote_count: Number(c.vote_count),
      percentage: totalVotes > 0 ? ((Number(c.vote_count) / totalVotes) * 100).toFixed(2) : '0.00'
    }));

    // Eligible employee count via shared eligibility service
    const eligible = await getEligibleCount(electionId);

    return res.json({
      success: true,
      election: {
        ...election,
        status: effectiveStatus
      },
      results,
      totalVotes,
      eligibleEmployees: eligible,
      participation: eligible > 0 ? ((totalVotes / eligible) * 100).toFixed(2) : '0.00',
      provisional: isProvisional
    });
  } catch (err) {
    console.error('[getResults]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getParticipation(req, res) {
  const { electionId } = req.params;
  const { department_id, branch_id, location_id } = req.query;

  try {
    const [[election]] = await db.execute(`SELECT * FROM elections WHERE id = ?`, [electionId]);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });

    const [eligRules] = await db.execute(
      `SELECT * FROM election_eligibility WHERE election_id = ?`,
      [electionId]
    );

    // Build base eligibility where clause for this election
    const { where: baseWhere, params: baseParams } = buildEligibilityWhere(election, eligRules, 'e');
    let empWhere = baseWhere;
    const params = [...baseParams];

    // Optional query filters on participation view
    if (department_id) { empWhere += ` AND e.department_id = ?`; params.push(department_id); }
    if (branch_id) { empWhere += ` AND e.branch_id = ?`; params.push(branch_id); }
    if (location_id) { empWhere += ` AND e.location_id = ?`; params.push(location_id); }

    const [rollTable] = await db.execute("SHOW TABLES LIKE 'voter_roll'");
    const hasVoterRoll = rollTable.length > 0;

    const joinClause = hasVoterRoll
      ? `LEFT JOIN voter_roll vr ON vr.employee_id = e.id AND vr.election_id = ?`
      : `LEFT JOIN votes vr ON vr.employee_id = e.id AND vr.election_id = ?`;

    const [rows] = await db.execute(
      `SELECT e.id, e.employee_id, e.employee_name, d.department_name, b.branch_name,
              IF(vr.id IS NOT NULL, TRUE, FALSE) AS has_voted
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       ${joinClause}
       WHERE ${empWhere}
       ORDER BY e.employee_name`,
      [electionId, ...params]
    );

    const voted = rows.filter(r => r.has_voted).length;
    return res.json({
      success: true,
      participation: rows,
      total: rows.length,
      voted,
      notVoted: rows.length - voted,
      percentage: rows.length > 0 ? ((voted / rows.length) * 100).toFixed(2) : '0.00'
    });
  } catch (err) {
    console.error('[getParticipation]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getResults,
  getParticipation
};
