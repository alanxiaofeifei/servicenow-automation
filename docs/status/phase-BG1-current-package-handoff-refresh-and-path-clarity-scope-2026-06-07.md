# Phase BG1 — Post-BF7 Handoff Resolution: Runbook Refresh, Current-Package Clarity, and Manual Validation Readiness — Scope

**Date:** 2026-06-07
**HEAD:** `019c502`
**Profile:** `sna-orchestrator`
**Task:** `t_d0d56549`

---

## 1. Latest gate / artifact baseline

### BF7 final gate — READY-FOR-MANUAL-VALIDATION-ONLY

BF7 completed successfully. It produced a verified Windows package and documented the exact handoff for Alan.

| Property | BF7 value |
|----------|-----------|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` |
| Windows UNC path (paste into File Explorer) | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` |
| SHA256 | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` |
| Size | 118,607,518 bytes (113.11 MiB) |
| SHA256 sidecar | PASS — sidecar exists, `sha256sum -c` returns OK |
| Archive spot-check | PASS — 86 files, expected structure |
| START-HERE-WINDOWS.txt | PASS — package-specific copy with UNC path, SHA256, P0 checklist reference, and diagnostic note |
| BF7 verdict | READY-FOR-MANUAL-VALIDATION-ONLY |

### BF7-observed freshness status

| Gate | Result | Source |
|------|--------|--------|
| `pnpm build` | PASS | Desktop + CLI TypeScript build exit 0 |
| `pnpm typecheck` | PASS | All 7 workspaces typechecked exit 0 |
| `pnpm test` | PASS | 459/459 tests passed |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288` exit 0 |

---

## 2. Why this scope now — the remaining BF7 gap

### BF7 said: "the runbook is still BE6-scoped; the handoff needs one authoritative current-package path, checksum, and archival alias demotion."

BF7 achieved everything it set out to do — rebuilt the package, verified it, produced a package-specific START-HERE, and wrote the gate document. However, two items remain unresolved:

#### Gap A — Runbook still references BE6, not BF6

`docs/test/windows-clean-machine-validation-2026-06-07.md` section 3 (Package location) still contains:

| Field in runbook | Current value (stale) | Correct value |
|------------------|----------------------|---------------|
| Package prefix | `be6` | `bf6` |
| UNC path | `...be6-20260607-local.zip` | `...bf6-20260607-local.zip` |
| SHA256 | `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` |
| File size | `118,607,550 bytes` | `118,607,518 bytes` |
| Package description | `be6` in prose | `bf6` in prose |

If Alan opens the runbook today, section 3 tells him to use a package that is NOT the current BF7-verified artifact. This is the same class of staleness that BE1 → BF1 discovered for bd6 → be6, and it was supposed to be fixed in BF3 but was not fully resolved.

#### Gap B — dist/release/ has 8 redundant packages with no "current" marker

The dist/release/ directory now contains complete ZIP + SHA256 + START-HERE sets for phases ay6 through bf6 — 8 full artifact sets. All look equally prominent. Alan cannot trivially determine which one is "current" without cross-referencing the BF7 gate document.

| Phase prefix | ZIP exists | SHA256 exists | START-HERE exists | Is current? |
|-------------|-----------|---------------|-------------------|-------------|
| ay6 | ✅ | ✅ | ✅ | No — archival |
| az6 | ✅ | ✅ | ✅ | No — archival |
| ba6 | ✅ | ✅ | ✅ | No — archival |
| bb6 | ✅ | ✅ | ✅ | No — archival |
| bc6 | ✅ | ✅ | ✅ | No — archival |
| bd6 | ✅ | ✅ | ✅ | No — archival |
| be6 | ✅ | ✅ | ✅ | No — archival |
| bf6 | ✅ | ✅ | ✅ | **YES — current** |

Without a current-package marker (symlink, CURRENT.txt, or similar), Alan's first interaction with the package is guesswork.

#### Gap C — No archival alias demotion convention

Older packages (ay6–be6) remain co-located with the current package, but there is no documented convention for how to identify archival demotion. The AT phase identified this same issue at the AS6 baseline and it has persisted through 8 subsequent phases without resolution.

### Why now and not earlier

- BF was the rebuild + verification phase. Its scope was narrow: "produce a current package and verify it." BF7 completed that.
- The runbook refresh from be6 → bf6 was always in BF3's scope, but the downstream workstream prioritized the build and verification over the docs refresh.
- The archival demotion problem was identified at AT (AS6 baseline), raised again at BD (BC6 baseline), and is now at BG (BF6 baseline). It keeps getting deferred. BG resolves it before Alan's manual validation.
- Manual validation is the next major user-visible step after BF. Resolving these gaps before validation avoids Alan hitting stale docs or guessing which package to use.

