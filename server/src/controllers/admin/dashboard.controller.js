/**
 * controllers/admin/dashboard.controller.js
 * Dashboard statistics
 */
const db = require('../../config/db');

async function getDashboard(req, res) {
  try {
    const [[empStats]] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(account_status = 'ACTIVE') AS active,
        SUM(account_status = 'INACTIVE') AS inactive,
        SUM(account_status = 'SUSPENDED') AS suspended
      FROM employees
      WHERE deleted_at IS NULL
    `);

    const [[electionStats]] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'ACTIVE') AS active,
        SUM(status = 'UPCOMING') AS upcoming,
        SUM(status = 'CLOSED') AS closed,
        SUM(status = 'DRAFT') AS draft
      FROM elections
    `);

    const [ballotsTable] = await db.execute("SHOW TABLES LIKE 'ballots'");
    const hasBallots = ballotsTable.length > 0;

    const [[voteStats]] = await db.execute(
      hasBallots ? `SELECT COUNT(*) AS total FROM ballots` : `SELECT COUNT(*) AS total FROM votes`
    );
    const [[deptCount]] = await db.execute(`SELECT COUNT(*) AS total FROM departments WHERE is_active = TRUE`);
    const [[branchCount]] = await db.execute(`SELECT COUNT(*) AS total FROM branches WHERE is_active = TRUE`);
    const [[locationCount]] = await db.execute(`SELECT COUNT(*) AS total FROM locations WHERE is_active = TRUE`);

    const [deptDist] = await db.execute(`
      SELECT d.department_name, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.account_status = 'ACTIVE' AND e.deleted_at IS NULL
      WHERE d.is_active = TRUE
      GROUP BY d.id, d.department_name
      ORDER BY employee_count DESC
      LIMIT 10
    `);

    const [recentElections] = await db.execute(`
      SELECT id, title, status, start_date, end_date FROM elections ORDER BY created_at DESC LIMIT 5
    `);

    const voteJoinClause = hasBallots
      ? `LEFT JOIN ballots v ON v.election_id = el.id`
      : `LEFT JOIN votes v ON v.election_id = el.id`;

    const [participationData] = await db.execute(`
      SELECT el.id, el.title, el.status, COUNT(v.id) AS vote_count
      FROM elections el
      ${voteJoinClause}
      WHERE el.status IN ('ACTIVE', 'CLOSED')
      GROUP BY el.id, el.title, el.status
      ORDER BY el.created_at DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      data: {
        employees: empStats,
        elections: electionStats,
        totalVotes: voteStats.total,
        departments: deptCount.total,
        branches: branchCount.total,
        locations: locationCount.total,
        departmentDistribution: deptDist,
        recentElections,
        participationData
      }
    });
  } catch (err) {
    console.error('[getDashboard]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getDashboard
};
