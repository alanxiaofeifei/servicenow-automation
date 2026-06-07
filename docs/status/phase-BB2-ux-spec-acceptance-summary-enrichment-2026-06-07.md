# Phase BB2 — UX / Copy Spec — Acceptance Summary Enrichment

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-ui-designer`
**Task:** `t_3fd41985`

---

## 1. Preflight

**Goal**
Enrich the worktree acceptance copy so the operator can see validation history at a glance without changing runtime behavior, layout, or IPC.

**Known facts**
- The current `Copy Summary` action emits: `Worktree {state}, {reviewed/not reviewed}, {accepted/not accepted}. Package: {filename} ({size}) — {path}`.
- `validationRunHistory` already exists in memory and already stores `timestamp`, `action`, `status`, and `sanitizedSummary`.
- The runtime evidence panel already shows the run list, so the acceptance card should stay compact.
- No new IPC handlers, runtime actions, or evidence-panel behavior are in scope.
- `sanitizedSummary` must remain sanitized and local-only.

**Assumptions**
- The implementation team will keep the current button label `Copy Summary`.
- The acceptance card can show a small history indicator without becoming a second evidence panel.
- `timeout` runs should not create a fourth counter in the clipboard string unless the implementation team explicitly chooses to surface them separately.

**Ambiguities**
- Whether the last-run indicator should be a chip or a queue item in the card.
- Whether timeout runs should be counted as errors in the compact summary.
- Whether the empty state should say `none yet` or `no validation runs yet` in the card itself.

**Chosen smallest approach**
- Keep the current button and card structure.
- Add one compact, dynamic `last run` chip to the worktree acceptance card when `validationRunHistory` is non-empty.
- Keep the queue item area unchanged; do not add a new queue row.
- Treat `timeout` as part of the compact error bucket for the clipboard summary so the copy stays readable.

**Files likely affected**
- `docs/status/phase-BB2-ux-spec-acceptance-summary-enrichment-2026-06-07.md` (new)
- `apps/desktop/src/App.tsx` only in the downstream implementation task, not this one

**Verification plan**
- Confirm the spec spells out the exact clipboard string for non-empty and empty history.
- Confirm the spec chooses chip vs queue item and explains why.
- Confirm the spec includes button gating, empty-state copy, accessibility notes, and implementation handoff.
- Confirm no raw URLs, ticket IDs, sys_ids, cookies, or other unsafe data appears.

---

## 2. Reference read

The current workbench already splits concerns well:
- the runtime evidence panel shows the detailed run list
- the worktree acceptance card shows package state and local acceptance state
- the acceptance summary clipboard is the quick-share bridge between those two views

That means the copy should answer the operator’s question in one sentence, not duplicate the full history list.

---

## 3. Decision: chip, not queue item

Add a compact dynamic `last run` chip to the worktree acceptance card when `validationRunHistory` is non-empty.

Why chip, not queue item:
- The card already contains a current package row and a history row.
- A new queue item would make the card taller and visually heavier.
- The runtime evidence panel already carries the detailed run list.
- The chip gives a fast status read without creating a second history surface.

Recommended chip labels:
- `Last run: OK`
- `Last run: BLOCKED`
- `Last run: ERROR`
- `Last run: TIMEOUT`
- `Last run: none yet` when history is empty

The chip should be compact and informational only; it does not need to be clickable.

---

## 4. Exact copy for `Copy Summary`

### 4.1 Current baseline

Current string:

```text
Worktree {state}, {reviewed/not reviewed}, {accepted/not accepted}. Package: {filename} ({size}) — {path}
```

### 4.2 Proposed enriched string

Use this exact structure:

```text
Worktree {state}, {reviewed/not reviewed}, {accepted/not accepted}. Package: {filename} ({size}) — {path}. Validation runs: {total} total ({ok} ok, {blocked} blocked, {error} error). Last run: {lastRunStatus} · {lastRunActionLabel} · {lastRunSanitizedSummary}
```

### 4.3 Field rules

- `total` = `validationRunHistory.length`
- `ok` = count of runs with `status === "ok"`
- `blocked` = count of runs with `status === "blocked"`
- `error` = count of runs with `status === "error"` plus runs with `status === "timeout"`
- `lastRunStatus` = the most recent run’s status label, normalized for display:
  - `OK`
  - `BLOCKED`
  - `ERROR`
  - `TIMEOUT`
- `lastRunActionLabel` = existing display label for the last run’s action
- `lastRunSanitizedSummary` = the existing `sanitizedSummary` field from the last run

### 4.4 Empty-history clipboard copy

When `validationRunHistory.length === 0`, use this exact completion:

```text
Worktree {state}, {reviewed/not reviewed}, {accepted/not accepted}. Package: {filename} ({size}) — {path}. Validation runs: 0 total (0 ok, 0 blocked, 0 error). Last run: none yet.
```

### 4.5 Empty-card helper copy

When the acceptance card itself has no run history, show a short muted helper line such as:

```text
No validation runs yet. Copy Summary will report 0 total, 0 ok, 0 blocked, 0 error, and last run: none yet.
```

That helper line keeps the card understandable even before the first validation run exists.

---

## 5. State matrix

| State | Acceptance card treatment | Clipboard output | Notes |
|---|---|---|---|
| No validation runs | Show `Last run: none yet` chip and muted helper copy | Use the empty-history clipboard string | Keep the card compact; no extra history row |
| History exists, latest run is `ok` | Show `Last run: OK` chip | Include the full count block and the latest run action + sanitized summary | This is the common success case |
| History exists, latest run is `blocked` | Show `Last run: BLOCKED` chip | Same full string, with the latest blocked run details | The chip should make the last safe stop obvious |
| History exists, latest run is `error` | Show `Last run: ERROR` chip | Same full string, with the latest error details | Error bucket includes timeout runs in the compact count |
| History exists, latest run is `timeout` | Show `Last run: TIMEOUT` chip | Same full string, with the latest timeout details | Timeout remains visible as its own status chip even though it is counted in the error bucket |

---

## 6. Button enable / disable logic

### `Copy Summary`

Recommended behavior:
- Keep the button enabled whenever the worktree acceptance card is visible.
- Do not require validation history before allowing the copy.
- Do not disable the action just because the history is empty; the clipboard text already has a safe empty-state branch.

Why:
- The copy is local-only and read-only.
- The action remains useful even before the first validation run.
- Disabled buttons should be reserved for actions with a safety or readiness dependency; this one does not have one.

### Last-run chip

- Enabled? Not applicable; it is informational only.
- Click behavior: none required.
- If the implementation later adds hover or tooltip text, it should remain purely descriptive.

---

## 7. Empty, loading, and error states

### Empty state

When there is no validation history:
- show `Last run: none yet`
- show the helper line above
- keep the summary button available
- use the empty-history clipboard string

### Loading state

If acceptance state is still being resolved from local memory:
- preserve the existing acceptance card structure
- avoid spinner-first copy
- prefer a muted `Loading local validation history...` helper if the implementation needs one

### Error state

If local history cannot be read safely:
- keep the last known safe copy visible if available
- do not guess at counts
- prefer a conservative fallback such as `Validation runs: unavailable` only if the implementation already has a local error path

---

## 8. Accessibility notes

- Keep the chip text short and high-contrast enough to read at a glance in the warm-light theme.
- Do not rely on color alone for `OK`, `BLOCKED`, `ERROR`, or `TIMEOUT`.
- If the chip uses color, pair it with the explicit status label.
- Ensure the `Copy Summary` button remains a large touch target.
- The empty-state helper should be plain-language, not jargon.
- The sanitized summary must stay free of raw URLs, ticket IDs, sys_ids, cookies, or page fingerprints.
- The chip should not interrupt keyboard navigation or create a focus trap.

---

## 9. GPT Images 2 / mockup notes

Attempted to generate a sanitized workbench mockup focused on the acceptance summary card with GPT Images 2, but the image backend returned `FalClientHTTPError` twice in this run.

Result:
- No mockup image artifact was produced for this task.
- The spec therefore stands on text-only acceptance guidance.

If a later pass wants a visual companion, the mockup prompt should remain sanitized and fake-data only.

---

## 10. Implementation handoff for `sna-frontend-workbench`

### What to implement
- Enrich the `Copy Summary` clipboard string with total validation runs, ok/blocked/error counts, and last-run details.
- Add a compact last-run chip to the worktree acceptance card when history exists.
- Add the empty-state helper line for the no-history case.
- Keep all data local and in-memory.

### What not to change
- No new IPC handlers.
- No runtime action behavior changes.
- No layout or column changes.
- No new evidence panel.
- No raw URL or ticket leakage.

### Suggested implementation shape
- Reuse the existing `validationRunHistory` array.
- Derive counts from the array at render time.
- Use the latest item in the array for the chip and the summary tail.
- Keep the summary text deterministic and stable for clipboard use.

### Safety / privacy status
- Safe if it only reads existing in-memory state.
- No ServiceNow writes.
- No external network dependency.
- No raw user/customer identifiers.

### Remaining risks
- The implementation could accidentally expose an un-sanitized summary tail if it bypasses `sanitizedSummary`.
- Timeout handling should stay explicit so the counts and chip do not contradict each other.
- The acceptance card could become visually busy if the chip is rendered too large; keep it compact.

---

## 11. Status

```text
Phase BB2 — UX / Copy Spec — Acceptance Summary Enrichment

State: COMPLETE (definition only, no implementation)
Deliverable: docs/status/phase-BB2-ux-spec-acceptance-summary-enrichment-2026-06-07.md
Scope: enrich the worktree acceptance copy with validation-history counts and a compact last-run state indicator while keeping the runtime evidence panel and layout unchanged.
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
