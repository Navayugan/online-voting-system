-- Migration: 003_ballot_secrecy.sql
-- Separates voter participation from ballot choice to ensure true secret ballot.

CREATE TABLE IF NOT EXISTS voter_roll (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  election_id  INT NOT NULL,
  employee_id  INT NOT NULL,
  voted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_voter_roll (election_id, employee_id),
  INDEX idx_voter_roll_election (election_id),
  CONSTRAINT fk_voter_roll_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_voter_roll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ballots (
  id           VARCHAR(36) PRIMARY KEY,
  election_id  INT NOT NULL,
  candidate_id INT NOT NULL,
  cast_at      DATETIME NOT NULL,
  INDEX idx_ballots_election (election_id),
  INDEX idx_ballots_candidate (candidate_id),
  CONSTRAINT fk_ballots_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ballots_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 003_ballot_secrecy.sql
-- voter_roll and ballots tables created if not exists
