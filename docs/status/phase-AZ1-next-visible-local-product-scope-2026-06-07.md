# Phase AZ1 — Local Package Artifact Housekeeping + Validation Guide Refresh — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_7c378506`

---

## 1. Latest final gate / backlog state

### AY7 final gate — COMPLETE (READY-FOR-MANUAL-VALIDATION-ONLY)

The latest completed final gate is **AY7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY** for the Cumulative Phase Artifact Cleanup scope (stale AR3 test fixture in App.test.ts → current AY6).

| Check | Result |
|-------|--------|
| QA acceptance (AY4) | PASS — 6/6 criteria |
| Privacy/security (AY5) | APPROVE — no blocking issues |
| Windows package refresh (AY6) | PASS — `*ay6-20260607-local.zip` |
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test (218 tests) | PASS |
| pnpm privacy:scan (288 files) | PASS |
| AY6 package newest in dist/release/ | PASS (mtime 15:54:14) |

### Current local Windows package baseline

| Property | Value |
|----------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` |
| **Linux path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` |
| **SHA256** | `4dd85b722a986d6e06d646493918f22a6a45c982548704ca78afa7477e0d7598` |
| **Size** | 118,603,008 bytes (~113.1 MB) |
| **mtime (local)** | 2026-06-07 15:54 (Asia/Shanghai) |

### Phase completion chain

| Phase | Scope | Final gate |
|-------|-------|------------|
| AE | First release-readiness handoff | PR #97 — ACCEPTANCE FAILED |
| AF | P0 recovery: startup diagnostics + runtime precheck | DONE |
| AG-AN | Three-column operator workbench polish | DONE (AN7) |
| AO | Stale archive entries in release-readiness card | DONE (AO7) |
| AP | Repo-hygiene three-column action rail + IPC | DONE (AP7) |
| AQ | Local repo hygiene + archive demotion UI wiring | DONE (AQ + release summary) |
| AR | Worktree acceptance action wiring (partial) | AR3 partial — ABANDONED |
| AS | Worktree acceptance action wiring (re-attempt) | DONE (AS7) |
| AT | Dynamic archival alias discovery | DONE (AT7) |
| AU | Release-readiness handoff current-package path + summary clarity | DONE (AU7) |
| AV | Release-readiness handoff badge styling + path state clarity | DONE (AV7) |
| AW | IPC handler unit tests for hygiene/cleanup handlers | DONE (AW5 + AW6) |
| AX | Repo-hygiene action-button disabled reason specificity | DONE (AX7) |
| AY | Cumulative Phase Artifact Cleanup (App.test.ts AR3→AY6) | DONE (AY7) |

**19 phases completed** from AE through AY.

---

## 2. Current state — what AY completed and what it left behind

### What AY completed

Phase AY executed the Cumulative Phase Artifact Cleanup scope, but AY2 narrowed the allowed touch surface to **App.test.ts only**:

- ✅ Test fixture `currentAr3PackageMetadata` renamed to `currentPackageMetadata`
- ✅ Test data values updated from AR3 to AY6 (phase, path, sha256, size, filename, mtime)
- ✅ `archivalAliases` updated to the full AW5→AQ6 stale-chain
- ✅ `pnpm build` / typecheck / test / privacy:scan — all PASS

### What AY deferred — the remaining artifact debt (5 items)

These 5 items were identified and documented as out-of-scope in AY4 (QA) and AY5 (privacy/security) but were NOT addressed because AY2 narrowed the scope:

#### Item 1: dist/release/ directory clutter — 28 files across 9 phase prefixes

The `dist/release/` directory still contains **9 full package sets** — 1 current (ay6) + 8 stale (aq6, ar3, as6, at6, au6, av6, aw5, ax6):

```
  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip       ← CURRENT
  servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-aw5-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-au6-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip       ← STALE
  servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip       ← STALE
```

Each package has 3 files (`.zip`, `.sha256`, `START-HERE-WINDOWS.txt`) = 27 files, plus the `.before-appasar-refresh` development artifact = **28 files total**.

