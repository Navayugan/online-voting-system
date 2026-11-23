const express = require('express');
const router = express.Router();
const { adminLogin, employeeLogin, adminRegister, getAdminStatus } = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { adminLoginSchema, employeeLoginSchema } = require('../validators/auth.validator');

// GET /api/auth/admin/status
router.get('/admin/status', getAdminStatus);

// POST /api/auth/admin/login
router.post('/admin/login', authLimiter, validate(adminLoginSchema), adminLogin);

// POST /api/auth/admin/register (Main user / Admin account creation)
router.post('/admin/register', authLimiter, adminRegister);

// POST /api/auth/employee/login
router.post('/employee/login', authLimiter, validate(employeeLoginSchema), employeeLogin);

module.exports = router;
