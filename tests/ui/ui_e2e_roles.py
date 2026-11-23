import json, os, urllib.request, time
from playwright.sync_api import sync_playwright

API = os.environ.get('API_BASE', 'http://127.0.0.1:8000')
WEB = os.environ.get('WEB_BASE', 'http://localhost:3000')
SHOTS = os.environ.get('SHOTS_DIR', '/tmp/ovms_shots')
os.makedirs(SHOTS, exist_ok=True)

def api(method, path, token=None, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')

out = []
def rec(id_, desc, ok, detail=''):
    out.append((id_, desc, ok, detail))
    print(('PASS ' if ok else 'FAIL ') + id_ + '  ' + desc + (('  -> ' + str(detail)) if detail else ''))

# ---- setup via API
_, a = api('POST', '/api/auth/admin/login', body={'username': 'admin', 'password': 'admin123'})
admin_tok = a['token']
# Finance-only active election the IT employee (EMP001) is NOT eligible for
_, e = api('POST', '/api/admin/elections', admin_tok, {'title': 'Finance Only Poll', 'start_date': '2020-01-01 00:00:00', 'end_date': '2099-01-01 00:00:00', 'status': 'ACTIVE', 'department_id': 3})
fin_id = e['id']
api('POST', '/api/admin/candidates', admin_tok, {'election_id': fin_id, 'employee_id': 'EMP005', 'employee_name': 'Suresh Babu'})
# An upcoming election with a known local time for TZ round-trip
_, e2 = api('POST', '/api/admin/elections', admin_tok, {'title': 'TZ Poll', 'start_date': '2026-10-20T09:00', 'end_date': '2026-10-21T17:00', 'status': 'DRAFT'})
tz_id = e2['id']

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800}, timezone_id='Asia/Kolkata')
    page = ctx.new_page()
    console_errors, failed = [], []
    page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
    page.on('response', lambda r: failed.append(f'{r.status} {r.url}') if r.status >= 400 and 'api/auth' not in r.url else None)

    # 1 Landing
    page.goto(WEB + '/'); page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SHOTS}/01_landing.png')
    rec('UI-01', 'Landing page renders with both login links', page.get_by_text('Employee Login').is_visible() and page.get_by_text('Admin Login').is_visible())
    page.set_viewport_size({'width': 390, 'height': 800}); page.goto(WEB + '/'); page.wait_for_load_state('networkidle')
    ov = page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
    page.screenshot(path=f'{SHOTS}/01b_landing_mobile.png')
    rec('UI-02', 'Landing page has no horizontal overflow at 390px', ov <= 0, f'overflow={ov}px')
    page.set_viewport_size({'width': 1280, 'height': 800})

    # 2 Employee login failure message
    page.goto(WEB + '/login'); page.fill('#identifier', 'EMP001'); page.fill('#password', 'nope'); page.click('button[type=submit]')
    page.wait_for_timeout(800)
    rec('UI-03', 'Wrong employee password shows error and stays on /login (no hard reload)', 'Invalid' in page.inner_text('body') and page.url.endswith('/login'))

    # a11y: labels
    labels_for = page.evaluate("[...document.querySelectorAll('label')].filter(l => l.htmlFor || l.querySelector('input')).length")
    rec('A11Y-01', 'Login form <label>s are programmatically associated with inputs', labels_for >= 2, f'associated labels={labels_for}/2')
    ac = page.evaluate("[...document.querySelectorAll('input')].map(i => i.autocomplete)")
    rec('A11Y-02', 'Login inputs declare autocomplete (username / current-password)', all(ac), f'autocomplete={ac}')

    # 3 Employee login success
    page.fill('#password', 'emp123'); page.click('button[type=submit]'); page.wait_for_url('**/employee/dashboard'); page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SHOTS}/02_emp_dashboard_desktop.png')
    rec('UI-04', 'Employee login succeeds and lands on dashboard', True)

    # 4 Desktop nav + logout visibility
    nav_links_visible = [page.get_by_role('link', name=n).first.is_visible() for n in ['Dashboard', 'Elections', 'My Profile']]
    # Mobile-style strip is rendered always; the desktop nav (with avatar/logout) is display:none via invalid inline @media
    logout_visible = page.get_by_text('Logout').count() > 0 and page.get_by_text('Logout').first.is_visible()
    avatar_visible = page.locator("nav >> text=Arun").count() > 0 and page.locator("nav >> text=Arun").first.is_visible()
    rec('BUG-NAV-01', 'Employee can see a Logout control on desktop (1280px)', logout_visible, f'avatar/menu trigger visible={avatar_visible}')
    page.set_viewport_size({'width': 390, 'height': 800}); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/02b_emp_dashboard_mobile.png')
    logout_visible_m = page.get_by_text('Logout').count() > 0 and page.get_by_text('Logout').first.is_visible()
    avatar_visible_m = page.locator("nav >> text=Arun").count() > 0 and page.locator("nav >> text=Arun").first.is_visible()
    rec('BUG-NAV-02', 'Employee can see a Logout control on mobile (390px)', logout_visible_m, f'avatar/menu trigger visible={avatar_visible_m}')
    page.set_viewport_size({'width': 1280, 'height': 800})

    # 5 Non-eligible election by URL -> view ballot, then try vote
    page.goto(f'{WEB}/employee/elections/{fin_id}/vote'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(500)
    body = page.inner_text('body')
    shows_ballot = 'Official Ballot' in body and 'Suresh Babu' in body
    page.screenshot(path=f'{SHOTS}/03_ineligible_ballot.png')
    rec('BUG-ELIG-UI', 'Ineligible employee is blocked from even viewing the ballot of a restricted election', not shows_ballot, 'ballot + candidate list rendered for a Finance-only election' if shows_ballot else '')
    if shows_ballot:
        page.once('dialog', lambda d: d.accept())
        page.get_by_text('Suresh Babu').click(); page.get_by_role('button', name='Cast Vote').click()
        page.wait_for_timeout(1500)
        stored = page.evaluate("localStorage.getItem('ovms_auth')")
        rec('BUG-403-LOGOUT', 'A legitimate 403 ("not eligible") must show a message, not log the user out', stored is not None and '/login' not in page.url, f'url={page.url}, token still stored={stored is not None}')
    # re-login if logged out
    if 'login' in page.url:
        page.fill('#identifier', 'EMP001'); page.fill('#password', 'emp123'); page.click('button[type=submit]'); page.wait_for_url('**/employee/dashboard')

    # 6 Vote semantics: candidates as radios?
    page.goto(f'{WEB}/employee/elections/1/vote'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(400)
    radios = page.locator('input[type=radio], [role=radio]').count()
    rec('A11Y-03', 'Ballot candidates are keyboard-accessible radios (input[type=radio] or role=radio)', radios >= 3, f'radio controls found={radios}')
    page.screenshot(path=f'{SHOTS}/04_ballot.png')
    # DOM nesting a > button
    nested = page.evaluate("document.querySelectorAll('a button').length")
    page.goto(f'{WEB}/employee/dashboard'); page.wait_for_load_state('networkidle')
    nested = page.evaluate("document.querySelectorAll('a button').length")
    rec('HTML-01', 'No <button> nested inside <a> (invalid HTML / double tab stops)', nested == 0, f'nested count on dashboard={nested}')

    # direct logout by clearing (cannot click) -> go admin
    page.evaluate("localStorage.clear()")

    # 7 Admin login
    page.goto(WEB + '/admin-login'); page.fill('#identifier', 'admin'); page.fill('#password', 'admin123'); page.click('button[type=submit]'); page.wait_for_url('**/admin/dashboard'); page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SHOTS}/05_admin_dashboard.png')
    rec('UI-05', 'Admin login succeeds and dashboard renders', True)

    # 8 Admin employees search
    page.goto(WEB + '/admin/employees'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(500)
    before = page.locator('tbody tr').count()
    page.fill('input[placeholder*="Search"]', 'Priya'); page.wait_for_timeout(1500)
    after = page.locator('tbody tr').count()
    rec('BUG-SEARCH', 'Employee search box filters the table when typing', after < before and after >= 1, f'rows before={before}, after typing "Priya"={after}')
    page.screenshot(path=f'{SHOTS}/06_admin_employees_search.png')

    # outline variant button
    page.get_by_text('Bulk Import').first.wait_for()
    style = page.evaluate("(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Bulk Import')); const s=getComputedStyle(b); return {bg:s.backgroundColor, border:s.borderStyle+' '+s.borderWidth, color:s.color}; })()")
    rec('UI-06', 'Bulk Import button (variant="outline") is styled as a visible button', style['bg'] not in ('rgb(239, 239, 239)', 'buttonface') and 'none' not in style['border'], f'computed={style}')

    # 9 TZ round trip in election edit form
    page.goto(f'{WEB}/admin/elections/{tz_id}/edit'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(600)
    start_val = page.locator('input[name=start_date]').input_value()
    rec('BUG-TZ-UI', 'Election edit form pre-fills the same local time that was entered (2026-10-20T09:00)', start_val == '2026-10-20T09:00', f'form shows {start_val}')

    # 10 DOB round trip in employee edit
    page.goto(WEB + '/admin/employees'); page.wait_for_load_state('networkidle')
    page.goto(WEB + '/admin/employees/1/edit'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(600)
    dob = page.locator('input[name=date_of_birth]').input_value()
    rec('BUG-DOB-UI', 'Employee edit form shows stored DOB 1990-05-15 for EMP001', dob == '1990-05-15', f'form shows {dob}')

    # 11 Admin mobile layout
    page.set_viewport_size({'width': 390, 'height': 800}); page.goto(WEB + '/admin/dashboard'); page.wait_for_load_state('networkidle'); page.wait_for_timeout(500)
    page.screenshot(path=f'{SHOTS}/07_admin_mobile.png')
    content_w = page.evaluate("(() => { const m=[...document.querySelectorAll('div')].find(d=>getComputedStyle(d).marginLeft==='260px'); if (m) return m.getBoundingClientRect().width; const c = document.querySelector('div[style*=\"padding: 32px\"], main') || document.body; return c.getBoundingClientRect().width; })()")
    rec('UI-07', 'Admin panel usable at 390px (content width > 200px, sidebar collapses)', content_w > 200, f'content column width={content_w}px (260px fixed sidebar)')
    page.set_viewport_size({'width': 1280, 'height': 800})

    print('\nCONSOLE ERRORS:', console_errors[:8])
    print('FAILED REQUESTS:', failed[:10])
    browser.close()

print(f"\nUI SUMMARY: {sum(1 for o in out if o[2])} pass / {sum(1 for o in out if not o[2])} fail / {len(out)} total")