The archive-demotion infrastructure (`dist/.release-archive/` with gitignored per-phase subdirs) already exists and contains even older phases (af through ap6). The stale aq-through-ax packages should be moved there.

#### Item 2: `.before-appasar-refresh` development artifact

`dist/release/servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip.before-appasar-refresh` — a development residue from the appasar refresh step. This should be removed.

#### Item 3: START-HERE-WINDOWS.txt is generic — no ay6-specific guidance

Every package's `START-HERE-WINDOWS.txt` contains the same generic safety instructions:

```
Quick test path:
1. Extract this zip on Windows.
2. Double-click the packaged ServiceNow Automation executable.
3. Use mock/demo workflows first.
4. For dedicated browser smoke, use about:blank only...
5. Stop before any real ServiceNow login...
```

No ay6-specific copy: no current package path, no SHA256, no three-card workflow reference, no diagnostic overlay guidance, no Chromium provisioning guidance. The current `ay6` START-HERE.txt is identical to the `ar3` and `aq6` versions.

#### Item 4: Clean-machine validation guide references `ae` package

`docs/test/windows-clean-machine-validation-2026-06-07.md` still references:
- Package: `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`
- SHA256: `4a9c7a3891...` (ae hash)
- Size: 118,590,385 bytes (ae size)
- UNC path points to `...rc.1-ae-...`

This validation guide was written during the AF era and never refreshed. It needs to reference the current `ay6` package.

#### Item 5: worktree-ipc.test.ts — 8 stale AR3 test fixture references

`apps/desktop/electron/worktree-ipc.test.ts` contains 8 lines of AR3-phase test fixture data:

- Line 319: filename `...ar3-20260607-local.zip`
- Line 327: mtime condition `if (name.includes("ar3"))`
- Line 332: dummy content `"ar3-content"`
- Line 333: dummy SHA256 `"sha256-ar3"`
- Line 366: filename `...ar3-20260607-local.zip` (second test)
- Line 373: mtime condition `if (name.includes("ar3"))` (second test)
- Line 378: dummy content `"ar3-content"` (second test)
- Line 379: dummy SHA256 `"sha256-ar3"` (second test)

These are sanitized test fixtures (dummy values, not real hashes), but they reference AR3 — a phase 7 iterations old. This is the same type of stale metadata that AY addressed in App.test.ts, but for the worktree IPC handler tests.

---

## 3. Why this scope now — the AY cleanup remainder is the most visible remaining gap

### What a code reviewer or Alan sees today

1. **dist/release/ has 8 stale packages** — Anyone inspecting the repo sees 28 files across 9 phase prefixes. The `.before-appasar-refresh` artifact is an obvious development residue.

2. **Validation guide says "ae"** — Running the clean-machine validation guide points to a package that was superseded 15 phases ago. The paths, SHA256, and sizes are all wrong.

3. **START-HERE-WINDOWS.txt says nothing specific** — The only piece of documentation Alan reads when extracting the zip is generic copy that doesn't reference the ay6 package, the three-card workflow, or the diagnostic overlay.

4. **worktree-ipc.test.ts has AR3 references** — Same type of stale test fixture that AY fixed for App.test.ts, but for the IPC handler tests.

### Risk if not addressed

- If Alan extracts the ay6 package and reads the validation guide, the package references won't match
- The dist/release/ clutter obscures which package is current
- The stale AR3 test fixture in worktree-ipc.test.ts was already flagged in AY4 and AY5 as "should be addressed in a follow-up phase"
- Each additional phase adds more stale packages to dist/release/

### Why this is the right next scope

- **Completes what AY started** — AY's goal was "Cumulative Phase Artifact Cleanup"; this scope closes the 5 items AY2 narrowed away
- **Local-only** — All changes are filesystem moves, copy edits, and test fixture updates. No ServiceNow, no network, no IPC.
- **Small** — 5 small changes, no new features, no behavioral changes
- **Visible** — Makes the repo look clean and coherent for the next person who inspects it
- **Self-contained** — Does not depend on external systems or human decision

---

## 4. Scope — what AZ includes

### Deliverable A — This scope document (AZ1)

