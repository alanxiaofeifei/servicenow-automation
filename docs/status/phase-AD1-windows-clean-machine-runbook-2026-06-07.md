# Phase AD1 — Windows clean-machine manual validation runbook

**Date/time:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD before this doc:** `9abd3eb`
**Pre-AD1 gates verified:** AC4 all gates — build PASS, typecheck PASS, test PASS (382/382), privacy:scan PASS (258 files)
**Deliverable:** `docs/test/windows-clean-machine-validation-2026-06-07.md`
**Conclusion:** RUNBOOK WRITTEN — Alan must execute the steps

---

## 1. Background

Phase AD1 addresses the #1 manual validation gap identified by AB1: there was no
procedure to validate the packaged Windows app on a **clean machine** — one without
Node.js, pnpm, WSL, or any developer toolchain. All prior validation checklists
(Phase T4, V1, X4) assumed the tester had a WSL development environment and could
fall back to `pnpm desktop:dev`. This phase creates the missing clean-machine runbook.

The runbook assumes only Windows 10/11, File Explorer, and a ZIP extractor.
It documents exactly what Alan should do, what he should record, where logs may be
found, and what constitutes a pass or fail.

---

## 2. Inputs used

| Input | Source | How used |
|-------|--------|----------|
| Package zip location and SHA256 | AC4 status doc | Runbook §3 — UNC path, checksum, size |
| Package contents (86 files) | `unzip -l` of the RC zip | Runbook Appendix A — expected folder structure |
| Main process code | `apps/desktop/electron/main.ts` | Confirmed no explicit log-file configuration (§5) |
| Electron-builder config | `apps/desktop/package.json` `build` section | Confirmed extraResources (scripts, docs) |
| START-HERE-WINDOWS.txt | From the zip | Confirmed safety boundaries, quick-test path |
| Existing validation docs | V1 next-morning checklist, X4 QA validation | Style reference for pass/fail table format |
| Package quickstart | `resources/docs/windows-operator-quickstart.md` | Confirmed correct double-click workflow description |
| Manual test quickstart | `resources/docs/windows-v0.1-rc-manual-test.md` | Confirmed browser setup instructions |
| Runtime paths | `electron/runtime-paths.ts` | Confirmed `app.isPackaged` detection, no logging |

---

## 3. What the runbook covers

| Section | Content |
|---------|---------|
| §1 Purpose | Why clean-machine validation matters — AB1 gap |
| §2 Prerequisites | Windows 10/11, no Node/pnpm/WSL required |
| §3 Package location | Exact UNC path, SHA256, file size, zip contents |
| §4 Validation steps | 22 numbered steps across extraction, launch, UI, mock workflow, browser (optional) |
| §5 Where logs are | Electron userData, Event Viewer, DevTools console |
| §6 What to record | Do-record and do-not-record lists |
| §7 Pass/fail criteria | PASS, FAIL, and Partial PASS criteria |
| §8 What NOT to test | Safety boundaries list |
| §9 Failure response | Step-by-step failure recovery |
| §10 Open questions | 4 gaps for engineering (log file, error dialogs, MSVC dep, AV false positives) |
| Appendix A | Expected folder structure |
| Appendix B | Key safety boundaries |

---

## 4. Key findings while writing

### 4.1 No explicit log file

The main process (`main.ts`) does not configure electron-log, winston, pino, or any
file-based logger. Console output goes to stdout/stderr, which is invisible in a
packaged double-click launch. Post-crash diagnostics require DevTools (Ctrl+Shift+I)
or Windows Event Viewer.