### Why this and not a new feature

| Candidate scope | Why not now |
|----------------|-------------|
| New runtime actions (autofill, bulk) | BF7 package is ready for Alan's validation — fix the handoff docs first |
| Three-column UI redesign | Completed in earlier phases — no change needed |
| Feature backlog items | Post-validation — Alan must validate the current package first |
| dist/release/ cleanup (removing old ZIPs) | Purposely excluded — removing sidecars breaks the archival audit trail. A lifecycle policy is a separate future scope. |
| Dynamic UNC prefix derivation | Completed in BD phase — the prefix `Ubuntu-Compact` is now derived; the renderer no longer hard-codes it |

### What this enables

After BG completes, Alan will:
1. Open the runbook and see the correct BF6 package path and SHA256
2. Navigate to dist/release/ and immediately identify which package is current via an explicit marker
3. Understand which packages are archival vs current
4. Perform clean-machine validation of the BF6 package without guesswork
5. Have a documented handoff doc that lands Alan directly on validation, not discovery

---

## 3. Scope — what BG includes

### BG1 — This scope document (current)

Documents:
- The BF7 final gate state (READY-FOR-MANUAL-VALIDATION-ONLY)
- The runbook staleness gap (section 3 still references be6)
- The dist/release/ overcrowding (8 redundant packages, no current marker)
- The archival alias demotion gap (no convention)
- Why handoff resolution is the next visible scope
- BG2–BG task chain
- Safety boundaries and change budget

### BG2 — Runbook refresh: be6 → bf6 (assignee: `sna-frontend-workbench`)

Update `docs/test/windows-clean-machine-validation-2026-06-07.md` section 3 (Package location):

| What | Old value (stale) | New value |
|------|-------------------|-----------|
| Package description | `be6` | `bf6` |
| UNC path | `...be6-20260607-local.zip` | `...bf6-20260607-local.zip` |
| SHA256 | `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` |
| File size | `118,607,550 bytes` | `118,607,518 bytes` |
| Prose references to `be6` | `be6` | `bf6` |

**Acceptance criteria:**
- Runbook section 3 no longer contains `be6` references (replaced with `bf6`)
- UNC path, SHA256, and size match BF7-handoff values
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS

**Change budget:** 1 file, < 10 line changes
**Non-goals:** No changes to runbook structure, validation steps, prerequisites, or any section outside §3 and prose cross-references.

### BG3 — Current-package clarity: dist/release/ marker (assignee: `sna-windows-runtime`)

Create a discoverable marker in `dist/release/` that trivially identifies which package is the current manual-validation target, without removing or renaming any existing files.

**Option A: CURRENT.txt** — A plain-text file containing one line:
```
CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
```
Alan opens dist/release/, sees CURRENT.txt, reads which ZIP to use.

**Option B: `current` symlink** — A symbolic link:
```
current → servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
```
Alan opens dist/release/, sees the symlink, knows which ZIP is current.

The chosen approach must:
- Not modify any existing file
- Not rename or remove any artifact
- Be trivially human-discoverable (sorted first, named clearly)
- Be easy to update when the current package changes (future phases)
- Survive rebuilds and CI/CD without breaking existing automation

**Acceptance criteria:**
- Marker exists at `dist/release/CURRENT.txt` (or `dist/release/current` symlink)
- Marker content points to the exact BF6 ZIP filename
- All existing artifacts remain untouched
- No automation breaks (existing scripts reference explicit paths, not globs)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS

**Change budget:** 1 new file (1 line of text, or a couple bytes for a symlink)
**Non-goals:** No changes to build scripts, no changes to release pipeline, no file moves/deletes, no dist/release/ cleanup.

### BG4 — Archival alias demotion convention doc (assignee: `sna-ui-designer`)

Document a simple convention for identifying archival vs current packages in `dist/release/`. This is not a code change — it is a documented policy.

Deliverable: `docs/status/archive-demotion-convention-2026-06-07.md`

