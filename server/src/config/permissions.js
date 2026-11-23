/**
 * config/permissions.js
 * Role-Based Access Control (RBAC) permission definitions and mapping
 */

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  CEO: [
    'elections:read', 'elections:write',
    'candidates:read', 'candidates:write',
    'results:read', 'participation:read',
    'dashboard:read'
  ],
  MD: [
    'elections:read', 'elections:write',
    'candidates:read', 'candidates:write',
    'results:read', 'participation:read',
    'dashboard:read'
  ],
  DIRECTOR: [
    'elections:read', 'elections:write',
    'candidates:read', 'candidates:write',
    'results:read', 'participation:read',
    'dashboard:read'
  ],
  HR: [
    'employees:read', 'employees:write',
    'departments:read', 'departments:write',
    'branches:read', 'branches:write',
    'locations:read', 'locations:write',
    'designations:read', 'designations:write',
    'dashboard:read'
  ],
  MANAGER: [
    'employees:read',
    'departments:read',
    'branches:read',
    'locations:read',
    'elections:read',
    'candidates:read',
    'dashboard:read'
  ]
};

function hasPermission(role, permission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;
  if (permissions.includes(permission)) return true;

  // Check wildcards like "employees:*"
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*`)) return true;

  return false;
}

module.exports = {
  ROLE_PERMISSIONS,
  hasPermission
};
