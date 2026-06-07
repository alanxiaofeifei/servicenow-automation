# Phase AH3 — Worktree Acceptance Checkpoint Implementation

Date: 2026-06-07
Status: implementation complete — all gates pass
Parent task: t_a6ddb3b2 (AH2 UX spec)
Kanban task: t_02dfd729

## Goal

Implement the local-only workbench polish described by AH2 so the acceptance checkpoint is visible in the desktop/workbench surface without introducing live ServiceNow actions or forbidden data.

## Files changed

1. **apps/desktop/src/App.tsx** — Added `worktree-acceptance-card` section (~114 new lines) between the `repo-hygiene-card` and `selected-source-card` in the center workspace's `workbench-page-shell`. The card implements the three-column internal layout from the AH2 spec: left queue (dirty/fresh/stale/history), center boundary detail (dirty vs accepted explanation + safe next steps), and right actions (Review diff, Copy package path, Open dist/release, Mark reviewed, Copy summary) with disabled-state reasons.

2. **apps/desktop/src/styles.css** — Added ~278 lines of warm-light CSS for the card: `worktree-acceptance-card`, worktree-accept-header, path-line, metadata-strip, internal three-column grid, queue items, state chips (dirty/fresh/stale/history), boundary card, safe-next list, action buttons with disabled reasons, footer boundary note, and responsive breakpoint (stacks to single column below 800px).

3. **apps/desktop/src/App.test.ts** — Updated the ordering test in the repo-hygiene test to include the new card between hygiene and selected-source. Added a new test `renders worktree acceptance checkpoint card with boundary copy and state queue` that verifies: card class, title, package path, freshness chip, all 4 queue items, all 4 state chips, boundary copy, all 5 action buttons, disabled reason text, and footer boundary language.

## Gates

| Gate | Result |
|------|--------|
| pnpm build | Pass |
| pnpm typecheck | Pass |
| pnpm test | Pass (124 tests, 8 files) |
| pnpm privacy:scan | Pass (288 files) |

## What the card shows

- **Header**: "Worktree Acceptance Checkpoint" with "Fresh and verified" chip
- **Package path**: Current local Windows package (AG build, UNC path from spec)
- **Metadata strip**: Freshness (newest dated), Checksum (verified locally), mtime (2026-06-07 ~03:00 CST), Scope (Local-only)
- **Left column**: Queue with 4 items — Dirty worktree (Tracked changes still open), Fresh package (AG local Windows package), Stale packages (Earlier local packages), Validation history (No prior acceptance)
- **Center column**: Dirty vs accepted boundary explanation, "Acceptance is a human decision" copy, safe next steps list
- **Right column**: Action buttons — Review diff (with "Dirty changes still need review" note), Copy package path, Open dist/release, Mark reviewed (disabled with "dirty changes still need review" reason), Copy summary
- **Footer**: "Local only" chip + "No live ServiceNow action, upload, PR, merge, tag, or release is implied"

## Safety and privacy

- No live ServiceNow login, browser automation, or API writes.
- No Save / Submit / Update / Resolve / Close.
- No upload, Microsoft Graph/Excel Web writes, Teams/Outlook/phone ingestion.
- No secrets/cookies/storage-state/HAR/trace/screenshot/real URL/ticket ID/sys_id/requester/assignment group/raw field values.
- No push/PR/merge/tag/GitHub Release.
- The UNC path shown is a local WSL path, not a ServiceNow URL.
- The stub actions (Review diff, Open dist/release) have empty onClick handlers — they are local-only placeholders with no side effects.
- The disabled "Mark reviewed" button has an explicit `disabled` attribute and a visible explanation.

## Simplicity check

- The card follows the exact pattern of the repo-hygiene-card and other center workspace cards.
- Uses existing CSS variables (`--surface`, `--muted-text`, `--panel-border`, `--text`, `--warm-hairline`) for consistency.
- No new dependencies, providers, or architecture changes.
- The three-column internal grid is CSS-only (no JS for column management).

## Surgical check

- **App.tsx**: Only the new card section was added between existing cards. No other lines changed.
- **styles.css**: Only the CSS for the new card was appended. No existing styles were modified.
- **App.test.ts**: Only the ordering assertion was updated (one new variable, one new assertion line) and one new test was added. No existing tests were modified.

## Verification

- All automated gates pass (build, typecheck, test, privacy:scan).
- The card renders in the correct DOM position: handoff -> hygiene -> worktree acceptance -> selected source.
- All visible copy, chips, buttons, disabled reasons, and footer boundary note are verified in tests.
- Manual visual check is required after launching the app.

## Remaining risks

- The "Review diff" and "Open dist/release" buttons have no-op onClick handlers — they should be connected to real local actions in a follow-up task.
- The "Mark reviewed" button is always disabled — real acceptance logic (toggle based on review state) was not in scope for this AH3 local-only polish.
- Package path, checksum, and mtime are hardcoded from the spec — a future task should read them from the actual dist/release/ metadata.
