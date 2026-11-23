const { z } = require('zod');

const createElectionSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required.').max(200, 'Title max 200 chars.'),
    description: z.string().optional().nullable(),
    election_type: z.string().max(100).optional().nullable(),
    start_date: z.string().min(1, 'Start date is required.'),
    end_date: z.string().min(1, 'End date is required.'),
    status: z.enum(['DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'CANCELLED']).optional().default('DRAFT'),
    department_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    branch_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    location_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional()
  }).refine((data) => {
    return new Date(data.end_date) > new Date(data.start_date);
  }, {
    message: 'Election end date must be after start date.',
    path: ['end_date']
  })
});

const updateElectionSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    title: z.string().trim().min(1, 'Title is required.').max(200),
    description: z.string().optional().nullable(),
    election_type: z.string().max(100).optional().nullable(),
    start_date: z.string().min(1, 'Start date is required.'),
    end_date: z.string().min(1, 'End date is required.'),
    status: z.enum(['DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'CANCELLED']).optional(),
    department_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    branch_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    location_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional()
  }).refine((data) => {
    return new Date(data.end_date) > new Date(data.start_date);
  }, {
    message: 'Election end date must be after start date.',
    path: ['end_date']
  })
});

const updateElectionStatusSchema = z.object({
  params: z.object({
    id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive())
  }),
  body: z.object({
    status: z.enum(['DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'CANCELLED'])
  })
});

const createCandidateSchema = z.object({
  body: z.object({
    election_id: z.preprocess((val) => parseInt(val, 10), z.number().int().positive('Election ID is required.')),
    employee_id: z.string().trim().min(1, 'Employee ID is required.').max(50),
    employee_name: z.string().trim().min(1).max(150).optional(),
    department_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    branch_id: z.preprocess((val) => (val ? parseInt(val, 10) : null), z.number().int().positive().nullable()).optional(),
    description: z.string().optional().nullable()
  })
});

module.exports = {
  createElectionSchema,
  updateElectionSchema,
  updateElectionStatusSchema,
  createCandidateSchema
};
