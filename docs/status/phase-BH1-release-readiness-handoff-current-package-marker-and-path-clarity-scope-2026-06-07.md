# Phase BH1 — Release readiness handoff: current-package marker and path clarity — Scope

**Date:** 2026-06-07
**HEAD:** `019c502`
**Profile:** `sna-orchestrator`
**Task:** `t_29fd9c8c`

---

## 1. Latest gate / artifact baseline

### BG7 final gate — BLOCKED (now candidate for re-gate)

BG7 produced a verified BG6 Windows package and ran full gates. The gate PASSed build, typecheck, and privacy:scan, but was **BLOCKED** on `pnpm test` with 2 desktop assertion failures (App.tsx/App.test.ts still had BE6/BF6 references). A remediation task (`t_db4873e6`, `sna-frontend-workbench`) subsequently fixed those assertions to BG6. BH1 picks up with the markers still pointing to BF6.

### BG6 package (current verified local artifact)

| Property | BG6 value |
|----------|-----------|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |
| Windows UNC path (paste into File Explorer) | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |
| SHA256 | `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb` |
| SHA256 sidecar | PASS — sidecar exists, `sha256sum -c` returns OK |
| START-HERE-WINDOWS.txt | PASS — package-specific copy with UNC path, SHA256, manual-validation guidance |
| P0 Re-Acceptance Checklist | PASS — UI copy and test assertions updated to BG6 by remediation `t_db4873e6` |

### Freshness status from BG7 gate (before it was blocked)

| Gate | Result | Source |
|------|--------|--------|
| `pnpm build` | PASS | Desktop + CLI TypeScript build exit 0 |
| `pnpm typecheck` | PASS | All 7 workspaces typechecked exit 0 |
| `pnpm test` | BLOCKED → FIXED by remediation | 2 desktop assertions were stale (BE6/BF6); remediation updated them to BG6 |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288` exit 0 |

---

## 2. Why this scope now — the remaining BG7 gap

### BG7 said: "CURRENT.txt still points to BF6, runbook still references BF6, and the tests failed — blocked."

The BG7 gate was BLOCKED because:
1. **`pnpm test` failed** — 2 desktop assertions had stale BE6/BF6 references. ✅ **FIXED** by remediation `t_db4873e6`.
2. **`dist/release/CURRENT.txt`** — still contains `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` (points to BF6, not BG6).
3. **Runbook section 3** — still references BF6 package, UNC path, and SHA256. Needs to advance to BG6.

### Gap A — CURRENT.txt points to BF6, not BG6

| What | Current value (stale) | Correct value |
|------|-----------------------|---------------|
| `dist/release/CURRENT.txt` | `CURRENT=...-bf6-...local.zip` | `CURRENT=...-bg6-...local.zip` |

### Gap B — Runbook section 3 references BF6, not BG6

| Field in runbook | Current value (stale) | Correct value |
|------------------|-----------------------|---------------|
| Package description | `bf6` | `bg6` |
| UNC path | `...bf6-20260607-local.zip` | `...bg6-20260607-local.zip` |
| SHA256 | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` | `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb` |
| Prose references to `bf6` | `bf6` in headings and prose | `bg6` |

### Gap C — No fresh re-gate after remediation

The BG7 test failure has been fixed, but:
- No fresh `pnpm test` was run to confirm the fix
- No re-gate document was produced with a READY-FOR-MANUAL-VALIDATION-ONLY verdict
- CURRENT.txt and runbook still need updating

### Why this and not a new feature

| Candidate scope | Why not now |
|----------------|-------------|
| New runtime actions (autofill, bulk) | BG7 is still BLOCKED — resolve the handoff first |
| Feature backlog items | Post-validation — Alan must validate the current package first |
| dist/release/ cleanup | Purposely excluded — removing sidecars breaks the archival audit trail |

### What this enables

After BH completes, Alan will:
1. Open the runbook and see the correct BG6 package path, SHA256, and file size
2. Navigate to dist/release/ and see CURRENT.txt pointing to BG6
3. Have a fresh READY-FOR-MANUAL-VALIDATION-ONLY gate verdict
4. Perform clean-machine validation of the BG6 package without guesswork

---

## 3. Scope — what BH includes

