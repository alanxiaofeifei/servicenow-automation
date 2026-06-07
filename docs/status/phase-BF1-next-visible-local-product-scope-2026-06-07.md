# Phase BF1 — BE6 Package Restoration and Validation Readiness — Scope

**Date:** 2026-06-07
**HEAD:** `019c502`
**Profile:** `sna-orchestrator`
**Task:** `t_9380aa95`

---

## 1. Latest final gate / backlog state

### BE7 final gate — READY-FOR-MANUAL-VALIDATION-ONLY (stale)

The latest completed final gate is **BE7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY** for the P0 Re-Acceptance Gate scope (BE6 cumulative package).

| Property | BE7 value | Current state |
|----------|-----------|---------------|
| Package name | `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` | ZIP MISSING from dist/release/ |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\...` | Path valid, ZIP absent |
| SHA256 | `bf7d0e79074f115eea00115ac48dd5d6b99abd039bcd730c7aad631234f9d097` | SHA256 sidecar exists |
| Size | 118,607,657 bytes | Sidecar only, ZIP absent |
| Gate results (BE7) | build PASS, typecheck PASS, test 459/459 PASS, privacy:scan PASS | Gates passed at BE7 time |

### Discovery: BE6 ZIP is missing from dist/release/

The BE6 Windows package ZIP was built during the BE6 phase (documented in `phase-BE6-windows-local-package-refresh-2026-06-07.md`) but has been removed from `dist/release/`. Only the SHA256 sidecar and START-HERE-WINDOWS.txt remain.

Current `dist/release/` inventory (sidecar-only artifacts — no actual ZIPs):

| Prefix | SHA256 sidecar exists | START-HERE exists | ZIP exists |
|--------|----------------------|-------------------|------------|
| be6 | ✅ `bf7d0e79...` | ✅ generic | ❌ MISSING |
| bd6 | ✅ `3054053c...` | ✅ generic | ❌ MISSING |
| bc6 | ✅ exists | ✅ generic | ❌ MISSING |
| bb6 | ✅ exists | ✅ generic | ❌ MISSING |
| ba6 | ✅ exists | ✅ generic | ❌ MISSING |
| az6 | ✅ exists | ✅ generic | ❌ MISSING |
| ay6 | ✅ exists | ✅ generic | ❌ MISSING |

**All 7 phase prefixes have only sidecars and START-HERE files. No ZIP packages remain on disk.**

### Runbook is also stale

The clean-machine validation runbook (`docs/test/windows-clean-machine-validation-2026-06-07.md`) references:

| Field in runbook | References | Current correct value |
|-----------------|-----------|---------------------|
| Package | `bd6` | `be6` (or a fresh package) |
| SHA256 | `3054053cd4...` (bd6 hash) | `bf7d0e79...` (be6 hash) |
| Size | `118,604,358 bytes` | `118,607,657 bytes` |
| UNC path | `...bd6-20260607-local.zip` | `...be6-20260607-local.zip` |
| Gate results | `220 tests` | `459 tests` |
| Package location note | `bd6` | `be6` |

The BE3 implementation did not update this runbook — BE3 focused on the P0 Re-Acceptance Checklist UI card. The runbook staleness was known at BC phase and was never formally refreshed.

### START-HERE-WINDOWS.txt is generic

Every package's START-HERE-WINDOWS.txt (including the BE6 copy) contains the same generic safety instructions with no package-specific guidance, no explicit UNC path, no P0 checklist reference, no diagnostic overlay guidance.

---

## 2. Why this scope now — the BE6 validation path is broken

### The problem

Alan needs to manually validate the BE6 package on a clean Windows machine. Three things block this:

1. **No BE6 ZIP in dist/release/** — the BUILD artifact was cleaned up. Alan has no package to extract.
2. **Runbook references bd6** — the instructions point to a stale package name, SHA256, size, and UNC path. Alan would follow wrong directions.
3. **START-HERE-WINDOWS.txt is generic** — even if Alan finds the right package, the first document he reads has no package-specific guidance.

Together these mean: the validation path that BE1–BE7 built is effectively broken until the package is rebuilt and the supporting docs are updated.

### Why now and not earlier

- BE was the P0 re-acceptance gate: BE1 defined the scope, BE2–BE7 implemented it.
- BE6 successfully built the package and BE7 passed it READY.
- But the package artifact was subsequently cleaned up, and the runbook was never refreshed from bd6 to be6.
- BF closes this gap: rebuild the current package, update the runbook, and enhance START-HERE.

### Why this and not a new feature

| Candidate scope | Why not now |
|----------------|-------------|
| New runtime actions (autofill, bulk) | P0 validation path is broken — fix before expanding |
| UI redesign / theme | Not P0 recovery — validation readiness first |
| Additional IPC handlers | Adds risk when the current package needs re-building |
| Feature backlog features | Post-P0 — validation path must be unblocked first |
| Wait for Alan to validate with old links | The package doesn't exist at the documented path |

### What this enables

After BF completes, Alan will:
1. Have a current ZIP package at a known UNC path in dist/release/
2. Follow a runbook that references the actual current package
3. Read a package-specific START-HERE-WINDOWS.txt with explicit guidance
4. Be able to perform clean-machine validation of all 8 P0 criteria

---

## 3. Scope — what BF includes

### BF1 — This scope document (current)

Documents:
- The latest gate state (BE7 READY-FOR-MANUAL-VALIDATION-ONLY but package missing)
- The dist/release/ directory state (all ZIPs removed, only sidecars remain)
- The stale runbook state (references bd6)
- The generic START-HERE-WINDOWS.txt gap
- Why package restoration + validation readiness is the next visible scope
- BF2–BF7 task chain
- Safety boundaries and change budget

### BF2 — UX/copy spec: package-specific START-HERE + runbook copy (assignee: `sna-ui-designer`)

Design the exact copy for:
1. **Package-specific START-HERE-WINDOWS.txt** — copy that includes:
   - Target package name and phase
   - Exact UNC path in a copyable box
   - SHA256 checksum for verification
   - Reference to the P0 Re-Acceptance Checklist (rendered in-app)
   - Diagnostic overlay guidance ("If app shows startup diagnostic, copy the visible text")
   - Safety boundary reminder
2. **Runbook copy update** — exact replacement copy for runbook §3 (Package location) and any other stale sections
3. **Change budget**: < 30 lines of copy changes

**Non-goals:**
- No changes to the runbook structure or validation steps — only copy refresh
- No changes to the START-HERE template format — only content refresh
- No new UX designs, no layout changes, no new IPC

### BF3 — Implementation: rebuild package + update docs (assignee: `sna-frontend-workbench`)

Two deliverables:

**Deliverable A — Rebuild BE6 package**

Execute the canonical release build pipeline to produce a fresh BE6-dated (or BF6-dated) Windows package at `dist/release/`:

```
SDA_RELEASE_VERSION=v0.1.0-rc.1-be6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

