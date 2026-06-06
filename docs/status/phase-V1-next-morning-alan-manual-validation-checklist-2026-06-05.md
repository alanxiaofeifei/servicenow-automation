# Phase V1 — Next-Morning Alan Manual Validation Checklist

**Date:** 2026-06-05  
**Branch:** `next/product-clarity-demo-polish-20260605`  
**Reviewed HEAD before this doc:** `da9f261` (U3 product-owner acceptance doc)  
**Profile:** `sna-qa-acceptance`  
**Status:** PASS (mandatory gates) — Alan manual validation required to proceed

All prior automated gates pass:
| Gate | Result |
|------|--------|
| `pnpm build` (7 workspace projects) | ✅ PASS |
| `pnpm typecheck` (7 workspace projects) | ✅ PASS |
| `pnpm test` (382 tests across 25 test files) | ✅ PASS |
| `pnpm privacy:scan` (225 files) | ✅ PASS |

---

## Purpose

This is the **next-morning** manual validation checklist for Alan. The RC artifact has been prepared (Phase T2), QA regression passed (Phase T4), the RC readiness gate declared green-amber for manual validation only (Phase T5), and product demo polish (U1→U2→U3) has updated labels and safety copy for the live demo. This doc tells you exactly what to check, what to expect, and what to skip — in a single page, no cross-referencing needed.

**If you have limited time, use the Bold Summary table (§3).** Otherwise walk through §4 in order.

---

## 1. What changed since prior manual validation

The Phase T4 checklist (docs/status/phase-T4-rc-qa-manual-validation-2026-06-05.md) was the previous manual guide. Between T4 and this V1 doc, the U-phase polish applied these copy-only changes:

| Area | Old text | New text |
|------|----------|----------|
| Browser action label | Start test browser | **Start QA Chromium** |
| Verify action label | Check current ticket page | **Verify current Incident** |
| Autofill action label | Autofill allowed fields | **Autofill current Incident** |
| Safety boundary | Human reviews and handles the record in ServiceNow | **Human reviews and submits in ServiceNow** |
| Disabled: browser not ready | ...start the test browser and wait | **...start QA Chromium and wait** |
| Disabled: verify needed first | ...check the current ticket page first | **...verify the current Incident first** |
| Disabled: another step in progress | ...another browser/test step | **...another browser or step** |
| Operator action display | Page check | **Verify** |
| Operator action display | Browser launch | **QA Chromium launch** |

No layout, behavior, runtime safety, or card order changed. The demo polish is strictly copy-and-label.

---

## 2. What NOT to test (safety boundaries)

These are **forbidden** in this session:

- ❌ No real ServiceNow login, browser automation on real instances, or API writes
- ❌ No Save / Submit / Update / Resolve / Close actions
- ❌ No attachment upload, Microsoft Graph/Excel Web writes
- ❌ No real Teams/Outlook/phone ingestion test
- ❌ No Git push, merge, tag, or release
- ❌ Do not share screenshots with real hostnames, ticket IDs, sys_ids, or credentials

**Real QA/Dev ServiceNow operations** (e.g. logging into a real instance, running autofill against production, testing with live tickets) are **not automated** in this build and require Alan daytime manual action outside this checklist. This app is a local demo/text-field-assistance tool only.

---

## 3. Bold Summary (30-second scan)

| # | Check | Expected | Pass/Fail |
|---|-------|----------|-----------|
| 1 | Double-click RC artifact (or `pnpm desktop:dev`) | Tool window opens, three-column layout, title says "ServiceNow Automation" | |
| 2 | Right column shows three action buttons | **Start QA Chromium**, **Verify current Incident**, **Autofill current Incident** | |
| 3 | Safety text visible | "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." | |
| 4 | Disabled reasons are plain language | E.g. "Disabled: start QA Chromium and wait until the browser connection is ready." | |
| 5 | Workbench card order (top to bottom) | Selected source → Cleaned summary → Incident draft → Guided Review Path → KB recommendations → Monthly Excel fill queue | |
| 6 | KB recommendations visible | Cards show local/demo KB articles with instruction text | |
| 7 | Monthly Excel fill queue is a local queue | Shows Queued/Deferred/Pending badge, instructional text about local dry-run | |
| 8 | Incident draft fields are editable text fields only | No Save/Submit/Update/Resolve/Close buttons on draft | |
| 9 | App title matches | Window title includes "ServiceNow Automation" | |
| 10 | No console errors on startup | No crash dialogs or red errors in DevTools console | |

