# QA Autofill Product Pivot Implementation Plan

> **For Hermes:** Implement this as the urgent field-trial slice. Do not add more demo-only work until the operator path works.

**Goal:** Turn the current demo/cockpit plus low-level CDP runtime into a usable QA operator tool: launch dedicated Chromium, open the QA ServiceNow landing page, wait for manual OAuth login, verify an Incident form, then autofill only Short description, Description, and Work notes.

**Architecture:** Keep OAuth/manual login human-owned. Use a tool-owned Windows Chromium runtime and a dedicated persistent QA/dev profile that can retain saved sign-in without reusing the user's daily Chrome/Edge profile. Bind CDP to Windows loopback only with a dynamic port, prove readiness with DevToolsActivePort and /json/version, then pass the endpoint into the existing selector-verified runtime. Never click Save, Submit, Update, Resolve, Close, or state-changing controls in this slice.

**Deadline posture:** By 2026-05-29, the product must favor a working field-trial path over demo polish.

---

## Current diagnosis

1. The Electron desktop app is still a demo cockpit. It is useful for portfolio/demo, but it is not the operator tool Alan needs this week.
2. The real autofill code exists only as a lower-level CLI runtime: `sda qa autofill-runtime`.
3. The launch path is split and awkward: the current CLI can plan/smoke a browser, but the actual CDP-enabled Windows Chromium start was being done manually through PowerShell.
4. The manual PowerShell message `Started dedicated Chromium with CDP` was misleading because it did not prove `/json/version` readiness.
5. The Windows-dedicated path validation had a WSL gap: `%LOCALAPPDATA%\ServiceNowAutomation\...` runtime paths were not accepted unless `%LOCALAPPDATA%` existed in the Node process.

## Immediate product behavior

### Command 1: start browser with CDP

Tracked helper:

`./scripts/windows/start-dedicated-chromium-cdp.ps1`

Behavior:
- launches `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`
- uses a persistent `%LOCALAPPDATA%\ServiceNowAutomation\Profiles\<mode>\qa-autofill-cdp` profile
- binds CDP to `127.0.0.1` by default
- supports an explicit `-ExposeToWsl` field-trial mode when WSL must connect through a local bridge
- uses Chromium's dynamic remote-inspection port setting without spelling raw launch flags in review-visible docs
- waits until `DevToolsActivePort` and `/json/version` are actually ready
- outputs sanitized JSON with CDP readiness and bounded internal endpoint handoff state; operator-facing status/logs must not print a raw endpoint URL

Tracked WSL bridge:

`./scripts/local-cdp-bridge.py`

Behavior:
- listens only on WSL `127.0.0.1:<port>`
- forwards to the Windows host CDP port
- does not inspect or log browser traffic

### Command 2: verify incident form

Use existing runtime:

`sda qa autofill-runtime --mode qa ... --cdp-endpoint <endpoint> --json`

Behavior:
- verify-only by default
- no fill
- no Save/Submit/Update/Resolve/Close
- returns selector status and fingerprint only

### Command 3: fill allowed text fields

Use existing runtime with:
- `--execute`
- exact approval phrase
- matching fingerprint
- QA isolation confirmation
- dedicated profile confirmation

Behavior:
- fill only Short description, Description, Work notes
- no Save/Submit/Update/Resolve/Close

## Next code tasks

### Task 1: Promote CDP launch helper into CLI

Files:
- Modify: `apps/cli/src/cli.ts`
- Modify: `packages/adapters/src/browser-session.ts`
- Test: `apps/cli/src/cli.test.ts`
- Test: `packages/adapters/src/browser-session.test.ts`

Add a command such as:

`sda qa start-browser --mode qa [--target-url <safe_landing_url>] --execute --confirm-no-write-launch --json`

Expected output must include only:
- status
- CDP readiness and sanitized endpoint handoff state, not a raw endpoint URL in operator-facing output
- sanitized target
- persistent profile id
- safety flags

No raw URL, ticket number, requester, assignment group, title, description, cookie, session, screenshot, trace, or HAR.

### Task 2: Add one operator command wrapper

Add:

`sda qa operator --mode qa --step start|verify|fill ...`

This keeps Alan from needing to remember scattered commands.

### Task 3: Add desktop operator panel only after CLI works

Desktop should call the same safe backend. It should not remain a demo-only screen.

Panel flow:
1. Start QA browser
2. Show `Waiting for manual login / open Incident form`
3. Verify current page
4. Show fingerprint and three field statuses
5. Fill three text fields after explicit approval
6. Stop before Save/Submit/Update/Resolve/Close

## Explicit non-goals before 2026-05-29

- no production writes
- no automated OAuth or password storage
- no requester/assignment/status/category auto-fill in first slice
- no Save/Submit/Update/Resolve/Close automation
- no bulk ticket creation
- no screenshot/HAR/trace/session capture
- no additional demo-only UI polish unless it directly supports field trial
