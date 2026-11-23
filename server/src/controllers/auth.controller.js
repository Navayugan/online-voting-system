/**
 * controllers/authController.js
 * Handles login for both Admin and Employee roles
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signAdminToken, signEmployeeToken } = require('../middleware/auth');
const { logAction } = require('../services/auditLog');

/**
 * POST /api/auth/admin/login
 */
async function adminLogin(req, res) {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid input format.' });
  }

  const trimmedUsername = username.trim();
  const clientIp = req.ip;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM admins WHERE username = ?`,
      [trimmedUsername]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      await logAction(null, 'LOGIN_FAILED', 'admins', null, `Failed admin login attempt for username: ${trimmedUsername}`, clientIp);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(String(password), admin.password_hash);
    if (!match) {
      await logAction(admin.id, 'LOGIN_FAILED', 'admins', admin.id, `Failed admin password attempt for username: ${trimmedUsername}`, clientIp);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update last login
    await db.execute(`UPDATE admins SET last_login = NOW() WHERE id = ?`, [admin.id]);

    await logAction(admin.id, 'LOGIN_SUCCESS', 'admins', admin.id, `Admin login successful: ${trimmedUsername}`, clientIp);

    const token = signAdminToken(admin);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: { id: admin.id, username: admin.username, fullName: admin.full_name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    console.error('[adminLogin]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * POST /api/auth/employee/login
 */
async function employeeLogin(req, res) {
  const { employeeId, password } = req.body;
  if (typeof employeeId !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid input format.' });
  }

  const trimmedEmpId = employeeId.trim();
  const clientIp = req.ip;

  try {
    const [rows] = await db.execute(
      `SELECT e.*, d.department_name, b.branch_name, l.location_name, des.designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE e.employee_id = ? AND e.deleted_at IS NULL`,
      [trimmedEmpId]
    );

    if (rows.length === 0) {
      await logAction(null, 'LOGIN_FAILED', 'employees', null, `Failed employee login for ID: ${trimmedEmpId}`, clientIp);
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or password.' });
    }

    const employee = rows[0];
    const match = await bcrypt.compare(String(password), employee.password_hash);
    if (!match) {
      await logAction(null, 'LOGIN_FAILED', 'employees', employee.id, `Failed employee password for ID: ${trimmedEmpId}`, clientIp);
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or password.' });
    }

    if (employee.account_status === 'SUSPENDED') {
      await logAction(null, 'LOGIN_BLOCKED', 'employees', employee.id, `Suspended employee login attempt: ${trimmedEmpId}`, clientIp);
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact the administrator.' });
    }

    if (employee.account_status !== 'ACTIVE') {
      await logAction(null, 'LOGIN_BLOCKED', 'employees', employee.id, `Inactive employee login attempt: ${trimmedEmpId}`, clientIp);
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact the administrator.' });
    }

    await logAction(null, 'LOGIN_SUCCESS', 'employees', employee.id, `Employee login successful: ${trimmedEmpId}`, clientIp);

    const token = signEmployeeToken(employee);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      employee: {
        id: employee.id,
        employeeId: employee.employee_id,
        name: employee.employee_name,
        departmentId: employee.department_id,
        departmentName: employee.department_name,
        branchId: employee.branch_id,
        branchName: employee.branch_name,
        locationId: employee.location_id,
        locationName: employee.location_name,
        designationId: employee.designation_id,
        designationName: employee.designation_name,
        employeeType: employee.employee_type
      }
    });
  } catch (err) {
    console.error('[employeeLogin]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * POST /api/auth/employee/register
 */
async function employeeRegister(req, res) {
  const { employee_id, employee_name, date_of_birth, password, official_email, gender, department_id, branch_id } = req.body;
  const trimmedEmpId = typeof employee_id === 'string' ? employee_id.trim() : '';
  const trimmedName = typeof employee_name === 'string' ? employee_name.trim() : '';

  if (!trimmedEmpId || !trimmedName || !date_of_birth || !password) {
    return res.status(400).json({ success: false, message: 'Employee ID, Name, Date of Birth, and Password are required.' });
  }

  if (typeof password !== 'string' || password.length < 10) {
    return res.status(400).json({ success: false, message: 'Password must be at least 10 characters long.' });
  }

  const clientIp = req.ip;

  try {
    const [existing] = await db.execute(
      `SELECT id FROM employees WHERE employee_id = ?`,
      [trimmedEmpId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this Employee ID already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO employees (
        employee_id, employee_name, date_of_birth, gender,
        official_email, department_id, branch_id,
        password_hash, account_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        trimmedEmpId,
        trimmedName,
        date_of_birth,
        gender || 'MALE',
        official_email ? official_email.trim() : null,
        department_id || null,
        branch_id || null,
        passwordHash
      ]
    );

    const newEmpId = result.insertId;

    await logAction(null, 'EMPLOYEE_REGISTER', 'employees', newEmpId, `New employee registered: ${trimmedName} (${trimmedEmpId})`, clientIp);

    const [rows] = await db.execute(
      `SELECT e.*, d.department_name, b.branch_name, l.location_name, des.designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE e.id = ?`,
      [newEmpId]
    );

    const employee = rows[0];
    const token = signEmployeeToken(employee);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      employee: {
        id: employee.id,
        employeeId: employee.employee_id,
        name: employee.employee_name,
        departmentId: employee.department_id,
        departmentName: employee.department_name,
        branchId: employee.branch_id,
        branchName: employee.branch_name,
        locationId: employee.location_id,
        locationName: employee.location_name,
        designationId: employee.designation_id,
        designationName: employee.designation_name,
        employeeType: employee.employee_type
      }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    }
    console.error('[employeeRegister]', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

/**
 * POST /api/auth/admin/register
 */
async function adminRegister(req, res) {
  const { username, password, email, full_name } = req.body;
  if (!username || !password || !email || !full_name) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const trimmedUsername = String(username).trim();
  const trimmedEmail = String(email).trim();
  const trimmedFullName = String(full_name).trim();

  if (password.length < 10) {
    return res.status(400).json({ success: false, message: 'Password must be at least 10 characters long.' });
  }

  const clientIp = req.ip;

  try {
    const [existing] = await db.execute(
      `SELECT id FROM admins WHERE username = ? OR email = ?`,
      [trimmedUsername, trimmedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An admin with this username or email already exists.' });
    }

    const [[{ totalAdmins }]] = await db.execute(`SELECT COUNT(*) AS totalAdmins FROM admins`);
    const adminRole = totalAdmins === 0
      ? 'SUPER_ADMIN'
      : (['SUPER_ADMIN', 'CEO', 'MD', 'HR', 'MANAGER', 'DIRECTOR'].includes(req.body.role) ? req.body.role : 'HR');

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO admins (username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [trimmedUsername, trimmedEmail, passwordHash, trimmedFullName, adminRole]
    );

    const newAdmin = {
      id: result.insertId,
      username: trimmedUsername,
      email: trimmedEmail,
      full_name: trimmedFullName,
      role: adminRole
    };

    await logAction(newAdmin.id, 'ADMIN_REGISTER', 'admins', newAdmin.id, `New admin registered: ${trimmedUsername}`, clientIp);

    const token = signAdminToken(newAdmin);

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      token,
      admin: { id: newAdmin.id, username: newAdmin.username, fullName: newAdmin.full_name, email: newAdmin.email, role: newAdmin.role }
    });
  } catch (err) {
    console.error('[adminRegister]', err);
    return res.status(500).json({ success: false, message: 'Server error during admin registration.' });
  }
}

/**
 * GET /api/auth/admin/status
 * Checks if any administrator exists in the system
 */
async function getAdminStatus(req, res) {
  try {
    const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM admins`);
    return res.json({ success: true, hasAdmin: total > 0 });
  } catch (err) {
    console.error('[getAdminStatus]', err);
    return res.status(500).json({ success: false, message: 'Server error checking admin status.' });
  }
}

module.exports = { adminLogin, employeeLogin, employeeRegister, adminRegister, getAdminStatus };

