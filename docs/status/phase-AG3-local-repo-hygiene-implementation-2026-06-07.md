# Phase AG3 — Local Repo Hygiene + Artifact Boundary Panel Implementation

**Date**: 2026-06-07
**Status**: implemented, all gates pass
**Scope**: local-only repo hygiene and artifact boundary status surface in the desktop workbench

---

## Summary

Implemented a `repo-hygiene-card` as the second card in the center workspace (after release-readiness handoff, before selected-source card). The card surfaces three local hygiene items per the AG2 UX spec:

1. `.gitignore verification` — Verified (remediation complete)
2. `Stale dist/release/ artifacts` — Pending cleanup (unresolved item, highlighted)
3. `.local/video-analysis/` — Closed as N/A (local-only and gitignored)

Each item shows a state chip (Verified / Pending / Closed as N/A), a title, and a short explanation. The pending item is visually highlighted with `aria-current="true"`. A collapsible evidence section shows file counts, paths, and cleanup details. A footer strip displays a "Local only" boundary chip and the safety disclaimer. The `.local/video-analysis/` item is local-only and gitignored, not a live action.

## Files Changed

| File | Change | Lines |
|---|---|---|
| `apps/desktop/src/App.tsx` | Added hygiene card JSX after release-readiness-handoff card | +47 |
| `apps/desktop/src/styles.css` | Added `.repo-hygiene-*` CSS classes at end of file | +151 |
| `apps/desktop/src/App.test.ts` | Added `renders repo hygiene card` test case | +28 |

Total: 3 files, ~226 net lines added.

## Why Each File Was Necessary

- **App.tsx**: The hygiene card is a new center-workspace card that displays repo state; it must be rendered in the component JSX.
- **styles.css**: The hygiene card uses a distinct visual style (state chips, queue layout, evidence section, footer boundary) that doesn't exist in the existing CSS.
- **App.test.ts**: The test verifies the card renders, shows all 3 items, displays correct state chips, includes boundary copy, and is ordered correctly (handoff -> hygiene -> selected source).

## Commands Run

```
pnpm build       — PASS
pnpm typecheck   — PASS
pnpm test        — PASS (123 tests, +1 new)
pnpm privacy:scan — PASS (288 files)
```

## Safety / Privacy Status

- No live ServiceNow login, browser automation, upload, PR, merge, tag, or release actions
- No raw URLs, ticket IDs, sys_id, credentials, cookies, or session data
- Copy uses generic file paths (e.g., `dist/release/`, `.codegraph/`, `.worktrees/`)
- Boundary chip and footer text clearly state "Local only" and "No live ServiceNow action"
- No new exports or external module dependencies

## Acceptance Checklist

- [x] The panel/surface is implemented and tested locally
- [x] Hygiene state is visible without exposing secrets or raw sensitive identifiers
- [x] Copy aligns with the AG2 UX spec
- [x] `.gitignore` verification is shown as Verified
- [x] Stale `dist/release/` artifacts shown as Pending (unresolved item highlighted)
- [x] `.local/video-analysis/` shown as Closed as N/A (local-only, gitignored)
- [x] Boundary copy present: "Local only", "No upload / PR / merge / tag / release"
- [x] No live ServiceNow action introduced
- [x] All 4 gates pass (build, typecheck, test, privacy:scan)

## Remaining Risks

- The card uses hardcoded hygiene state (not live repo inspection). The data reflects the AG1 cleanup state as documented in the AG1 cleanup report. If the repo state changes, the hardcoded strings must be updated manually.
- The card currently shows all 3 items at once in the center workspace. No left-column navigation or filtering is implemented — this is a single-status-surface approach following the existing center-card pattern.

## Known UI Limitations

- The card always shows `centerState === "populated"` content; it does not use the empty/loading/error center state pattern because it has its own internal state representation.
- No refresh-local-scan button is present (the right rail could host this in a future phase).
- No export-to-markdown action is present.
- The card is always expanded; no collapse/expand toggle.
