# Phase AG4 — QA Acceptance: Repo Hygiene + Artifact Boundary Panel

**Date**: 2026-06-07
**Tester**: `sna-qa-acceptance`
**Parent task**: t_8e2935c0 (AG3 — implementation)
**Verdict**: **PASS** — all acceptance criteria verified, all 4 required gates pass.

---

## Required Automated Gates

| Gate | Result | Evidence |
|---|---|---|
| `pnpm build` | PASS | 29 modules transformed, 3 bundles (main/preload/renderer), CLI done |
| `pnpm typecheck` | PASS | All 7 workspace projects pass: core, kb, ai, profiles, adapters, cli, desktop |
| `pnpm test` | PASS | 123/123 desktop tests, 55/55 cli, 95/95 adapters, 83/83 core, 34/34 ai, 17/17 profiles, 6/6 kb |
| `pnpm privacy:scan` | PASS | 288 files scanned, no privacy violations |

---

## Acceptance Criteria Verification

### A1. Three hygiene items are rendered with correct states

| Item | State Chip | aria-current |
|---|---|---|
| `.gitignore verification` | **Verified** | `false` |
| `Stale dist/release/ artifacts` | **Pending** (highlighted) | `true` (unresolved) |
| `.local/video-analysis/` | **Closed as N/A` | `false` |

**Evidence**: JSX lines 4120–4140 in App.tsx. All three items rendered. The pending item has `aria-current="true"` and the spec-required brand-accent border.

### A2. Collapsible evidence section

- "Show evidence" `<details>` element appears below the hygiene queue.
- Lists 4 bullet points: stale file count, canonical+latest kept, cleanup preview, after-cleanup totals.
- All file paths use generic names (`dist/release/`, `rc.1`, etc.) — no sensitive identifiers.

**Evidence**: Lines 4144–4151 in App.tsx.

### A3. Boundary footer

- **"Local only"** chip (neutral gray, `.repo-hygiene-boundary-chip` style).
- Text: "This surface only reports local repository state. No live ServiceNow action is performed here. Disabled actions explain why they are unavailable."
- Eyebrow line: "Local only · No ServiceNow actions · No upload / PR / merge / tag / release"

**Evidence**: Lines 4115 (eyebrow), 4154–4157 (footer) in App.tsx. Test line 1661–1663 confirms all three boundary strings appear.

### A4. Card ordering

- release-readiness-handoff → repo-hygiene-card → selected-source-card

**Evidence**: DOM index order verified in test (lines 1666–1671). `hygieneIndex > handoffIndex && selectedIndex > hygieneIndex`.

### A5. Safety and privacy

**No sensitive data in AG3 additions (git diff HEAD check):**
- No `service-now.com` URL
- No `sys_id` or `sysparm`
- No `password`, `credential`, `token`, `api_key`
- No `cookie`, `session`, `localStorage`
- No `fetch()`, `axios.post`, `axios.put`, `axios.patch`, `axios.delete`
- No real ticket IDs, customer names, or assignment groups

**No ServiceNow write action:**
- No Save/Submit/Update/Resolve/Close buttons or API calls
- No live browser automation
- No upload, PR, merge, tag, or release triggers
- The card is static JSX with no event handlers beyond the `<details>` toggle

### A6. Test coverage

New test "renders repo hygiene card after handoff and before selected source card" (App.test.ts lines 1645–1672) covers:
- Title rendering
- All 3 items by name
- All 3 state chips
- Boundary copy strings
- Card ordering assertion

---

## Surgical Change Validation

| File | Lines Changed | Why Necessary |
|---|---|---|
| `apps/desktop/src/App.tsx` | +47 | New center-workspace card JSX inserted after handoff, before selected-source |
| `apps/desktop/src/styles.css` | +150 | New `.repo-hygiene-*` CSS classes for state chips, queue layout, evidence drawer, boundary footer |
| `apps/desktop/src/App.test.ts` | +29 | Test coverage for the new card rendering and ordering |

Total: 3 files, 226 additions. No deletions. No unrelated files touched.

---

## Remaining Risks for Local Hygiene Follow-ups

1. **Hardcoded hygiene state**: The card embeds literal strings for the 3 items rather than inspecting the live repo. If repo state changes, the strings must be manually updated.
2. **No refresh button**: The right rail could host a "Rescan" action in a future phase.
3. **No export-to-markdown**: The evidence section is in-app only; there's no "Export report" action.

These are documented in the AG3 implementation doc and are outside AG4's acceptance scope.

---

## Manual Steps for Alan (local-only, no ServiceNow actions)

1. **Build the desktop app**: `pnpm build` (verified: passes)
2. **Run the tests**: `pnpm test` (verified: 123 desktop tests pass including hygiene card test)
3. **Launch the desktop workbench**: In a Windows environment, double-click the packaged `.exe` or run `npx electron apps/desktop` from WSL
4. **Visually verify the center workspace** shows three cards in order:
   - Release Readiness Handoff
   - Local Repo Hygiene + Artifact Boundary ← NEW
   - Selected Source (ticket queue item)
5. **Confirm the Pending item** (Stale dist/release/ artifacts) is highlighted with a colored left border
6. **Expand the evidence details**: Click "Show evidence" to verify the collapsible section works
7. **Confirm the boundary footer** reads "Local only" and the safety disclaimer
8. **Verify the .gitignore remediation** item shows as "Verified" (not reopened)
9. **Verify the .local/video-analysis/** item shows as "Closed as N/A" (not "Open" or "Investigating")
10. **Confirm no button** in this card triggers a ServiceNow write, URL navigation, or file upload

---

## Handoff to Next Phase (AG6)

This acceptance unblocks t_bceef47b (AG6 — Windows local package refresh). The repo hygiene panel is verified clean and safe for the package refresh pass.
