/* End-to-end API test harness (plain Node 22, no deps). Prints PASS/FAIL/BUG lines. */
const BASE = process.env.API_BASE || 'http://127.0.0.1:8000';
const results = [];
let bugs = 0;

async function call(method, path, { token, body, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

function check(id, desc, cond, detail = '') {
  const tag = cond ? 'PASS' : 'FAIL';
  if (!cond) bugs++;
  results.push({ id, desc, tag, detail });
  console.log(`${tag}  ${id}  ${desc}${detail ? '  -> ' + detail : ''}`);
}

(async () => {
  // ---------- AUTH ----------
  let r = await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: 'admin123' } });
  check('AUTH-01', 'Admin login with seed credentials', r.status === 200 && r.data.token, `status=${r.status}`);
  let adminTok = r.data.token;

  r = await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: 'wrong' } });
  check('AUTH-02', 'Admin login wrong password -> 401', r.status === 401, `status=${r.status}`);

  const empPw = 'emp123';
  r = await call('POST', '/api/auth/employee/login', { body: { employeeId: 'EMP001', password: empPw } });
  const empTok = r.data.token;
  check('AUTH-04', 'Employee login works with the real seed password', !!empTok, `pw=${empPw}`);

  // brute-force: 15 rapid wrong logins, expect throttling (429) at some point
  let got429 = false;
  for (let i = 0; i < 15; i++) {
    const x = await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: 'bad' + i } });
    if (x.status === 429) { got429 = true; break; }
  }
  check('SEC-01', 'Login endpoint rate-limits brute force (429 after repeated failures)', got429, 'express-rate-limit is in package.json but never used');

  // malformed bodies
  r = await call('POST', '/api/auth/admin/login', { body: { username: { $ne: '' }, password: 'x' } });
  check('AUTH-05', 'Admin login with object username does not 500', r.status < 500, `status=${r.status}`);
  r = await call('POST', '/api/auth/employee/login', { body: { employeeId: 12345, password: 'x' } });
  check('AUTH-06', 'Employee login with numeric employeeId does not 500', r.status < 500, `status=${r.status}`);

  // ---------- RBAC ----------
  r = await call('GET', '/api/admin/dashboard');
  check('RBAC-01', 'Admin route without token -> 401', r.status === 401, `status=${r.status}`);
  r = await call('GET', '/api/admin/dashboard', { token: empTok });
  check('RBAC-02', 'Admin route with employee token -> 403', r.status === 403, `status=${r.status}`);
  r = await call('GET', '/api/employee/profile', { token: adminTok });
  check('RBAC-03', 'Employee route with admin token -> 403', r.status === 403, `status=${r.status}`);
  r = await call('GET', '/api/admin/dashboard', { token: 'garbage.token.value' });
  check('RBAC-04', 'Invalid/expired token returns 401 (not 403)', r.status === 401, `status=${r.status} (frontend interceptor treats 401 and 403 identically)`);

  // the 3 seeded admins have roles SUPER_ADMIN / CEO / HR - do they differ in power?
  r = await call('POST', '/api/auth/admin/login', { body: { username: 'hr', password: 'admin123' } });
  const hrTok = r.data.token;
  r = await call('GET', '/api/admin/audit-logs', { token: hrTok });
  check('RBAC-05', 'Role-based admin permissions exist (HR admin should NOT read audit logs / reset passwords)', r.status === 403, `HR admin got status=${r.status}; every admin has full power`);

  // Dead voting router: is the unauthenticated vote endpoint reachable?
  r = await call('POST', '/api/voting/elections/1/vote', { body: { employeeId: 1, candidateId: 1 } });
  check('SEC-02', 'Legacy unauthenticated /api/voting routes are not exposed', r.status === 404, `status=${r.status}`);

  // ---------- Dashboard / data ----------
  r = await call('GET', '/api/admin/dashboard', { token: adminTok });
  check('DASH-01', 'Dashboard loads', r.status === 200 && r.data.success, `status=${r.status}`);

  // ---------- Elections list counts (JOIN fan-out) ----------
  // Cast one vote first, as EMP001, for candidate 2
  r = await call('GET', '/api/employee/elections', { token: empTok });
  check('EMP-01', 'Employee sees active seeded election', r.status === 200 && r.data.elections.length === 1, `count=${r.data.elections?.length}`);
  r = await call('POST', '/api/employee/elections/1/vote', { token: empTok, body: { candidateId: 2 } });
  check('VOTE-01', 'Employee can cast a vote', r.status === 200, `status=${r.status} ${JSON.stringify(r.data)}`);
  r = await call('POST', '/api/employee/elections/1/vote', { token: empTok, body: { candidateId: 3 } });
  check('VOTE-02', 'Second vote same election rejected 409', r.status === 409, `status=${r.status}`);

  r = await call('GET', '/api/admin/elections', { token: adminTok });
  const el = r.data.elections.find(e => e.id === 1);
  check('BUG-COUNT-01', 'Election list shows correct total_votes (1 vote cast)', Number(el.total_votes) === 1, `total_votes=${el.total_votes}, candidate_count=${el.candidate_count} (3 candidates, 1 vote) - JOIN fan-out`);
  check('BUG-COUNT-02', 'Election list shows correct candidate_count (3)', Number(el.candidate_count) === 3, `candidate_count=${el.candidate_count}`);

  r = await call('GET', '/api/admin/elections/1', { token: adminTok });
  check('COUNT-03', 'Single-election total_votes correct', Number(r.data.election.total_votes) === 1, `total_votes=${r.data.election.total_votes}`);


  // ---------- Eligibility ----------
  // Create a restricted election (only Finance dept id=3), make active, add candidate, EMP001 (IT) should be refused.
  r = await call('POST', '/api/admin/elections', { token: adminTok, body: {
    title: 'Finance Only', start_date: '2020-01-01 00:00:00', end_date: '2099-01-01 00:00:00', status: 'ACTIVE', department_id: 3 } });
  const finId = r.data.id;
  check('ELIG-00', 'Create restricted election', r.status === 201, `id=${finId}`);
  await call('POST', '/api/admin/candidates', { token: adminTok, body: { election_id: finId, employee_id: 'EMP005', employee_name: 'Suresh Babu' } });
  r = await call('GET', '/api/employee/elections', { token: empTok });
  check('ELIG-01', 'IT employee does not see Finance-only election in list', !r.data.elections.some(e => e.id === finId), `ids=${r.data.elections.map(e => e.id)}`);
  r = await call('GET', `/api/employee/elections/${finId}/candidates`, { token: empTok });
  check('ELIG-02', 'IT employee cannot fetch candidates of an election they are not eligible for', r.status === 403 || r.status === 404, `status=${r.status} candidates=${r.data.candidates?.length}`);
  r = await call('GET', `/api/employee/elections/${finId}`, { token: empTok });
  check('ELIG-03', 'IT employee cannot fetch details of an election they are not eligible for', r.status === 403 || r.status === 404, `status=${r.status}`);
  const candId = (await call('GET', `/api/admin/candidates?election_id=${finId}`, { token: adminTok })).data.candidates[0].id;
  r = await call('POST', `/api/employee/elections/${finId}/vote`, { token: empTok, body: { candidateId: candId } });
  check('ELIG-04', 'IT employee vote in Finance-only election rejected (403 expected)', r.status === 403, `status=${r.status}`);

  // DRAFT election leak
  r = await call('POST', '/api/admin/elections', { token: adminTok, body: { title: 'Secret Draft', start_date: '2030-01-01 00:00:00', end_date: '2030-02-01 00:00:00' } });
  const draftId = r.data.id;
  r = await call('GET', `/api/employee/elections/${draftId}`, { token: empTok });
  check('LEAK-01', 'Employee cannot read DRAFT election details by guessing id', r.status === 403 || r.status === 404, `status=${r.status}`);

  // ---------- Admin integrity ----------
  // Reopen closed election, change dates, delete candidates in an ACTIVE election
  r = await call('PATCH', '/api/admin/elections/1/status', { token: adminTok, body: { status: 'CLOSED' } });
  r = await call('PATCH', '/api/admin/elections/1/status', { token: adminTok, body: { status: 'ACTIVE' } });
  check('INTEG-01', 'A CLOSED election cannot be re-opened (state machine)', r.status === 400 || r.status === 409, `status=${r.status}`);
  r = await call('PUT', '/api/admin/elections/1', { token: adminTok, body: { title: 'x', start_date: '2030-01-02', end_date: '2030-01-01', status: 'ACTIVE' } });
  check('INTEG-02', 'Election end date before start date rejected server-side', r.status === 400, `status=${r.status}`);
  r = await call('POST', '/api/admin/elections', { token: adminTok, body: { title: 'bad status', start_date: '2030-01-01', end_date: '2030-02-01', status: 'BANANA' } });
  check('INTEG-03', 'Invalid election status on create -> 400 (not 500)', r.status === 400, `status=${r.status}`);
  r = await call('PUT', '/api/admin/elections/1', { token: adminTok, body: { title: 'only title' } });
  check('INTEG-04', 'Partial election update -> 400 validation (not 500)', r.status === 400, `status=${r.status}`);
  r = await call('PATCH', '/api/admin/elections/99999/status', { token: adminTok, body: { status: 'ACTIVE' } });
  check('INTEG-05', 'Status change on non-existent election -> 404', r.status === 404, `status=${r.status}`);
  r = await call('PUT', '/api/admin/departments/99999', { token: adminTok, body: { department_code: 'ZZ', department_name: 'Zed' } });
  check('INTEG-06', 'Update non-existent department -> 404', r.status === 404, `status=${r.status}`);

  // candidate must be a real employee
  r = await call('POST', '/api/admin/candidates', { token: adminTok, body: { election_id: draftId, employee_id: 'NOT-REAL-999', employee_name: 'Ghost' } });
  check('INTEG-07', 'Candidate must reference an existing employee', r.status === 400 || r.status === 404, `status=${r.status}`);

  // Activating an election with no candidates
  r = await call('PATCH', `/api/admin/elections/${draftId}/status`, { token: adminTok, body: { status: 'ACTIVE' } });
  check('INTEG-08', 'Cannot activate an election with zero candidates', r.status === 400, `status=${r.status}`);

  // ---------- Validation / undefined-bind 500s ----------
  r = await call('POST', '/api/admin/locations', { token: adminTok, body: { location_code: 'x1', location_name: 'Only Required Fields' } });
  check('VAL-01', 'Create location with only required fields works (not 500)', r.status === 201, `status=${r.status} ${JSON.stringify(r.data)}`);
  r = await call('PUT', '/api/admin/profile', { token: adminTok, body: { full_name: 'New Name' } });
  check('VAL-02', 'Update admin profile with only full_name works (not 500)', r.status === 200, `status=${r.status} ${JSON.stringify(r.data)}`);
  r = await call('POST', '/api/admin/organization', { token: adminTok, body: {} });
  r = await call('PUT', '/api/admin/organization', { token: adminTok, body: { org_name: 'Only Name' } });
  check('VAL-03', 'Update organization with only org_name works (not 500)', r.status === 200, `status=${r.status} ${JSON.stringify(r.data)}`);
  // Reactivation bug: deactivate a department, then PUT edit with no is_active
  await call('DELETE', '/api/admin/departments/6', { token: adminTok });
  await call('PUT', '/api/admin/departments/6', { token: adminTok, body: { department_code: 'ADMIN', department_name: 'Administration (renamed)' } });
  r = await call('GET', '/api/admin/departments', { token: adminTok });
  const d6 = r.data.departments.find(d => d.id === 6);
  check('BUG-REACT', 'Editing a deactivated department must not silently re-activate it', !d6.is_active, `is_active=${d6.is_active} (frontend also hard-codes is_active:true on every edit)`);

  // Pagination abuse
  r = await call('GET', '/api/admin/employees?limit=abc', { token: adminTok });
  check('PAGE-01', 'Non-numeric limit handled (400 or default), not 500', r.status < 500, `status=${r.status}`);
  r = await call('GET', '/api/admin/employees?limit=20&page=1', { token: adminTok });
  check('PAGE-02', 'Normal pagination works (LIMIT ? with prepared stmt on MySQL 8.0.22+)', r.status === 200, `status=${r.status} ${typeof r.data === 'object' ? JSON.stringify(r.data).slice(0, 120) : ''}`);

  // ---------- Results/participation accuracy ----------
  r = await call('GET', `/api/admin/results/${finId}`, { token: adminTok });
  check('BUG-ELIG-COUNT', 'Results "eligible voters" respects the election eligibility rule (Finance-only => 1 employee)', Number(r.data.eligibleEmployees) === 1, `eligibleEmployees=${r.data.eligibleEmployees} (counts ALL active employees)`);
  r = await call('GET', `/api/admin/participation/${finId}`, { token: adminTok });
  check('BUG-PART-COUNT', 'Participation list respects eligibility rule (should list only Finance employees)', r.data.total === 1, `total=${r.data.total}`);

  // ---------- Employee lifecycle ----------
  r = await call('PATCH', '/api/admin/employees/1/status', { token: adminTok, body: { account_status: 'SUSPENDED' } });
  r = await call('GET', '/api/employee/profile', { token: empTok });
  check('SESS-01', 'Suspended employee\'s existing JWT is rejected immediately', r.status === 401 || r.status === 403, `status=${r.status} (token stays valid up to 8h)`);
  await call('PATCH', '/api/admin/employees/1/status', { token: adminTok, body: { account_status: 'ACTIVE' } });

  // Password policy / bulk default password
  r = await call('POST', '/api/admin/employees/bulk', { token: adminTok, body: { employees: [{ employee_id: 'BULK1', employee_name: 'Bulk One', date_of_birth: '1990-01-01' }] } });
  r = await call('POST', '/api/auth/employee/login', { body: { employeeId: 'BULK1', password: 'BULK1' } });
  check('SEC-04', 'Bulk-imported employees do NOT get password == employee id', r.status !== 200, `login with password==employeeId status=${r.status}`);

  // Excel serial date in bulk import
  r = await call('POST', '/api/admin/employees/bulk', { token: adminTok, body: { employees: [{ employee_id: 'BULK2', employee_name: 'Bulk Two', date_of_birth: 32874 }] } });
  check('BULK-01', 'Bulk import reports skipped/invalid rows to the admin', r.data.skipped !== undefined || r.data.errors !== undefined, `response=${JSON.stringify(r.data)}`);

  // Admin password change keeps old token valid
  r = await call('POST', '/api/admin/profile/change-password', { token: adminTok, body: { current_password: 'admin123', new_password: 'newpass123' } });
  r = await call('GET', '/api/admin/dashboard', { token: adminTok });
  check('SESS-02', 'Old admin JWT invalid after password change', r.status === 401, `status=${r.status}`);
  const newTok = (await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: 'newpass123' } })).data?.token;
  await call('POST', '/api/admin/profile/change-password', { token: newTok || adminTok, body: { current_password: 'newpass123', new_password: 'admin123' } });
  adminTok = (await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: 'admin123' } })).data?.token || adminTok;

  // Headers
  r = await call('GET', '/api/public/organization');
  check('SEC-05', 'Security headers present (helmet): x-content-type-options', r.headers.get('x-content-type-options') === 'nosniff', `x-powered-by=${r.headers.get('x-powered-by')}`);

  // 404 JSON & trailing
  r = await call('GET', '/api/nope');
  check('MISC-01', 'Unknown route returns JSON 404', r.status === 404 && typeof r.data === 'object', `status=${r.status}`);

  // Audit coverage
  r = await call('GET', '/api/admin/audit-logs?limit=100', { token: adminTok });
  const logs = Array.isArray(r.data?.logs) ? r.data.logs : [];
  const actions = new Set(logs.map(l => l.action));
  check('AUDIT-01', 'Audit log covers logins (LOGIN / LOGIN_FAILED)', actions.has('ADMIN_LOGIN') || actions.has('LOGIN') || actions.has('LOGIN_FAILED'), `distinct actions=${[...actions].join(',')}`);
  check('AUDIT-02', 'Audit log covers vote casting / candidate updates / profile updates', actions.has('VOTE_CAST') || actions.has('CANDIDATE_UPDATED'), '');


  // ---------- second pass (real assertions) ----------
  const { execSync } = require('child_process');
  const sql = q => execSync(`mysql -h${process.env.MYSQL_HOST||'127.0.0.1'} -u${process.env.MYSQL_USER||'root'} -N -B ${process.env.DB_NAME||'employee_voting_system'} -e "${q}" 2>/dev/null`, { env: process.env }).toString().trim();
  const bulk = Array.from({ length: 300 }, (_, i) => ({ employee_id: `LOAD${i}`, employee_name: `Load ${i}`, date_of_birth: '1990-01-01' }));
  await call('POST', '/api/admin/employees/bulk', { token: adminTok, body: { employees: bulk } });
  r = await call('GET', '/api/admin/employees?limit=100000', { token: adminTok });
  check('PAGE-03', 'Huge limit is clamped to a sane maximum (<=100 rows)', (r.data.employees?.length ?? 0) <= 100, `rows=${r.data.employees?.length}`);
  r = await call('GET', '/api/admin/employees?page=0&limit=20', { token: adminTok });
  check('PAGE-04', 'page=0 does not 500', r.status < 500, `status=${r.status}`);
  r = await call('GET', '/api/admin/employees?search=%25', { token: adminTok });
  check('PAGE-05', 'LIKE wildcards in search are escaped', r.data.total === 0, `total=${r.data.total}`);

  const emp2 = (await call('POST', '/api/auth/employee/login', { body: { employeeId: 'EMP003', password: 'emp123' } })).data.token;
  r = await call('POST', '/api/admin/elections', { token: adminTok, body: { title: 'Race', start_date: '2020-01-01 00:00:00', end_date: '2099-01-01 00:00:00', status: 'ACTIVE' } });
  const raceId = r.data.id;
  const rc = await call('POST', '/api/admin/candidates', { token: adminTok, body: { election_id: raceId, employee_id: 'EMP001', employee_name: 'A' } });
  await call('POST', '/api/admin/candidates', { token: adminTok, body: { election_id: raceId, employee_id: 'EMP002', employee_name: 'B' } });
  const rs = await Promise.all(Array.from({ length: 25 }, (_, i) => call('POST', `/api/employee/elections/${raceId}/vote`, { token: emp2, body: { candidateId: rc.data.id + (i % 2) } })));
  check('RACE-01', '25 parallel votes by one voter -> exactly one counted, no 5xx', rs.filter(x => x.status === 200).length === 1 && rs.every(x => x.status < 500), `200s=${rs.filter(x => x.status === 200).length}`);
  check('INTEG-VC', 'Results are derived from the votes table (or counter cannot drift)', (() => { sql(`DELETE FROM votes WHERE election_id=${raceId}`); return sql(`SELECT COALESCE(SUM(vote_count),0) FROM candidates WHERE election_id=${raceId}`) === '0'; })(), 'results read candidates.vote_count which survives deletion of vote rows');

  const tbls = sql("SELECT table_name FROM information_schema.columns WHERE table_schema=DATABASE() AND column_name IN ('candidate_id','employee_id','voter_id') GROUP BY table_name HAVING SUM(column_name='candidate_id')>0 AND SUM(column_name IN ('employee_id','voter_id'))>0");
  check('SEC-03', 'Ballot secrecy: no table links a voter to a candidate', tbls === '', `tables linking voter+candidate: ${tbls || 'none'}`);

  const cr = await call('POST', '/api/admin/employees', { token: adminTok, body: { employee_id: 'TZ1', employee_name: 'Tz', date_of_birth: '1990-05-15', password: 'Str0ng!pass' } });
  const ge = await call('GET', `/api/admin/employees/${cr.data.id}`, { token: adminTok });
  check('TZ-01', 'DATE columns are returned as plain YYYY-MM-DD (no timezone shift)', ge.data.employee?.date_of_birth === '1990-05-15', `got ${ge.data.employee?.date_of_birth}`);
  const el2 = await call('POST', '/api/admin/elections', { token: adminTok, body: { title: 'TZ', start_date: '2026-10-20T09:00', end_date: '2026-10-21T17:00' } });
  const g2 = await call('GET', `/api/admin/elections/${el2.data.id}`, { token: adminTok });
  check('TZ-02', 'Election datetimes round-trip without timezone drift', /^2026-10-20[T ]09:00/.test(String(g2.data.election.start_date)), `got ${g2.data.election.start_date}`);

  r = await call('POST', '/api/admin/elections', { token: adminTok, body: { title: 'Past', start_date: '2020-01-01 00:00:00', end_date: '2020-02-01 00:00:00', status: 'ACTIVE' } });
  const lst = await call('GET', '/api/admin/elections?limit=100', { token: adminTok });
  check('STATE-01', 'Elections past end_date are not reported ACTIVE', lst.data.elections.find(e => e.id === r.data.id).status !== 'ACTIVE', 'no scheduler/derived status');
  r = await call('POST', '/api/admin/candidates', { token: adminTok, body: { election_id: raceId, employee_id: 'EMP004', employee_name: 'Late' } });
  check('INTEG-09', 'Candidates cannot be added to an ACTIVE election', r.status >= 400 && r.status < 500, `status=${r.status}`);
  r = await call('GET', '/api/admin/results/' + raceId, { token: adminTok });
  check('RES-01', 'Results hidden from admin API while election is ACTIVE (or explicitly flagged)', r.status === 403 || r.data.provisional === true, `status=${r.status}`);
  r = await call('POST', '/api/admin/departments', { token: adminTok, body: { department_code: 'BIG', department_name: 'x'.repeat(5000) } });
  check('VAL-LEN', 'Over-long field -> 400 not 500', r.status === 400, `status=${r.status}`);
  r = await call('POST', '/api/admin/employees', { token: adminTok, body: { employee_id: 'BAD2', employee_name: 'B', date_of_birth: 'garbage', password: 'Str0ng!pass' } });
  check('VAL-DOB', 'Garbage DOB -> 400 not 500', r.status === 400, `status=${r.status}`);
  r = await call('POST', '/api/admin/employees', { token: adminTok, body: { employee_id: 'BAD3', employee_name: 'B', date_of_birth: '2099-12-31', official_email: 'nope', password: 'Str0ng!pass' } });
  check('VAL-EMP', 'Future DOB / invalid email -> 400', r.status === 400, `status=${r.status}`);
  r = await call('POST', '/api/admin/employees', { token: adminTok, body: { employee_id: 'WEAK1', employee_name: 'W', date_of_birth: '1990-01-01', password: '123456' } });
  check('SEC-PW', 'Weak password rejected', r.status === 400, `status=${r.status}`);

  console.log(`\n==== SUMMARY: ${results.filter(x => x.tag === 'PASS').length} pass, ${bugs} fail, ${results.length} total ====`);
  require('fs').writeFileSync('/tmp/ovms_api_results.json', JSON.stringify(results, null, 2));
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
process.on('exit', () => { if (bugs) process.exitCode = 1; });
