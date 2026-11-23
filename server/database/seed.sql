-- ============================================================
-- Organization Employee Voting Management System - Seed Data
-- ============================================================
USE employee_voting_system;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Organizations
INSERT INTO organizations (
  id, org_name, org_code, gstn_number, org_type, official_email, contact_number, website,
  established_year, address_line1, address_line2, country, state, district, city, postal_code,
  logo_url, primary_color, secondary_color, is_setup_complete
) VALUES (
  1, 'Acme Corporation', 'ACME', '33AAAAA0000A1Z5', 'PRIVATE_COMPANY', 'contact@acme.com', '+91 9876543210', 'https://acme.com',
  2010, '123 Tech Park', 'Phase 1', 'India', 'Karnataka', 'Bangalore Urban', 'Bangalore', '560001',
  NULL, '#1e40af', '#7c3aed', TRUE
) ON DUPLICATE KEY UPDATE org_name = VALUES(org_name);

-- 2. Locations
INSERT INTO locations (id, location_code, location_name, district, city, state, country, postal_code, is_active)
VALUES (1, 'LOC01', 'Headquarters', 'Bangalore Urban', 'Bangalore', 'Karnataka', 'India', '560001', TRUE)
ON DUPLICATE KEY UPDATE location_name = VALUES(location_name);

-- 3. Departments
INSERT INTO departments (id, department_code, department_name, description, is_active) VALUES
(1, 'IT', 'Information Technology', 'IT & Software Development', TRUE),
(2, 'HR', 'Human Resources', 'People and Culture', TRUE),
(3, 'FIN', 'Finance', 'Financial Operations', TRUE),
(4, 'MKT', 'Marketing', 'Marketing and Communications', TRUE),
(5, 'OPS', 'Operations', 'Business Operations', TRUE),
(6, 'ADMIN', 'Administration', 'General Administration', TRUE)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- 4. Branches
INSERT INTO branches (id, branch_code, branch_name, location_id, address, description, is_active)
VALUES (1, 'BR01', 'Main Campus', 1, '123 Tech Park', 'Primary Office', TRUE)
ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name);

-- 5. Designations
INSERT INTO designations (id, designation_code, designation_name, department_id, is_active) VALUES
(1, 'DES01', 'Software Engineer', 1, TRUE),
(2, 'DES02', 'HR Specialist', 2, TRUE),
(3, 'DES03', 'Financial Analyst', 3, TRUE)
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name);

-- 6. Admins (password: admin123)
-- bcrypt hash: $2b$10$PHd/6PNbosUXw8r3JaXfyOBSyHXxNJsFcn86hIZ9TQgkpzUFAYJYa
INSERT INTO admins (id, username, email, password_hash, full_name, role, is_active, token_version) VALUES
(1, 'admin', 'admin@acme.com', '$2b$10$PHd/6PNbosUXw8r3JaXfyOBSyHXxNJsFcn86hIZ9TQgkpzUFAYJYa', 'Super Admin', 'SUPER_ADMIN', TRUE, 1),
(2, 'ceo', 'ceo@acme.com', '$2b$10$PHd/6PNbosUXw8r3JaXfyOBSyHXxNJsFcn86hIZ9TQgkpzUFAYJYa', 'Chief Executive', 'CEO', TRUE, 1),
(3, 'hr', 'hr@acme.com', '$2b$10$PHd/6PNbosUXw8r3JaXfyOBSyHXxNJsFcn86hIZ9TQgkpzUFAYJYa', 'HR Admin', 'HR', TRUE, 1)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- 7. Employees (password: emp123)
-- bcrypt hash: $2b$10$VRibKdL4zq9XhsWdWBf7mOnIKJR1VeX1xppqb91VRzcWBvP9e2BlW
INSERT INTO employees (
  id, employee_id, employee_name, date_of_birth, gender, personal_email, official_email,
  phone_number, department_id, branch_id, location_id, designation_id, employee_type,
  password_hash, account_status, token_version
) VALUES
(1, 'EMP001', 'Arun Kumar', '1990-05-15', 'MALE', 'arun@example.com', 'arun.kumar@company.com', '+91 9876543211', 1, 1, 1, 1, 'FULL_TIME', '$2b$10$VRibKdL4zq9XhsWdWBf7mOnIKJR1VeX1xppqb91VRzcWBvP9e2BlW', 'ACTIVE', 1),
(2, 'EMP002', 'Priya Sharma', '1992-08-22', 'FEMALE', 'priya@example.com', 'priya.sharma@company.com', '+91 9876543212', 2, 1, 1, 2, 'FULL_TIME', '$2b$10$VRibKdL4zq9XhsWdWBf7mOnIKJR1VeX1xppqb91VRzcWBvP9e2BlW', 'ACTIVE', 1),
(3, 'EMP003', 'Rahul Verma', '1988-11-10', 'MALE', 'rahul@example.com', 'rahul.verma@company.com', '+91 9876543213', 1, 1, 1, 1, 'FULL_TIME', '$2b$10$VRibKdL4zq9XhsWdWBf7mOnIKJR1VeX1xppqb91VRzcWBvP9e2BlW', 'ACTIVE', 1),
(4, 'EMP004', 'Sneha Patel', '1993-04-18', 'FEMALE', 'sneha@example.com', 'sneha.patel@company.com', '+91 9876543214', 4, 1, 1, 1, 'FULL_TIME', '$2b$10$VRibKdL4zq9XhsWdWBf7mOnIKJR1VeX1xppqb91VRzcWBvP9e2BlW', 'ACTIVE', 1),
(5, 'EMP005', 'Suresh Babu', '1985-09-12', 'MALE', 'suresh@example.com', 'suresh.babu@company.com', '+91 9876543215', 3, 1, 1, 3, 'FULL_TIME', '$2b$10$VRibKdL4zq9XhsWdWBf7mOnIKJR1VeX1xppqb91VRzcWBvP9e2BlW', 'ACTIVE', 1)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- 8. Elections
INSERT INTO elections (
  id, title, description, election_type, start_date, end_date, status, created_by
) VALUES (
  1, 'Employee Representative', 'Annual election for employee representative committee.', 'General',
  '2020-01-01 00:00:00', '2099-01-01 00:00:00', 'ACTIVE', 1
) ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 9. Candidates for Election 1
INSERT INTO candidates (
  id, election_id, employee_id, employee_name, department_id, branch_id, location_id, description, vote_count
) VALUES
(1, 1, 'EMP001', 'Arun Kumar', 1, 1, 1, 'Candidate for Employee Representative', 0),
(2, 1, 'EMP002', 'Priya Sharma', 2, 1, 1, 'Candidate for Employee Representative', 0),
(3, 1, 'EMP003', 'Rahul Verma', 1, 1, 1, 'Candidate for Employee Representative', 0)
ON DUPLICATE KEY UPDATE employee_name = VALUES(employee_name);

SET FOREIGN_KEY_CHECKS = 1;
