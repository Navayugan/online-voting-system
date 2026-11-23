const express = require('express');
const router = express.Router();
const { authenticateToken, requireEmployee } = require('../middleware/auth');
const ctrl = require('../controllers/employee.controller');

// All routes require JWT + EMPLOYEE role
router.use(authenticateToken, requireEmployee);

// Profile
router.get('/profile', ctrl.getProfile);

// Elections
router.get('/elections', ctrl.getEligibleElections);
router.get('/elections/:id', ctrl.getElectionDetails);
router.get('/elections/:id/candidates', ctrl.getCandidates);
router.get('/elections/:id/vote-status', ctrl.getVoteStatus);
router.post('/elections/:id/vote', ctrl.submitVote);

module.exports = router;
