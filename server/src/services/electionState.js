/**
 * services/electionState.js
 * State machine and effective status derivation for elections
 */

const ALLOWED_TRANSITIONS = {
  DRAFT: ['UPCOMING', 'ACTIVE', 'CANCELLED'],
  UPCOMING: ['ACTIVE', 'CANCELLED', 'DRAFT'],
  ACTIVE: ['CLOSED'],
  CLOSED: [],
  CANCELLED: []
};

/**
 * Returns the effective status derived from dates and database status.
 * Prevents past elections from erroneously showing as ACTIVE.
 */
function getEffectiveStatus(election) {
  if (!election) return null;
  const now = new Date();
  const endDate = election.end_date ? new Date(election.end_date) : null;
  const startDate = election.start_date ? new Date(election.start_date) : null;

  if (election.status === 'CANCELLED') return 'CANCELLED';
  if (election.status === 'CLOSED') return 'CLOSED';

  if (endDate && now > endDate) {
    return 'CLOSED';
  }

  if (election.status === 'UPCOMING' && startDate && endDate && now >= startDate && now <= endDate) {
    return 'ACTIVE';
  }

  return election.status;
}

/**
 * Validates whether transition from currentStatus to targetStatus is valid.
 */
function isValidTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

module.exports = {
  getEffectiveStatus,
  isValidTransition,
  ALLOWED_TRANSITIONS
};
