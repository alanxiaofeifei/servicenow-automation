# Accelerated Field-Trial Implementation Plan

> **For Hermes:** Use service-desk-automation-safety before execution. Use TDD, small GitHub issues, full gates, privacy/safety scan, independent review, and GPT-5.5 Pro checkpoint before any real QA write.

**Goal:** Make the Service Desk Workflow Cockpit field-trial-ready by 2026-05-29, then use 2026-06-01 to 2026-06-05 for QA trials, bug fixes, demo recording, and job-search positioning.

**Architecture:** Keep P0 local, deterministic, fake/sanitized, and human-in-the-loop. Add recording-derived scenarios and field-trial runbooks before any real QA ticket. If GPT-5.5 Pro approves QA writes, perform only a controlled single-ticket manual-fill assisted QA trial with explicit approval.

**Tech Stack:** Electron + React + TypeScript, pnpm workspace, Vitest, existing core workflow model, local fake demo data, GitHub issues, docs checkpoint prompts.

---

## Timeline

As of 2026-05-21:

- 2026-05-29 field-trial-ready target: 7 weekdays including today and target day.
- 2026-06-05 demo/polish target: 12 weekdays including today and target day.

New operating model:

```text
By 2026-05-29: safe product slice + QA runbook + GPT checkpoint + first QA-ready package
2026-06-01 to 2026-06-05: QA trial(s), bug fix, demo polish, recording, resume/interview packaging
```

## Non-negotiable boundaries

Until a later checkpoint explicitly approves more:

- No production use.
- No bulk ticket creation.
- No browser DOM autofill.
- No ServiceNow API write.
- No Microsoft Graph / Excel Web write.
- No real Teams / Outlook / ServiceNow Chat polling.
- No external AI on raw enterprise/customer/ticket/mail/chat content.
- No committed screenshots, recordings, HAR, traces, storage-state, cookies, sessions, credentials, or raw transcripts.
- QA writes, if approved, must be single-ticket, fake/sanitized, manual-fill assisted, explicitly approved, and recorded only as sanitized outcomes.

---

## Phase 0 — GPT checkpoint before QA write decision

**Objective:** Ask GPT-5.5 Pro whether the new deadline and recording evidence justify a controlled QA single-ticket field trial.

**Files:**

- Use: `docs/prompts/gpt-5.5-pro/accelerated-qa-field-trial-after-recordings-review.md`
- Reference: `docs/research/field-workflow-recording-analysis-2026-05-21.md`
- Reference: `docs/research/manager-call-deadline-update-2026-05-21.md`

**Steps:**

1. Paste the checkpoint prompt into GPT-5.5 Pro.
2. Ask for the required verdict format.
3. Save the sanitized result under `docs/reviews/` if useful.
4. Do not start QA write implementation until the verdict is READY or READY WITH CONDITIONS.

**Verification:** GPT-5.5 Pro gives explicit verdict and conditions.

---

## Phase 1 — Add recording-derived fake scenarios

**Objective:** Make the demo reflect Alan's actual Service Desk workflow without real data.

**Suggested issue:** `Add recording-derived fake workflow scenarios`

**Files:**

- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/App.test.ts`
- Modify if needed: `packages/core/src/service-desk-workflow.ts`
- Modify if needed: `packages/core/src/service-desk-workflow.test.ts`

**Implementation scope:**

Add or revise local fake queue items for:

1. Chat intake to Incident routing.
2. Shared mailbox with attachment evidence.
3. Phone call intake with confirmation state.
4. Self-service ticket requiring SD normalization and final routing.
5. Remote support / Teams troubleshooting runbook scenario.

**Acceptance criteria:**

- Every scenario is clearly fake/sanitized.
- Source channel and ServiceNow channel mapping are visible.
- Teams and ServiceNow Chat both map to `Chat`, but original source labels remain visible.
- Phone call scenario works even without written source text.
- Self-service scenario emphasizes normalization before final assignment.
- Remote support scenario is local checklist only; no real remote automation.

**Verification commands:**

```bash
pnpm --filter @servicenow-automation/desktop test
pnpm --filter @servicenow-automation/desktop typecheck
pnpm build
pnpm typecheck
pnpm test
```

---

## Phase 2 — Evidence / attachment review state

**Objective:** Represent screenshot/document evidence from real workflow without implementing real OCR or uploads.

**Suggested issue:** `Add local evidence review state to source review`

**Files:**

- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/App.test.ts`
- Modify if needed: `packages/core/src/service-desk-workflow.ts`

**Implementation scope:**

Add a small local-only section in Source Review:

- Evidence type: screenshot / document / table / none.
- Review state: not reviewed / reviewed / needs manual check.
- Extracted facts: fake deterministic bullet list.
- Safety copy: `Evidence state is demo-only. No file is uploaded, OCRed, or sent externally.`

**Acceptance criteria:**

