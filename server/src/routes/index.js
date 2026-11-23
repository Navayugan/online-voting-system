/**
 * routes/index.js - mounts every router under /api
 */
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/employee', require('./employee.routes'));
router.use('/public', require('./public.routes'));

module.exports = router;
