const { z } = require('zod');

const createLocationSchema = z.object({
  body: z.object({
    location_code: z.string().trim().min(1, 'Location code is required.').max(50, 'Location code max 50 chars.'),
    location_name: z.string().trim().min(1, 'Location name is required.').max(150, 'Location name max 150 chars.'),
    district: z.string().max(100).optional().nullable(),
    address_line1: z.string().max(300).optional().nullable(),
    address_line2: z.string().max(300).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(20).optional().nullable(),
    is_active: z.boolean().optional()
  })
});

const updateLocationSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    location_code: z.string().trim().min(1).max(50).optional(),
    location_name: z.string().trim().min(1).max(150).optional(),
    district: z.string().max(100).optional().nullable(),
    address_line1: z.string().max(300).optional().nullable(),
    address_line2: z.string().max(300).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(20).optional().nullable(),
    is_active: z.boolean().optional()
  })
});

const createDepartmentSchema = z.object({
  body: z.object({
    department_code: z.string().trim().min(1, 'Department code is required.').max(50, 'Department code max 50 chars.'),
    department_name: z.string().trim().min(1, 'Department name is required.').max(150, 'Department name max 150 chars.'),
    description: z.string().optional().nullable(),
    is_active: z.boolean().optional()
  })
});

const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    department_code: z.string().trim().min(1).max(50).optional(),
    department_name: z.string().trim().min(1).max(150).optional(),
    description: z.string().optional().nullable(),
    is_active: z.boolean().optional()
  })
});

const createBranchSchema = z.object({
  body: z.object({
    branch_code: z.string().trim().min(1, 'Branch code is required.').max(50),
    branch_name: z.string().trim().min(1, 'Branch name is required.').max(150),
    location_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    address: z.string().max(500).optional().nullable(),
    description: z.string().optional().nullable(),
    is_active: z.boolean().optional()
  })
});

const updateBranchSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    branch_code: z.string().trim().min(1).max(50).optional(),
    branch_name: z.string().trim().min(1).max(150).optional(),
    location_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    address: z.string().max(500).optional().nullable(),
    description: z.string().optional().nullable(),
    is_active: z.boolean().optional()
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(1).max(150).optional(),
    email: z.string().email().max(200).optional()
  })
});

const updateOrgSchema = z.object({
  body: z.object({
    org_name: z.string().trim().min(1).max(200).optional(),
    org_code: z.string().max(50).optional().nullable(),
    gstn_number: z.string().max(50).optional().nullable().or(z.literal('')),
    org_type: z.enum(['PRIVATE_COMPANY','PUBLIC_COMPANY','EDUCATIONAL_INSTITUTION','COLLEGE','SCHOOL','HOSPITAL','NGO','NON_PROFIT','OTHER']).optional(),
    official_email: z.string().email().max(200).optional().nullable().or(z.literal('')),
    contact_number: z.string().max(30).optional().nullable(),
    website: z.string().max(200).optional().nullable(),
    established_year: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().min(1800).max(2100).nullable()).optional(),
    address_line1: z.string().max(300).optional().nullable(),
    address_line2: z.string().max(300).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    district: z.string().max(100).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(20).optional().nullable(),
    primary_color: z.string().max(10).optional(),
    secondary_color: z.string().max(10).optional()
  })
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createBranchSchema,
  updateBranchSchema,
  updateProfileSchema,
  updateOrgSchema
};