---

## 4. Detailed walkthrough

### 4.1 Startup and tool window

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1 | Double-click the built Windows RC artifact (or run `pnpm desktop:dev`) | Tool window opens with three-column layout | |
| 1.2 | Check the window title | Includes "ServiceNow Automation" | |
| 1.3 | Open DevTools console (Ctrl+Shift+I) | No uncaught errors, no crash dialogs | |
| 1.4 | Verify three-column UI visible | Left: source/nav/history/settings; Center: source/TicketDraft/field plan; Right: runtime actions/templates/status/safety | |

If startup fails: The app shows clear sanitized diagnostics and a log path. The error message will not contain raw ServiceNow URLs, ticket IDs, or credentials.

### 4.2 Workbench card order (the critical test)

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1 | Select any queue item from the left column | Workbench center column shows cards in vertical order | |
| 2.2 | Card 1 — Selected source | Shows source type, channel, timestamp | |
| 2.3 | Card 2 — Cleaned summary | Shows structured summary rows | |
| 2.4 | Card 3 — Incident draft | Shows Short description, Description, Work notes text fields | |
| 2.5 | Card 4 — Guided Review Path | Shows numbered stepper with 6 steps, chip explaining flow | |
| 2.6 | Card 5 — KB recommendations | Shows KB article cards with explanation text | |
| 2.7 | Card 6 — Monthly Excel fill queue | Shows queue badge (Queued/Deferred/Pending) | |

**If this order is different from above, the product is broken. Report immediately.**

### 4.3 Demo-polish labels (new in U2/U3)

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.1 | Look at the right column runtime action buttons | Button 1 = **Start QA Chromium** (not "Start test browser") | |
| 3.2 | Button 2 | **Verify current Incident** (not "Check current ticket page") | |
| 3.3 | Button 3 | **Autofill current Incident** (not "Autofill allowed fields") | |
| 3.4 | Hover over Verify button before starting browser | Disabled reason says "...start QA Chromium and wait..." | |
| 3.5 | Hover over Autofill before verifying | Disabled reason says "...verify the current Incident first..." | |
| 3.6 | Check the safety boundary text below actions | "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." | |
| 3.7 | Switch locale to zh-CN (Settings) | All three button labels show Chinese translations | |
| 3.8 | Switch locale to es-ES (Settings) | All three button labels show Spanish translations | |

### 4.4 Button gating (behavior unchanged)

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.1 | With no browser running | Start QA Chromium is **enabled**; Verify/Autofill are **disabled** with clear reason | |
| 4.2 | Click Start QA Chromium | Launches dedicated Chromium window; app shows "QA Chromium launch" status | |
| 4.3 | Wait for CDP readiness | Verify button enables once CDP connection is ready | |
| 4.4 | Incorrect state: Verify current Incident should be disabled before CDP | Confirmed disabled with reason "Disabled: start QA Chromium and wait..." | |
| 4.5 | After verify succeeds | Autofill button enables | |
| 4.6 | Verify-only does not write | Clicking Verify only reads the page; no field writes occur | |
| 4.7 | Autofill remains separated from Save/Submit | Autofill action does not Submit/Save/Update/Resolve/Close | |

