# Phase AF4 — QA Acceptance and Alan Manual Checklist for Windows Operator Packaging/Runtime Readiness

**Date:** 2026-06-07
**Tester:** sna-qa-acceptance (automated gates + evidence review)
**Task:** t_7a4e2917
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Parent:** t_c5d39b0f (AF3 Windows operator packaging/runtime readiness implementation)

## Verdict: PASS

All acceptance criteria are met. The AF3 implementation is correct, the gates pass, the package artifacts are verifiable, and the manual checklist is safe and actionable.

---

## 1. Mandatory Automated Gates

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | PASS | CLI TypeScript + Electron main/preload/renderer production build completed |
| `pnpm typecheck` | PASS | All 7 workspace packages typecheck clean |
| `pnpm test` | PASS | 396/396 tests pass across all 6 packages (core=83, kb=6, profiles=17, ai=34, adapters=95, cli=55, desktop=106) |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=273` |

Commands run:
```
cd /home/alanxwsl/projects/servicenow-automation
pnpm build          # exit 0
pnpm typecheck      # exit 0
pnpm test           # exit 0, 396/396 pass
pnpm privacy:scan   # exit 0, 273 files pass
```

---

## 2. Package Artifact Verification

### Latest AE package

| Check | Result | Evidence |
|-------|--------|----------|
| Zip exists | PASS | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` exists |
| SHA256 match | PASS | Code `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde` matches actual `sha256sum` of file |
| SHA256 sidecar | PASS | `.zip.sha256` sidecar file contains matching hash |
| mtime | PASS | `2026-06-07 02:00:01 CST` — matches code display `02:00 CST` |
| Size | PASS | 118,590,385 bytes |
| START-HERE file exists | PASS | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local-START-HERE-WINDOWS.txt` present |
| UNC path | PASS | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` — valid WSL UNC path (confirmed via `wslpath -w`) |

### Stale package archive

| Entry | Exists? | Checksum vs Latest | Staleness |
|-------|---------|--------------------|-----------|
| `rc.1-ad-20260607 (01:32)` | YES | `7f5ca5a7...8006` — different from latest ✅ | Visually stale in code |
| `rc.1-ab-20260607 (01:04)` | YES | `ea94272d...86f1` — different from latest ✅ | Visually stale in code |
| `rc.1 (01:04)` | YES | `ea94272d...86f1` — different from latest ✅ | Visually stale in code |

All stale packages are genuine older artifacts, not copies of the latest.

---

## 3. Code Implementation Verification

### release-readiness-handoff-card (App.tsx lines 4006-4107)

| Feature | Present? | Evidence |
|---------|----------|----------|
| UNC path display | ✅ | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` |
| SHA256 display | ✅ | `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde` |
| mtime display | ✅ | `2026-06-07 02:00 CST` |
| What-changed summary | ✅ | `Stale-archive list, runtime readiness copy, quickstart checklist, updated AE metadata` |
| Stale-package warning banner | ✅ | `handoff-stale-warning` class, warm yellow banner with bold text |
| Archive list (3 stale entries) | ✅ | `handoff-archive-list` with `handoff-archive-latest` + 3 `handoff-archive-stale` entries |
| Why retest matters panel | ✅ | 4 bullet points |
| Human-only boundaries panel | ✅ | 4 bullet points (no live ServiceNow, no Save/Submit, no writes, no raw data) |
| Runtime readiness chips | ✅ | `handoff-runtime-section` with 2 chips: "Dedicated Chromium runtime: not found yet" + "CDP readiness: disconnected" |
| Runtime note | ✅ | "Start QA Chromium is disabled until the tool-owned runtime is ready..." |
| Quickstart checklist strip | ✅ | `handoff-quickstart-strip` with 5 numbered steps |
| Copy path button | ✅ | Copies UNC path to clipboard |
| Copy SHA256 button | ✅ | Copies SHA256 to clipboard |
| Copy summary button | ✅ | Copies what-changed summary to clipboard |

### Styling (styles.css lines 6532-6671)

| Requirement | Met? | Detail |
|-------------|------|--------|
| Stale entries demoted | ✅ | `opacity: 0.72` + muted colors (not color-only — accessibility compliant) |
| Latest entry highlighted | ✅ | Green tinted background (`rgba(47,117,108,0.08)`) + green border |
| Warning banner visible | ✅ | Warm yellow background `#fbf3db`, brown border, rounded |
| Runtime chips styled | ✅ | `.handoff-chip-blocked` with warm background, brown border, distinct from active state |
| Quickstart styled | ✅ | Green-tinted background, dark green text |

### Test coverage (App.test.ts lines 1616-1643)

All 13 assertions in the "renders release-readiness handoff card before the center cards" test pass, confirming:
- Card title and heading
- UNC path and SHA256 values
- Copy path/SHA256/summary buttons
- All 4 section class names (handoff-stale-warning, handoff-archive-list, handoff-runtime-section, handoff-quickstart-strip)
- Runtime readiness placeholder text
- Quickstart checklist title
- Human-only boundaries content
- Card ordering before selected-source-card

