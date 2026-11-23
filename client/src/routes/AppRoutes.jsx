/**
 * routes/AppRoutes.jsx - every route in the application
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRoute, EmployeeRoute, PublicRoute } from './guards';

// Public pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import AdminLoginPage from '../pages/public/AdminLoginPage';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';

// Admin pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminOrganizationPage from '../pages/admin/AdminOrganizationPage';
import AdminDepartmentsPage from '../pages/admin/AdminDepartmentsPage';
import AdminLocationsPage from '../pages/admin/AdminLocationsPage';
import AdminBranchesPage from '../pages/admin/AdminBranchesPage';
import AdminEmployeesPage from '../pages/admin/AdminEmployeesPage';
import AdminEmployeeFormPage from '../pages/admin/AdminEmployeeFormPage';
import AdminElectionsPage from '../pages/admin/AdminElectionsPage';
import AdminElectionFormPage from '../pages/admin/AdminElectionFormPage';
import AdminCandidatesPage from '../pages/admin/AdminCandidatesPage';
import AdminResultsPage from '../pages/admin/AdminResultsPage';
import AdminParticipationPage from '../pages/admin/AdminParticipationPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';

// Employee pages
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage';
import EmployeeElectionsPage from '../pages/employee/EmployeeElectionsPage';
import EmployeeVotePage from '../pages/employee/EmployeeVotePage';
import EmployeeProfilePage from '../pages/employee/EmployeeProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/admin-login" element={<PublicRoute><AdminLoginPage initialMode="signin" /></PublicRoute>} />
      <Route path="/admin-signup" element={<PublicRoute><AdminLoginPage initialMode="signup" /></PublicRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="organization" element={<AdminOrganizationPage />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="locations" element={<AdminLocationsPage />} />
        <Route path="branches" element={<AdminBranchesPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="employees/add" element={<AdminEmployeeFormPage />} />
        <Route path="employees/:id/edit" element={<AdminEmployeeFormPage />} />
        <Route path="elections" element={<AdminElectionsPage />} />
        <Route path="elections/add" element={<AdminElectionFormPage />} />
        <Route path="elections/:id/edit" element={<AdminElectionFormPage />} />
        <Route path="candidates" element={<AdminCandidatesPage />} />
        <Route path="results" element={<AdminResultsPage />} />
        <Route path="participation" element={<AdminParticipationPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Employee */}
      <Route path="/employee" element={<EmployeeRoute><EmployeeLayout /></EmployeeRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboardPage />} />
        <Route path="elections" element={<EmployeeElectionsPage />} />
        <Route path="elections/:id/vote" element={<EmployeeVotePage />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
      </Route>

      {/* Legacy redirect */}
      <Route path="/admin-dashboard/*" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/employee-dashboard" element={<Navigate to="/employee/dashboard" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
