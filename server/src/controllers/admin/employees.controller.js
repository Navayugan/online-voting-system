/**
 * controllers/admin/employees.controller.js
 * Employee management
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');
const { BCRYPT_ROUNDS } = require('../../config/constants');
const { escapeLike } = require('../../middleware/validate');

async function getEmployees(req, res) {
  let { search, department_id, branch_id, location_id, status, page = 1, limit = 20 } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  let where = 'e.deleted_at IS NULL';
  const params = [];

  if (search && typeof search === 'string' && search.trim() !== '') {
    const escaped = escapeLike(search.trim());
    where += ` AND (e.employee_id LIKE ? OR e.employee_name LIKE ?)`;
    params.push(`%${escaped}%`, `%${escaped}%`);
  }
  if (department_id) { where += ` AND e.department_id = ?`; params.push(department_id); }
  if (branch_id) { where += ` AND e.branch_id = ?`; params.push(branch_id); }
  if (location_id) { where += ` AND e.location_id = ?`; params.push(location_id); }
  if (status) { where += ` AND e.account_status = ?`; params.push(status); }

  try {
    const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM employees e WHERE ${where}`, params);
    const [rows] = await db.execute(
      `SELECT e.id, e.employee_id, e.employee_name, e.gender, e.official_email, e.phone_number,
              e.account_status, e.employee_type, e.joining_date, e.created_at,
              d.department_name, b.branch_name, l.location_name, des.designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE ${where}
       ORDER BY e.employee_name
       LIMIT ? OFFSET ?`,
      [...params, l, offset]
    );

    return res.json({ success: true, employees: rows, total, page: p, limit: l });
  } catch (err) {
    console.error('[getEmployees]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getEmployee(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.employee_id, e.employee_name, e.date_of_birth, e.gender, e.personal_email,
              e.official_email, e.phone_number, e.department_id, e.branch_id, e.location_id,
              e.designation_id, e.employee_type, e.joining_date, e.account_status, e.created_at, e.updated_at,
              d.department_name, b.branch_name, l.location_name, des.designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE e.id = ? AND e.deleted_at IS NULL`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    return res.json({ success: true, employee: rows[0] });
  } catch (err) {
    console.error('[getEmployee]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createEmployee(req, res) {
  const { employee_id, employee_name, date_of_birth, gender, personal_email, official_email,
    phone_number, department_id, branch_id, location_id, designation_id, custom_designation, employee_type,
    joining_date, password, account_status } = req.body;

  if (!employee_id || !employee_name || !date_of_birth) {
    return res.status(400).json({ success: false, message: 'Employee ID, name, and date of birth are required.' });
  }

  try {
    const [existingWithId] = await db.execute('SELECT id, deleted_at FROM employees WHERE employee_id = ?', [employee_id.trim()]);
    if (existingWithId.length > 0) {
      if (existingWithId[0].deleted_at) {
        return res.status(409).json({ success: false, message: 'This ID exists in the Recycle Bin. Restore it or permanently delete it first.' });
      }
      return res.status(409).json({ success: false, message: 'ID already exists.' });
    }
    let finalDesignationId = designation_id || null;
    if (!finalDesignationId && custom_designation && custom_designation.trim()) {
      const manualName = custom_designation.trim();
      const [existing] = await db.execute(
        `SELECT id FROM designations WHERE LOWER(designation_name) = LOWER(?) LIMIT 1`,
        [manualName]
      );
      if (existing.length > 0) {
        finalDesignationId = existing[0].id;
      } else {
        const slug = manualName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() || 'DES';
        const rand = Math.floor(1000 + Math.random() * 9000);
        const code = `${slug}_${rand}`;
        const [desRes] = await db.execute(
          `INSERT INTO designations (designation_code, designation_name, department_id, is_active) VALUES (?, ?, ?, TRUE)`,
          [code, manualName, department_id || null]
        );
        finalDesignationId = desRes.insertId;
        await logAction(req.user.id, 'DESIGNATION_CREATED', 'designations', finalDesignationId, `Created designation: ${manualName}`, req.ip);
      }
    }

    const initialStatus = (account_status && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(account_status)) ? account_status : 'ACTIVE';
    const rawPassword = (password && password.trim()) || employee_id.trim();
    const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
    const [result] = await db.execute(
      `INSERT INTO employees (employee_id, employee_name, date_of_birth, gender, personal_email, official_email, phone_number, department_id, branch_id, location_id, designation_id, employee_type, joining_date, password_hash, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id.trim(), employee_name.trim(), date_of_birth, gender || null, personal_email || null,
       official_email || null, phone_number || null, department_id || null, branch_id || null,
       location_id || null, finalDesignationId, employee_type || 'FULL_TIME', joining_date || null, passwordHash, initialStatus]
    );
    await logAction(req.user.id, 'EMPLOYEE_CREATED', 'employees', result.insertId, `Created employee: ${employee_name} (${employee_id})`, req.ip);
    return res.status(201).json({ success: true, message: 'Employee created successfully.', id: result.insertId, designation_id: finalDesignationId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    console.error('[createEmployee]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateEmployee(req, res) {
  const { id } = req.params;
  const { employee_id, employee_name, date_of_birth, gender, personal_email, official_email,
    phone_number, department_id, branch_id, location_id, designation_id, custom_designation, employee_type, joining_date, account_status } = req.body;

  try {
    let finalDesignationId = designation_id !== undefined ? designation_id : undefined;
    if (custom_designation && custom_designation.trim()) {
      const manualName = custom_designation.trim();
      const [existing] = await db.execute(
        `SELECT id FROM designations WHERE LOWER(designation_name) = LOWER(?) LIMIT 1`,
        [manualName]
      );
      if (existing.length > 0) {
        finalDesignationId = existing[0].id;
      } else {
        const slug = manualName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() || 'DES';
        const rand = Math.floor(1000 + Math.random() * 9000);
        const code = `${slug}_${rand}`;
        const [desRes] = await db.execute(
          `INSERT INTO designations (designation_code, designation_name, department_id, is_active) VALUES (?, ?, ?, TRUE)`,
          [code, manualName, department_id || null]
        );
        finalDesignationId = desRes.insertId;
        await logAction(req.user.id, 'DESIGNATION_CREATED', 'designations', finalDesignationId, `Created designation: ${manualName}`, req.ip);
      }
    }

    const [result] = await db.execute(
      `UPDATE employees SET
        employee_id = COALESCE(?, employee_id),
        employee_name = COALESCE(?, employee_name),
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender),
        personal_email = COALESCE(?, personal_email),
        official_email = COALESCE(?, official_email),
        phone_number = COALESCE(?, phone_number),
        department_id = COALESCE(?, department_id),
        branch_id = COALESCE(?, branch_id),
        location_id = COALESCE(?, location_id),
        designation_id = COALESCE(?, designation_id),
        employee_type = COALESCE(?, employee_type),
        joining_date = COALESCE(?, joining_date),
        account_status = COALESCE(?, account_status)
       WHERE id = ?`,
      [
        employee_id ? employee_id.trim() : null,
        employee_name ? employee_name.trim() : null,
        date_of_birth || null,
        gender !== undefined ? gender : null,
        personal_email !== undefined ? personal_email : null,
        official_email !== undefined ? official_email : null,
        phone_number !== undefined ? phone_number : null,
        department_id !== undefined ? department_id : null,
        branch_id !== undefined ? branch_id : null,
        location_id !== undefined ? location_id : null,
        finalDesignationId !== undefined ? finalDesignationId : null,
        employee_type !== undefined ? employee_type : null,
        joining_date !== undefined ? joining_date : null,
        account_status !== undefined ? account_status : null,
        id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    await logAction(req.user.id, 'EMPLOYEE_UPDATED', 'employees', id, `Updated employee ID ${id}`, req.ip);
    return res.json({ success: true, message: 'Employee updated successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    console.error('[updateEmployee]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateEmployeeStatus(req, res) {
  const { id } = req.params;
  const { account_status } = req.body;
  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (!validStatuses.includes(account_status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    // When suspending or inactivating, bump token_version so tokens immediately stop working
    const [result] = await db.execute(
      `UPDATE employees SET account_status = ?, token_version = token_version + 1 WHERE id = ?`,
      [account_status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    await logAction(req.user.id, 'EMPLOYEE_STATUS_CHANGED', 'employees', id, `Status changed to ${account_status}`, req.ip);
    return res.json({ success: true, message: `Employee status updated to ${account_status}.` });
  } catch (err) {
    console.error('[updateEmployeeStatus]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function resetEmployeePassword(req, res) {
  const { id } = req.params;
  const { new_password } = req.body;
  if (!new_password || new_password.length < 10) {
    return res.status(400).json({ success: false, message: 'Password must be at least 10 characters.' });
  }
  try {
    const hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    const [result] = await db.execute(
      `UPDATE employees SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`,
      [hash, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    await logAction(req.user.id, 'EMPLOYEE_PASSWORD_RESET', 'employees', id, 'Password reset by admin', req.ip);
    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[resetEmployeePassword]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function bulkCreateEmployees(req, res) {
  const { employees, updateExisting } = req.body;
  const isDryRun = req.query.dryRun === 'true' || req.query.dryRun === true;

  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ success: false, message: 'Valid employees array is required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let addedCount = 0;
    let updatedCount = 0;
    const errors = [];
    const skipped = [];
    const credentials = [];

    // Helper to parse dates including Excel serial numbers (1 = 1900-01-01)
    const parseFlexibleDate = (raw) => {
      if (!raw) return null;
      if (typeof raw === 'number') {
        // Excel serial date to JS Date: subtract 25569 (days between 1900 and 1970) * 86400 * 1000
        const jsDate = new Date((raw - 25569) * 86400 * 1000);
        return isNaN(jsDate.getTime()) ? null : jsDate.toISOString().slice(0, 10);
      }
      const parsed = new Date(raw);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
    };

    // Helper to map and sanitize gender to MySQL ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')
    const normalizeGender = (raw) => {
      if (!raw) return null;
      const g = String(raw).trim().toUpperCase();
      if (['MALE', 'M'].includes(g)) return 'MALE';
      if (['FEMALE', 'F'].includes(g)) return 'FEMALE';
      if (['OTHER', 'NON-BINARY', 'NON_BINARY', 'NONBINARY', 'ENBY', 'TRANS', 'NB'].includes(g)) return 'OTHER';
      if (['PREFER_NOT_TO_SAY', 'PREFER NOT TO SAY', 'DECLINE', 'N/A'].includes(g)) return 'PREFER_NOT_TO_SAY';
      return 'OTHER';
    };

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const { employee_id, employee_name, date_of_birth, gender, personal_email, official_email, phone_number } = emp;
      
      if (!employee_id || !employee_name || !date_of_birth) {
        skipped.push({ row: i + 1, reason: 'Missing required fields (id, name, or dob)' });
        continue;
      }

      const parsedDob = parseFlexibleDate(date_of_birth);
      if (!parsedDob) {
        skipped.push({ row: i + 1, employee_id, reason: 'Invalid date format for date_of_birth' });
        continue;
      }

      const parsedGender = normalizeGender(gender);

      // Check duplicate ID
      const [existing] = await connection.execute('SELECT id FROM employees WHERE employee_id = ?', [employee_id.trim()]);
      if (existing.length > 0) {
        if (updateExisting) {
          if (isDryRun) {
            updatedCount++;
            continue;
          }
          try {
            await connection.execute(
              `UPDATE employees 
               SET employee_name = ?, date_of_birth = ?, gender = ?, personal_email = ?, official_email = ?, phone_number = ?
               WHERE id = ?`,
              [employee_name.trim(), parsedDob, parsedGender, personal_email || null, official_email || null, phone_number || null, existing[0].id]
            );
            updatedCount++;
          } catch (err) {
            errors.push({ row: i + 1, employee_id, error: err.message });
          }
          continue;
        } else {
          skipped.push({ row: i + 1, employee_id, reason: `Employee ID ${employee_id} already exists` });
          continue;
        }
      }

      if (isDryRun) {
        addedCount++;
        continue;
      }

      try {
        // Default employee password to employee ID
        const tempPassword = employee_id.trim();
        const empPasswordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

        await connection.execute(
          `INSERT INTO employees (employee_id, employee_name, date_of_birth, gender, personal_email, official_email, phone_number, employee_type, password_hash, account_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'FULL_TIME', ?, 'ACTIVE')`,
          [employee_id.trim(), employee_name.trim(), parsedDob, parsedGender, personal_email || null, official_email || null, phone_number || null, empPasswordHash]
        );
        addedCount++;
        credentials.push({ employee_id: employee_id.trim(), tempPassword });
      } catch (err) {
        errors.push({ row: i + 1, employee_id, error: err.message });
      }
    }
    
    if (isDryRun) {
      await connection.rollback();
      return res.json({
        success: true,
        dryRun: true,
        message: `Validation complete: ${addedCount} new rows, ${updatedCount} to update, ${skipped.length} skipped rows.`,
        validCount: addedCount + updatedCount,
        addedCount,
        updatedCount,
        skipped,
        errors
      });
    }

    await connection.commit();
    await logAction(req.user.id, 'EMPLOYEE_BULK_CREATED', 'employees', null, `Bulk added ${addedCount}, updated ${updatedCount}, skipped ${skipped.length}`, req.ip);
    return res.json({
      success: true,
      message: `Successfully imported: ${addedCount} added, ${updatedCount} updated, ${skipped.length} skipped.`,
      addedCount,
      updatedCount,
      skipped,
      errors,
      credentials
    });
  } catch (err) {
    await connection.rollback();
    console.error('[bulkCreateEmployees]', err);
    return res.status(500).json({ success: false, message: 'Server error during bulk import.' });
  } finally {
    connection.release();
  }
}

async function deleteEmployee(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT id, employee_id, employee_name, deleted_at FROM employees WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (rows[0].deleted_at) {
      return res.status(400).json({ success: false, message: 'Already in recycle bin.' });
    }

    await db.execute('UPDATE employees SET deleted_at = NOW(), token_version = token_version + 1 WHERE id = ?', [id]);
    await logAction(req.user.id, 'EMPLOYEE_DELETED', 'employees', id, `Moved to recycle bin: ${rows[0].employee_name} (${rows[0].employee_id})`, req.ip);

    return res.json({ success: true, message: 'Moved to Recycle Bin successfully.' });
  } catch (err) {
    console.error('[deleteEmployee]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getRecycleBin(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.employee_id, e.employee_name, e.gender, e.official_email, e.phone_number,
              e.account_status, e.employee_type, e.deleted_at, e.created_at,
              d.department_name, b.branch_name, l.location_name, des.designation_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN locations l ON e.location_id = l.id
       LEFT JOIN designations des ON e.designation_id = des.id
       WHERE e.deleted_at IS NOT NULL
       ORDER BY e.deleted_at DESC`
    );
    return res.json({ success: true, employees: rows, total: rows.length });
  } catch (err) {
    console.error('[getRecycleBin]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function restoreEmployee(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT id, employee_id, employee_name, deleted_at FROM employees WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (!rows[0].deleted_at) {
      return res.status(400).json({ success: false, message: 'Record is already active.' });
    }

    await db.execute('UPDATE employees SET deleted_at = NULL, token_version = token_version + 1 WHERE id = ?', [id]);
    await logAction(req.user.id, 'EMPLOYEE_RESTORED', 'employees', id, `Restored from recycle bin: ${rows[0].employee_name} (${rows[0].employee_id})`, req.ip);

    return res.json({ success: true, message: 'Restored successfully.' });
  } catch (err) {
    console.error('[restoreEmployee]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function permanentlyDeleteEmployee(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT id, employee_id, employee_name FROM employees WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // Clean up voter_roll records if any exist
    await db.execute('DELETE FROM voter_roll WHERE employee_id = ?', [id]);
    await db.execute('DELETE FROM employees WHERE id = ?', [id]);

    await logAction(req.user.id, 'EMPLOYEE_PERMANENTLY_DELETED', 'employees', id, `Permanently deleted: ${rows[0].employee_name} (${rows[0].employee_id})`, req.ip);

    return res.json({ success: true, message: 'Permanently deleted.' });
  } catch (err) {
    console.error('[permanentlyDeleteEmployee]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function restoreAllRecycleBin(req, res) {
  try {
    const [result] = await db.execute('UPDATE employees SET deleted_at = NULL, token_version = token_version + 1 WHERE deleted_at IS NOT NULL');
    await logAction(req.user.id, 'RECYCLE_BIN_RESTORE_ALL', 'employees', null, `Restored ${result.affectedRows} records from recycle bin`, req.ip);
    return res.json({ success: true, message: `Successfully restored ${result.affectedRows} records.`, count: result.affectedRows });
  } catch (err) {
    console.error('[restoreAllRecycleBin]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function emptyRecycleBin(req, res) {
  try {
    const [deleted] = await db.execute('SELECT id FROM employees WHERE deleted_at IS NOT NULL');
    if (deleted.length > 0) {
      const ids = deleted.map(d => d.id);
      await db.execute(`DELETE FROM voter_roll WHERE employee_id IN (${ids.map(() => '?').join(',')})`, ids);
      await db.execute('DELETE FROM employees WHERE deleted_at IS NOT NULL');
    }
    await logAction(req.user.id, 'RECYCLE_BIN_EMPTIED', 'employees', null, `Permanently deleted ${deleted.length} records from recycle bin`, req.ip);
    return res.json({ success: true, message: `Permanently removed ${deleted.length} records.`, count: deleted.length });
  } catch (err) {
    console.error('[emptyRecycleBin]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function removeAllEmployees(req, res) {
  try {
    const { ids, all } = req.body;
    if (all) {
      const [result] = await db.execute('UPDATE employees SET deleted_at = NOW(), token_version = token_version + 1 WHERE deleted_at IS NULL');
      await logAction(req.user.id, 'EMPLOYEES_REMOVE_ALL', 'employees', null, `Moved ${result.affectedRows} records to recycle bin`, req.ip);
      return res.json({ success: true, message: `Moved ${result.affectedRows} records to Recycle Bin.`, count: result.affectedRows });
    } else if (Array.isArray(ids) && ids.length > 0) {
      await db.execute(
        `UPDATE employees SET deleted_at = NOW(), token_version = token_version + 1 WHERE id IN (${ids.map(() => '?').join(',')}) AND deleted_at IS NULL`,
        ids
      );
      await logAction(req.user.id, 'EMPLOYEES_BULK_DELETED', 'employees', null, `Moved ${ids.length} records to recycle bin`, req.ip);
      return res.json({ success: true, message: `Moved ${ids.length} records to Recycle Bin.`, count: ids.length });
    }
    return res.status(400).json({ success: false, message: 'Invalid request. Please specify all=true or provide an array of IDs.' });
  } catch (err) {
    console.error('[removeAllEmployees]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  resetEmployeePassword,
  bulkCreateEmployees,
  deleteEmployee,
  getRecycleBin,
  restoreEmployee,
  permanentlyDeleteEmployee,
  restoreAllRecycleBin,
  emptyRecycleBin,
  removeAllEmployees
};
