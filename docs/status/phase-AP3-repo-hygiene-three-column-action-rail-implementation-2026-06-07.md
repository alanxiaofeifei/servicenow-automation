# Phase AP3 — Repo-Hygiene Three-Column Action-Rail Implementation

**Date:** 2026-06-07
**Status:** implemented, all gates pass
**Scope:** restructure repo-hygiene card from single vertical column to three-column sub-layout

## Summary

Restructured the repo-hygiene card in the center workspace from a single vertical column to a three-column sub-layout per the AP2 UX spec. The card now uses `repo-hygiene-columns` CSS grid with:
- **Left column:** Queue/feed with 3 hygiene items (`.gitignore verification`, `Stale dist/release/`, `.local/video-analysis/`)
- **Center column:** Selected detail + evidence block with collapsible detail
- **Right column:** Action rail (5 buttons), cleanup preview card, boundary chip

The existing `styles.css` already had the three-column grid classes (`.repo-hygiene-columns`, dividers, responsive fallback, `.repo-hygiene-right-col`) from a prior partial implementation. The key change was restructuring the card JSX in `App.tsx` to use these classes.

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `apps/desktop/src/App.tsx` | Restructured repo-hygiene card JSX from single-column to three-column grid layout | ~50 lines restructured |
| `apps/desktop/src/styles.css` | Updated grid column ratios from `1fr 1.5fr 1fr` to spec values `minmax(280px, 0.28fr) minmax(460px, 0.46fr) minmax(300px, 0.26fr)` | 1 line |

## Why Each File Was Necessary

- **App.tsx**: The card JSX needed restructuring to use `.repo-hygiene-columns` container with left/center/right column divs instead of a single vertical flow.
- **styles.css**: The grid column ratios were not matching the AP2 spec; updated to the exact `minmax` values.

## Commands Run

```
pnpm build        — PASS
pnpm typecheck    — PASS
pnpm test         — PASS (440 tests total across the workspace)
pnpm privacy:scan — PASS (288 files)
```

## Test Results

All workspace tests pass:
1. ✓ 440 tests passed across the workspace
2. ✓ 150 desktop tests passed, including the repo-hygiene and worktree-acceptance coverage
3. ✓ The AP3-focused repo-hygiene layout assertions and the current worktree-acceptance copy are aligned

## Safety / Privacy Status

- No live ServiceNow login, browser automation, upload, PR, merge, tag, or release actions
- No raw URLs, ticket IDs, sys_id, credentials, cookies, or session data
- Copy uses generic file paths (e.g., `dist/release/`, `.local/video-analysis/`)
- Boundary chip and footer text clearly state "Local only"
- No new exports or external module dependencies

## Acceptance Checklist

- [x] Repo-hygiene card renders as three-column sub-layout (queue | evidence | actions)
- [x] Column hairline dividers present (via existing CSS)
- [x] Responsive fallback below 900px (via existing CSS)
- [x] All 3 hygiene items render with correct state chips
- [x] All 5 action buttons present in right column
- [x] Cleanup preview card appears in right column when toggled
- [x] Boundary copy preserved: "Local only", "No upload / PR / merge / tag / release"
- [x] Dynamic scan data accepted via `initialHygieneScanResult` prop
- [x] All 4 gates pass

## Remaining Risks

None observed in the current local-only verification run.

## Grid Layout Detail

```
┌───────────────────────────────────────────────────────────────────┐
│ header: Local Repo Hygiene + Archive Demotion                     │
├────────────────┬─────────────────────────┬────────────────────────┤
│ Left (queue)   │ Center (evidence)        │ Right (actions)       │
│ .gitignore     │ Stale artifacts: 3 files │ Refresh local scan   │
│   Verified     │   340 MB                 │ Open workspace root   │
│ dist/release/  │ Evidence detail ▶        │ Export status md      │
│   Pending      │ .codegraph/ scanned      │ Copy selected summary │
│ .local/video/  │ .worktrees/ scanned      │ Cleanup preview       │
│   Closed as N/A│ dist/release/ 3 stale     │                       │
│                │                         │ [Local only] chip     │
├────────────────┴─────────────────────────┴────────────────────────┤
│ footer: Local only · No upload/PR/merge/tag/release                │
└───────────────────────────────────────────────────────────────────┘
```
