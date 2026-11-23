/**
 * controllers/admin/locations.controller.js
 * Locations CRUD
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');

async function getLocations(req, res) {
  try {
    const [rows] = await db.execute(`
      SELECT l.*, COUNT(e.id) AS employee_count
      FROM locations l
      LEFT JOIN employees e ON e.location_id = l.id AND e.account_status = 'ACTIVE' AND e.deleted_at IS NULL
      GROUP BY l.id
      ORDER BY l.location_name
    `);
    return res.json({ success: true, locations: rows });
  } catch (err) {
    console.error('[getLocations]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function createLocation(req, res) {
  const { location_code, location_name, district, city, state, country, postal_code } = req.body;
  if (!location_code || !location_name) {
    return res.status(400).json({ success: false, message: 'Location code and name are required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO locations (location_code, location_name, district, city, state, country, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        location_code.trim().toUpperCase(),
        location_name.trim(),
        district ? district.trim() : null,
        city ? city.trim() : null,
        state ? state.trim() : null,
        country ? country.trim() : null,
        postal_code ? postal_code.trim() : null
      ]
    );
    await logAction(req.user.id, 'LOCATION_CREATED', 'locations', result.insertId, `Created location: ${location_name}`, req.ip);
    return res.status(201).json({ success: true, message: 'Location created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Location code already exists.' });
    console.error('[createLocation]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateLocation(req, res) {
  const { id } = req.params;
  const { location_code, location_name, district, city, state, country, postal_code, is_active } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE locations SET
        location_code = COALESCE(?, location_code),
        location_name = COALESCE(?, location_name),
        district = COALESCE(?, district),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        country = COALESCE(?, country),
        postal_code = COALESCE(?, postal_code),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        location_code ? location_code.trim().toUpperCase() : null,
        location_name ? location_name.trim() : null,
        district !== undefined ? (district ? district.trim() : null) : null,
        city !== undefined ? (city ? city.trim() : null) : null,
        state !== undefined ? (state ? state.trim() : null) : null,
        country !== undefined ? (country ? country.trim() : null) : null,
        postal_code !== undefined ? (postal_code ? postal_code.trim() : null) : null,
        is_active !== undefined ? is_active : null,
        id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }
    await logAction(req.user.id, 'LOCATION_UPDATED', 'locations', id, `Updated location: ${location_name || id}`, req.ip);
    return res.json({ success: true, message: 'Location updated.' });
  } catch (err) {
    console.error('[updateLocation]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function deleteLocation(req, res) {
  const { id } = req.params;
  const { permanent } = req.query;
  try {
    if (permanent === 'true') {
      // Unlink employees, branches, candidates, and eligibility from this location
      await db.execute(`UPDATE employees SET location_id = NULL WHERE location_id = ?`, [id]);
      await db.execute(`UPDATE branches SET location_id = NULL WHERE location_id = ?`, [id]);
      await db.execute(`UPDATE candidates SET location_id = NULL WHERE location_id = ?`, [id]);
      await db.execute(`DELETE FROM election_eligibility WHERE location_id = ?`, [id]);
      const [result] = await db.execute(`DELETE FROM locations WHERE id = ?`, [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Location not found.' });
      }
      await logAction(req.user.id, 'LOCATION_DELETED', 'locations', id, 'Location permanently deleted', req.ip);
      return res.json({ success: true, message: 'Location permanently deleted.' });
    }

    const [result] = await db.execute(`UPDATE locations SET is_active = FALSE WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }
    await logAction(req.user.id, 'LOCATION_DEACTIVATED', 'locations', id, 'Location deactivated', req.ip);
    return res.json({ success: true, message: 'Location deactivated.' });
  } catch (err) {
    console.error('[deleteLocation]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation
};
