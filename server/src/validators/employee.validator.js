const { z } = require('zod');

const paginationQuerySchema = z.object({
  query: z.object({
    page: z.preprocess((val) => {
      if (val === undefined || val === '') return 1;
      const n = parseInt(val, 10);
      return isNaN(n) ? 1 : Math.max(1, n);
    }, z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => {
      if (val === undefined || val === '') return 20;
      const n = parseInt(val, 10);
      if (isNaN(n)) return 20;
      return Math.min(100, Math.max(1, n));
    }, z.number().int().min(1).max(100).default(20)),
    search: z.string().optional(),
    department_id: z.string().optional(),
    branch_id: z.string().optional(),
    location_id: z.string().optional(),
    status: z.string().optional(),
    election_id: z.string().optional()
  }).passthrough()
});

const idParamSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive('ID must be a positive integer.'))
  })
});

const createEmployeeSchema = z.object({
  body: z.object({
    employee_id: z.string().trim().min(1, 'Employee ID is required.').max(50, 'Employee ID max length is 50.'),
    employee_name: z.string().trim().min(1, 'Employee name is required.').max(150, 'Name max length is 150.'),
    date_of_birth: z.string().refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    }, { message: 'Date of birth must be a valid date in the past.' }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    personal_email: z.string().email('Invalid personal email format.').max(200).optional().or(z.literal('')),
    official_email: z.string().email('Invalid official email format.').max(200).optional().or(z.literal('')),
    phone_number: z.string().max(30).optional().or(z.literal('')),
    department_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    branch_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    location_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    designation_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    custom_designation: z.string().trim().max(150).optional().or(z.literal('')),
    employee_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(),
    joining_date: z.string().optional().or(z.literal('')),
    reporting_manager_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    password: z.string().refine((val) => !val || (val.length >= 8 && !['123456', '12345678', 'password', 'password123', 'admin123', 'emp123'].includes(val.toLowerCase())), { message: 'Password is too weak or commonly used.' }).optional().or(z.literal('')),
    account_status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional()
  }).refine((data) => {
    if (data.joining_date && data.date_of_birth) {
      return new Date(data.joining_date) >= new Date(data.date_of_birth);
    }
    return true;
  }, {
    message: 'Joining date must be on or after date of birth.',
    path: ['joining_date']
  })
});

const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    employee_name: z.string().trim().min(1).max(150).optional(),
    date_of_birth: z.string().refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    }, { message: 'Date of birth must be a valid date in the past.' }).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    personal_email: z.string().email().max(200).optional().or(z.literal('')),
    official_email: z.string().email().max(200).optional().or(z.literal('')),
    phone_number: z.string().max(30).optional().or(z.literal('')),
    department_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    branch_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    location_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    designation_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    custom_designation: z.string().trim().max(150).optional().or(z.literal('')),
    employee_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(),
    joining_date: z.string().optional().or(z.literal('')),
    reporting_manager_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    account_status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    is_active: z.boolean().optional()
  })
});

const updateEmployeeStatusSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    account_status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  })
});

module.exports = {
  paginationQuerySchema,
  idParamSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema
};