### BH1 — This scope document (current)

Documents:
- The BG7 blocked state and remediation resolution
- The CURRENT.txt staleness gap (points to BF6, not BG6)
- The runbook staleness gap (section 3 references BF6, not BG6)
- Why current-package marker clarity is the next scope
- BH2–BH7 task chain
- Safety boundaries and change budget

### BH2 — CURRENT.txt advance: bf6 → bg6 (assignee: `sna-windows-runtime`)

Update one line in `dist/release/CURRENT.txt`:

| What | Old value (stale) | New value |
|------|-------------------|-----------|
| `CURRENT=` line | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |

**Acceptance criteria:**
- `dist/release/CURRENT.txt` contains `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip`
- No `bf6` reference remains in CURRENT.txt
- All other files remain untouched
- `pnpm build` — PASS
- `pnpm typecheck` — PASS  
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS

**Change budget:** 1 file, 1 line change
**Non-goals:** No changes to any other file, no build scripts, no production code.

### BH3 — Runbook refresh: bf6 → bg6 (assignee: `sna-frontend-workbench`)

Update `docs/test/windows-clean-machine-validation-2026-06-07.md` section 3 (Package location) and any prose cross-references from bf6 → bg6:

| What | Old value (stale) | New value |
|------|-------------------|-----------|
| Package description | `bf6` | `bg6` |
| UNC path | `...bf6-20260607-local.zip` | `...bg6-20260607-local.zip` |
| SHA256 | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` | `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb` |
| Prose references to `bf6` | `bf6` | `bg6` |

**Acceptance criteria:**
- Runbook section 3 (Package location) references bg6 (not bf6)
- UNC path, SHA256 match BG6 package values
- All prose references to bf6 updated to bg6
- No changes to runbook structure, validation steps, or any section outside §3 and prose cross-references
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS

**Change budget:** 1 file, < 15 line changes
**Non-goals:** No changes to runbook structure, validation steps, prerequisites, or any section outside §3 and prose cross-references.

### BH4 — START-HERE-WINDOWS.txt refresh: bf6 → bg6 (assignee: `sna-windows-runtime`)

The START-HERE-WINDOWS.txt for the bg6 package already exists and references the correct bg6 package. However, verify that:
- The bg6 START-HERE references the correct bg6 package (not bf6)
- Package facts (SHA256, size) match the verified bg6 values

If any stale bf6 reference remains in the bg6 START-HERE, update it.

**Acceptance criteria:**
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local-START-HERE-WINDOWS.txt` references bg6 correctly
- No stale bf6 references in the bg6 START-HERE
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS

**Change budget:** 1 file, < 5 line changes (likely zero — verify only)
**Non-goals:** No changes to other START-HERE files. No production code changes.

### BH5 — QA acceptance (assignee: `sna-qa-acceptance`)

Verify:
1. `CURRENT.txt` points to bg6 (not bf6)
2. Runbook section 3 references bg6 — UNC path, SHA256 all match BG6 handoff
3. bg6 START-HERE-WINDOWS.txt references bg6 correctly
4. All four gates pass (build, typecheck, test, privacy:scan)
5. No stale bf6 references remain in CURRENT.txt, runbook §3, or bg6 START-HERE
6. P0 Re-Acceptance Checklist UI and test assertions remain aligned with BG6 (post-remediation)

**Change budget:** 1 file, < 40 lines of Markdown

### BH6 — Privacy/security audit (assignee: `sna-privacy-security`)

Verify:
1. CURRENT.txt update introduces no new sensitive data
2. Runbook refresh introduces no new sensitive data  
3. Privacy scan passes (288 files baseline)
4. No new forbidden markers in dist/release/
5. No stale package markers that could cause confusion

**Change budget:** 1 file, < 30 lines of Markdown

### BH7 — Release readiness handoff (assignee: `sna-orchestrator`)

Produce `docs/status/phase-BH7-release-readiness-handoff-2026-06-07.md` with:
- Exact BG6 package UNC path (same as baseline)
- Package facts (size, SHA256, sidecar status)
- CURRENT.txt content confirmation (points to bg6)
- Runbook freshness confirmation (section 3 references bg6)
- START-HERE freshness confirmation (bg6 references correct package)
- P0 Re-Acceptance Checklist alignment confirmation
- All four gate results
- Remaining pre-validation checklist for Alan
- Verdict: READY-FOR-MANUAL-VALIDATION or BLOCKED