Documents:
- The latest gate state (AY7)
- The 5 deferred artifact cleanup items
- Why completing the AY cleanup remainder is the next visible scope
- AZ2–AZ7 task chain
- Safety boundaries and change budget

### Deliverable B — AZ2–AZ7 downstream task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **AZ2** | UX/copy spec — package housekeeping + validation guide refresh | `sna-ui-designer` | AZ1 | Define exact copy changes: START-HERE-WINDOWS.txt ay6-specific guidance, clean-machine validation guide package reference refresh, three-card workflow copy, diagnostic overlay guidance, Chromium provisioning guide. Also define the archive-move plan: which phase prefixes map to which .release-archive/ subdirs. |
| **AZ3** | Implementation — archive cleanup + copy refresh + test fixture update | `sna-frontend-workbench` | AZ2 | Move stale packages (aq6-ax6) from dist/release/ to dist/.release-archive/; remove `.before-appasar-refresh`; update worktree-ipc.test.ts AR3 references to ay6; refresh START-HERE-WINDOWS.txt; refresh clean-machine validation guide. |
| **AZ4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AZ3 | Verify: dist/release/ contains only ay6 package (3 files), no `.before-appasar-refresh`, START-HERE.txt has ay6-specific copy, validation guide references ay6, worktree-ipc.test.ts has no AR3 references, tests/build/typecheck/privacy:scan pass. |
| **AZ5** | Privacy/security audit | `sna-privacy-security` | AZ3 | Verify: no stale package metadata in source code, no ServiceNow data in START-HERE.txt or validation guide, no secrets in refreshed copies. |
| **AZ6** | Windows local package refresh | `sna-windows-runtime` | AZ4 + AZ5 | Rebuild fresh AZ-dated package after artifact cleanup changes. |
| **AZ7** | Final local readiness gate | `codex-gpt55-control` | AZ4 + AZ5 + AZ6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED. |

### Dependencies

```
AZ1 ──→ AZ2 ──→ AZ3 ──→ AZ4 ──┐
                         │     ├──→ AZ6 ──→ AZ7
                         └──→ AZ5 ──┘
```

AZ3 (implementation) is the only code/file-change task. AZ4 and AZ5 can run in parallel after AZ3 completes. AZ6 (package refresh) requires both QA and security sign-off.

---

## 5. Specific changes for AZ3 (implementation)

### Change 1: Clean up dist/release/ stale archives

Move all stale packages (aq6, ar3, as6, at6, au6, av6, aw5, ax6) and their sidecars (.sha256, START-HERE-WINDOWS.txt) to `dist/.release-archive/<phase>/`.

Each phase gets its own subdirectory, following the convention already established for phases af-ap6:
```
dist/.release-archive/aq6/  ← aq6 .zip + .sha256 + START-HERE.txt
dist/.release-archive/ar3/  ← ar3 .zip + .sha256 + START-HERE.txt
dist/.release-archive/as6/  ← as6 .zip + .sha256 + START-HERE.txt
dist/.release-archive/at6/  ← at6 .zip + .sha256 + START-HERE.txt
dist/.release-archive/au6/  ← au6 .zip + .sha256 + START-HERE.txt
dist/.release-archive/av6/  ← av6 .zip + .sha256 + START-HERE.txt
dist/.release-archive/aw5/  ← aw5 .zip + .sha256 + START-HERE.txt
dist/.release-archive/ax6/  ← ax6 .zip + .sha256 + START-HERE.txt
```

**Remove the `.before-appasar-refresh` artifact.** This is a one-off development residue from ar3 that should be deleted.

**After cleanup, `dist/release/` should contain only the ay6 package:**
- `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip`
- `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip.sha256`
- `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local-START-HERE-WINDOWS.txt`

**Safety:** The `.release-archive/` directory is gitignored (already exists from the archive-demotion feature). This is a local-only filesystem operation — rename, not delete (except `.before-appasar-refresh`).

### Change 2: Update worktree-ipc.test.ts — 8 AR3 references → ay6 fixtures

**Current (8 AR3 references across 2 describe blocks):**

Describe block 1 (lines 319-333):
```typescript
"servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip",
if (name.includes("ar3")) mtimeMs = 3000;
vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("ar3-content"));
const mockDigest = vi.fn().mockReturnValueOnce("sha256-ar3");
```

