import json, os, subprocess, urllib.request
from playwright.sync_api import sync_playwright

WEB = os.environ.get('WEB_BASE', 'http://localhost:3000')
SHOTS = os.environ.get('SHOTS_DIR', '/tmp/ovms_shots')
os.makedirs(SHOTS, exist_ok=True)

def sql(q):
    return subprocess.run(['mysql', '-h', os.environ.get('MYSQL_HOST','127.0.0.1'), '-u', os.environ.get('MYSQL_USER','root'), '-N', '-B', os.environ.get('DB_NAME','employee_voting_system'), '-e', q], capture_output=True, text=True).stdout.strip()

out = []
def rec(id_, desc, ok, detail=''):
    out.append(ok)
    print(('PASS ' if ok else 'FAIL ') + id_ + '  ' + desc + (('  -> ' + str(detail)) if detail else ''))

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800}, timezone_id='Asia/Kolkata')
    page = ctx.new_page()

    def admin_login():
        page.goto(WEB + '/admin-login'); page.fill('#identifier', 'admin'); page.fill('#password', 'admin123')
        page.click('button[type=submit]'); page.wait_for_url('**/admin/dashboard'); page.wait_for_load_state('networkidle')

    admin_login()
    # --- Logout reachability at common laptop/desktop viewport heights
    for w, h in [(1366, 768), (1440, 900), (1536, 730), (1920, 940), (1920, 1080)]:
        page.set_viewport_size({'width': w, 'height': h}); page.wait_for_timeout(200)
        r = page.evaluate("(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Logout')); const r=b.getBoundingClientRect(); return {top:Math.round(r.top), bottom:Math.round(r.bottom), vh:window.innerHeight}; })()")
        prof = page.evaluate("(() => { const a=[...document.querySelectorAll('a')].find(x=>x.textContent.includes('Admin Profile')); const r=a.getBoundingClientRect(); return Math.round(r.bottom); })()")
        rec(f'BUG-SIDEBAR-{w}x{h}', f'Admin Logout button inside viewport at {w}x{h}', r['bottom'] <= r['vh'], f"logout bottom={r['bottom']}px vs viewport={r['vh']}px; 'Admin Profile' link bottom={prof}px")
    page.set_viewport_size({'width': 1280, 'height': 800})

    # Can the user scroll to it? try wheel over sidebar & window scroll
    page.mouse.move(100, 400); page.mouse.wheel(0, 2000); page.wait_for_timeout(300)
    r = page.evaluate("(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Logout')); const r=b.getBoundingClientRect(); return Math.round(r.bottom); })()")
    rec('BUG-SIDEBAR-SCROLL', 'Scrolling the page brings the sidebar Logout button into view', r <= 800, f'logout bottom after wheel scroll={r}px (fixed sidebar does not scroll)')

    # --- Admin logout destination (JS click because button may be off-screen)
    page.evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Logout')).click()"); page.wait_for_timeout(600)
    rec('UI-08', 'Admin logout returns to /admin-login (not employee /login)', page.url.endswith('/admin-login'), f'url={page.url}')

    page.goto(WEB + '/admin/elections'); page.wait_for_timeout(500)
    rec('UI-09', 'Logged-out deep link /admin/elections redirects to admin login', page.url.endswith('/admin-login'), f'url={page.url}')

    page.evaluate("localStorage.setItem('ovms_auth', JSON.stringify({token:'bad', role:'ADMIN', user:{username:'x'}}))")
    page.goto(WEB + '/admin/dashboard'); page.wait_for_timeout(1800)
    rec('UI-10', 'Expired/invalid ADMIN token redirects to ADMIN login (not employee login)', page.url.endswith('/admin-login'), f'url={page.url}')
    page.evaluate("localStorage.clear()")

    # --- Cumulative time drift on edit/save via real UI
    admin_login()
    page.goto(WEB + '/admin/elections/add'); page.wait_for_load_state('networkidle')
    page.fill('input[name=title]', 'Drift Test'); page.fill('input[name=start_date]', '2026-11-01T09:00'); page.fill('input[name=end_date]', '2026-11-02T17:00')
    page.get_by_role('button', name='Create Election').click(); page.wait_for_url('**/admin/elections', timeout=6000)
    page.wait_for_load_state('networkidle')
    eid = sql("SELECT id FROM elections WHERE title='Drift Test'")
    seen = []
    for i in range(3):
        page.goto(f'{WEB}/admin/elections/{eid}/edit'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(500)
        seen.append(page.locator('input[name=start_date]').input_value())
        page.get_by_role('button', name='Update Election').click(); page.wait_for_url('**/admin/elections', timeout=6000)
    rec('BUG-TZ-DRIFT', 'Opening and saving an election without changes keeps start time constant (09:00)', len(set(seen)) == 1 and seen[0] == '2026-11-01T09:00', f'start time shown on successive open+save cycles: {seen}; DB now stores: {sql(f"SELECT start_date FROM elections WHERE id={eid}")}')

    # same for DOB
    dobs = []
    for i in range(3):
        page.goto(WEB + '/admin/employees/2/edit'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(500)
        dobs.append(page.locator('input[name=date_of_birth]').input_value())
        page.get_by_role('button', name='Update Employee').click(); page.wait_for_url('**/admin/employees', timeout=6000)
    rec('BUG-DOB-DRIFT', 'Opening and saving an employee without changes keeps DOB constant (1992-08-22)', len(set(dobs)) == 1 and dobs[0] == '1992-08-22', f'DOB shown on successive cycles: {dobs}; DB now stores: {sql("SELECT date_of_birth FROM employees WHERE id=2")}')

    # --- Election UI: UPCOMING has no way to start
    sql("UPDATE elections SET status='UPCOMING' WHERE title='Drift Test'")
    page.goto(WEB + '/admin/elections'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(400)
    row = page.locator('tr', has_text='Drift Test')
    has_start = row.get_by_text('Start').count() > 0
    rec('UI-11', 'An UPCOMING election exposes a Start/Activate action in the list', has_start, 'only DRAFT shows Start, only ACTIVE shows Close; no Cancel, no Reopen, no delete')

    # --- Employee happy path
    page.evaluate("localStorage.clear()")
    page.goto(WEB + '/login'); page.fill('#identifier', 'EMP002'); page.fill('#password', 'emp123'); page.click('button[type=submit]'); page.wait_for_url('**/employee/dashboard'); page.wait_for_load_state('networkidle')
    page.goto(WEB + '/employee/elections/1/vote'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(400)
    page.once('dialog', lambda d: d.accept())
    page.get_by_text('Priya Sharma').click(); page.get_by_role('button', name='Cast Vote').click(); page.wait_for_timeout(1200)
    body = page.inner_text('body')
    rec('UI-12', 'Happy path: vote recorded and success page shown', 'Vote Recorded Successfully' in body)
    page.screenshot(path=f'{SHOTS}/08_vote_success.png')
    rec('SEC-CLAIM', 'Success page claims vote is "anonymously recorded" - verify DB cannot link voter to candidate', 'anonymously' not in body, 'UI text says "securely and anonymously recorded"')
    print('SEC-03 proof (voter -> candidate, one SQL join):')
    print('   ' + sql("SELECT CONCAT(e.employee_id,' (',e.employee_name,') voted for ',c.employee_name) FROM votes v JOIN employees e ON e.id=v.employee_id JOIN candidates c ON c.id=v.candidate_id"))
    page.goto(WEB + '/employee/elections/1/vote'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(400)
    rec('UI-13', 'Re-opening the ballot after voting shows "already voted" message', 'already voted' in page.inner_text('body'))
    page.goto(WEB + '/employee/dashboard'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/09_emp_dash_after_vote.png')
    # voted election link behaviour: Link to="#"
    href = page.evaluate("[...document.querySelectorAll('a')].filter(a=>a.textContent.includes('Vote Recorded')).map(a=>a.getAttribute('href'))")
    rec('HTML-02', 'Voted election card does not render a dead href="#" link', href == [] or all(h != '#' for h in href), f'hrefs={href}')

    # employee results visibility after close
    sql("UPDATE elections SET status='CLOSED' WHERE id=1")
    page.goto(WEB + '/employee/elections'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(300)
    rec('UI-14', 'Employee can see a CLOSED election and its published result', 'Employee Representative' in page.inner_text('body'), 'employees only ever see ACTIVE elections; there is no employee-facing results page')

    browser.close()
print(f"\nPART2 SUMMARY: {sum(out)} pass / {len(out)-sum(out)} fail / {len(out)} total")
