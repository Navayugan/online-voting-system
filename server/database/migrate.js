const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('../src/config/env');

async function runSQL(conn, sql) {
  const statements = sql.split(/;\s*\n/).filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (trimmed.length > 2) {
      try {
        await conn.execute(trimmed);
      } catch (e) {
        console.error('Error on statement:', trimmed.substring(0, 80), '\n', e.message);
      }
    }
  }
}

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('📦 Applying schema...');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query(schema);
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Schema applied successfully');

  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  console.log('🌱 Seeding data...');
  await conn.query(seed);
  console.log('✅ Seed data inserted successfully');

  // Apply incremental migrations if any
  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of migrationFiles) {
      console.log(`📦 Applying incremental migration: ${file}...`);
      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await conn.query(migrationSql);
      console.log(`✅ ${file} applied successfully`);
    }
  }

  await conn.end();
  console.log('\n🎉 Migration complete!\nDatabase is clean. Create your Super Admin account at http://localhost:3000/admin-signup or http://localhost:3000/admin-login');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
