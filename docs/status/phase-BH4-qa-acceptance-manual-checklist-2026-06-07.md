# Phase BH4 — QA Acceptance Report and Manual Checklist

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-qa-acceptance`  
**Task:** `t_b59e813d`  
**Parent:** `t_746719f0` (BH3)  

---

## Automated Gates

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | PASS | All packages build clean (desktop: main.js 307kB + renderer 1.1MB, CLI done) |
| `pnpm typecheck` | PASS | tsc --noEmit passes for all 7 workspace packages |
| `pnpm test` | PASS | 319 tests pass (95 adapters + 55 CLI + 169 desktop) |
| `pnpm privacy:scan` | PASS | 288 files scanned, 0 violations |

---

## Manual Path Clarity Review

### Criterion 1: Exact current package path is obvious

| Surface | Evidence | Status |
|---------|----------|--------|
| Handoff card: "Current package path" | `formatPackagePathForDisplay()` renders full WSL UNC path in `<code>` block, e.g. `\\wsl.localhost\Ubuntu-Compact\...` | ✅ PASS |
| Handoff card: "Source of truth" | `dist/release/CURRENT.txt → CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` | ✅ PASS |
| Handoff header chip | `Current · BG6` badge in `.handoff-current-chip` (green pill, uppercase phase) | ✅ PASS |
| Current package summary | Filename, SHA256, mtime, archival aliases all visible in `.handoff-summary-line` | ✅ PASS |
| Copy buttons | "Copy CURRENT marker", "Copy current package path", "Copy current package summary" all wired to clipboard API | ✅ PASS |

Source: `apps/desktop/src/App.tsx` lines 4244-4321, `apps/desktop/src/styles.css` lines 7017-7048

### Criterion 2: Stale BF6/BG6 ambiguity is gone

| Surface | Evidence | Status |
|---------|----------|--------|
| Phase derivation | `extractPhasePrefix(newest.name).toUpperCase()` — dynamically from actual newest ZIP's mtime, never hardcoded | ✅ PASS |
| CURRENT.txt on disk | Content: `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` — matches newest ZIP | ✅ PASS |
| Archival aliases section | `.handoff-chip-archival` chips with "Archival-only aliases" label, visually secondary | ✅ PASS |
| Worktree acceptance header | `Local only · bg6 is current · Older aliases are archival only` | ✅ PASS |
| Archival queue item | "Archival only" chip + "Older aliases are archival only. Do not use as the current package anchor." | ✅ PASS |
| Manual checklist step 8 | "Confirm older aliases remain archival only and are not presented as the current package." | ✅ PASS |

Source: `apps/desktop/electron/worktree-ipc.ts` lines 128-187, `apps/desktop/src/App.tsx` lines 4670-4711

### Criterion 3: Manual steps are stable

| Surface | Evidence | Status |
|---------|----------|--------|
| 8-step validation checklist | All steps dynamically include `{currentPhase}` in their text | ✅ PASS |
| Checklist content | 1. Confirm current package is BG6, 2. Confirm path, 3. Review diff, 4. Copy path, 5. Open dist/release, 6. Mark reviewed, 7. Copy summary, 8. Confirm archival aliases | ✅ PASS |
| Button labels | Stable: "Review diff", "Copy package path", "Open dist/release", "Mark reviewed", "Copy summary" | ✅ PASS |
| Disabled reasons | "Package metadata is still loading", "Current package path is unavailable", "No package found" | ✅ PASS |

Source: `apps/desktop/src/App.tsx` lines 4741-4753

### Criterion 4: BH2 Spec Acceptance Alignment

| BH2 Spec Requirement | Implementation | Status |
|----------------------|----------------|--------|
| CURRENT.txt is source-of-truth anchor | Handoff card shows "Source of truth" section with `dist/release/CURRENT.txt → CURRENT=...` at top | ✅ PASS |
| BG6 UNC path appears first after marker | "Current package path" section is immediately after source-of-truth section | ✅ PASS |
| Checksum visible immediately after path | SHA256 shown inline in "Current package summary" line right after path | ✅ PASS |
| BF6 labeled archival-only | BF6 appears only in archival aliases section with clear "Archival only" labeling | ✅ PASS |
| Disabled controls show plain reason | "Current package metadata is unavailable" / "still loading" — short, safe | ✅ PASS |

---

## Privacy / Safety Review

| Check | Status | Evidence |
|-------|--------|----------|
| No raw ServiceNow URLs | ✅ | All URLs are local-only (WSL UNC paths, dist/release/) |
| No raw ticket IDs | ✅ | Not present in any changed file |
| No cookies/sessions/credentials | ✅ | Not present in inspected surfaces |
| No Save/Submit/Update/Resolve/Close | ✅ | Only copy-to-clipboard actions |
| No live ServiceNow writes | ✅ | Red-zone prohibitions respected |

---

## Verdict

**PASS** — All 4 automated gates pass. All 4 manual criteria verified by source inspection.

The CURRENT.txt source-of-truth marker, "Current · BG6" status chip, and archival alias demotion are correctly implemented per BH2 spec. The exact current package path is obvious, stale BF6 ambiguity is eliminated from current surfaces, and the manual checklist is stable and correctly phase-aware.

---

## Alan Manual Checklist (Copy this section for manual validation)

**Before you test:**
1. Open the app and navigate to the Release Readiness Handoff card.
2. Verify you see "Source of truth" with `dist/release/CURRENT.txt → CURRENT=servicenow-automation-windows-v0.1.0-rc.1-<phase>-<date>-local.zip`
3. Verify the "Current · <phase>" chip appears in the card header (green pill badge).
4. Verify the "Current package path" shows the full Windows UNC path matching the current package.
5. Verify "Current package summary" shows filename, SHA256, and mtime.
6. Verify archival aliases are labeled "Archival-only aliases" — not presented as current.
7. Click "Copy CURRENT marker" — confirm clipboard gets `CURRENT=<package-filename>`.
8. Click "Copy current package path" — confirm clipboard gets the correct UNC path.
9. Click "Copy current package summary" — confirm clipboard has the full summary.
10. Open Worktree Acceptance and confirm the 8-step manual validation checklist is complete.
