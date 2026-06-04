# Windows v0.1.0-rc.1 — ServiceNow Automation Operator Preview

**ServiceNow Automation v0.1.0-rc.1** is a Windows Operator Preview for supervised local testing of the human-in-the-loop ServiceNow Automation Workbench for service desk agents.

> ⚠️ **Prerelease.** This build is for supervised QA and demonstration only. It does not approve live ServiceNow operation.

---

## What's Included

- **Electron desktop app** — prebuilt outputs for Windows, double-click launcher (`scripts\windows\Start-ServiceNow-Automation.cmd`)
- **WSL startup and repair helpers** — scripts/wsl/ for WSL-based development and testing
- **Dedicated browser runtime helpers** — scripts for Chromium-based smoke testing (about:blank only)
- **Operator quickstart** — START-HERE-WINDOWS.txt with setup steps
- **Manual test checklist** — `docs/releases/windows-v0.1-rc-manual-test.md` inside the package
- **SHA256 checksum** — portable zip verification

### Artifact details

| Artifact | Size | Verification |
|---|---|---|
| `servicenow-automation-windows-v0.1.0-rc.1.zip` | ~119 MB | SHA256 checksum provided |
| `servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` | 128 bytes | `sha256sum -c` |
| `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` | — | Included in zip |

### What to test

- **WSL dry-run readiness check** — verify environment before full launch
- **Windows launcher opens the desktop app** — double-click Start-ServiceNow-Automation.cmd
- **Mock/synthetic desktop workflows:**
  - VPN Demo (multi-source intake → draft → KB match → support group → dry-run report)
  - Windows Demo
  - Mock Account Access Demo — no browser login
- **Draft editing** — modify any field to confirm agent remains in control
- **KB matching** — verify keyword-based article scoring and support group recommendation
- **Missing info detection and risk flags** — confirm tool identifies gaps
- **Mock ServiceNow form mapping** — field preview with submit disabled in demo mode
- **Excel dry-run report** — CSV and Markdown copy buttons
- **Optional dedicated browser smoke** — about:blank only, no real pages

---

## Safety Boundary

### This prerelease does

- Generate structured TicketDraft fields from pasted mock context
- Match local demo KB articles by keyword scoring
- Recommend support groups with confidence and evidence
- Flag missing information and risk indicators
- Display a Risk Control Gate (stop-before-write)
- Show a clearly labeled Mock ServiceNow Incident Preview
- Generate dry-run report rows with CSV/Markdown export
- Provide text-field-only automated fill of demo mock form fields
- Package as portable Windows zip with launcher, runbooks, and checksum

### This prerelease does NOT

- Save, Submit, Update, Resolve, or Close any ServiceNow record
- Call any ServiceNow API (REST, SOAP, GraphQL, KM)
- Connect to any real ServiceNow instance
- Open, control, or inspect any real browser page
- Use real LLM / AI provider calls (deterministic mock only)
- Log in to any external service
- Export HAR, trace, screenshot, video, cookie, session, or storage state
- Upload, email, or bulk-create anything
- Use real customer data, employee names, ticket IDs, sys_ids, or URLs

### Strictly forbidden

- Automatic login
- Save / Submit / Update / Resolve / Close
- Upload / email / bulk action
- ServiceNow API write (REST, SOAP, GraphQL)
- Production write or production-shadow write
- Screenshots / HAR / trace / video capture from real ServiceNow pages
- Cookies / sessions / storage-state export
- Raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

---

## Install / Test Summary

1. Download the zip and `.sha256` file.
2. Verify checksum: `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1.zip.sha256`
3. Extract into your working directory.
4. From WSL: `SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh`
5. From Windows: double-click `scripts\windows\Start-ServiceNow-Automation.cmd`
6. Test mock workflows only — see `docs/releases/windows-v0.1-rc-manual-test.md` for the full checklist.

---

## Build Info

- **Source branch:** `nightly/release-candidate-20260604`
- **All P0 features implemented:** multi-source intake, ticket drafting, KB matching, support group recommendation, missing info/risk detection, Risk Control Gate, mock form preview, dry-run reporting
- **Test gates passed:** pnpm build | pnpm typecheck | pnpm test (344+ tests) | pnpm privacy:scan (190+ files clean)
- **Regression audit:** All 6 post-M5 questions PASS — desktop is text-field-only, no full-field autofill exposed, stop-before-write enforced, no data leaks
