# Phase AJ4 — QA Acceptance and Alan Manual Checklist for Package-Path Clarity

**Status:** PASS
**Date:** 2026-06-07
**QA Engineer:** sna-qa-acceptance (automated)
**Phase:** AJ4 (post-AJ3 implementation of package-path clarity)

---

## Automated Gates

| Gate | Result | Details |
|------|--------|---------|
| `pnpm build` | PASS | All packages build clean |
| `pnpm typecheck` | PASS | All packages typecheck clean |
| `pnpm test` | PASS | Desktop 147/147 tests pass (354 total across all packages) |
| `pnpm privacy:scan` | PASS | 288 files scanned, no leaks |

### Gate evidence

```
apps/desktop build: ✓ built in 793ms
packages/core typecheck: Done
apps/desktop test: Tests  147 passed (147)
TRACKED_PRIVACY_SCAN_PASS files=288
```

---

## Code Review — Package-Path Clarity Changes

### Files changed (AJ3)

| File | Change |
|------|--------|
| `apps/desktop/src/App.tsx` | Package path/SHA256/What-changed metadata → dynamic via `worktreePkgMetadata`. Archive labels "Stale" → "Archival only". "rc/ad/ab" → "AF/AG/AH". Added worktree acceptance checkpoint card with 3-column layout, diff review, Mark reviewed gating, manual validation checklist. Added `linuxToWslUncPath` conversion utility. |
| `apps/desktop/src/styles.css` | ~510 lines of new CSS for repo hygiene card, worktree acceptance card (3-column grid, state queue, boundary card, diff panel, footer). |
| `apps/desktop/src/App.test.ts` | Removed hardcoded path/SHA256 checks (now dynamic). Added 9 new tests for: repo hygiene card, worktree acceptance card boundary+state queue, dirty/reviewed states, Mark reviewed enable/disable logic, Accepted chip, manual validation checklist. |

### Label verification

| Label | Previous | Current | Verdict |
|-------|----------|---------|---------|
| Archive entry labels | `Stale` (×3) | `Archival only` (×3) | PASS |
| Stale warning header | `Older rc/ad/ab packages...` | `Older AF/AG/AH packages...` | PASS |
| Package archive references | `rc/ad/ab` | `AF/AG/AH` | PASS |
| Worktree accept stale chip | *(was not present)* | `Archival only` | PASS |
| Worktree accept stale header | *(was not present)* | `Archived local Windows package` | PASS |
| Worktree accept current header | *(was not present)* | `Current local Windows package` | PASS |
| Handoff latest badge | `Latest local package` | `Latest local package` (unchanged — correct) | PASS |
| Package path | Hardcoded UNC string | Dynamic via `worktreePkgMetadata` | PASS |
| SHA256 | Hardcoded hex string | Dynamic via `worktreePkgMetadata` | PASS |
| Copy path button | Hardcoded UNC | Dynamic conversion via `linuxToWslUncPath` | PASS |
| Copy SHA256 button | Hardcoded hex | Dynamic from metadata | PASS |
| What-changed summary | Hardcoded text | Dynamic filename + "newest dated local build..." | PASS |

### Acceptance criteria verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Current package clearly labeled `Current local Windows package` | PASS | Line 4301: `<strong>Current local Windows package</strong>` |
| 2 | Older packages marked `Archived local Windows package` / `Archival only` | PASS | Lines 4306-4309: chips + header both correct |
| 3 | "Stale" → "Archival only" in handoff archive entries | PASS | Lines 4144, 4148, 4152: `<dt>Archival only</dt>` |
| 4 | "rc/ad/ab" → "AF/AG/AH" in warning copy | PASS | Line 4133: `Older AF/AG/AH packages are archival only` |
| 5 | Dynamic package path replaces hardcoded UNC | PASS | Line 4115: `{worktreePkgMetadata ? linuxToWslUncPath(...) : ...}` |
| 6 | Dynamic SHA256 replaces hardcoded | PASS | Lines 4119-4121 dynamic display |
| 7 | Manual validation checklist present with 5 AJ2-spec items | PASS | Lines 4343-4352 |
| 8 | Three-column UI layout (Queue-State / Boundary-Detail / Actions-Safety) | PASS | Lines 4287-4415: `worktree-accept-grid` with left/center/right columns |
| 9 | "Mark reviewed" only enabled after diff review when dirty | PASS | Lines 4388-4401: `disabled={worktreeReviewed || (worktreeHasDirtyChanges && !worktreeDiffReviewed)}` |
| 10 | No hardcoded ServiceNow URL/fingerprint/credential/session | PASS | Code reviewed — no raw SNow identifiers |
| 11 | No stale AG wording in App.tsx source | PASS | All references now use `AF/AG/AH` or generic "archival only" |
| 12 | Autofill separated from Save/Submit/Update/Resolve/Close | PASS | Verified in handoff boundaries section |

---

## Alan Manual Validation Checklist

Run this checklist while visually inspecting the app at `dist/release/`:

### Prerequisites

- A recent local build exists in `dist/release/` (e.g., `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip`)
- The app is running via Electron (from the latest build)

### UNC path format (for reference)

