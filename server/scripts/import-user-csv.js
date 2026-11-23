const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const normalizeGender = (raw) => {
  if (!raw) return null;
  const g = String(raw).trim().toUpperCase();
  if (['MALE', 'M'].includes(g)) return 'MALE';
  if (['FEMALE', 'F'].includes(g)) return 'FEMALE';
  if (['OTHER', 'NON-BINARY', 'NON_BINARY', 'NONBINARY', 'ENBY', 'TRANS', 'NB'].includes(g)) return 'OTHER';
  if (['PREFER_NOT_TO_SAY', 'PREFER NOT TO SAY', 'DECLINE', 'N/A'].includes(g)) return 'PREFER_NOT_TO_SAY';
  return 'OTHER';
};

const employees = [
  { employee_id: 'EMP001', employee_name: 'Jane Doe', date_of_birth: '1992-04-15', gender: 'Female', personal_email: 'jane.doe@example.com', official_email: 'jane.doe@company.com', phone_number: '+15550192831' },
  { employee_id: 'EMP002', employee_name: 'John Smith', date_of_birth: '1988-11-23', gender: 'Male', personal_email: 'john.smith@example.com', official_email: 'john.smith@company.com', phone_number: '+15550183742' },
  { employee_id: 'EMP003', employee_name: 'Alex Rivera', date_of_birth: '1995-07-08', gender: 'Non-Binary', personal_email: null, official_email: 'alex.rivera@company.com', phone_number: '+15550149201' },
  { employee_id: 'EMP004', employee_name: 'Maria Garcia', date_of_birth: '1990-01-30', gender: 'Female', personal_email: 'maria.g@example.com', official_email: 'maria.garcia@company.com', phone_number: null },
  { employee_id: 'EMP005', employee_name: 'David Kim', date_of_birth: '1985-09-12', gender: 'Male', personal_email: null, official_email: 'david.kim@company.com', phone_number: '+15550172639' }
];

async function updateRecords() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'online_voting_system',
    port: process.env.DB_PORT || 3306
  });

  for (const emp of employees) {
    const gender = normalizeGender(emp.gender);
    const [existing] = await conn.execute('SELECT id FROM employees WHERE employee_id = ?', [emp.employee_id]);
    if (existing.length > 0) {
      await conn.execute(
        'UPDATE employees SET employee_name = ?, date_of_birth = ?, gender = ?, personal_email = ?, official_email = ?, phone_number = ? WHERE id = ?',
        [emp.employee_name, emp.date_of_birth, gender, emp.personal_email, emp.official_email, emp.phone_number, existing[0].id]
      );
      console.log('Updated', emp.employee_id, emp.employee_name, gender);
    } else {
      await conn.execute(
        'INSERT INTO employees (employee_id, employee_name, date_of_birth, gender, personal_email, official_email, phone_number, employee_type, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, "FULL_TIME", "ACTIVE")',
        [emp.employee_id, emp.employee_name, emp.date_of_birth, gender, emp.personal_email, emp.official_email, emp.phone_number]
      );
      console.log('Inserted', emp.employee_id, emp.employee_name, gender);
    }
  }

  const [verify] = await conn.execute('SELECT employee_id, employee_name, gender, personal_email, official_email, phone_number FROM employees WHERE employee_id LIKE "EMP%"');
  console.log('Current DB state:');
  console.table(verify);
  await conn.end();
}

updateRecords().catch(console.error);
