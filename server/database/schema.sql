-- ============================================================
-- Organization Employee Voting Management System
-- Database Schema v2.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS employee_voting_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE employee_voting_system;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS ballots;
DROP TABLE IF EXISTS voter_roll;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS election_eligibility;
DROP TABLE IF EXISTS elections;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS designations;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS organization_settings;
DROP TABLE IF EXISTS organizations;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Table: organizations
-- ============================================================
CREATE TABLE organizations (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  org_name          VARCHAR(200) NOT NULL,
  org_code          VARCHAR(50),
  gstn_number       VARCHAR(50),
  org_type          ENUM('PRIVATE_COMPANY','PUBLIC_COMPANY','EDUCATIONAL_INSTITUTION','COLLEGE','SCHOOL','HOSPITAL','NGO','NON_PROFIT','OTHER') NOT NULL DEFAULT 'PRIVATE_COMPANY',
  official_email    VARCHAR(200),
  contact_number    VARCHAR(30),
  website           VARCHAR(200),
  established_year  YEAR,
  address_line1     VARCHAR(300),
  address_line2     VARCHAR(300),
  country           VARCHAR(100),
  state             VARCHAR(100),
  district          VARCHAR(100),
  city              VARCHAR(100),
  postal_code       VARCHAR(20),
  logo_url          VARCHAR(500),
  primary_color     VARCHAR(10) DEFAULT '#1e40af',
  secondary_color   VARCHAR(10) DEFAULT '#7c3aed',
  is_setup_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: admins
-- ============================================================
CREATE TABLE admins (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(200),
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150),
  role          ENUM('SUPER_ADMIN', 'CEO', 'MD', 'HR', 'MANAGER', 'DIRECTOR') DEFAULT 'MANAGER',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  token_version INT NOT NULL DEFAULT 1,
  last_login    TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: departments
-- ============================================================
CREATE TABLE departments (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(50)  NOT NULL UNIQUE,
  department_name VARCHAR(150) NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dept_name (department_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: locations
-- ============================================================
CREATE TABLE locations (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  location_code  VARCHAR(50)  NOT NULL UNIQUE,
  location_name  VARCHAR(150) NOT NULL,
  district       VARCHAR(100),
  city           VARCHAR(100),
  state          VARCHAR(100),
  country        VARCHAR(100),
  postal_code    VARCHAR(20),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: branches
-- ============================================================
CREATE TABLE branches (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  branch_code VARCHAR(50)  NOT NULL UNIQUE,
  branch_name VARCHAR(150) NOT NULL,
  location_id INT,
  address     TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_branch_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: designations
-- ============================================================
CREATE TABLE designations (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  designation_code VARCHAR(50)  NOT NULL UNIQUE,
  designation_name VARCHAR(150) NOT NULL,
  department_id    INT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_designation_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: employees
-- ============================================================
CREATE TABLE employees (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  employee_id      VARCHAR(50)  NOT NULL UNIQUE,
  employee_name    VARCHAR(150) NOT NULL,
  date_of_birth    DATE         NOT NULL,
  gender           ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'),
  personal_email   VARCHAR(200),
  official_email   VARCHAR(200),
  phone_number     VARCHAR(30),
  department_id    INT,
  branch_id        INT,
  location_id      INT,
  designation_id   INT,
  employee_type    ENUM('FULL_TIME','PART_TIME','CONTRACT','INTERN','CONSULTANT') DEFAULT 'FULL_TIME',
  joining_date     DATE,
  reporting_manager_id INT,
  password_hash    VARCHAR(255) NOT NULL,
  account_status   ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  token_version    INT NOT NULL DEFAULT 1,
  deleted_at       DATETIME NULL DEFAULT NULL,
  is_active        BOOLEAN GENERATED ALWAYS AS (account_status = 'ACTIVE') STORED,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_emp_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_emp_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_emp_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_emp_designation
    FOREIGN KEY (designation_id) REFERENCES designations(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_emp_manager
    FOREIGN KEY (reporting_manager_id) REFERENCES employees(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_employee_id (employee_id),
  INDEX idx_emp_department (department_id),
  INDEX idx_emp_branch (branch_id),
  INDEX idx_emp_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: elections
-- ============================================================
CREATE TABLE elections (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  election_type    VARCHAR(100),
  start_date       DATETIME     NOT NULL,
  end_date         DATETIME     NOT NULL,
  status           ENUM('DRAFT','UPCOMING','ACTIVE','CLOSED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  created_by       INT,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_election_admin
    FOREIGN KEY (created_by) REFERENCES admins(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_election_status (status),
  INDEX idx_election_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: election_eligibility
-- (null = all, value = only that group)
-- ============================================================
CREATE TABLE election_eligibility (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  election_id   INT NOT NULL,
  department_id INT,
  branch_id     INT,
  location_id   INT,

  CONSTRAINT fk_elig_election
    FOREIGN KEY (election_id) REFERENCES elections(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_elig_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_elig_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_elig_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: candidates
-- ============================================================
CREATE TABLE candidates (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  election_id   INT          NOT NULL,
  employee_id   VARCHAR(50)  NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  department_id INT,
  branch_id     INT,
  location_id   INT,
  description   TEXT,
  profile_image VARCHAR(500),
  vote_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cand_election
    FOREIGN KEY (election_id) REFERENCES elections(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_cand_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_cand_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  UNIQUE (election_id, employee_id),
  INDEX idx_cand_election (election_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: voter_roll (tracks WHO voted, never candidate choice)
-- ============================================================
CREATE TABLE voter_roll (
  id           INT       AUTO_INCREMENT PRIMARY KEY,
  election_id  INT       NOT NULL,
  employee_id  INT       NOT NULL COMMENT 'References employees.id',
  voted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_voter_roll_election
    FOREIGN KEY (election_id) REFERENCES elections(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_voter_roll_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  UNIQUE (election_id, employee_id),
  INDEX idx_voter_roll_election (election_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: ballots (tracks VOTES cast, no voter identity)
-- ============================================================
CREATE TABLE ballots (
  id           VARCHAR(36) PRIMARY KEY,
  election_id  INT         NOT NULL,
  candidate_id INT         NOT NULL,
  cast_at      DATETIME    NOT NULL,

  CONSTRAINT fk_ballots_election
    FOREIGN KEY (election_id) REFERENCES elections(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ballots_candidate
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_ballots_election (election_id),
  INDEX idx_ballots_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- View: votes (compatibility view for ballots)
-- ============================================================
CREATE OR REPLACE VIEW votes AS
  SELECT id, election_id, candidate_id, cast_at FROM ballots;

-- ============================================================
-- Table: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   INT,
  description TEXT,
  ip_address  VARCHAR(60),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_audit_admin (admin_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
