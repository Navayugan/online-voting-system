const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requirePermission, requireOrgProfile } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paginationQuerySchema, idParamSchema, createEmployeeSchema, updateEmployeeSchema, updateEmployeeStatusSchema } = require('../validators/employee.validator');
const { createElectionSchema, updateElectionSchema, updateElectionStatusSchema, createCandidateSchema } = require('../validators/election.validator');
const { createLocationSchema, updateLocationSchema, createDepartmentSchema, updateDepartmentSchema, createBranchSchema, updateBranchSchema, updateProfileSchema, updateOrgSchema } = require('../validators/admin.validator');
const { changeAdminPasswordSchema } = require('../validators/auth.validator');
const ctrl = require('../controllers/admin');

// All routes require JWT + ADMIN role
router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/dashboard', requirePermission('dashboard:read'), ctrl.getDashboard);

// Organization
router.get('/organization', ctrl.getOrganization);
router.put('/organization', validate(updateOrgSchema), ctrl.updateOrganization);

// Departments
router.get('/departments', ctrl.getDepartments);
router.post('/departments', requireOrgProfile, validate(createDepartmentSchema), ctrl.createDepartment);
router.post('/departments/bulk', requireOrgProfile, ctrl.bulkCreateDepartments);
router.put('/departments/:id', validate(idParamSchema), validate(updateDepartmentSchema), ctrl.updateDepartment);
router.delete('/departments/:id', validate(idParamSchema), ctrl.deleteDepartment);

// Locations
router.get('/locations', ctrl.getLocations);
router.post('/locations', requireOrgProfile, validate(createLocationSchema), ctrl.createLocation);
router.put('/locations/:id', validate(idParamSchema), validate(updateLocationSchema), ctrl.updateLocation);
router.delete('/locations/:id', validate(idParamSchema), ctrl.deleteLocation);

// Branches
router.get('/branches', ctrl.getBranches);
router.post('/branches', requireOrgProfile, validate(createBranchSchema), ctrl.createBranch);
router.post('/branches/bulk', requireOrgProfile, ctrl.bulkCreateBranches);
router.put('/branches/:id', validate(idParamSchema), validate(updateBranchSchema), ctrl.updateBranch);
router.delete('/branches/:id', validate(idParamSchema), ctrl.deleteBranch);

// Designations
router.get('/designations', ctrl.getDesignations);
router.post('/designations', requireOrgProfile, ctrl.createDesignation);

// Employees
router.get('/employees', validate(paginationQuerySchema), ctrl.getEmployees);
router.post('/employees', requireOrgProfile, validate(createEmployeeSchema), ctrl.createEmployee);
router.post('/employees/bulk', requireOrgProfile, ctrl.bulkCreateEmployees);
router.get('/employees/recycle-bin', ctrl.getRecycleBin);
router.post('/employees/recycle-bin/restore-all', requirePermission('employees:write'), ctrl.restoreAllRecycleBin);
router.delete('/employees/recycle-bin/empty', requirePermission('employees:write'), ctrl.emptyRecycleBin);
router.post('/employees/remove-all', requirePermission('employees:write'), ctrl.removeAllEmployees);
router.get('/employees/:id', validate(idParamSchema), ctrl.getEmployee);
router.put('/employees/:id', validate(idParamSchema), validate(updateEmployeeSchema), ctrl.updateEmployee);
router.patch('/employees/:id/status', validate(idParamSchema), validate(updateEmployeeStatusSchema), ctrl.updateEmployeeStatus);
router.post('/employees/:id/reset-password', validate(idParamSchema), requirePermission('employees:write'), ctrl.resetEmployeePassword);
router.delete('/employees/:id', validate(idParamSchema), requirePermission('employees:write'), ctrl.deleteEmployee);
router.post('/employees/:id/restore', validate(idParamSchema), requirePermission('employees:write'), ctrl.restoreEmployee);
router.delete('/employees/:id/permanent', validate(idParamSchema), requirePermission('employees:write'), ctrl.permanentlyDeleteEmployee);

// Elections
router.get('/elections', validate(paginationQuerySchema), ctrl.getElections);
router.get('/elections/options', ctrl.getElectionOptions);
router.post('/elections', requireOrgProfile, validate(createElectionSchema), ctrl.createElection);
router.get('/elections/:id', validate(idParamSchema), ctrl.getElection);
router.put('/elections/:id', validate(idParamSchema), validate(updateElectionSchema), ctrl.updateElection);
router.patch('/elections/:id/status', validate(idParamSchema), validate(updateElectionStatusSchema), ctrl.updateElectionStatus);
router.post('/elections/:id/cancel', validate(idParamSchema), ctrl.cancelElection);
router.delete('/elections/:id', validate(idParamSchema), ctrl.deleteElection);

// Candidates
router.get('/candidates', ctrl.getCandidates);
router.post('/candidates', requireOrgProfile, validate(createCandidateSchema), ctrl.createCandidate);
router.post('/candidates/bulk', requireOrgProfile, ctrl.bulkCreateCandidates);
router.put('/candidates/:id', validate(idParamSchema), ctrl.updateCandidate);
router.delete('/candidates/:id', validate(idParamSchema), ctrl.deleteCandidate);

// Results & Participation
router.get('/results/:electionId', ctrl.getResults);
router.get('/participation/:electionId', ctrl.getParticipation);

// Audit Logs (requires audit:read permission - HR admin will be 403 forbidden)
router.get('/audit-logs', requirePermission('audit:read'), ctrl.getAuditLogs);

// Admin Profile
router.get('/profile', ctrl.getAdminProfile);
router.put('/profile', validate(updateProfileSchema), ctrl.updateAdminProfile);
router.post('/profile/change-password', validate(changeAdminPasswordSchema), ctrl.changeAdminPassword);

module.exports = router;