**Change budget:** 1 file, < 50 lines of Markdown

---

## 4. Pipeline and dependencies

```
BH1 (scope) ──→ BH2 (CURRENT.txt advance → sna-windows-runtime)
              ──→ BH3 (runbook refresh → sna-frontend-workbench)
              ──→ BH4 (START-HERE verify → sna-windows-runtime)
                    ↓
              BH5 (QA acceptance → sna-qa-acceptance) ──┐
                    ↓                                    ├──→ BH7 (readiness handoff)
              BH6 (privacy/security → sna-privacy-security) ──┘
```

BH2, BH3, and BH4 can run in parallel. BH5 and BH6 run after all three complete. BH7 is the final gate.

### Minimum viable path

```
BH1 → (BH2 ∥ BH3 ∥ BH4) → BH5 ∥ BH6 → BH7
```

---

## 5. Specific changes

### Change 1 — CURRENT.txt update (BH2)

File: `dist/release/CURRENT.txt`

| Old text | New text |
|----------|----------|
| `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |

### Change 2 — Runbook refresh (BH3)

File: `docs/test/windows-clean-machine-validation-2026-06-07.md`

Section 3 (Package location) and prose cross-references:

| Old text | New text |
|----------|----------|
| `bf6` package description | `bg6` package description |
| `...bf6-20260607-local.zip` | `...bg6-20260607-local.zip` |
| `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` | `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb` |
| `bf6` in prose references | `bg6` |

### Change 3 — START-HERE verify (BH4)

File: `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local-START-HERE-WINDOWS.txt`

Verify no stale bf6 references. Update if found.

### File budget

| File | Change | Budget |
|------|--------|--------|
| `dist/release/CURRENT.txt` | Updated — bf6→bg6 | < 1 line |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Updated — bf6→bg6 refs in §3 | < 15 lines |
| `dist/release/...-bg6-...-START-HERE-WINDOWS.txt` | Verify/update — bf6→bg6 refs | < 5 lines |
| `docs/status/phase-BH2-*.md` | New — CURRENT.txt status | < 30 lines |
| `docs/status/phase-BH3-*.md` | New — runbook refresh status | < 30 lines |
| `docs/status/phase-BH4-*.md` | New — START-HERE verify status | < 20 lines |
| `docs/status/phase-BH5-*.md` | New — QA acceptance | < 40 lines |
| `docs/status/phase-BH6-*.md` | New — privacy/security audit | < 30 lines |
| `docs/status/phase-BH7-*.md` | New — readiness handoff | < 50 lines |

**Total estimated change budget:** < 230 lines across 9 doc/template files. No build execution. No production code changes.

---

## 6. Non-goals

These are explicitly **out of scope** for BH:

- **No new features** — no new IPC handlers, UI panels, runtime actions, or state variables
- **No behavioral changes** — button logic, disabled/enabled states, state management, CDP connection, runtime actions all stay identical
- **No layout or CSS changes** — three-column layout, rail positions, tints stay as-is
- **No test logic changes** — no new or modified test code beyond the already-completed BG7 remediation
- **No production code changes** — BH2 is a CURRENT.txt line edit, BH3 is a doc refresh, BH4 is a verify
- **No dist/release/ archive cleanup** — removing old packages/sidecars is not in scope
- **No build execution** — BH does not rebuild the package; BG6 already did that
- **No automatic clean-machine validation execution** — the runbook is for Alan to follow; BH does not execute it
- **No Git push, PR, merge, tag, GitHub Release, publish, or cron changes**
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values**
- **No refactoring beyond the specific file updates listed in Section 5**
- **No changes to the runbook structure, validation steps, or prerequisites** — only §3 copy and prose references

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BH2 | dist/release/CURRENT.txt | < 1 line |
| BH3 | runbook doc — bf6→bg6 refs in §3 | < 15 lines |
| BH4 | bg6 START-HERE — verify/update | < 5 lines |
| BH5 | QA acceptance doc | < 40 lines |
| BH6 | Privacy/security audit doc | < 30 lines |
| BH7 | Readiness handoff doc | < 50 lines |

**Total estimated change budget:** < 230 lines across documentation files. No build execution. No production code changes.

---

## 8. Safety boundaries

### Safe (documentation and plain-text marker only)

| Concern | Why it's safe |
|---------|---------------|
| CURRENT.txt line update | Plain text file — one line change |
| Runbook doc refresh | String replacements — no functional change |
| START-HERE verify/update | String replacements — no functional change |
| No production code changes | By explicit constraint |
| No new IPC, Electron, or behavioral changes | By explicit constraint |
| No build execution | By explicit constraint |

### Red-zone prohibitions (identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- No production code changes — BH2–BH4 are doc refresh and a plain-text marker
- No test logic changes — test files are NOT in scope
- No new IPC handlers, Electron API, or behavioral changes
- No automatic clean-machine validation execution
- No build execution
- No dist/release/ archive cleanup

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing tests pass (no new test logic in BH scope)
- `pnpm privacy:scan` — no new violations
- `dist/release/CURRENT.txt` points to bg6 before BH7
- Runbook section 3 references bg6 (not bf6) before BH7
- bg6 START-HERE references correct bg6 package before BH7
- Release readiness handoff before Alan's validation (BH7)

---

## 10. Why this is the right next scope — honest assessment

### This is handoff resolution, not feature expansion

BG7 produced a verified BG6 package but was BLOCKED on test assertions. The remediation fixed those. BH finishes the job:
1. Advance CURRENT.txt from bf6 → bg6
2. Refresh runbook section 3 from bf6 → bg6
3. Verify bg6 START-HERE freshness
4. Re-run gates to confirm the fix
5. Produce READY-FOR-MANUAL-VALIDATION-ONLY verdict

BH is not a new feature. It is **handoff resolution**: closing the BG7 gap that left CURRENT.txt, runbook, and gate verdict all pointing to the wrong package.

### Why BH wasn't needed earlier

BG7 intended to resolve these gaps, but the test assertion failure blocked the gate. The remediation task (`t_db4873e6`) fixed the assertions. BH picks up the remaining administrative updates (CURRENT.txt, runbook, START-HERE verify) and re-runs the gate.

### What happens if BH doesn't happen

- Alan opens dist/release/ and CURRENT.txt points to BF6, but the latest package is BG6
- Alan opens the runbook and section 3 tells him to use the BF6 package
- Alan has to cross-reference the BG7 remediation doc to understand the true state
- The BG7 gate remains BLOCKED indefinitely

### What about the dist/release/ archive cleanup?

Not in scope — same reasoning as BG: removing artifacts breaks the archival audit trail. CURRENT.txt solves the discoverability problem.

---

## 11. Status

```
Phase BH1 — RELEASE READINESS HANDOFF: CURRENT-PACKAGE MARKER AND PATH CLARITY