Describe block 2 (lines 366-379):
```typescript
"servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip",
if (name.includes("ar3")) return { ... };
vi.mocked(readFileSync).mockReturnValueOnce(Buffer.from("ar3-content"));
const mockDigest = vi.fn().mockReturnValueOnce("sha256-ar3");
```

**Target:** Replace `ar3` with `ay6` in all 8 locations. These are mock test fixtures — dummy filenames, dummy content, dummy SHA256 hashes — not real package values. The test only needs internally consistent mock data; the phase prefix is cosmetic.

### Change 3: Refresh START-HERE-WINDOWS.txt (ay6 package only)

The current generic START-HERE-WINDOWS.txt (26 lines, same across all 9 packages) should be replaced with ay6-specific copy that:

- References the ay6 package version explicitly
- Describes the three-card local operator workflow (Release Readiness Handoff, Repo Hygiene, Worktree Acceptance)
- Includes guidance on the startup diagnostic overlay
- References the Chromium provisioning process
- Points to the clean-machine validation guide for full validation steps
- Preserves all existing safety warnings (no Save/Submit/Update/Resolve/Close, no real ServiceNow, no screenshot/HAR/trace)

### Change 4: Refresh clean-machine validation guide

Update `docs/test/windows-clean-machine-validation-2026-06-07.md`:

- Replace all `ae` package references with `ay6`
- Update package path: `...-rc.1-ae-...` → `...-rc.1-ay6-...`
- Update SHA256: `4a9c7a3891...` → `4dd85b722a98...`
- Update size: `118,590,385` → `118,603,008`
- Update UNC path and Linux path to ay6 values
- Update section references (the current guide references "[AE7-verified]" gates — should reference AY7)
- Keep all validation steps, safety boundaries, diagnostic guidance, and recording instructions exactly as they are

---

## 6. Non-goals

These are explicitly **out of scope** for AZ:

- **No new features, new cards, new panels, or new IPC handlers**
- **No behavioral changes** — button logic, disabled/enabled states, state management all stay identical
- **No layout, CSS, or UI redesign**
- **No changes to renderer logic, IPC, preload, or Electron main process**
- **No changes to App.tsx or App.test.ts** (already cleaned up in AY)
- **No reorganization of the existing `.release-archive/` structure** (unknown/ subdirs and older phases left as-is)
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes**
- **No refactoring beyond the specific file moves, copy updates, and test fixture changes listed in Section 5**
- **No clean-machine validation execution** — the guide is for Alan to follow
- **No changes to the release-readiness handoff display** — archival alias formatting, badge styling, and copy are unchanged
- **No cleaning up the `.release-archive/unknown/` subdirectory** — that was created by earlier phases and is out of scope

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| AZ2 | `docs/status/phase-AZ2-ux-spec-*.md` | < 50 lines spec doc |
| AZ3 | `dist/release/` (24 file moves + 1 delete), `apps/desktop/electron/worktree-ipc.test.ts` (< 8 lines), `dist/release/*ay6*START-HERE*.txt` (< 35 lines), `docs/test/windows-clean-machine-validation-2026-06-07.md` (< 20 lines) | < 110 lines + 24 file renames |
| AZ4 | QA checklist doc | < 40 lines |
| AZ5 | Security audit doc | < 40 lines |
| AZ6 | Build/packaging scripts | < 20 lines |
| AZ7 | Gate document | < 40 lines |

**Total estimated change budget:** < 300 lines across 6–10 files + 24 filesystem renames.
**No production logic changes.** All changes are filesystem operations, test fixture data, copy edits, and docs.

---

## 8. Safety boundaries

### Safe (local-only, copy/docs cleanup, filesystem moves)

| Concern | Why it's safe |
|---------|---------------|
| dist/release/ archive move | Files moved to gitignored archive directory; no deletion of necessary files. Rename preserves data. |
| `.before-appasar-refresh` deletion | Development artifact residue; no runtime code depends on it |
| worktree-ipc.test.ts fixture update | Mock data update only — no runtime code change |
| START-HERE-WINDOWS.txt refresh | Text copy update only — no functional change |
| Clean-machine validation guide refresh | Package reference update only — no validation logic change |
| No new IPC, no new handlers, no new Electron API | By explicit non-goal |
| No behavioral changes | Mock test data has no effect on app behavior |

