/**
 * controllers/admin/organization.controller.js
 * Organization profile & branding
 */
const db = require('../../config/db');
const { logAction } = require('../../services/auditLog');

async function getOrganization(req, res) {
  try {
    const [rows] = await db.execute(`SELECT * FROM organizations LIMIT 1`);
    return res.json({ success: true, organization: rows[0] || null });
  } catch (err) {
    console.error('[getOrganization]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function updateOrganization(req, res) {
  const {
    org_name, org_code, gstn_number, org_type, official_email, contact_number, website, established_year,
    address_line1, address_line2, country, state, district, city, postal_code,
    primary_color, secondary_color
  } = req.body;

  try {
    const [existing] = await db.execute(`SELECT id FROM organizations LIMIT 1`);
    if (existing.length === 0) {
      if (!org_name) {
        return res.status(400).json({ success: false, message: 'Organization name is required.' });
      }
      const [insertResult] = await db.execute(
        `INSERT INTO organizations (org_name, org_code, gstn_number, org_type, official_email, contact_number, website, established_year, address_line1, address_line2, country, state, district, city, postal_code, primary_color, secondary_color, is_setup_complete)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [org_name, org_code || null, gstn_number || null, org_type || 'PRIVATE_COMPANY', official_email || null, contact_number || null, website || null, established_year || null,
         address_line1 || null, address_line2 || null, country || null, state || null, district || null, city || null, postal_code || null,
         primary_color || '#1e40af', secondary_color || '#7c3aed']
      );
      await logAction(req.user.id, 'ORGANIZATION_CREATED', 'organizations', insertResult.insertId, 'Organization created', req.ip);
    } else {
      await db.execute(
        `UPDATE organizations SET
          org_name = COALESCE(?, org_name),
          org_code = COALESCE(?, org_code),
          gstn_number = COALESCE(?, gstn_number),
          org_type = COALESCE(?, org_type),
          official_email = COALESCE(?, official_email),
          contact_number = COALESCE(?, contact_number),
          website = COALESCE(?, website),
          established_year = COALESCE(?, established_year),
          address_line1 = COALESCE(?, address_line1),
          address_line2 = COALESCE(?, address_line2),
          country = COALESCE(?, country),
          state = COALESCE(?, state),
          district = COALESCE(?, district),
          city = COALESCE(?, city),
          postal_code = COALESCE(?, postal_code),
          primary_color = COALESCE(?, primary_color),
          secondary_color = COALESCE(?, secondary_color),
          is_setup_complete = TRUE
         WHERE id = ?`,
        [org_name || null, org_code || null, gstn_number || null, org_type || null, official_email || null, contact_number || null, website || null, established_year || null,
         address_line1 || null, address_line2 || null, country || null, state || null, district || null, city || null, postal_code || null,
         primary_color || null, secondary_color || null, existing[0].id]
      );
      await logAction(req.user.id, 'ORGANIZATION_UPDATED', 'organizations', existing[0].id, 'Organization profile updated', req.ip);
    }

    return res.json({ success: true, message: 'Organization updated successfully.' });
  } catch (err) {
    console.error('[updateOrganization]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getOrganization,
  updateOrganization
};