- Collapsed by default if UI gets crowded.
- No file upload control in P0.
- No OCR dependency.
- No external AI call.
- No real attachment names or contents.

---

## Phase 3 — Remote support / troubleshooting checklist

**Objective:** Model remote-support-style work observed in recordings while avoiding real remote automation.

**Suggested issue:** `Add local remote support checklist scenario`

**Files:**

- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/App.test.ts`

**Implementation scope:**

Add collapsed `Troubleshooting Checklist` for the remote support scenario:

- Confirm user identity and affected device/app.
- Confirm issue impact and urgency.
- Check app launch / login / version state.
- Check basic network / browser condition.
- Capture result in Work Notes plan.
- Generate user-facing follow-up draft.

**Hard copy boundary:**

The panel must say:

```text
Local checklist only — no remote desktop control, no command execution, no file access.
```

---

## Phase 4 — Excel dry-run row refinement

**Objective:** Align Excel dry-run preview with recording-derived workflow and QA field trial needs.

**Suggested issue:** `Refine Excel dry-run row for QA field trial`

**Files:**

- Modify: `packages/core/src/service-desk-workflow.ts`
- Modify: `packages/core/src/service-desk-workflow.test.ts`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/App.test.ts`
- Modify if needed: `apps/cli/src/cli.ts`

**Candidate fields to add:**

- Service Desk owner / initial group
- Confirmation State
- Evidence Review State
- QA Trial Result

**Acceptance criteria:**

- Still dry-run only.
- CSV row remains copyable.
- UI remains readable at common laptop widths.
- No Graph / Excel Web write.
- Tests cover the new columns and copy text.

---

## Phase 5 — Demo flow script and in-app guide

**Objective:** Make Alan's 3–5 minute presentation obvious and interview-friendly.

**Suggested issue:** `Add 3-5 minute demo flow guide`

**Files:**

- Create: `docs/demo/field-trial-demo-flow-script.md`
- Modify optionally: `apps/desktop/src/App.tsx`
- Modify optionally: `apps/desktop/src/App.test.ts`

**Demo story:**

1. Real problem: Service Desk agents switch across ServiceNow, Teams/chat, mailbox, remote support, portals, attachments, and Excel.
2. Cockpit receives a fake sanitized multi-channel intake item.
3. Source Review cleans and normalizes the intake.
4. Confirmation state highlights missing facts.
5. Incident Draft maps required ServiceNow fields.
6. Two-stage routing mirrors real Service Desk handling.
7. Work Notes plan is generated but not saved automatically.
8. Excel dry-run row provides reporting without workbook write.
9. Safety panel proves no uncontrolled integrations or production writes.

**Acceptance criteria:**

- Script is understandable by a hiring manager.
- Script explicitly says the demo uses fake/sanitized data.
- Script emphasizes business value and safety, not only code.

---

## Phase 6 — Controlled QA single-ticket trial only if GPT approves

**Objective:** Validate field mapping in a QA environment without uncontrolled automation.

**Preconditions:**

- GPT-5.5 Pro checkpoint returns READY or READY WITH CONDITIONS.
- Alan confirms QA target and exact fake scenario.
- Approval phrase is required for every real write.
- Tool-owned/dedicated browser profile strategy is confirmed or manual browser fill is used.

**Allowed first trial:**

```text
QA environment only
+ fake/sanitized ticket content
+ one ticket
+ manual-fill assisted
+ no browser DOM autofill
+ no ServiceNow API
+ no bulk create
+ no production
+ sanitized outcome note only
```

**Stop rules:**

- Browser profile isolation uncertain.
- QA host or environment uncertain.
- Any real customer data appears in the draft.
- Any Save / Submit / Update / Resolve / Close action is not explicitly approved.
- Any attempt to auto-fill DOM or use API occurs.
- Any screenshot, trace, cookie, storage-state, or session would be stored.

---

## Recommended order before 2026-05-29

1. Run GPT checkpoint.
2. Implement Phase 1 scenarios.
3. Implement either Phase 2 evidence state or Phase 3 troubleshooting checklist; choose whichever best supports the first QA scenario.
4. Refine Excel dry-run row only if it does not crowd the UI.
5. Write demo flow script.
6. If GPT approves, perform one controlled QA single-ticket field trial.
7. Fix only blockers found by QA; do not expand scope.

## What to defer

- Real integrations.
- Full workflow engine.
- Persistent template store.
- Real attachment OCR.
- Remote desktop automation.
- Bulk ticket handling.
- AI provider integration with real enterprise data.
- Installer/product packaging.

## Verification gates for every code slice

Run:

```bash
pnpm --filter @servicenow-automation/desktop test
pnpm --filter @servicenow-automation/desktop typecheck
pnpm build
pnpm typecheck
pnpm test
```

Then:

- Safety/privacy diff scan.
- Browser smoke for UI readability.
- Independent pre-commit review.
- Commit and push only after gates pass.