State: IN PROGRESS (scope definition in progress)
Deliverable: this document

Latest gate base: BG7 (BLOCKED → P0 remediation complete)
Current HEAD: 019c502

Remaining gaps from BG7:
  1. CURRENT.txt still points to bf6, not bg6
  2. Runbook section 3 still references bf6, not bg6
  3. bg6 START-HERE needs verification
  4. No fresh re-gate after remediation
  5. No READY-FOR-MANUAL-VALIDATION-ONLY verdict

Phase chain: AE → AF → ... → AY → AZ → BA → BB → BC → BD → BE → BF → BG → BH
  27+ phases completed. BH resolves the remaining gaps before manual validation.

What BH does:
  1. Advance CURRENT.txt bf6 → bg6                → BH2 (sna-windows-runtime)
  2. Refresh runbook bf6 → bg6                    → BH3 (sna-frontend-workbench)
  3. Verify bg6 START-HERE freshness               → BH4 (sna-windows-runtime)
  4. QA acceptance                                 → BH5 (sna-qa-acceptance)
  5. Privacy/security audit                        → BH6 (sna-privacy-security)
  6. Release readiness handoff                     → BH7 (sna-orchestrator)

Downstream pipeline to create:
  BH2 ∥ BH3 ∥ BH4 → BH5 ∥ BH6 → BH7

Red-zone items excluded: 16
Non-goals: 14
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