---

## 4. Safety Boundary Verification

| Check | Result | Detail |
|-------|--------|--------|
| No real ServiceNow URL | PASS | No real ServiceNow hostname, URL, or nav_to.do in changed files |
| No ticket ID | PASS | No sys_id, ticket number, or incident reference in changed files |
| No credential/session | PASS | No credentials, cookies, storage-state, or session data in changed files |
| No Save/Submit/Update/Resolve/Close | PASS | Only local copy-to-clipboard actions present |
| No writes | PASS | No write operations to any external service |
| No push/PR/merge/tag | PASS | No git operations that modify remote state |
| No cron edits | PASS | No cron configuration changed |
| Privacy scan | PASS | 273 files scanned, no privacy violations detected |

### Safety wording in code

The "Human-only boundaries" panel explicitly states:
- No live ServiceNow login
- No Save / Submit / Update / Resolve / Close
- No external write paths
- No raw customer or ticket data

---

## 5. Manual Windows Validation Checklist for Alan

Alan should perform these checks on Windows using the latest AE package only. **Do not use the stale ad, ab, or rc.1 packages.**

### Prerequisites

1. **Open** the UNC path in Windows File Explorer:
   `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`

2. **Verify** the SHA256 before extracting:
   ```
   certutil -hashfile "\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip" SHA256
   ```
   Expected: `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde`

3. **Copy** the zip to a Windows folder (e.g., Desktop), then extract it.

4. **Open** `START-HERE-WINDOWS.txt` first and verify the local-only safety wording.

### Step-by-step

| # | Action | Expected result | Skip if |
|---|--------|-----------------|---------|
| 1 | Double-click `ServiceNow Automation.exe` | App window opens with three-column layout | File missing or antivirus blocks |
| 2 | Verify the release-readiness handoff card | Shows AE package path, SHA256 `4a9c7a38...`, stale archive with ad/ab/rc.1 demoted | App doesn't launch |
| 3 | Verify the stale-package warning banner | Yellow banner says "Older rc/ad/ab packages are archival only" | Card not visible |
| 4 | Verify the runtime readiness section | Shows 2 chips: "Dedicated Chromium runtime: not found yet" + "CDP readiness: disconnected" | Section missing |
| 5 | Verify the quickstart checklist | 5 steps visible, starting with "Open the latest local package first" | Strip not shown |
| 6 | Verify Copy path button | Clicking copies the UNC path to clipboard | Button not working |
| 7 | Verify Copy SHA256 button | Clicking copies the SHA256 to clipboard | Button not working |
| 8 | Verify Copy summary button | Clicking copies the what-changed summary to clipboard | Button not working |
| 9 | Verify Human-only boundaries panel | Shows 4 safety rules including "No Save / Submit / Update / Resolve / Close" | Panel not visible |
| 10 | Verify stale packages are visibly demoted | ad/ab/rc.1 entries are faded (opacity ~72%), latest AE entry is highlighted green | All entries look the same |
| 11 | Verify center card order | Selected source detail → Cleaned summary → Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue | Order is wrong |

### What NOT to do

- ❌ Do NOT attempt to log in to a real ServiceNow instance
- ❌ Do NOT click Save / Submit / Update / Resolve / Close
- ❌ Do NOT enter real customer, ticket, or personal data
- ❌ Do NOT upload attachments
- ❌ Do NOT paste real ServiceNow URLs or credentials
- ❌ Do NOT use the stale ad, ab, or rc.1 packages

### Reporting issues

If any step fails, note:
- Which step number
- What you expected vs what happened
- Screenshot if safe (no credentials/ServiceNow data visible)
- Any error messages or crash dialogs

---

## 6. Findings

### No blocking issues found

All acceptance criteria from the task body are satisfied.

### Edge case: Backslash escaping in JSX UNC paths

The UNC path in JSX uses `\\\\wsl.localhost\\...` double-backslash escaping. This is a known fragility noted in the AF3 implementation doc. The test suite verifies the output correctly contains `\\wsl.localhost...` (single backslashes in rendered HTML). This was confirmed by the successful test run.

### Non-blocking observation: Static placeholder content

The runtime readiness chips ("not found yet", "disconnected") and the quickstart checklist are static placeholder content. The AF3 implementation document correctly notes this is for a future phase (AF4+) to wire to actual runtime detection or CDP status. This is expected and non-blocking.

---

## Summary

All four mandatory gates pass (build, typecheck, 396/396 tests, privacy 273 files). The AE package exists with matching SHA256 and mtime. The stale packages (ad, ab, rc.1) are genuine older artifacts. The code correctly displays the UNC path, metadata, archive list with demoted stale entries, runtime readiness chips, quickstart checklist, and safe copy-to-clipboard actions. No safety boundary violations exist.

**Verdict: PASS** — Ready for Alan's manual Windows validation.
