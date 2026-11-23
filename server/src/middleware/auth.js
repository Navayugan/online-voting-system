/**
 * middleware/auth.js
 * JWT authentication + RBAC middleware
 */
require('../config/env');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { hasPermission } = require('../config/permissions');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies JWT token, checks DB existence, active status, and token_version.
 * Attaches decoded user to req.user.
 * Note: Missing/invalid/expired token returns 401 (never 403).
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  try {
    if (decoded.role === 'EMPLOYEE') {
      const [rows] = await db.execute(
        `SELECT id, employee_id, employee_name, department_id, branch_id, location_id, account_status, token_version
         FROM employees WHERE id = ? AND deleted_at IS NULL`,
        [decoded.id]
      );
      if (rows.length === 0 || rows[0].account_status !== 'ACTIVE') {
        return res.status(401).json({ success: false, message: 'Account is inactive or suspended.' });
      }
      if (decoded.token_version !== undefined && rows[0].token_version !== decoded.token_version) {
        return res.status(401).json({ success: false, message: 'Session expired or password was changed.' });
      }
      req.user = {
        ...decoded,
        ...rows[0],
        role: 'EMPLOYEE'
      };
    } else {
      // Admin user
      const [rows] = await db.execute(
        `SELECT id, username, email, full_name, role, is_active, token_version
         FROM admins WHERE id = ?`,
        [decoded.id]
      );
      if (rows.length === 0 || !rows[0].is_active) {
        return res.status(401).json({ success: false, message: 'Admin account is inactive.' });
      }
      if (decoded.token_version !== undefined && rows[0].token_version !== decoded.token_version) {
        return res.status(401).json({ success: false, message: 'Session expired or password was changed.' });
      }
      req.user = {
        ...decoded,
        ...rows[0],
        adminRole: rows[0].role // e.g. SUPER_ADMIN, HR, CEO
      };
    }
    next();
  } catch (err) {
    console.error('[authenticateToken error]', err.message);
    return res.status(500).json({ success: false, message: 'Authentication verification error.' });
  }
}

/**
 * Requires authenticated user to be an ADMIN
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role === 'EMPLOYEE') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
}

/**
 * Requires authenticated user to have EMPLOYEE role
 */
function requireEmployee(req, res, next) {
  if (!req.user || req.user.role !== 'EMPLOYEE') {
    return res.status(403).json({ success: false, message: 'Access denied. Employee login required.' });
  }
  next();
}

/**
 * Enforces fine-grained RBAC permission for admins
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || req.user.role === 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }
    const adminRole = req.user.adminRole || req.user.role;
    if (!hasPermission(adminRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${adminRole}' lacks permission '${permission}'.`,
        code: 'FORBIDDEN'
      });
    }
    next();
  };
}

/**
 * Helper: sign JWT for admin
 */
function signAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: 'ADMIN',
      adminRole: admin.role,
      token_version: admin.token_version || 1
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Helper: sign JWT for employee
 */
function signEmployeeToken(employee) {
  return jwt.sign(
    {
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.employee_name,
      role: 'EMPLOYEE',
      token_version: employee.token_version || 1
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Enforces that an organization profile must be created before operational entities can be created.
 */
async function requireOrgProfile(req, res, next) {
  try {
    const [rows] = await db.execute(`SELECT id, org_name, is_setup_complete FROM organizations LIMIT 1`);
    if (rows.length === 0 || !rows[0].org_name) {
      return res.status(403).json({
        success: false,
        message: 'Please create an organization profile before entering these details.',
        code: 'ORG_PROFILE_REQUIRED'
      });
    }
    next();
  } catch (err) {
    console.error('[requireOrgProfile error]', err.message);
    return res.status(500).json({ success: false, message: 'Server error verifying organization setup.' });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmployee,
  requirePermission,
  requireOrgProfile,
  signAdminToken,
  signEmployeeToken
};
