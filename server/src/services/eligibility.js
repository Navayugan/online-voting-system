const db = require('../config/db');

/**
 * Checks if an employee is eligible to participate/vote in an election.
 * Returns { eligible: boolean, reason?: string, election?: object }
 */
async function checkEligibility(employeeId, electionId) {
  // 1. Fetch employee
  const [employees] = await db.execute(
    'SELECT id, employee_id, department_id, branch_id, location_id, account_status, deleted_at FROM employees WHERE id = ?',
    [employeeId]
  );
  if (employees.length === 0 || employees[0].deleted_at) {
    return { eligible: false, reason: 'Employee not found or record has been deleted.' };
  }
  const employee = employees[0];
  if (employee.account_status !== 'ACTIVE') {
    return { eligible: false, reason: 'Employee account is not active.' };
  }

  // 2. Fetch election
  const [elections] = await db.execute(
    'SELECT * FROM elections WHERE id = ?',
    [electionId]
  );
  if (elections.length === 0) {
    return { eligible: false, reason: 'Election not found.' };
  }
  const election = elections[0];

  // Employees can only view/vote in non-draft elections
  if (election.status === 'DRAFT' || election.status === 'CANCELLED') {
    return { eligible: false, reason: 'Election is not accessible.', isDraft: true };
  }

  // 3. Check direct restrictions on election row
  if (election.department_id && election.department_id !== employee.department_id) {
    return { eligible: false, reason: 'Not eligible for this department election.' };
  }
  if (election.branch_id && election.branch_id !== employee.branch_id) {
    return { eligible: false, reason: 'Not eligible for this branch election.' };
  }
  if (election.location_id && election.location_id !== employee.location_id) {
    return { eligible: false, reason: 'Not eligible for this location election.' };
  }

  // 4. Check election_eligibility table rules if any exist
  const [rules] = await db.execute(
    'SELECT * FROM election_eligibility WHERE election_id = ?',
    [electionId]
  );

  if (rules.length > 0) {
    // If rules exist, employee must match at least ONE rule (OR across rows)
    const matchesAnyRule = rules.some(rule => {
      if (rule.department_id && rule.department_id !== employee.department_id) return false;
      if (rule.branch_id && rule.branch_id !== employee.branch_id) return false;
      if (rule.location_id && rule.location_id !== employee.location_id) return false;
      return true;
    });

    if (!matchesAnyRule) {
      return { eligible: false, reason: 'Employee does not match election criteria.' };
    }
  }

  return { eligible: true, election, employee };
}

/**
 * Builds the SQL WHERE condition and params for an election's eligibility rules.
 * Supports direct election restrictions AND multiple election_eligibility rows (OR condition).
 * Alias defaults to 'e' for employees table.
 */
function buildEligibilityWhere(election, rules = [], alias = 'e') {
  const prefix = alias ? `${alias}.` : '';
  const conditions = [];
  const params = [];

  // Account must be ACTIVE and not deleted
  conditions.push(`${prefix}account_status = 'ACTIVE'`);
  conditions.push(`${prefix}deleted_at IS NULL`);

  // Direct election restrictions (AND)
  if (election.department_id) {
    conditions.push(`${prefix}department_id = ?`);
    params.push(election.department_id);
  }
  if (election.branch_id) {
    conditions.push(`${prefix}branch_id = ?`);
    params.push(election.branch_id);
  }
  if (election.location_id) {
    conditions.push(`${prefix}location_id = ?`);
    params.push(election.location_id);
  }

  // Multi-rule criteria (OR across rules)
  if (rules && rules.length > 0) {
    const ruleClauses = [];
    for (const rule of rules) {
      const parts = [];
      if (rule.department_id) {
        parts.push(`${prefix}department_id = ?`);
        params.push(rule.department_id);
      }
      if (rule.branch_id) {
        parts.push(`${prefix}branch_id = ?`);
        params.push(rule.branch_id);
      }
      if (rule.location_id) {
        parts.push(`${prefix}location_id = ?`);
        params.push(rule.location_id);
      }
      if (parts.length > 0) {
        ruleClauses.push(`(${parts.join(' AND ')})`);
      }
    }
    if (ruleClauses.length > 0) {
      conditions.push(`(${ruleClauses.join(' OR ')})`);
    }
  }

  return {
    where: conditions.join(' AND '),
    params
  };
}

/**
 * Calculates exact count of eligible employees for a given election.
 */
async function getEligibleCount(electionId) {
  const [[election]] = await db.execute('SELECT * FROM elections WHERE id = ?', [electionId]);
  if (!election) return 0;

  const [rules] = await db.execute('SELECT * FROM election_eligibility WHERE election_id = ?', [electionId]);
  const { where, params } = buildEligibilityWhere(election, rules, '');

  const [[res]] = await db.execute(`SELECT COUNT(*) AS count FROM employees WHERE ${where}`, params);
  return Number(res.count || 0);
}

module.exports = {
  checkEligibility,
  buildEligibilityWhere,
  getEligibleCount
};