### Red-zone (explicit prohibitions — identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- Local-only only; no external writes or deliveries
- No new IPC handlers or Electron API usage
- No changes to `.release-archive/unknown/` structure

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing + new tests pass
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (AZ6)
- Final local readiness gate before Alan manual validation (AZ7)

---

## 10. Why this is the right next scope — honest assessment

### Not P0 recovery (P0s are already delivered)

All 8 P0 criteria from PR #97 have been technically delivered across the AF–AX chain. AY cleaned up the most visible test fixture debt. AZ completes the remaining artifact housekeeping.

### What AZ adds that AY didn't

AY2 narrowed its scope to App.test.ts only. AZ picks up the 5 items that AY deferred:

| Item | AY planned | AY delivered | AZ delivers |
|------|-----------|-------------|-------------|
| App.test.ts AR3→AY6 | ✅ Planned | ✅ Done | 🟢 Already done |
| dist/release/ archive cleanup | ✅ Planned | ❌ Dropped (AY2 narrow) | ✅ AZ3 |
| `.before-appasar-refresh` removal | ✅ Planned | ❌ Dropped | ✅ AZ3 |
| START-HERE-WINDOWS.txt refresh | ✅ Planned | ❌ Dropped | ✅ AZ3 |
| Clean-machine validation guide refresh | ✅ Planned | ❌ Dropped | ✅ AZ3 |
| worktree-ipc.test.ts AR3→AY6 | ❌ Not in AY scope | N/A | ✅ AZ3 |

### What this enables

After AZ completes, the codebase will:
1. Have a clean `dist/release/` directory with only the current ay6 package
2. Have no stale phase references in test fixtures (both App.test.ts and worktree-ipc.test.ts)
3. Have an ay6-specific START-HERE-WINDOWS.txt with three-card workflow guidance
4. Have a validation guide that references the actual current package
5. Be ready for the **next category of work** — whatever that may be — from a clean, coherent baseline

---

## 11. Status

```
Phase AZ1 — LOCAL PACKAGE ARTIFACT HOUSEKEEPING + VALIDATION GUIDE REFRESH

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: AY7 (READY-FOR-MANUAL-VALIDATION-ONLY)
Current package: servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip

Phase chain: AE → AF → AG/AN → AO → AP → AQ → AR → AS → AT → AU → AV → AW → AX → AY → AZ
  20 phases total. AZ closes the 5 deferred artifact cleanup items from AY.

Deferred artifact items remaining from AY:
  1. dist/release/ directory clutter (28 files, 9 phase prefixes) → housekeep
  2. .before-appasar-refresh development artifact → delete
  3. START-HERE-WINDOWS.txt generic copy → refresh with ay6-specific guidance
  4. Clean-machine validation guide references ae package → update to ay6
  5. worktree-ipc.test.ts 8 stale AR3 references → update to ay6 fixtures

Downstream pipeline created: AZ2 → AZ3 → AZ4 ∥ AZ5 → AZ6 → AZ7
  AZ2: UX/copy spec                   → sna-ui-designer [first]
  AZ3: Implementation                  → sna-frontend-workbench [after AZ2]
  AZ4: QA acceptance                   → sna-qa-acceptance [after AZ3]
  AZ5: Privacy/security audit          → sna-privacy-security [after AZ3]
  AZ6: Windows local package refresh   → sna-windows-runtime [after AZ4 + AZ5]
  AZ7: Final local readiness gate      → codex-gpt55-control [after AZ4 + AZ5 + AZ6]

Red-zone items excluded: 14
Non-goals: 14 (no new features, no new IPC, no behavioral changes, no layout changes,
           no ServiceNow, no Git push, no refactoring, no test logic changes,
           no validation execution, no .release-archive/unknown/ cleanup,
           no App.tsx changes, no App.test.ts changes, no CSS changes,
           no release-readiness handoff copy changes)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