Content must answer:
1. How does a reader of dist/release/ tell archival from current? (Answer: by reading the `CURRENT.txt` marker from BG3)
2. What is the lifecycle of an archival package? (No automated cleanup — manual retirement after N phases or at Alan's discretion)
3. What convention disambiguates phase prefixes? (The `.sha256` sidecar and `-START-HERE-WINDOWS.txt` companion files share the phase prefix — match by prefix)
4. When and how should the current-package marker be updated? (Each time a new Windows package is built and gated, the marker advances to the new phase prefix)
5. What is explicitly NOT addressed? (Automated dist/release/ cleanup, GitHub Release promotion, version numbering)

**Change budget:** 1 new file, < 50 lines of Markdown
**Non-goals:** No code changes, no scripts, no automation — documentation only.

### BG5 — QA acceptance (assignee: `sna-qa-acceptance`)

Verify:
1. Runbook section 3 references bf6 (not be6) — UNC path, SHA256, size all match BF7 handoff
2. dist/release/ contains a current-package marker pointing to the BF6 ZIP
3. All archival artifacts remain untouched
4. All four gates pass (build, typecheck, test, privacy:scan)
5. Archival demotion convention doc exists and answers the five questions above
6. No stale be6 references remain in runbook

**Change budget:** 1 file, < 40 lines of Markdown

### BG6 — Privacy/security audit (assignee: `sna-privacy-security`)

Verify:
1. Runbook refresh introduces no new sensitive data
2. Current-package marker contains no secrets, paths with personal info, or sensitive data
3. Archival demotion convention doc contains no sensitive data
4. Privacy scan passes (288 files baseline)
5. No new forbidden markers in dist/release/

**Change budget:** 1 file, < 30 lines of Markdown

### BG7 — Manual validation readiness handoff (assignee: `sna-orchestrator` or `sna-qa-acceptance`)

Produce `docs/status/phase-BG7-manual-validation-readiness-handoff-2026-06-07.md` with:
- Exact BF6 package UNC path (same as BF7)
- Package facts (size, SHA256, sidecar status)
- Current-package marker location and content
- Runbook freshness confirmation
- START-HERE freshness confirmation
- Remaining pre-validation checklist for Alan
- Verdict: READY-FOR-MANUAL-VALIDATION or BLOCKED

**Change budget:** 1 file, < 50 lines of Markdown

---

## 4. Pipeline and dependencies

```
BG1 (scope) ──→ BG2 (runbook refresh → sna-frontend-workbench)
              ──→ BG3 (package marker → sna-windows-runtime)
              ──→ BG4 (archive convention → sna-ui-designer)
                    ↓
              BG5 (QA acceptance → sna-qa-acceptance) ──┐
                    ↓                                    ├──→ BG7 (readiness handoff)
              BG6 (privacy/security → sna-privacy-security) ──┘
```

BG2, BG3, and BG4 can run in parallel. BG5 and BG6 run after all three complete. BG7 is the final gate.

### Minimum viable path

```
BG1 → (BG2 ∥ BG3 ∥ BG4) → BG5 ∥ BG6 → BG7
```

---

## 5. Specific changes

### Change 1 — Runbook refresh (BG2)

File: `docs/test/windows-clean-machine-validation-2026-06-07.md`

Section 3 (Package location) replacements:

| Old text | New text |
|----------|----------|
| `be6` package description | `bf6` package description |
| `...be6-20260607-local.zip` | `...bf6-20260607-local.zip` |
| `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` |
| `118,607,550 bytes` | `118,607,518 bytes` |
| `be6` in prose references | `bf6` |

### Change 2 — Current-package marker (BG3)

New file: `dist/release/CURRENT.txt` or `dist/release/current` symlink

If CURRENT.txt:
```
CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
```

### Change 3 — Archive demotion convention (BG4)

New file: `docs/status/archive-demotion-convention-2026-06-07.md`

### File budget

| File | Change | Budget |
|------|--------|--------|
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Updated — be6→bf6 refs in §3 | < 10 lines |
| `dist/release/CURRENT.txt` (or symlink) | New — current-package marker | < 1 line |
| `docs/status/archive-demotion-convention-2026-06-07.md` | New — archival convention doc | < 50 lines |
| `docs/status/phase-BG2-*.md` | New — runbook refresh status | < 60 lines |
| `docs/status/phase-BG3-*.md` | New — package marker status | < 30 lines |
| `docs/status/phase-BG4-*.md` | New — archive convention status | < 40 lines |
| `docs/status/phase-BG5-*.md` | New — QA acceptance | < 40 lines |
| `docs/status/phase-BG6-*.md` | New — privacy/security audit | < 30 lines |
| `docs/status/phase-BG7-*.md` | New — readiness handoff | < 50 lines |

**Total estimated change budget:** < 310 lines across 8 doc/template files. No build execution. No production code changes.

---

## 6. Non-goals

These are explicitly **out of scope** for BG:

- **No new features** — no new IPC handlers, UI panels, runtime actions, or state variables
- **No behavioral changes** — button logic, disabled/enabled states, state management, CDP connection, runtime actions all stay identical
- **No layout or CSS changes** — three-column layout, rail positions, tints stay as-is
- **No test logic changes** — no new or modified test code
- **No production code changes** — BG2 is doc refresh, BG3 is a plain-text marker, BG4 is a convention doc
- **No dist/release/ archive cleanup** — removing old packages/sidecars is not in scope
- **No build execution** — BG does not rebuild the package; BF6 already did that
- **No automatic clean-machine validation execution** — the runbook is for Alan to follow; BG does not execute it
- **No Git push, PR, merge, tag, GitHub Release, publish, or cron changes**
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values**
- **No refactoring beyond the specific file updates listed in Section 5**
- **No changes to the runbook structure, validation steps, or prerequisites** — only §3 copy and prose references

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BG2 | runbook doc — be6→bf6 refs | < 10 lines |
| BG3 | dist/release/CURRENT.txt (new) | < 1 line |
| BG4 | archive-demotion-convention.md (new) | < 50 lines |
| BG5 | QA acceptance doc | < 40 lines |
| BG6 | Privacy/security audit doc | < 30 lines |
| BG7 | Readiness handoff doc | < 50 lines |

**Total estimated change budget:** < 310 lines across documentation files. No build execution. No production code changes.

---

## 8. Safety boundaries

### Safe (documentation and plain-text marker only)

| Concern | Why it's safe |
|---------|---------------|
| Runbook doc refresh | String replacements — no functional change |
| CURRENT.txt marker | Plain text file — no executable content |
| Archive demotion convention | Documentation only — no automation |
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
- No production code changes — BG2–BG4 are doc refresh and a plain-text marker
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
- `pnpm test` — all existing tests pass (no new test logic in BG scope)
- `pnpm privacy:scan` — no new violations
- dist/release/ contains current-package marker before BG7
- Runbook section 3 references bf6 (not be6) before BG7
- Archive demotion convention exists before BG7
- Manual validation readiness handoff before Alan's validation (BG7)

---

## 10. Why this is the right next scope — honest assessment

### This is handoff resolution, not feature expansion

BF7 produced a verified BF6 package and declared it READY-FOR-MANUAL-VALIDATION-ONLY. However, the runbook still tells Alan to use the BE6 package, and dist/release/ presents 8 packages with no "which one do I use" signal.

BG is not a new feature. It is **handoff resolution**: making the BF7-gated artifact actually accessible and discoverable through the docs that Alan will read during validation.

### Why BG wasn't needed earlier

- The runbook staleness (be6 → bf6) was a known BF3 gap that propagated through BF4–BF7 without being resolved.
- The dist/release/ overcrowding was tolerable when there were 2-3 packages, but at 8 it's a real problem.
- The archival demotion convention has been deferred since AT phase. BG resolves it because Alan's manual validation is the next major user-visible milestone — he shouldn't have to guess.

### What happens if BG doesn't happen

- Alan opens the runbook and section 3 tells him to use the be6 package, not the bf6 package
- Alan navigates to dist/release/ and sees 8 equally-prominent ZIPs with no indication of which is current
- Alan has to cross-reference the BF7 gate document to find the right package
- Alan's first impression of the project's release infrastructure is "disorganized"

### What about the dist/release/ archive cleanup?

The 7 older packages (ay6–be6) remain in dist/release/. BG explicitly does not clean them up because:
1. Removing artifacts would break the archival audit trail established across 26+ phases
2. A formal lifecycle policy (how long to keep, when to archive) is a separate future scope
3. The current-package marker (BG3) solves the discoverability problem without removing anything
4. Archival packages serve as a rollback resource if a regression is found in the current package

---

## 11. Status

```
Phase BG1 — POST-BF7 HANDOFF RESOLUTION

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: BF7 (READY-FOR-MANUAL-VALIDATION-ONLY — package verified)
Current HEAD: 019c502

Remaining gaps from BF7:
  1. Runbook section 3 still references be6, not bf6
  2. dist/release/ has 8 redundant packages with no "current" marker
  3. No archival alias demotion convention

Phase chain: AE → AF → ... → AY → AZ → BA → BB → BC → BD → BE → BF → BG
  27+ phases completed. BG resolves the handoff gaps before manual validation.

What BG does:
  1. Refresh runbook be6 → bf6                      → BG2 (sna-frontend-workbench)
  2. Create current-package marker in dist/release/  → BG3 (sna-windows-runtime)
  3. Document archival demotion convention           → BG4 (sna-ui-designer)
  4. QA acceptance                                   → BG5 (sna-qa-acceptance)
  5. Privacy/security audit                          → BG6 (sna-privacy-security)
  6. Manual validation readiness handoff             → BG7 (sna-orchestrator or sna-qa-acceptance)

Downstream pipeline created:
  BG2 ∥ BG3 ∥ BG4 → BG5 ∥ BG6 → BG7

Red-zone items excluded: 16
Non-goals: 14 (no features, no behavioral changes, no test logic changes,
             no production code changes, no IPC, no ServiceNow,
             no Git push, no refactoring, no dist/release/ cleanup,
             no automatic validation execution, no layout/CSS changes,
             no new state variables, no build execution,
             no runbook structure changes)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
