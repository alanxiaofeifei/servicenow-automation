# Phase BA1 — Runtime Action Evidence and Operator Feedback Enrichment — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_e34bce74`

---

## 1. Latest final gate / backlog state

### AZ final gate — COMPLETE through AZ5 (privacy/security APPROVE)

The AZ chain ("Local Package Artifact Housekeeping + Validation Guide Refresh") completed through AZ5 (privacy/security audit — APPROVE). AZ6 (Windows package refresh) and AZ7 (final readiness gate) were never written because the AZ scope was docs-only and the branch state was clean.

AZ delivered:
- ✅ dist/release/ archive cleanup (stale packages moved to `.release-archive/`)
- ✅ `.before-appasar-refresh` development artifact removed
- ✅ `worktree-ipc.test.ts` AR3 stale fixtures updated
- ✅ START-HERE-WINDOWS.txt ay6-specific refresh (59 lines, three-card workflow, diagnostic overlay, Chromium provisioning)
- ✅ Clean-machine validation guide ay6 SHA256/size/gate-status refresh
- ✅ All 4 gates (build, typecheck, test, privacy:scan) — PASS
- ✅ AZ4 QA acceptance — PASS
- ✅ AZ5 privacy/security audit — APPROVE

### What was deferred — nothing explicit

The AY deferred items (5 artifact-cleanup tasks) were all delivered by AZ. No user-visible gaps were explicitly deferred from AZ.

However, a consistent observation across the AF→AX phases is that the **runtime action feedback** in the right-rail is functional but minimal. The operator sees a status label per action, but there is no persistent, scannable evidence panel showing what the last N actions were, what each produced, and whether the desktop backend has recorded any anomalies.

### Current local state

- Branch: `next/post-release-operator-cockpit-ab-20260606`
- Three-column operator workbench: delivered and tested
- Runtime actions (Start QA Chromium → Verify → Autofill): wired and functional
- `validationRunHistory` state tracks last 20 operator actions in memory
- No dedicated persistent "evidence panel" rendering these entries in the right rail — only a summary count on a history/subpage view
- `dist/release/`: clean (no stale packages)
- All automated gates: PASS

---

## 2. Current state — what's visible now vs. what's missing

### What the operator sees today

The right rail shows:
- Runtime action buttons (Start QA Chromium, Verify, Autofill)
- CDP readiness status chip
- Safety boundary notification
- Environment controls
- A compact "recent evidence" label with no persistent scrollable action history

### What's missing

The `validationRunHistory` state already captures every operator action result (launch, verify, autofill) with timestamp, status (ok/blocked/timeout/error), sanitized summary, planned field count, and filled field count — **but this data is not rendered as a persistent, scannable evidence panel in the right rail.**

The operator must switch to a different view to see validation run counts, and even there the display is a summary table rather than a timeline.

### Risk if not addressed

- Operator has no in-context evidence trail after each action
- If a blocked or error action occurs, there's no persistent record in the right rail
- Debugging "what happened" requires switching between views
- The rich data already being captured (`validationRunHistory`) is going to waste

---

## 3. Why this scope now — the most visible gap after AZ

After 15+ phases of cleanup, docs refresh, test fixture updates, and three-column polish, the runtime action feedback loop is the most visible area that has not been enriched.

### What makes this the right next scope

- **Visible in the desktop workbench** — right rail, always accessible
- **Local-only** — in-memory state, no ServiceNow writes, no IPC additions
- **Small** — one new panel section in App.tsx, no new state, no new IPC handlers
- **Builds on existing infrastructure** — `validationRunHistory` already captures the data
- **Self-contained** — no external dependencies, no human decision needed
- **Usability win** — the operator gets immediate, persistent feedback after each action

### What this enables

After BA completes, the operator will have:
1. A persistent runtime evidence timeline in the right rail
2. Clear status indicators (ok/blocked) for the last N actions
3. Collapsible detail per action (sanitized summary, field counts, timestamp)
4. An explicit "no evidence yet" empty state
5. Consistent disabled-reason display when the runtime action panel is not populated

---

## 4. Scope — what BA includes

### Deliverable A — This scope document (BA1)

Documents:
- The latest gate state (AZ final gate — APPROVE)
- The runtime evidence gap
- Why this is the next visible scope
- BA2–BA7 task chain
- Safety boundaries and change budget

