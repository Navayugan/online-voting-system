const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/public.controller');

// GET /api/public/organization  - branding info
router.get('/organization', ctrl.getOrganization);

// GET /api/public/branches      - active branches
router.get('/branches', ctrl.getBranches);

module.exports = router;