**Recommendation:** Add a simple startup log to `%APPDATA%\ServiceNow Automation\logs\`
for future releases. This would make clean-machine failure reporting much easier.

### 4.2 MSVC++ Redistributable dependency

Electron on Windows depends on the MSVC++ Redistributable (VCRUNTIME140.dll). The
packaged zip does not bundle this DLL. If the clean machine lacks it, the app will not
start — and the error dialog will look like a generic "application failed to start"
message rather than "install VC++ redist."

**Recommendation:** Add a note to START-HERE-WINDOWS.txt or provide a fallback that
catches this gracefully.

### 4.3 Antivirus false-positive risk

Electron-packaged apps (especially unsigned ones) are frequently flagged by Windows
Defender / SmartScreen. This build has `signAndEditExecutable: false` in electron-builder
config, so the executable is unsigned. Alan should expect a SmartScreen prompt.

**Recommendation:** Consider code signing for release builds, or document the SmartScreen
flow in the runbook.

### 4.4 Browser runtime dependency

On a clean machine without Chrome/Edge, the app's CDP helper scripts may need to
download a Chromium runtime under `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\`.
This requires an internet connection. If it fails, the non-browser mock/demo workflow
is still testable.

**Recommendation:** Document in the runbook that the browser test is optional and the
primary validation is the mock/demo workflow without a browser.

---

## 5. Privacy/security status

| Check | Result |
|-------|--------|
| No real ServiceNow URLs in runbook | PASS — uses UNC path and clean path descriptions |
| No ticket IDs, sys_ids, credentials | PASS — none in either delivered document |
| No screenshots, HAR, traces recommended | PASS — runbook explicitly says do NOT record these |
| No live ServiceNow write instructed | PASS — safety boundaries in §8 |
| No GitHub push/merge/tag/release | PASS — docs only |
| No customer data exposure | PASS — runbook references only the package name and demo workflows |

The runbook documents safety boundaries for Alan (§8 "What NOT to test") and
tells him what to record and not record (§6).

---

## 6. Acceptance gate status

### Pre-existing gates (inherited from AC4)

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | PASS | Confirmed in AC4 |
| `pnpm typecheck` | PASS | Confirmed in AC4 |
| `pnpm test` | PASS (382/382) | Confirmed in AC4 |
| `pnpm privacy:scan` | PASS (258 files @ AC4) | Confirmed in AC4 |

### AD1-specific checks

| Check | Result | Evidence |
|-------|--------|----------|
| Runbook document written | PASS | `docs/test/windows-clean-machine-validation-2026-06-07.md` (14,490 bytes) |
| Status document written | PASS | This document |
| All runbook sections complete | PASS | 10 sections + 2 appendices |
| Safety boundaries documented | PASS | §6 (record/not-record), §8 (what not to test), §9 (failure response) |
| Pass/fail criteria explicit | PASS | §7 — three tiers: PASS, FAIL, Partial PASS |
| Log location documented | PASS | §5 — honest about no explicit log file |
| No live ServiceNow actions | PASS | All inputs are local code/docs inspection |
| No push/merge/tag/release | PASS | Docs-only phase |

---

## 7. BLOCKERS

**None.** The runbook is written and ready for Alan to execute.

---

## 8. Risks and next steps

| Risk / Item | Status | Action |
|-------------|--------|--------|
| MSVC++ redist missing on clean machine | Not tested | Alan to note if the app fails to start with VC++ error |
| SmartScreen blocking unsigned .exe | Expected | Alan to click "Run anyway" |
| No app log file for crash diagnostics | Known gap | Runbook documents DevTools + Event Viewer as alternatives |
| Browser runtime may not start without Chrome | Documented | Runbook marks browser test as optional (§4.5) |
| Package is at 9abd3eb — no new commits | Stable | No rebuild needed for docs |
| Alan manual validation verdict | **PENDING** | Alan to execute the runbook |

---

## 9. Boundary statement

This AD1 phase produced two documentation files only:
- `docs/test/windows-clean-machine-validation-2026-06-07.md` — the validation runbook
- `docs/status/phase-AD1-windows-clean-machine-runbook-2026-06-07.md` — this status document

No real ServiceNow login, browser operation, API write, Save/Submit/Update/Resolve/Close
action, attachment upload, Microsoft Graph/Excel Web write, push, merge, tag, GitHub
Release, PR creation, or live/customer-data ingestion was performed.

No screenshots, HAR, traces, cookies, storage state, or credentials were captured or referenced.

**Conclusion:** RUNBOOK WRITTEN. Alan should execute `docs/test/windows-clean-machine-validation-2026-06-07.md` on a clean Windows machine (no WSL, no Node, no pnpm).
