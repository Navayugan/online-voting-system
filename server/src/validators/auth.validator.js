const { z } = require('zod');

// Password policy: >= 10 chars, not in deny-list, not username/employeeId
const DENIED_PASSWORDS = [
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'admin123',
  'emp123',
  'qwerty',
  'letmein'
];

function createPasswordSchema(disallowIdentifierGetter) {
  return z.string()
    .min(10, 'Password must be at least 10 characters long.')
    .refine((val) => !DENIED_PASSWORDS.includes(val.toLowerCase()), {
      message: 'Password is too common or easily guessable.'
    })
    .superRefine((val, ctx) => {
      if (disallowIdentifierGetter) {
        const id = disallowIdentifierGetter();
        if (id && val.toLowerCase() === String(id).toLowerCase()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password cannot be the same as your username or employee ID.'
          });
        }
      }
    });
}

const adminLoginSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: 'Username is required.',
      invalid_type_error: 'Username must be a string.'
    }).trim().min(1, 'Username cannot be empty.'),
    password: z.string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a string.'
    })
  })
});

const employeeLoginSchema = z.object({
  body: z.object({
    employeeId: z.string({
      required_error: 'Employee ID is required.',
      invalid_type_error: 'Employee ID must be a string.'
    }).trim().min(1, 'Employee ID cannot be empty.'),
    password: z.string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a string.'
    })
  })
});

const changeAdminPasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, 'Current password is required.'),
    new_password: z.string().min(6, 'New password must be at least 6 characters long.')
  })
});

module.exports = {
  createPasswordSchema,
  adminLoginSchema,
  employeeLoginSchema,
  changeAdminPasswordSchema
};