If the BE6 tag is gone from the build system, produce `bf6` as the fresh package prefix instead.

**Deliverable B — Update runbook from bd6 → be6/bf6**

Replace stale references in `docs/test/windows-clean-machine-validation-2026-06-07.md`:
| What | Old value | New value |
|------|-----------|-----------|
| Package | `bd6` | `be6` (or `bf6`) |
| SHA256 | `3054053cd4...` | Actual new SHA256 |
| Size | `118,604,358 bytes` | Actual new size |
| UNC path | `...bd6-...` | `...be6-...` (or `bf6-...`) |
| Gate results | `220 tests` | Actual test count |
| `bd6` text refs | `bd6` in prose | `be6` (or `bf6`) |

**Deliverable C — Generate package-specific START-HERE-WINDOWS.txt**

The build script generates `START-HERE-WINDOWS.txt`. After the build, ensure the generated file includes:
- Package name and phase prefix
- UNC path to the ZIP
- SHA256 checksum
- Reference to the in-app P0 Re-Acceptance Checklist card
- Diagnostic overlay note ("If the app starts with a diagnostic overlay, copy only the visible error text")
- Safety boundary reminder

**Acceptance criteria:**
- Fresh ZIP exists at `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` (or bf6-dated equivalent)
- SHA256 sidecar matches ZIP checksum
- Runbook no longer contains `bd6` references (replaced with current package prefix)
- START-HERE-WINDOWS.txt contains package-specific copy (UNC path, SHA256, P0 checklist reference)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS

