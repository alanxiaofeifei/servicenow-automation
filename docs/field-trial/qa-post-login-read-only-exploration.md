# QA Post-Login Read-Only Exploration Runbook

## Purpose

This runbook is the final manual script for the field trial approved by GPT-5.5 Pro checkpoint #30 as **READY WITH CONDITIONS**.

The goal is only to verify that Alan controls login to the QA/dev ServiceNow environment through the controlled isolated browser and can observe a safe landing page or navigator shell.

This runbook does **not** approve any ServiceNow write action.

## Current approved scope

Allowed:

- Open controlled isolated browser.
- Alan controls login.
- Observe only landing page or navigator shell.
- Record only non-sensitive yes/no observations.
- Close browser.
- Optionally reset only the verified project/tool-owned persistent profile.

Forbidden:

- Automatic login.
- App-managed credential storage or credential export.
- DOM automation.
- Playwright page inspection.
- Page text extraction.
- Page title/current URL metadata capture.
- Screenshot / HAR / trace / video.
- Storage-state / cookie / session export.
- Real ticket/customer/user data collection.
- Opening real ticket/customer/user records.
- Field fill.
- Save / Submit / Update / Close.
- Create Change / Upload Attachment / Send Email.
- External AI with real ServiceNow content.
- Production-shadow.
- Production testing.

## Product browser-runtime direction

Linux Chrome inside WSL is a development-machine workaround to protect Alan's daily work browser.

The product direction should follow Alan's AIA-era safety pattern:

> The product should use a dedicated browser runtime and a tool-owned persistent profile. It must never depend on or modify the user's daily Chrome/Edge profile. Login remains user-controlled; saved sign-in can be reused from the dedicated test profile.

Long-term target:

- Dedicated / bundled / portable Chromium runtime.
- Tool-owned persistent profile directory.
- User-controlled login.
- No app-managed password storage.
- Explicit safe reset when Alan wants to clear the dedicated profile.
- Never attach to the user's daily Chrome/Edge profile.

## Hard stop conditions

Stop immediately and close the browser if any of these occur:

- Browser path is `/mnt/c`, `/mnt/d`, another Windows drive path, or ends with `.exe`.
- Browser opens Alan's normal Windows Chrome/Edge profile.
- QA page redirects into a real ticket/customer/user record page.
- Any editable record page appears and read-only observation cannot be guaranteed.
- Any command output exposes query/hash, record identifiers, secrets, or credential-bearing URL parts.
- Any screenshot/HAR/trace/video/storage-state/cookie/session export is attempted.
- Any Save/Submit/Update/Close path appears.
- Any external AI receives real ServiceNow content.
- Any uncertainty about whether a click or page is read-only.

If stopped, record only a non-sensitive stop reason such as `redirected to record page` or `profile reuse suspected`.

## Phase 0 — Pre-check

Run from the repository root in WSL:

```bash
cd $HOME/projects/servicenow-automation

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 24.15.0

git status --short
git status --ignored --short .local private field-test-results field-test-notes apps/cli/.local || true
pnpm build
pnpm typecheck
pnpm test
```

Confirm there are no staged or untracked sensitive artifacts such as:

- screenshots
- HAR
- trace
- video
- storage-state
- cookie/session exports
- real ticket data
- customer/user data

## Phase 1 — Verify Linux browser path

```bash
command -v google-chrome
google-chrome --version
```

Required:

```text
path = /usr/bin/google-chrome
not /mnt/...
not .exe
```

## Phase 2 — Dry-run

```bash
SDA_BROWSER_EXECUTABLE=/usr/bin/google-chrome \
  pnpm --silent --filter @servicenow-automation/cli sda \
  browser launch --mode qa --json > /tmp/sda-qa-post-login-dry-run.json
```

Inspect with a redacted validation summary instead of pasting raw JSON:

