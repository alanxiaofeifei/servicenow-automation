# BG7 remediation: P0 Re-Acceptance Checklist UI/test alignment to BG6

**Date:** 2026-06-07
**Task:** t_db4873e6
**Profile:** sna-frontend-workbench

## What changed

Updated the P0 Re-Acceptance Checklist UI copy and corresponding test assertions from BF6/BE6 → BG6 to align with the current BG6 Windows package (`servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip`).

### App.tsx — 7 locations updated

| Location | Before | After |
|---|---|---|
| Target package label | BF6 cumulative package (AE through BE) | BG6 cumulative package (AE through BF) |
| Criterion 1 verification step | Extract the BF6 ZIP ... | Extract the BG6 ZIP ... |
| Criterion 8 pass condition | ...-bf6-...-local.zip | ...-bg6-...-local.zip |
| Runbook diff summary | Runbook refresh diff (AE-era → BE6/BF6) | Runbook refresh diff (AE-era → BG6) |
| Runbook table header | BE6/BF6 runbook | BG6 runbook |
| Package row in diff table | be6 → bf6 | bf6 → bg6 |
| BC7 closure statement | ...BE6/BF6 cumulative package | ...BG6 cumulative package |

### App.test.ts — 4 locations updated

| Assertion | Before | After |
|---|---|---|
| Target package copy | BF6 cumulative package (AE through BE) | BG6 cumulative package (AE through BF) |
| Runbook diff summary | Runbook refresh diff (AE-era → BE6/BF6) | Runbook refresh diff (AE-era → BG6) |
| detailStart indexOf (same string) | Runbook refresh diff (AE-era → BE6/BF6) | Runbook refresh diff (AE-era → BG6) |
| Runbook table header in detail section | BE6/BF6 runbook | BG6 runbook |

## Verification

- `pnpm vitest run src/App.test.ts`: 101 tests pass (1 file)
- `pnpm vitest run`: 169 tests pass (9 files)
- No BE6/BF6 references remain in App.test.ts
- One intentional BF6 reference remains in App.tsx line 4449 (`bf6 → bg6`) showing historical package evolution in the runbook diff table

## Scope

Minimal surgical change touching only the P0 Re-Acceptance Checklist section. No runtime safety logic, no layout changes, no stylesheet changes, no other features.

## Safety/privacy status

No live ServiceNow writes, no credentials, no URLs, no PII. All changes are local UI copy and test assertions. Red-zone prohibitions respected.

## Remaining risks

- CURRENT.txt still points to BF6 (separate concern — runbook/package-pointer update)
- Runbook itself still references BF6 (out of scope for this UI/tests task)