### 4.5 Safety features

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.1 | Scan all UI text for "Demo only" or similar badges | At least one visible indicator that data is fake/local/demo | |
| 5.2 | Look for the safety phrase | "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." present in right column | |
| 5.3 | Check Incident draft card | No submit/save/update/close/resolve buttons on or near draft fields | |
| 5.4 | Look for explicit "No Save / Submit / Update / Resolve / Close" text | Present somewhere in the UI (often in safety boundary or footer) | |
| 5.5 | Production mode (if selectable in Settings) | All runtime actions disabled with reason: "Production is read-only in this workbench" | |

### 4.6 Guided Review Path

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 6.1 | The 6-step guide reads: | "Choose source → review context → draft ticket → check KB → verify/report → optional QA/dev text-field assistance" | |
| 6.2 | Each step has a badge | Completed/current/locked indicators present | |
| 6.3 | Click "Start over" | Stepper resets to initial state | |

### 4.7 KB recommendations

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.1 | Scroll to KB section | KB article cards visible with title and explanation text | |
| 7.2 | The instruction text says: | "No external KB lookup. These cards explain the recommendation before the operator uses it." | |
| 7.3 | Article cards do not link to real ServiceNow | Links/buttons are local/demo only (no real instance URLs) | |

### 4.8 Monthly Excel fill queue

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 8.1 | Check queue badge | Shows current state: "Queued", "Deferred", or "Pending" | |
| 8.2 | Text reads: | "Prompt after ticket is opened: fill the reviewed core fields into the current month tracking workbook, or keep it pending for later." | |
| 8.3 | Confirm it is a **local/dry-run queue**, not a one-off Excel export | No "Export to Excel" or "Save to Excel" action buttons visible; no real Excel write capability claimed | |

### 4.9 If something fails

If any step in this checklist produces an unexpected result:

1. **Check the app's diagnostics** — startup/show the diagnostics panel; it shows sanitized information
2. **Check the log file** — the path is shown in the diagnostics area on startup failure
3. **Do not retry with real ServiceNow** — all operations here are local/demo only
4. **Report to engineering** with: what step failed, what you saw vs expected, and the log path/file

What is **not** covered by this checklist (Alan daytime manual action required):
- Real ServiceNow login and browser automation
- Real Excel web writes or Microsoft Graph operations
- Real Teams/Outlook/phone ingestion
- Git push, merge, tag, or release
- Windows installer/uninstaller behavior
- Performance under heavy load or long-running sessions

---

## 5. Privacy/security status

Privacy scan PASS on 225 tracked files. No real ServiceNow hosts, customer data, credentials, approval phrases, or write-capability claims found in tracked codebase files. The demo-polish copy changes (U2) did not introduce any new data exposure.

---

## 6. BLOCKERS

**None.** All mandatory automated gates pass (build, typecheck, 382 tests, privacy scan). The single flaky test (`waits for matching Runtime.evaluate response`) is a resource-contention artifact under parallel execution on WSL, not a logic regression. It passes reliably with `--workspace-concurrency=1`.

---

## 7. Risks and next steps

| Risk / Item | Status | Action |
|-------------|--------|--------|
| Windows double-click validation | Not tested here (green-zone scope) | Alan to validate on Windows with the RC artifact |
| Settings environment helper text | Still says "Start, Check Page, and Autofill" (old terms) | Non-blocking cosmetic; follow-up if desired |
| RC artifact commit level | Artifact built by T2 is before U2 changes | Alan may choose to rebuild RC after reviewing copy changes, or validate via dev build |
| Real ServiceNow operations | Not automated; out of scope | Alan daytime manual action required |
| Merge/release approval | Not granted by this document | Requires explicit later approval |

---

## 8. Verdict summary

```
Phase V1 — next-morning manual validation checklist
Mandatory gates: all PASS (build ✓ typecheck ✓ test ✓ privacy ✓)
Alan manual validation: PENDING (use this checklist)
Product acceptance: PENDING (Alan's verdict after manual validation)

To proceed to merge/release: Alan completes this checklist → provides product acceptance verdict → explicit merge/release approval
```
