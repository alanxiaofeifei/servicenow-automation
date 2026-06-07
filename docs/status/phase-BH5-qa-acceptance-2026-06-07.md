# BH5 — QA acceptance: CURRENT.txt, runbook, START-HERE alignment

**Date:** 2026-06-07
**Verdict:** PASS

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `CURRENT.txt` → bg6 package (not bf6) | PASS | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |
| 2 | Runbook §3 → bg6 UNC + SHA256 + size | PASS | UNC path, SHA256 `1d1d9dbed6...e6cb`, size 118,607,518 bytes all bg6 |
| 3 | BG6 START-HERE → bg6 only | PASS | All 3 refs (package name, UNC, SHA256) point to bg6 |
| 4 | All 4 gates pass | PASS | build ✓, typecheck ✓, test (224/224) ✓, privacy:scan (288) ✓ |
| 5 | No stale bf6 refs in target files | PASS | Zero matches in CURRENT.txt, runbook, START-HERE |
| 6 | P0 Checklist UI + tests aligned to BG6 | PASS | App.tsx L4340 `BG6 cumulative package`; App.test.ts L1798 `BG6`, L1814 `BG6`, L1831 `BG6 runbook` |

## Gate results

- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS (224 tests: cli 55 + desktop 169)
- `pnpm privacy:scan` — PASS (288 files)

## Verdict

**PASS** — All 6 BH5 deliverables verified by source inspection and automated gates.