**Change budget:**
- Build pipeline: rebuild (no code changes)
- `docs/test/windows-clean-machine-validation-2026-06-07.md`: < 10 line changes
- `scripts/packaging/build-windows-rc.sh`: if START-HERE template needs enhancement, < 10 lines
- `docs/status/phase-BF3-...md`: < 60 lines

### BF4 — QA acceptance (assignee: `sna-qa-acceptance`)

Verify:
1. Fresh ZIP exists at expected path with correct SHA256
2. Runbook references current package (not bd6)
3. START-HERE-WINDOWS.txt contains package-specific copy
4. All four gates pass (build, typecheck, test, privacy:scan)
5. No stale package references in runbook or START-HERE
6. Safety reminder is present and prominent

**Change budget:** 1 file, < 40 lines of Markdown

### BF5 — Privacy/security audit (assignee: `sna-privacy-security`)

Verify:
1. Rebuilt package has no new forbidden markers
2. No privacy violations in runbook or START-HERE copy
3. Package-specific UNC path contains no sensitive data (WSL distro name is already sanitized)
4. Privacy scan passes (288 files baseline)

**Change budget:** 1 file, < 30 lines of Markdown

### BF6 — Windows local package refresh (assignee: `sna-windows-runtime`)

If BF3 built and gated the package, BF6 confirms the final artifact is ready for Alan:
- Package at expected UNC path
- SHA256 sidecar matches
- START-HERE-WINDOWS.txt is package-specific
- Archive integrity check (no forbidden markers, expected structure)

If BF3 handled the full build, BF6 is a verification-only step.

**Change budget:** 1 file, < 30 lines of Markdown

### BF7 — Final local readiness gate (assignee: `codex-gpt55-control` or `sna-qa-acceptance`)

Produce `docs/status/phase-BF7-final-local-readiness-gate-2026-06-07.md` with:
- Exact UNC path for Alan
- Package facts (size, SHA256, sidecar status, archive integrity)
- Fresh gate results (build, typecheck, test, privacy:scan)
- Runbook freshness confirmation
- START-HERE freshness confirmation
- Verdict: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED

**Change budget:** 1 file, < 50 lines of Markdown

---

## 4. Pipeline and dependencies

```
BF1 (scope) ──→ BF2 (UX/copy spec → sna-ui-designer)
              ──→ BF3 (rebuild + docs → sna-frontend-workbench)
                    ↓
              BF4 (QA acceptance → sna-qa-acceptance) ──┐
                    ↓                                   ├──→ BF6 (package verify → sna-windows-runtime) ──→ BF7 (final gate → codex-gpt55-control)
              BF5 (privacy/security → sna-privacy-security) ──┘
```

BF2 and BF3 can run in parallel. BF4 and BF5 run after BF3 completes. BF6 requires QA and security sign-off. BF7 is the final gate.

### Minimum viable path

```
BF1 → BF2 + BF3 → BF4 ∥ BF5 → BF6 → BF7
```

---

## 5. Specific changes for BF3 (implementation)

### Change 1: Rebuild BE6 (or BF6) package

