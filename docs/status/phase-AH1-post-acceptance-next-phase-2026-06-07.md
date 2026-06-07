# Post-Acceptance Next Phase Definition — AH1 Handoff

**Part of:** AH1 (t_c21155ec)
**Date:** 2026-06-07

This document defines what happens after Alan explicitly accepts the AG1–AG7 worktree changes. It is Deliverable C of the AH1 phase.

---

## Scenario 1: Accept as-is

If Alan accepts all AG1–AG7 changes as-is:

**Immediate actions:**
1. Commit all AG1–AG7 changes to the branch `next/post-release-operator-cockpit-ab-20260606`
2. AG7 final readiness gate can be re-run, now with a clean worktree → should pass to **READY FOR ALAN MANUAL VALIDATION ONLY**
3. The AG Windows package (`ag-20260607-local.zip`) is the validated artifact

**Next phase (AH2):** Choose one of these P0 recovery gaps from the AF1 scope:

| Priority | Gap | Description | Suggested assignee |
|----------|-----|-------------|-------------------|
| P0 | Clean-machine validation | Run the AG package on a clean Windows machine (no Node/pnpm/WSL/uv) to confirm double-click opens the app | `sna-qa-acceptance` |
| P0 | Startup diagnostics | When app fails on clean machine, show visible sanitized error overlay instead of Electron crash/blank window | `sna-frontend-workbench` + `sna-windows-runtime` |
| P0 | Chromium provisioning | Fix Start QA Chromium so it actually provisions Chrome for Testing and opens a visible browser window | `sna-browser-cdp` |
| P1 | Three-column UI polish | Address acceptance feedback that the three-column layout didn't look like a real three-column operator workbench | `sna-ui-designer` → `sna-frontend-workbench` |

---

## Scenario 2: Accept with conditions

If Alan accepts with conditions:

1. Address each condition as a small, well-scoped task
2. After all conditions met, re-run the acceptance template
3. Then proceed as Scenario 1

---

## Scenario 3: Reject

If Alan rejects any AG1–AG6 code changes:

1. Revert the affected files:
   - `apps/desktop/src/App.tsx` (−47 lines of hygiene card JSX)
   - `apps/desktop/src/App.test.ts` (−28 lines of test)
   - `apps/desktop/src/styles.css` (−151 lines of CSS)
2. Delete or revert script additions:
   - `scripts/hygiene/` directory
   - `.todo-ag1-check-gitignore.sh`
   - `.gitignore` comment addition
3. Rebuild the AG package or continue with the AF package as the reference
4. Re-scope the repo hygiene implementation for a later phase
5. Proceed to AH2 with the remaining P0 gaps

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
