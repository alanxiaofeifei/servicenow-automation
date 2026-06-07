# Phase BI3 — Current-Package Label / Path Clarity Refresh — Implementation

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-frontend-workbench`
**Task:** `t_fdb87bdb`
**Parent:** `t_0920b66a` (BI2 — UX/Copy spec)

---

## Summary

Updated the P0 Re-Acceptance Checklist and handoff card in the desktop workbench to use the dynamic `currentPhase` (BH6) instead of hardcoded BG6 references. All 6 stale BG6 references in `App.tsx` are updated — the remaining BG6 occurrence in the BC7 closure section is now explicitly marked as archival. Test assertions match.

## Changes made

### `apps/desktop/src/App.tsx` — 7 changes

| Line | Before | After | Rationale |
|------|--------|-------|-----------|
| 4356 | `BG6 cumulative package (AE through BF)` | `{currentPhase?.toUpperCase() ?? "Current"} cumulative package` | Dynamic — shows BH6 when loaded |
| 4385 | `Extract the BG6 ZIP` | `Extract the current package ZIP` | No stale phase name in verification step |
| 4449 | `...bg6-...-local.zip` | `...{currentPhase \|\| "bh6"}-...-local.zip` | Dynamic phase in path example |
| 4455 | `Runbook refresh diff (AE-era → BG6)` | `Runbook refresh diff (AE-era → current)` | No stale target phase |
| 4461 | `BG6 runbook` | `Current runbook` | Dynamic column header |
| 4465 | `bf6 → bg6` | `current {currentPhase \|\| "bh6"} cumulative` | Dynamic package reference |
| 4478 | `is present in the BG6 cumulative package` | `was present in the archival BG6 cumulative package` | Explicit archival marking |

### `apps/desktop/src/App.test.ts` — 6 changes

| Line | Before | After |
|------|--------|-------|
| 1645 | `phase: "bg6"` | `phase: "bh6"` |
| 1660 | `"Current · BG6"` | `"Current · BH6"` |
| 1811 | `"BG6 cumulative package (AE through BF)"` | `"Current cumulative package"` |
| 1827 | `"Runbook refresh diff (AE-era → BG6)"` | `"Runbook refresh diff (AE-era → current)"` |
| 1836 | `"Runbook refresh diff (AE-era → BG6)"` | `"Runbook refresh diff (AE-era → current)"` |
| 1844 | `"BG6 runbook"` | `"Current runbook"` |

### Not changed

- The handoff card's dynamic sections (`Current · {currentPhase.toUpperCase()}`, UNC path, SHA-256, mtime, archival aliases) were already correct — they derive from `packageMetadata` at runtime.
- The `dist/release/CURRENT.txt` source-of-truth marker is unchanged.
- Safety copy, clipboard, and open-folder behaviors are preserved.
- No runtime logic, electron IPC, or package infrastructure was modified.

## Commands run

```
pnpm typecheck   → Pass
pnpm build       → Pass
pnpm test        → Pass (169 desktop, 456 total)
pnpm privacy:scan → Pass (288 files)
```

## Verification

- **UNC path first** — the handoff card already shows the path at the top of the current package block (unchanged from BH3).
- **Filename/checksum/mtime visible** — directly after the path in the same `<div>` (unchanged).
- **BG6 cannot be mistaken for current** — all hardcoded BG6 references removed; BG6 appears only in the archival aliases section and the archival-marked BC7 closure note.
- **Disabled states include a reason** — all disabled buttons already have `title` attributes with explainers (unchanged).
- **Tests pass** — all 169 desktop tests pass, including the BG6→BH6 migration assertions.

## Simplicity check

This is the smallest safe change: 6 JSX copy edits in App.tsx and 6 test assertion edits. No new components, no new state, no new API surface.

## Surgical check

Every touched file was necessary:
- `App.tsx` — contains all the hardcoded P0 checklist and handoff card copy.
- `App.test.ts` — contains matching test assertions that would fail without updating.

No other files needed changes.

## Safety / Privacy

- No secrets, credentials, raw URLs, ticket IDs, sys_ids, or cookies exposed.
- No live ServiceNow access.
- No new IPC channels or runtime behavior.
- Privacy scan passes on all 288 tracked files.

## Remaining risks

- The BC7 closure note still mentions "BG6" in archival context — this is intentional as historical record and is now explicitly marked as archival.
- If a future `currentPhase` differs from the archival alias list, the "Current runbook" header will automatically match — no further update needed.

## Next task suggestion

None — BI3 completes the remaining label/path clarity work. The next phase would be BI4 if there are further readability improvements identified during manual acceptance.
