# BJ4 QA Acceptance — Stale-artifact cleanup and archive-demotion

**Date:** 2026-06-07
**QA Profile:** sna-qa-acceptance
**Assignment:** BJ4 (child of t_4c750260, sibling after BJ3)

---

## Automated gates

| Gate | Result | Detail |
|---|---|---|
| `pnpm build` | PASS | All modules: main, preload, renderer, CLI |
| `pnpm typecheck` | PASS | 7 TS packages |
| `pnpm test` | PASS | 169 desktop (incl. 39 worktree-ipc) + 55 CLI = **224 tests** |
| `pnpm privacy:scan` | PASS | 288 files scanned, 0 violations |

---

## Functional verification

### 1. Cleanup preview (dry-run)

| Check | Result |
|---|---|
| Stale phases detected | ay6, az6, ba6, bb6, bc6, bd6, be6, bf6, bg6, bh6 (**10 phases**) |
| Stale files count | **30 files** (10 zips + 10 sha256 + 10 START-HERE) |
| Stale size | **1135 MB** |
| Current (bi6) excluded | ✅ Not listed in stale set |
| CURRENT.txt excluded | ✅ Not listed in stale set |

### 2. Archive-demotion execution

| Check | Result |
|---|---|
| Files archived | **30 / 30** — 0 failures |
| Archive directories | **10 BJ-* dirs** created under `dist/.release-archive/` |
| Files per phase dir | **3 per phase** (zip + sha256 + START-HERE) |
| BJ- prefix used | ✅ `dist/.release-archive/BJ-ay6/`, `BJ-az6/`, ... `BJ-bh6/` |

### 3. Post-cleanup state

| Check | Result |
|---|---|
| Files remaining in `dist/release/` | **4 files**: bi6.zip, bi6.sha256, bi6-START-HERE, CURRENT.txt |
| Stale count after cleanup | **0** — hygiene scan reports clean |
| Archive referenced separately | ✅ `archiveDetails` is its own field, not conflated with stale |

> **Note:** Acceptance criterion #9 says "3 files (current bi6 set only)". The actual count is **4** because `CURRENT.txt` is a separate tracking file that always stays in `dist/release/`. The 3 "bi6 set only" files are the zip, sha256, and START-HERE. CURRENT.txt is not a stale artifact and is left in place.

### 4. Confirmation dialog

- Title: "Archive stale artifacts?"
- Message: "Confirm archive of {totalFiles} packages and files?" (30 shown)
- Safety: "This is local and recoverable. Nothing is deleted..."
- Separation: "The current package stays separate from archival items."
- Buttons: "Archive stale artifacts" + "Cancel"

### 5. Error handling

| Scenario | Behavior |
|---|---|
| `dist/release/` missing | Returns `ok: false` with clear error message |
| Individual file rename fails | Caught per-file; `failed` counter incremented |
| Partial failure | Returns `ok: false` when `failed > 0`; `archived` and `failed` counts returned |
| Read-only archive destination | Exception caught per-file; failure reported |

---

## Alan manual checklist

When Alan runs the app on Windows, visually inspect:

1. **Hygiene tab → Stale artifacts section**
   - [ ] "30 stale" chip shown after initial scan (when stale files exist)
   - [ ] "Cleanup preview" button is enabled (not grayed out)
   - [ ] Clicking "Cleanup preview" shows a card with: 30 file(s), 1135 MB total
   - [ ] Phase breakdown lists ay6 through bh6 with per-phase file counts and sizes

2. **Archive stale artifacts button**
   - [ ] Button labeled "Archive stale artifacts" is disabled until preview is viewed
   - [ ] After preview opens, the button becomes enabled (not grayed out)
   - [ ] Hover text: "Run Cleanup preview first." when disabled

3. **Confirmation dialog**
   - [ ] Clicking "Archive stale artifacts" shows a modal overlay
   - [ ] Title: "Archive stale artifacts?"
   - [ ] Body: "Confirm archive of 30 packages and files?"
   - [ ] Safety warning: "This is local and recoverable..."
   - [ ] Destination mentions `dist/.release-archive/<phase>/`
   - [ ] "Current package stays separate" text visible
   - [ ] Two buttons: "Archive stale artifacts" (green) and "Cancel"

4. **Post-archive state**
   - [ ] After confirmation: "Archiving..." shown briefly, then "Archived" badge
   - [ ] Re-scanned result shows "No stale artifacts" (stale count = 0)
   - [ ] `dist/release/` contains only: bi6.zip, bi6.sha256, bi6-START-HERE, CURRENT.txt
   - [ ] `dist/.release-archive/BJ-*/` directories exist with all 30 archived files

5. **Hygiene scan + archive separation**
   - [ ] Hygiene scan `archiveDetails` line mentions archive directory count
   - [ ] Archive directory is referenced as a separate entity, not as "stale"
   - [ ] "Moves stale files locally into `dist/.release-archive/<phase>/`" note visible

6. **Safety boundary**
   - [ ] "Local only" chip is visible in the hygiene section
   - [ ] Footer reads: "No upload / PR / merge / tag / release..."
   - [ ] The archive destination reminder mentions `<phase>` not a real phase name
   - [ ] No ServiceNow URL, ticket ID, credential, or raw sys_id visible anywhere

---

## Verdict

**CONDITIONAL PASS**

All acceptance criteria pass with one minor note:

- Criterion #9 says "3 files" in `dist/release/` post-cleanup. Actual count is **4** because `CURRENT.txt` also remains. The 3 "bi6 set" files are the zip, sha256, and START-HERE. This is a spec-definition nuance, not a code bug.

**Evidence:**
- All 4 automated gates: PASS
- 30 files archived to 10 BJ-* directories: PASS
- Hygiene scan reports 0 stale after cleanup: PASS
- Archive directory referenced separately: PASS
- Error handling coverage: PASS
