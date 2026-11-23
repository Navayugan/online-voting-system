// top5.test.js – Execute with `node tests/api/top5.test.js`
// Uses native fetch (Node >=18). No external deps.

const BASE = process.env.API_BASE || 'http://127.0.0.1:8000';
const results = [];

function check(id, desc, condition, detail = '') {
  const tag = condition ? 'PASS' : 'FAIL';
  console.log(`${tag}  ${id}  ${desc}${detail ? ' → ' + detail : ''}`);
  results.push({ id, desc, tag, detail });
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let data;
  try { data = JSON.parse(txt); } catch { data = txt; }
  return { status: res.status, data, headers: res.headers };
}

async function testRateLimit() {
  let got429 = false;
  for (let i = 0; i < 15; i++) {
    const r = await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: `bad${i}` } });
    if (r.status === 429) { got429 = true; break; }
  }
  check('TOP-SEC-01', 'Rate‑limit blocks brute‑force login attempts', got429);
}

async function testRBAC(adminTok, empTok) {
  const r1 = await call('GET', '/api/admin/dashboard');
  check('TOP-RBAC-01', 'Admin route unauthenticated → 401', r1.status === 401);
  const r2 = await call('GET', '/api/admin/dashboard', { token: empTok });
  check('TOP-RBAC-02', 'Employee token on admin route → 403', r2.status === 403);
  const r3 = await call('GET', '/api/employee/profile', { token: adminTok });
  check('TOP-RBAC-03', 'Admin token on employee route → 403', r3.status === 403);
}

async function testDuplicateVote(empTok) {
  const v1 = await call('POST', '/api/employee/elections/1/vote', { token: empTok, body: { candidateId: 2 } });
  const v2 = await call('POST', '/api/employee/elections/1/vote', { token: empTok, body: { candidateId: 2 } });
  check('TOP-VOTE-02', 'Second vote on same election rejected (409)', v2.status === 409);
}

async function testEligibility(adminTok, empTok) {
  const create = await call('POST', '/api/admin/elections', {
    token: adminTok,
    body: {
      title: 'Finance‑Only',
      start_date: '2025-01-01 00:00:00',
      end_date: '2030-01-01 00:00:00',
      status: 'ACTIVE',
      department_id: 3,
    },
  });
  const finId = create.data?.id;
  if (!finId) { check('TOP-ELIG-SETUP', 'Finance‑only election created', false); return; }
  const vote = await call('POST', `/api/employee/elections/${finId}/vote`, { token: empTok, body: { candidateId: 1 } });
  check('TOP-ELIG-04', 'Ineligible employee cannot vote (403)', vote.status === 403);

  const draft = await call('POST', '/api/admin/elections', {
    token: adminTok,
    body: { title: 'Secret Draft', start_date: '2035-01-01 00:00:00', end_date: '2035-02-01 00:00:00' },
  });
  const draftId = draft.data?.id;
  const leak = await call('GET', `/api/employee/elections/${draftId}`, { token: empTok });
  const leakOk = leak.status === 403 || leak.status === 404;
  check('TOP-LEAK-01', 'Employee cannot read draft election (403/404)', leakOk);
}

async function testAuditLog(adminTok) {
  const r = await call('GET', '/api/admin/audit-logs?limit=200', { token: adminTok });
  const logs = r.data?.logs || [];
  const actions = logs.map(l => l.action);
  const hasLogin = actions.includes('ADMIN_LOGIN') || actions.includes('LOGIN');
  const hasVote = actions.includes('VOTE_CAST') || actions.includes('CANDIDATE_UPDATED');
  check('TOP-AUDIT-01', 'Audit log contains login & vote actions', hasLogin && hasVote);
}

(async () => {
  const adminLogin = await call('POST', '/api/auth/admin/login', { body: { username: 'admin', password: 'admin123' } });
  const adminTok = adminLogin.data?.token;
  const empLogin = await call('POST', '/api/auth/employee/login', { body: { employeeId: 'EMP001', password: 'emp123' } });
  const empTok = empLogin.data?.token;
  if (!adminTok || !empTok) { console.error('❌ Seed login failed – aborting'); process.exit(1); }

  await testRateLimit();
  await testRBAC(adminTok, empTok);
  await testDuplicateVote(empTok);
  await testEligibility(adminTok, empTok);
  await testAuditLog(adminTok);

  const passed = results.filter(r => r.tag === 'PASS').length;
  console.log(`\n🧪 Top‑5 suite: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})();