When the app renders, the package path should appear in this format:

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip
```

Substitute the actual newest package filename as Alan sees it.

---

### 1. Handoff card (Release Readiness Handoff)

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 1.1 | Scroll to Release Readiness Handoff card | Card is visible and titled "Release Readiness Handoff" | |
| 1.2 | Check the latest badge | Shows "Latest local package" badge on current entry | |
| 1.3 | Check package path display | Shows a UNC path starting with `\\wsl.localhost\Ubuntu-Compact\` — NOT hardcoded text | |
| 1.4 | Check SHA256 | Shows a hex hash — NOT hardcoded `4a9c7a38...` | |
| 1.5 | Check What changed | Shows `servicenow-automation-windows-v0.1.0-rc.1-ai6-...` (the actual current filename) | |
| 1.6 | Check stale warning text | Reads: `Older AF/AG/AH packages are archival only` (NOT `rc/ad/ab`) | |
| 1.7 | Check archive entry labels | All older entries say **Archival only** (NOT `Stale`) | |
| 1.8 | Click Copy path | Copies the UNC path to clipboard — verify the path is correct for the latest build | |
| 1.9 | Click Copy SHA256 | Copies the hex hash to clipboard | |
| 1.10 | Check the "Why retest matters" list | Contains `Confirms older packages are visibly archival only` | |

### 2. Repo Hygiene + Artifact Boundary card

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 2.1 | Scroll to card below handoff | Card with border-left color `#bb8256` (brown) | |
| 2.2 | Check state chips | Shows "Verified", "Pending", "Closed as N/A" chips | |
| 2.3 | Check boundary footer | Shows "Local only" chip + "No upload / PR / merge / tag / release" | |

### 3. Worktree Acceptance Checkpoint card

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 3.1 | Verify card is present between hygiene and selected source | Card titled "Worktree Acceptance Checkpoint" with green left border | |
| 3.2 | Check eyebrow | Reads: "Local only · No ServiceNow actions · No upload / PR / merge / tag / release" | |
| 3.3 | Check package path line | Shows path label "Current local Windows package:" with UNC path | |
| 3.4 | Check freshness badge | Shows "Newest dated local package" badge | |
| 3.5 | Check left column (Queue · State) | 4 queue items: Dirty → Fresh → Archival only → History | |
| 3.6 | Check "Current local Windows package" label | Present on the Fresh queue item | |
| 3.7 | Check "Archived local Windows package" label | Present on the Archival only queue item | |
| 3.8 | Check center column (Boundary · Detail) | Contains "Dirty vs accepted boundary" card + "What is safe to do next" | |
| 3.9 | Check manual validation checklist | 5 numbered items present with correct AJ2 copy | |
| 3.10 | Check right column (Actions · Safety) | Shows: Review diff, Copy package path, Open dist/release, Mark reviewed, Copy summary buttons | |
| 3.11 | Check Mark reviewed is disabled when dirty | If worktree has uncommitted changes, "Disabled: dirty changes still need review before acceptance" appears | |
| 3.12 | Check Mark reviewed enables after diff review | Click "Review diff" → Mark reviewed becomes enabled | |
| 3.13 | Check footer | Shows "Local only" chip + "No live ServiceNow action, upload, PR, merge, tag, or release is implied" | |

### 4. Stale label audit (no AG wording)

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 4.1 | Search all visible labels for "Stale" | No visible user-facing label says "Stale" (except in repo hygiene card where it refers to actual stale build files) | |
| 4.2 | Search for "rc/ad/ab" | Not present anywhere in visible text | |
| 4.3 | Search for "AG/AF" / "AF/AG/AH" | Only appears in archival context: "Older AF/AG/AH packages are archival only" | |
| 4.4 | Verify "Archival only" is the preferred badge wording | All archive entries use "Archival only" | |

### 5. Boundary safety verification

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 5.1 | Verify "Mark reviewed" does NOT trigger ServiceNow write | UI shows "No live ServiceNow action, upload, PR, merge, tag, or release is implied" | |
| 5.2 | Verify Autofill/Verify remains separate from Save/Submit/Update/Resolve/Close | Check the handoff "Human-only boundaries" section | |

---

## Current UNC Path (as seen in the App)

The worktree acceptance card renders the current package path dynamically from Electron IPC. The expected format is:

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\<repo>\dist\release\<filename>-local.zip
```

At the time of this QA, the newest package in `dist/release/` is:
- `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` (04:38, 118 MB)

Older archival packages in `dist/release/`:
- `servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` (03:59)
- `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip` (03:36)
- `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` (02:39)

---

## Concise Pass/Fail Summary

| Area | Verdict |
|------|---------|
| **Automated gates** | PASS — all 4 gates (build, typecheck, 354 tests, privacy:scan) |
| **Package-path clarity** | PASS — handoff path is dynamic, labels are current |
| **Archive labels** | PASS — "Stale" → "Archival only" throughout |
| **Alias references** | PASS — "rc/ad/ab" → "AF/AG/AH" |
| **Worktree acceptance** | PASS — 3-column UI with full state queue, boundary copy, checklist, actions |
| **Dynamic metadata** | PASS — paths, SHA256, filenames all read from IPC |
| **No stale AG wording** | PASS — no AG-phase labels in source text |
| **Safety/audit** | PASS — no SNow secrets, local-only boundary enforced in text and logic |
| **Tests** | PASS — 9 new tests cover worktree acceptance states, checklist, hygiene ordering, Mark reviewed gating |

**Overall verdict: PASS**

All AJ2-spec changes were correctly implemented by AJ3 and verified by AJ4 automated gates and code review. The UI clearly identifies the current local Windows package (ai6), marks older AF/AG/AH packages as archival only, and provides unambiguous manual validation guidance.

---

*Document written by sna-qa-acceptance. All gates run and verified on 2026-06-07.*
