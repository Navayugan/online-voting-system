/**
 * controllers/admin/index.js
 * Aggregates every admin handler so routes can use a single import.
 */
module.exports = {
  ...require('./dashboard.controller'),
  ...require('./organization.controller'),
  ...require('./departments.controller'),
  ...require('./locations.controller'),
  ...require('./branches.controller'),
  ...require('./designations.controller'),
  ...require('./employees.controller'),
  ...require('./elections.controller'),
  ...require('./candidates.controller'),
  ...require('./results.controller'),
  ...require('./audit.controller'),
  ...require('./profile.controller'),
};