```bash
cd /home/alanxwsl/projects/servicenow-automation
# Obtain HEAD at BE6 commit (019c502 is post-BE6, okay)
SDA_RELEASE_VERSION=v0.1.0-rc.1-be6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

**Expected artifact:**
```
dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip
```

If the build system requires a unique phase prefix, use `bf6` instead:
```
dist/release/servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
```

### Change 2: Runbook refresh (docs/test/windows-clean-machine-validation-2026-06-07.md)

Replace in §3 (Package location):

| Old text | New text |
|----------|----------|
| `bd6` package description | `be6` (or `bf6`) package description |
| `...bd6-20260607-local.zip` | `...be6-20260607-local.zip` |
| `3054053cd4...` | Actual new SHA256 |
| `118,604,358 bytes` | Actual new size |
| `220 tests` | Actual test count |
| `bd6` in prose references | Current prefix |

### Change 3: START-HERE-WINDOWS.txt enhancement

The build script generates START-HERE-WINDOWS.txt from a template. After the build, verify the generated file includes:
- Package name and phase prefix
- UNC path
- SHA256
- P0 checklist reference

If the template at `scripts/packaging/templates/START-HERE-WINDOWS.txt` doesn't support package-specific variables, enhance it to accept:
- `${PACKAGE_PHASE}` — phase prefix (e.g., `be6`)
- `${UNC_PATH}` — Windows UNC path
- `${SHA256}` — checksum
- `${P0_CHECKLIST_REF}` — reference to in-app P0 checklist

### File budget

| File | Change | Budget |
|------|--------|--------|
| `dist/release/*.zip` | New — rebuilt package | N/A (binary) |
| `dist/release/*.sha256` | New — fresh SHA256 sidecar | 1 line |
| `dist/release/*-START-HERE-WINDOWS.txt` | Updated — package-specific copy | < 10 lines |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Updated — bd6→be6/bf6 refs | < 10 lines |
| `scripts/packaging/templates/START-HERE-WINDOWS.txt` | Updated — template variables | < 10 lines (if needed) |
| `docs/status/phase-BF3-*.md` | New — implementation status | < 60 lines |

**Total estimated change budget:** < 90 lines across 3–4 doc/template files. One build execution.

---

## 6. Non-goals

These are explicitly **out of scope** for BF:

- **No new features** — no new IPC handlers, no new UI panels, no new runtime actions, no new state variables
- **No behavioral changes** — button logic, disabled/enabled states, state management, CDP connection, runtime actions all stay identical
- **No layout or CSS changes** — three-column layout, rail positions, tints stay as-is
- **No test logic changes** — no new or modified test code
- **No production code changes** — BF3 is rebuild + doc refresh
- **No dist/release/ archive cleanup** — removing old sidecars is not in scope (would break the existing archive-demotion infrastructure)
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes**
- **No refactoring beyond the specific file updates listed in Section 5**
- **No automatic clean-machine validation execution** — the runbook is for Alan to follow; BF does not execute it

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BF2 | START-HERE copy spec + runbook copy spec | < 30 lines |
| BF3 | Rebuild + runbook + START-HERE template + status doc | < 90 lines + build |
| BF4 | QA acceptance doc | < 40 lines |
| BF5 | Privacy/security audit doc | < 30 lines |
| BF6 | Package verification doc | < 30 lines |
| BF7 | Gate document | < 50 lines |

**Total estimated change budget:** < 270 lines across non-code files. One build execution.
**No production code changes.** All changes are documentation and packaging.

---

## 8. Safety boundaries

### Safe (packaging and documentation only)

| Concern | Why it's safe |
|---------|---------------|
| Package rebuild | Standard build pipeline — same as BE6, BD6, etc. |
| Runbook refresh | String replacements — no functional change |
| START-HERE update | Template variable expansion — no behavioral change |
| No production code changes | By explicit constraint |
| No new IPC, Electron, or behavioral changes | By explicit constraint |

### Red-zone prohibitions (identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- No production code changes — BF3 is rebuild + doc refresh
- No test logic changes — test files are NOT in scope
- No new IPC handlers, Electron API, or behavioral changes
- No automatic clean-machine validation execution

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing tests pass (no new test logic in BF scope)
- `pnpm privacy:scan` — no new violations
- Windows local package exists at expected UNC path before BF7
- Final local readiness gate before Alan manual validation (BF7)

---

## 10. Why this is the right next scope — honest assessment

### This is validation-path repair, not feature expansion

The project truth says: "PR #97 manual acceptance failed. The next phase is P0 recovery, not feature expansion."

BE was the P0 recovery phase — it produced the BE6 package and BE7 gate. However:

1. **The BE6 ZIP was cleaned up from dist/release/** — discovered during BF1 evidence gathering. Only the SHA256 sidecar remains. The validation path is broken.
2. **The runbook still references bd6** — was never refreshed to be6. This was a known gap from BC/BE that propagated through all phases.
3. **START-HERE-WINDOWS.txt is generic** — same template for all packages, no package-specific guidance.

BF is not a new feature. It is **validation path repair**: making the artifact that BE produced actually findable and usable by Alan.

### Why BF wasn't needed earlier

- BC and BD phases had their own package builds and runbook updates, but the package cleanup (AZ/AL phases) removed all ZIPs and the runbook was only refreshed through bd6.
- BE was the cumulative P0 re-acceptance gate, but the runbook refresh was scoped out of BE3 (which focused on the UI checklist card).
- The dist/release/ cleanup removed the BE6 ZIP because the cleanup scripts don't track which package is "current" for manual validation.

### What happens if BF doesn't happen

- Alan follows the runbook, gets a bd6 package path that no longer exists
- Alan searches dist/release/ and finds no ZIPs
- Alan cannot validate the BE6 package
- The P0 re-validation loop from BE stays unclosed

### What about the stale packages in dist/release/?

The sidecar-only state of dist/release/ (all ZIPs removed, only .sha256 and START-HERE files remain) is a separate concern. BF does not address this because:
1. The package cleanup was an intentional AZ/AL phase deliverable
2. Removing sidecars would break the archive-demotion audit trail
3. BF's scope is narrowly: rebuild the current package, update docs
4. A formal dist/release/ lifecycle policy belongs in a future phase

---

## 11. Status

```
Phase BF1 — BE6 PACKAGE RESTORATION AND VALIDATION READINESS

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: BE7 (READY-FOR-MANUAL-VALIDATION-ONLY — but package missing)
Current HEAD: 019c502

Discovery: BE6 ZIP was cleaned up from dist/release/ after BE6 build.
           Runbook still references bd6, not be6.
           START-HERE-WINDOWS.txt is generic, not package-specific.

Phase chain: AE → AF → ... → AY → AZ → BA → BB → BC → BD → BE → BF
  26+ phases completed. BF repairs the validation path.

What BF does:
  1. Rebuild BE6 (or BF6) Windows package     → BF3 (sna-frontend-workbench)
  2. Refresh runbook bd6 → be6/bf6           → BF3 (sna-frontend-workbench)
  3. Generate package-specific START-HERE     → BF3 (sna-frontend-workbench)
  4. UX/copy spec                              → BF2 (sna-ui-designer)
  5. QA acceptance                             → BF4 (sna-qa-acceptance)
  6. Privacy/security audit                    → BF5 (sna-privacy-security)
  7. Package verification                      → BF6 (sna-windows-runtime)
  8. Final readiness gate                      → BF7 (codex-gpt55-control)

Downstream pipeline created: BF2 + BF3 → BF4 ∥ BF5 → BF6 → BF7
  BF2: UX/copy spec for START-HERE + runbook   → sna-ui-designer
  BF3: Rebuild + docs refresh                  → sna-frontend-workbench
  BF4: QA acceptance                           → sna-qa-acceptance
  BF5: Privacy/security audit                  → sna-privacy-security
  BF6: Package verification                    → sna-windows-runtime
  BF7: Final readiness gate                    → codex-gpt55-control

Red-zone items excluded: 14
Non-goals: 12 (no features, no behavioral changes, no test logic changes,
             no production code changes, no IPC, no ServiceNow,
             no Git push, no refactoring, no dist/release/ cleanup,
             no automatic validation execution, no layout/CSS changes,
             no new state variables)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