### Deliverable B — BA2–BA7 downstream task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **BA2** | UX/copy spec — runtime action evidence panel | `sna-ui-designer` | BA1 | Define exact copy: panel title, per-action status labels, empty/error states, collapsed detail format, disabled-reason wording, accessibility labels. Specify the evidence panel position in the right rail (below action buttons, above safety boundary). Define maximum visible entries (12) and overflow behavior ("show last 12, scroll if more"). |
| **BA3** | Implementation — runtime evidence panel in right rail | `sna-frontend-workbench` | BA2 | Add evidence panel section to App.tsx render output in the right rail, consuming `validationRunHistory`. Show last 12 entries, newest first, with status chip, timestamp, sanitized summary, and collapsible detail. No new state, no new IPC, no new handlers. |
| **BA4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | BA3 | Verify: evidence panel renders in right rail, shows last 12 entries, status indicators correct, timestamps present, collapsible detail works, empty state shows when no runs exist, all disabled reasons in the runtime action panel remain correct, gates pass (build, typecheck, test, privacy:scan). |
| **BA5** | Privacy/security audit | `sna-privacy-security` | BA3 | Verify: no sensitive data leaked in evidence display (sanitized summaries are truly sanitized), no ServiceNow data exposed, no IPC handler changes introduce new risk. |
| **BA6** | Windows local package refresh | `sna-windows-runtime` | BA4 + BA5 | Rebuild fresh BA-dated package. Publish exact UNC path Alan should test. |
| **BA7** | Final local readiness gate | `sna-qa-acceptance` | BA4 + BA5 + BA6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED. |

### Dependencies

```
BA1 ──→ BA2 ──→ BA3 ──→ BA4 ──┐
                         │     ├──→ BA6 ──→ BA7
                         └──→ BA5 ──┘
```

BA3 (implementation) is the only code change. BA4 and BA5 can run in parallel after BA3. BA6 (package refresh) requires both QA and security sign-off.

---

## 5. Specific changes for BA3 (implementation)

### Change 1: Add evidence panel section to right rail

Insert a new section in the right rail, below the runtime action buttons and above the safety boundary chip.

**Location:** After the runtime action buttons `<div className="runtime-action-rail">` but before the safety boundary.

**Content:**
- Panel title: "Runtime Evidence" (matching BA2 spec)
- Last 12 entries from `validationRunHistory`, newest first
- Each entry shows:
  - Status chip: green (ok), amber (blocked), red (error/timeout)
  - Time: relative ("2m ago") + absolute tooltip
  - Action label: "Start QA Chromium", "Verify current Incident", or "Autofill current Incident"
  - Sanitized summary line (from `sanitizedSummary` field)
  - Collapsible `<details>` with: planned field count (if verify/autofill), filled field count (if autofill), exact timestamp
- Empty state: "No runtime actions yet. Choose a source and start QA Chromium."
- Scroll if more than 12 entries
- Maximum 12 visible

**No new state variables.** The panel reads only from existing `validationRunHistory`.

**No new IPC handlers.** All data is already in the renderer state.

### Change 2: CSS for evidence panel

Add CSS for:
- `.runtime-evidence-panel` — container with scroll
- `.runtime-evidence-entry` — per-entry row
- `.runtime-evidence-status-chip` — ok/blocked/error chips
- `.runtime-evidence-summary` — summary line
- `.runtime-evidence-detail` — collapsible detail section
- `.runtime-evidence-empty` — empty state styling

### File budget

| File | Change | Budget |
|------|--------|--------|
| `apps/desktop/src/App.tsx` | Insert evidence panel section in right rail | < 80 lines |
| `apps/desktop/src/styles.css` | Evidence panel CSS | < 60 lines |
| `apps/desktop/src/App.test.ts` | Add test for evidence panel rendering (empty + populated) | < 50 lines |

**Total estimated change budget:** < 200 lines across 3 files.

---

## 6. Non-goals

These are explicitly **out of scope** for BA:

