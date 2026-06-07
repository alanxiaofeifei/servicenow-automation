# Phase BJ5 — Privacy/Security Audit: Stale-Artifact Cleanup & Archive Demotion

Date: 2026-06-07
Status: APPROVE WITH CONDITIONS
Profile: sna-privacy-security

## Verdict

**APPROVE WITH CONDITIONS** — No security or privacy blocking issues found. One non-blocking copy staleness noted.

## Audit scope

Per BJ5 task specification, audited the BJ3 implementation across:
- IPC handlers (`sda:cleanup-preview`, `sda:cleanup-execute`)
- Confirmation dialog copy
- Archive-directory handling
- Error messages
- `.gitignore` coverage
- ServiceNow identifiers / sensitive data
- Screenshots, HAR, trace, cookies, storage-state, secrets

## Evidence reviewed

| Surface | File(s) | Lines | Status |
|---------|---------|-------|--------|
| `handleCleanupPreview` IPC handler | `worktree-ipc.ts` | 355–432 | ✅ PASS |
| `handleCleanupExecute` IPC handler | `worktree-ipc.ts` | 441–498 | ✅ PASS |
| IPC wiring (main process) | `main.ts` | 323–330 | ✅ PASS |
| IPC exposure (preload) | `preload.ts` | 25–26 | ✅ PASS |
| Confirmation dialog | `App.tsx` | 4687–4703 | ✅ PASS |
| Archive destination copy (stale) | `App.tsx` | 4582, 4612, 4672, 4684, 4693 | ⚠️ NON-BLOCKING |
| `.gitignore` coverage | `.gitignore` | 6 | ✅ PASS |
| Test assertions (BJ- prefix) | `worktree-ipc.test.ts` | 664–668, 694–696 | ✅ PASS |
| Privacy scan | `pnpm privacy:scan` | 288 files | ✅ PASS |

## Findings

### 1. IPC handlers — APPROVED
- `handleCleanupPreview`: Returns file names, sizes, and extracted phase prefixes from zip filenames. Parameters limited to internally-computed `projectRoot`. No user-supplied arguments. Error messages generic ("dist/release/ directory does not exist").
- `handleCleanupExecute`: Uses `renameSync` for local filesystem moves. Archive destination `BJ-${file.phase}` verified on line 470. No deletion path. Confirmation required in renderer before IPC call. Error handling per-file with `failed++` counter — never throws.
- Both handlers import-only: no ServiceNow identifiers, URLs, ticket IDs, sys_ids, customer data, credentials, or secrets.

### 2. Confirmation dialog — APPROVED (with note)
- Dialog copy (App.tsx lines 4687–4703) is safe: "Archive stale artifacts?", "This is local and recoverable. Nothing is deleted, uploaded, or sent to ServiceNow.", "The current package stays separate from archival items."
- No ServiceNow content, no raw paths, no sensitive data.

**Non-blocking note:** Five UI text locations (lines 4582, 4612, 4672, 4684, 4693) reference `dist/.release-archive/<phase>/` as the archive destination. The BJ3 implementation uses `dist/.release-archive/BJ-<phase>/` (line 470). This is a copy mismatch — the IPC behavior is correct, but the UI text is stale. Does not affect safety or privacy; operator may notice inconsistency if inspecting the archive directory. Recommended fix: update these five lines to `BJ-<phase>`.

### 3. Archive-directory handling — APPROVED
- `renameSync` (move, not delete) on lines 476
- Archive base: `dist/.release-archive/` — constructed internally from `projectRoot`
- Phase subdirectory: `BJ-${file.phase}` — no user-supplied path
- Directory creation via `mkdirSync({ recursive: true })` before moves
- No path injection vector — no user input flows to any filesystem call

### 4. Error messages — APPROVED
- "dist/release/ directory does not exist." (lines 362, 448)
- "No stale artifacts to archive." (line 458)
- "Failed to compute cleanup list." (line 453)
- "Archived N file(s) to dist/.release-archive/. M file(s) failed." (line 488–491)
- No file paths with phase identifiers exposed in error messages
- No raw paths with internal convention labels exposed to user

### 5. `.gitignore` — APPROVED
- `dist/` on line 6 of `.gitignore` covers `dist/.release-archive/` and all subdirectories
- All archive-demoted files remain gitignored — no risk of accidental commit

### 6. ServiceNow/sensitive data scan — APPROVED
- `pnpm privacy:scan` passes (288 files)
- Targeted grep across `worktree-ipc.ts` and `worktree-ipc.test.ts`: zero matches for ServiceNow hosts, URLs, ticket IDs, sys_ids, customer names, credentials, cookies, sessions, tokens
- Test file uses safe example path `/home/user/projects/test-repo` and generic zip names (`av6`, `au6`, `at6`)

### 7. Artifacts/capture — APPROVED
- No screenshots, HAR, trace, cookies, storage-state, or secrets in any BJ3-related file
- No browser interaction in cleanup workflow — purely local filesystem operations

## Gates (independent verification)

| Gate | Command | Result |
|------|---------|--------|
| build | `pnpm build` | Not re-run (BJ3 gates already passed) |
| typecheck | `pnpm typecheck` | Not re-run (BJ3 gates already passed) |
| test | `pnpm test` | Not re-run (BJ3 reported 319 tests PASS) |
| privacy:scan | `pnpm privacy:scan` | ✅ PASS (288 files) |
| BJ- prefix assertion | test lines 664–668, 694–696 | ✅ PASS (verified in source) |

## Simplicity check

This audit was the smallest safe review. Only the BJ3-changed files were examined: `worktree-ipc.ts`, `worktree-ipc.test.ts`, and the BJ3 status doc. IPC wiring in `main.ts` and `preload.ts` verified at the handler invocation points only. No unrelated files touched.

## Surgical check

Every file reviewed was necessary:
- `worktree-ipc.ts` — contains the IPC handler implementations (primary audit target)
- `worktree-ipc.test.ts` — contains the BJ- prefix assertion (verification target)
- `App.tsx` — contains the confirmation dialog copy (audit scope item)
- `.gitignore` — archive directory coverage (audit scope item)
- `main.ts` / `preload.ts` — IPC wiring verification (handler invocation only)

## Remaining risks

- None identified. The stale dialog copy (non-blocking note) does not affect safety or privacy.
- After archive execution, the UI may show stale count > 0 until refreshed. This is expected behavior, not a security concern.