```bash
python3 - <<'PY'
import json, pathlib, re, subprocess, sys
repo = pathlib.Path.cwd().resolve()
raw = pathlib.Path('/tmp/sda-qa-post-login-dry-run.json').read_text()
data = json.loads(raw)
launch = data.get('launch') or {}
errors = []
status = launch.get('status')
if status != 'dry-run': errors.append(f'launch.status={status!r}, expected dry-run')
cp = launch.get('commandPreview') or {}
exe = cp.get('executable') or ''
if exe != '/usr/bin/google-chrome': errors.append(f'executable={exe!r}, expected /usr/bin/google-chrome')
if exe.lower().endswith('.exe') or '/mnt/' in exe: errors.append('executable is Windows-mounted or .exe')
args = cp.get('args') or []
profile_arg = next((a for a in args if a.startswith('--user-data-dir=')), '')
profile = pathlib.Path(profile_arg.split('=', 1)[1]).resolve() if profile_arg else None
if not profile:
    errors.append('missing --user-data-dir')
else:
    try:
        rel = profile.relative_to(repo)
    except Exception:
        errors.append(f'profile outside repo: {profile}')
        rel = None
    if rel and '.local' not in rel.parts:
        errors.append(f'profile path does not contain .local: {rel}')
    if rel and tuple(rel.parts[-3:]) != ('.local', 'servicenow-browser-profiles', 'qa'):
        errors.append(f'profile path does not end with .local/servicenow-browser-profiles/qa: {rel}')
    if subprocess.run(['git', 'check-ignore', '-q', str(profile)], cwd=repo).returncode != 0:
        errors.append('profile path is not git-ignored')
for a in args:
    if a.startswith('http'):
        if '?' in a or '#' in a: errors.append('target arg contains query/hash')
        if re.match(r'https?://[^/]+@', a): errors.append('target arg contains userinfo')
launch_safety = launch.get('safety') or {}
top_safety = data.get('safety') or {}
checks = {
    'launch.noWriteMode': (launch_safety.get('noWriteMode'), True),
    'launch.formAutomationAllowed': (launch_safety.get('formAutomationAllowed'), False),
    'launch.fieldFillAllowed': (launch_safety.get('fieldFillAllowed'), False),
    'launch.realServiceNowApiCalled': (launch_safety.get('realServiceNowApiCalled'), False),
    'launch.realSubmitAllowed': (launch_safety.get('realSubmitAllowed'), False),
    'launch.writeOperationsAllowed': (launch_safety.get('writeOperationsAllowed'), False),
    'top.browserAutomationCalled': (top_safety.get('browserAutomationCalled'), False),
    'top.browserProcessLaunched': (top_safety.get('browserProcessLaunched'), False),
    'top.realServiceNowApiCalled': (top_safety.get('realServiceNowApiCalled'), False),
    'top.productionWriteAllowed': (top_safety.get('productionWriteAllowed'), False),
    'top.noExternalActionPerformed': (top_safety.get('noExternalActionPerformed'), True),
}
for name, (got, expected) in checks.items():
    if got is not expected:
        errors.append(f'{name}={got!r}, expected {expected!r}')
if '.exe' in raw.lower(): errors.append('raw JSON contains .exe')
if '/mnt/' in raw: errors.append('raw JSON contains /mnt/')
print('DRY_RUN_VALIDATION')
print('launch_status=', status)
print('executable=', exe)
print('profile_rel=', str(profile.relative_to(repo)) if profile and str(profile).startswith(str(repo)) else '<outside>')
print('no_query_or_hash=', not any(a.startswith('http') and ('?' in a or '#' in a) for a in args))
print('no_windows_paths=', '.exe' not in raw.lower() and '/mnt/' not in raw)
print('validation=', 'PASS' if not errors else 'FAIL')
if errors:
    for e in errors:
        print('ERROR:', e)
    sys.exit(1)
PY
```

Do not proceed unless validation is `PASS`.

## Phase 3 — Execute controlled no-write launch

Run this from a GUI-capable WSL terminal, not from a headless Hermes tool run:

```bash
SDA_BROWSER_EXECUTABLE=/usr/bin/google-chrome \
  pnpm --silent --filter @servicenow-automation/cli sda \
  browser launch --mode qa --execute --confirm-no-write-launch --json > /tmp/sda-qa-post-login-launch.json
```

Then:

1. Confirm the browser window opened.
2. Confirm it is a new/blank isolated profile, not Alan's daily work Chrome/Edge profile.
3. Alan controls login.
4. Observe only landing page or navigator shell.
5. Do not open real ticket/customer/user records.
6. Do not type into any ServiceNow field.
7. Do not click Save/Submit/Update/Close.
8. Do not screenshot or export anything.
9. Close browser.

## Phase 4 — Post-check

After closing the browser:

```bash
git status --short
git status --ignored --short .local private field-test-results field-test-notes apps/cli/.local || true
```

Only record non-sensitive observations in an ignored private note.

```bash
mkdir -p private/field-tests
NOTE="private/field-tests/$(date +%F)-qa-post-login-read-only.md"
cat > "$NOTE" <<'EOF'
# QA post-login read-only exploration

## Browser
WSL Linux Chrome /usr/bin/google-chrome

## Profile isolation
New/blank isolated profile observed: yes/no
Default work profile reused: yes/no

## Login
Manual login succeeded: yes/no

## Observation
Landing page or navigator shell reachable: yes/no
Real ticket/customer/user record opened: no

## Safety confirmation
- No ticket page opened.
- No field typed.
- No Save/Submit/Update/Close.
- No screenshot/HAR/trace/video.
- No metadata/page text capture.
- No cookie/session/storage-state export.
- No external AI.
- Browser closed.

## Follow-up
...
EOF
chmod 600 "$NOTE"
printf 'Wrote private ignored note: %s\n' "$NOTE"
```

Never record:

- username
- email
- ticket number
- internal record identifier
- full URL
- customer name
- assignment group
- CI/device name
- page title if it contains ticket/customer/user data
- any page text

## Optional reset after the trial

Only run reset if all are true:

- Browser was WSL Linux Chrome `/usr/bin/google-chrome`.
- Profile path was repo/worktree-local under `.local/servicenow-browser-profiles/qa`.
- Browser did not reuse Alan's daily Chrome/Edge profile.
- Alan wants to clear the QA persistent profile after closing the browser.

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser reset --mode qa --json > /tmp/sda-qa-post-login-reset.json
```

Do not paste raw reset JSON into GitHub if it contains local paths you do not want to share.

## Completion criteria

The trial is complete only if Alan can report, without sensitive details:

```text
Linux Chrome window opened: yes/no
New blank isolated profile: yes/no
Manual login succeeded: yes/no
Landing page or navigator shell reachable: yes/no
Real ticket/customer/user record opened: no
Any field typed: no
Any Save/Submit/Update/Close: no
Screenshot/HAR/trace/video/export: no
External AI used: no
Browser closed: yes/no
Optional reset run: yes/no
```

If all expected no-write confirmations are satisfied, comment a non-sensitive summary on GitHub issue #30 and close it.