- **No new IPC handlers, Electron API usage, or main-process changes**
- **No new state variables** — only existing `validationRunHistory` consumed
- **No behavioral changes** — runtime action buttons, gating, and safety logic stay identical
- **No changes to center column or left column**
- **No changes to the three-column layout or shell**
- **No changes to settings, environment controls, or safety boundary**
- **No database, file I/O, or persistent storage** — evidence is in-memory only
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes**
- **No refactoring beyond the specific changes listed in Section 5**
- **No changes to existing validation run recording logic** — only display

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BA2 | `docs/status/phase-BA2-ux-spec-*.md` | < 40 lines |
| BA3 | `apps/desktop/src/App.tsx` (< 80 lines), `apps/desktop/src/styles.css` (< 60 lines), `apps/desktop/src/App.test.ts` (< 50 lines) | < 200 lines |
| BA4 | QA checklist doc | < 40 lines |
| BA5 | Security audit doc | < 40 lines |
| BA6 | Build/packaging scripts | < 20 lines |
| BA7 | Gate document | < 40 lines |

**Total estimated change budget:** < 400 lines across 7–8 files.
**No production logic changes.** All changes are UI rendering, CSS, and tests.

---

## 8. Safety boundaries

### Safe (local-only, UI rendering of in-memory state, no IPC)

| Concern | Why it's safe |
|---------|---------------|
| Evidence panel reads from in-memory state | `validationRunHistory` is already maintained in renderer — no new data source |
| No new IPC or Electron API | All data is already in the renderer |
| No behavioral changes | Evidence panel is read-only display |
| Sanitized summaries only | `sanitizedSummary` is already sanitized before being stored |
| No persistent storage | Evidence is in-memory only — lost on page refresh |
| No ServiceNow writes | Panel is purely presentational |

### Red-zone (explicit prohibitions — identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- Local-only only; no external writes or deliveries
- No new IPC handlers or Electron API usage
- No changes to evidence recording logic

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:
- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing + new tests pass
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (BA6)
- Final local readiness gate before Alan manual validation (BA7)

---

## 10. Why this is the right next scope — honest assessment

### Not a P0 recovery (P0s are already delivered)

All 8 P0 criteria from PR #97 have been technically delivered across the AF–AZ chain.

### What BA adds that AZ didn't

AZ was artifact housekeeping (docs, stale packages, test fixtures). BA is the first UI-enrichment phase after the cleanup phases AY–AZ.

### Why this and not something else

| Candidate scope | Why not now |
|-----------------|-------------|
| App.tsx refactor | Not user-visible; too large for one BA cycle |
| More doc cleanup | Already done in AY + AZ |
| New IPC handlers | Would introduce risk after stable codebase |
| Settings enrichment | Would require IPC changes |
| Operator action evidence panel | ✅ Visible, local-only, small, builds on existing infrastructure |

### What this enables

After BA completes, the operator workbench will:
1. Show a persistent, scannable evidence panel in the right rail
2. Give the operator immediate feedback after each runtime action
3. Leverage already-captured `validationRunHistory` that is currently not displayed in-context
4. Be ready for the **next category of work** — whatever that may be — from a more usable baseline

---

## 11. Status

```
Phase BA1 — RUNTIME ACTION EVIDENCE AND OPERATOR FEEDBACK ENRICHMENT

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: AZ5 (privacy/security — APPROVE)
Current branch: next/post-release-operator-cockpit-ab-20260606

Phase chain: AE → AF → AG/AN → AO → AP → AQ → AR → AS → AT → AU → AV → AW → AX → AY → AZ → BA
  16 major phases. BA is the first UI-enrichment phase after AY/AZ cleanup.

Scope: Add a runtime action evidence panel in the right rail of the operator workbench,
        displaying the last 12 operator action results with status indicators,
        timestamps, sanitized summaries, and collapsible detail.

Downstream pipeline created: BA2 → BA3 → BA4 ∥ BA5 → BA6 → BA7
  BA2: UX/copy spec                          → sna-ui-designer [first]
  BA3: Implementation (evidence panel)       → sna-frontend-workbench [after BA2]
  BA4: QA acceptance                         → sna-qa-acceptance [after BA3]
  BA5: Privacy/security audit                → sna-privacy-security [after BA3]
  BA6: Windows local package refresh         → sna-windows-runtime [after BA4 + BA5]
  BA7: Final local readiness gate            → sna-qa-acceptance [after BA4 + BA5 + BA6]

Red-zone items excluded: 14
Non-goals: 12 (no new IPC, no new state, no behavioral changes, no layout changes,
           no ServiceNow, no Git push, no refactoring, no persistent storage,
           no settings changes, no center/left column changes,
           no evidence recording logic changes, no Electron API usage)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
