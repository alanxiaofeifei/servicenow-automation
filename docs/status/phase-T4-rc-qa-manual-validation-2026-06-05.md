# Phase T4 — RC QA Regression & Alan Manual Validation Checklist

**Date:** 2026-06-05  
**Branch:** `next/product-clarity-demo-polish-20260605` (13 commits ahead of origin)  
**QA profile:** `sna-qa-acceptance`  
**Status:** PASS (with note)

---

## Mandatory Gates

| Gate | Result | Evidence |
|---|---|---|
| `pnpm build` | ✅ PASS | All 7 workspace projects build clean |
| `pnpm typecheck` | ✅ PASS | All 7 workspace projects typecheck clean |
| `pnpm test` | ✅ PASS (382/382) | 382 tests pass (retried with `--workspace-concurrency=1`; see note below) |
| `pnpm privacy:scan` | ✅ PASS | 220 files scanned, no violations |

**Note:** One test (`QA incident default field read-only runtime > waits for the matching Runtime.evaluate response instead of accepting unsolicited WebSocket events`) is flaky under parallel execution. It spawns a fake WebSocket server + real Windows PowerShell child process and its 5000ms timeout fires under concurrent test execution on WSL. Passes reliably with `--workspace-concurrency=1` (takes ~1000ms). This is a resource-contention artifact, not a logic regression.

---

## Workbench UI Order Verification

Confirmed DOM order in `apps/desktop/src/App.tsx`:

1. **Selected source** — source-preview-card (line ~3890)
2. **Cleaned summary** — cleaned-summary-card (line ~3918)
3. **Incident draft** — incident-draft-card (line ~3934)
4. **Guided demo path** — guided-demo-stepper-card (line ~3963)
5. **Local KB recommendations** — kb-recommendations-card (line ~3993)
6. **Monthly Excel fill queue** — monthly-excel-fill-card (line ~4035)

This matches Alan's manual confirmation exactly. The test at `App.test.ts:160` (`renders incident draft card before guided demo path, before KB recommendations, before monthly Excel fill queue`) asserts all four ordering constraints via index comparison. It passed in this run.

---

## Alan Manual Validation Checklist

### Before you start
- **Do NOT** test on real ServiceNow, real Excel, real Teams/Outlook
- **Do NOT** press Save/Submit/Update/Resolve/Close — product is view-only for text-field edits
- **Do NOT** push or merge the branch — code review comes later
- **Do NOT** share screenshots with real hostnames, ticket IDs, or credentials

### What to test

#### 1. Startup and tool window
| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1.1 | Double-click the built desktop app (or `pnpm desktop:dev`) | Tool window opens with three-column layout | |
| 1.2 | Check for any console errors | Window loads cleanly, no crash dialogs | |
| 1.3 | Verify the app title includes "ServiceNow Automation" | Confirms correct app | |

#### 2. Workbench card order (the key test)
| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 2.1 | Select any queue item | Workbench panel shows cards in vertical order | |
| 2.2 | Verify card 1 is "Selected source" | Shows source type, channel, timestamp | |
| 2.3 | Verify card 2 is "Cleaned summary" | Shows structured summary rows | |
| 2.4 | Verify card 3 is "Incident draft" | Shows Short description, Description, Work notes text fields | |
| 2.5 | Verify card 4 is "Guided demo path" | Shows numbered stepper with 6 steps, chip explaining flow | |
| 2.6 | Verify card 5 is "Local KB recommendations" | Shows KB article cards with explanation text | |
| 2.7 | Verify card 6 is "Monthly Excel fill queue" | Shows queue badge (Queued/Deferred/Pending) | |

#### 3. Safety features
| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 3.1 | Look for "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." text | Present in Guided demo path footer | |
| 3.2 | Look for "Demo only" / "Fake/local/demo data only" badges | Visible on the page | |
| 3.3 | Check "Verify-only" and "Autofill" controls are separate from any Submit/Save buttons | Autofill is its own action, not tied to Save/Submit | |
| 3.4 | Check Incident draft fields are editable text fields only | No submit/save/update buttons on draft | |

#### 4. Guided demo stepper
| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 4.1 | The 6-step guide reads: "Choose source → review context → draft ticket → check KB → verify/report → optional QA/dev text-field assistance" | Chip text matches exactly | |
| 4.2 | Each step has a badge (completed/current/locked) | Visual state indicators present | |
| 4.3 | Clicking the "Start over" button resets the stepper | Stepper returns to initial state | |

#### 5. KB recommendations
| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 5.1 | Scroll to KB section | KB article cards visible with title and explanation | |
| 5.2 | The text says "No external KB lookup. These cards explain the recommendation before the operator uses it." | Text present above articles | |
| 5.3 | Verify article cards do not link to real ServiceNow | Links are local/demo only | |

#### 6. Monthly Excel fill queue
| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 6.1 | Check the queue badge shows current state | "Queued", "Deferred", or "Pending" shown | |
| 6.2 | Text reads "Prompt after ticket is opened: fill the reviewed core fields into the current month tracking workbook, or keep it pending for later." | Instructional text present | |

#### 7. What NOT to test
- **No real ServiceNow login** — the app uses local mock data
- **No real Excel** — the monthly fill queue is a UI mock, no Excel writes
- **No real Teams/Outlook** — source items use demo/fake data
- **No Save/Submit/Update/Resolve/Close** — those would fail with a safety gate block
- **No browser autofill to real ServiceNow** — only local QA/dev targets allowed, and only text fields
- **No Git push/merge** — the branch is 13 ahead of origin, not reviewed yet

---

## Security/Privacy

No real ServiceNow hosts, customer data, credentials, approval phrases, or write capability claims found in the local codebase. Privacy scan clean on 220 files.

---

## BLOCKERS

**None.** All gates pass. The single flaky test is a resource-contention issue under parallel execution, not a logic defect. Sequential workspace concurrency resolves it reliably.

---

## Remaining Risks

1. **Windows double-click validation** — not tested here (out of green-zone scope). Product acceptance requires Alan or QA to double-click the Electron build on Windows and confirm the window opens.
2. **The flaky WebSocket+PowerShell test** (`waits for the matching Runtime.evaluate response...`) — timeouts under parallel vitest execution. Recommend increasing the test timeout from 5000ms to 10000ms for WSL environments, or adding a `{ retry: 2 }` vitest config for that specific test.

---

## Checklist file

This document IS the manual validation checklist. Alan can use Section 2-6 tables directly in their review.
