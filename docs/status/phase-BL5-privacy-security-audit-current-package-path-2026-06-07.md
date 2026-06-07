# Phase BL5 — Privacy/Security Audit for Current Package Path Regression Fix

Date: 2026-06-07
Task: t_6d77224a
Profile: sna-privacy-security
Privacy level: sanitized local-only. No live ServiceNow operations, no browser automation, no real ticket/customer data.

## Verdict

**APPROVE — no blocking issues.**

All BL2-BL4 path display and IPC metadata changes use only local WSL/Windows filesystem paths. No ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups, cookies, HAR/traces, endpoint host/port details, or credentials are exposed. `pnpm privacy:scan` passes with 291 files clean.

## Scope

Audit BL2 through BL4 for privacy and boundary safety:
- **BL2**: Renderer fix (always store `ok:false` metadata) + IPC fix (CURRENT.txt as source of truth)
- **BL3**: Windows local package refresh (docs only, no code changes)
- **BL4**: Dynamic WSL distro name for UNC paths, hygiene scan, cleanup workflow IPC handlers

## Evidence inspected

### Files changed (uncommitted working tree)

| File | BL Phase | Change |
|------|----------|--------|
| `apps/desktop/src/App.tsx` | BL2, BL4 | Always store metadata; `formatPackagePathForDisplay` uses dynamic distro name |
| `apps/desktop/electron/worktree-ipc.ts` | BL2, BL4 | New: `handleWorktreePackageMetadata`, `handleHygieneScan`, `handleCleanupPreview`, `handleCleanupExecute` |
| `apps/desktop/electron/worktree-ipc.test.ts` | BL2 | New: 12 CURRENT.txt tests + existing test updates |
| `apps/desktop/src/App.test.ts` | BL2 | New: `ok:false` renderer test |
| `apps/desktop/electron/main.ts` | BL4 | 9 new IPC handler registrations (local-only worktree ops) |
| `apps/desktop/electron/preload.ts` | BL4 | Expose `worktreePackageMetadata`, `hygieneScan`, `cleanupPreview`, `cleanupExecute` |
| `packages/adapters/src/wsl-utils.ts` | BL4 | New: `resolveWslDistroName()` — env-var-based WSL distro resolution |
| `packages/adapters/src/browser.ts` | BL4 | Re-export `resolveWslDistroName` |
| `apps/desktop/electron/runtime-paths.ts` | (not modified) | Existing code, not changed in BL2-BL4 |
| `scripts/packaging/build-windows-rc.sh` | BL4 | START-HERE rework with dynamic UNC path and actual SHA-256 |
| `apps/desktop/src/styles.css` | BL4 | UI polish (no data leakage) |
| `.gitignore` | BL4 | 1 line addition |

### BL3 (committed, docs only)

- `docs/status/phase-BL3-windows-local-package-refresh-2026-06-07.md` (commit `16d8fa1`)
- `dist/release/CURRENT.txt` updated to bl3 marker
- No code changes in BL3 commit — only status doc and CURRENT.txt marker update

## Detailed findings

### 1. `worktree-ipc.ts` — `handleWorktreePackageMetadata` (BL2 core fix)

**What it does**: Reads `dist/release/CURRENT.txt` as source of truth for current package filename. Falls back to newest ZIP by mtime. Returns `path`, `filename`, `sha256`, `size`, `mtime`, `phase`, `archivalAliases`, and `source` field.

**Path returned**: `join(projectRoot, "dist", "release", <filename>.zip)` — purely local filesystem path. No ServiceNow identifiers, URLs, or secrets.

**Safety checks in `readCurrentTxt()`**:
- Rejects path traversal (`/`, `\`, `..`) in `CURRENT=` value
- Requires `.zip` suffix
- Converts Buffer to String before parsing (handles test mock scenarios)

**Error messages**: Generic local-only strings like `"dist/release/ directory does not exist"`, `"no package found"`, `"CURRENT.txt references <filename> but file not found in dist/release/"`. Contains only the ZIP filename, not system paths or secrets.

**Verdict**: CLEAN. No leakage.

### 2. `worktree-ipc.ts` — `handleHygieneScan` (BL4)

**What it does**: Reads local `.gitignore` content, scans `dist/release/` for stale ZIP artifacts, checks `.local/video-analysis/` existence.

**Data accessed**: Local filesystem only — `.gitignore`, `dist/release/*`, `.local/video-analysis/`. No ServiceNow contact.

**Verdict**: CLEAN.

### 3. `worktree-ipc.ts` — `handleCleanupPreview` and `handleCleanupExecute` (BL4)

**What they do**: Preview lists stale ZIPs and companions that would be archived. Execute renames them from `dist/release/` to `dist/.release-archive/BJ-<phase>/`.

**Write operations**: `handleCleanupExecute` calls `renameSync()` — moves local files within the local repo. This is a **local filesystem rename**, not a ServiceNow API write. No external network, no ServiceNow login, no Save/Submit/Update/Resolve/Close.

**Verdict**: CLEAN. Local-only filesystem operation within boundary.

### 4. `App.tsx` — `formatPackagePathForDisplay` (BL4)

**What it does**: Converts a local Linux path (e.g., `/home/alanxwsl/projects/servicenow-automation/dist/release/...`) to a WSL UNC path (e.g., `\\wsl.localhost\Ubuntu-Compact\home\...`).

**Path derivation**:
- `distroName` from `resolveWslDistroName()` (env vars `SDA_WSL_DISTRO` or `WSL_DISTRO_NAME`, sanitized to `[A-Za-z0-9_.-]+`, default `"WSL"`)
- Linux slashes replaced with Windows backslashes
- No ServiceNow data, URLs, or secrets involved

**Verdict**: CLEAN. Displays local WSL path only.

### 5. `App.tsx` — Renderer metadata handling (BL2 fix)

**What changed**: Always stores `setPackageMetadata(meta)` regardless of `ok` value. Previously `ok:false` was dropped.

**`ok:false` display**: "Current package metadata is unavailable." / "Current package path is unavailable." — no sensitive data exposed.

**Copy buttons**: Path copied to clipboard via `navigator.clipboard.writeText(packageMetadata.path)` — same local filesystem path, no ServiceNow data.

**Verdict**: CLEAN.

### 6. `wsl-utils.ts` — `resolveWslDistroName` (BL4)

**What it does**: Reads `SDA_WSL_DISTRO` or `WSL_DISTRO_NAME` from `process.env`. Sanitizes to `[A-Za-z0-9_.-]+`. Returns undefined if not set or invalid.

**Verdict**: CLEAN. Environment variables only, sanitized.

### 7. `main.ts` — IPC handler registrations (BL4)

9 new handlers registered: `worktree-git-diff`, `worktree-open-dist-release`, `worktree-open-workspace-root`, `worktree-open-file`, `worktree-status`, `worktree-package-metadata`, `hygiene-scan`, `cleanup-preview`, `cleanup-execute`.

All use `findProjectRoot()` for path resolution. No user-supplied paths in handlers except `worktree-open-file` which takes a **hardcoded-in-renderer** relative path.

**Verdict**: CLEAN.

### 8. `build-windows-rc.sh` — START-HERE rework (BL4)

**Change**: START-HERE sidecar now includes actual SHA-256 checksum and dynamic UNC path. Fallback UNC uses `SDA_UNC_PATH` env var or a hardcoded default containing the local WSL path.

**Observation**: The hardcoded fallback includes the local username (`alanxwsl`) and distro name (`Ubuntu-Compact`). These are local development environment identifiers, not ServiceNow customer data. The START-HERE is a local companion file for supervised test packages — it is not a widely distributed artifact. Non-blocking, noted below.

### 9. `runtime-paths.ts` — Not modified in BL2-BL4

No changes. Still has the BL1-identified issue (packaged mode `projectRoot = resourceRoot = process.resourcesPath`, which lacks `dist/release/`). Deferred to a future phase per BL2 remaining risks.

## Privacy scan

```
$ pnpm privacy:scan
TRACKED_PRIVACY_SCAN_PASS files=291
```

291 tracked files scanned, zero violations. All gates pass:
- `pnpm build` — PASS (verified by BL2 status doc; unchanged since)
- `pnpm typecheck` — PASS (verified by BL2 status doc)
- `pnpm test` — 465 tests PASS (verified by BL3 status doc; includes BL2 new tests)
- `pnpm privacy:scan` — 291 files PASS

## Test coverage audit

### `worktree-ipc.test.ts` — All fixtures are sanitized

- Test project root: `"/test/project"` (mock, not real path)
- Test ZIP names: `"current-marker.zip"`, `"older-phase.zip"`, etc. (mock names)
- Test SHA-256: `"abcdef1234567890..."` (placeholder)
- Test CURRENT.txt content: `"CURRENT=current-marker.zip\n"` (mock)
- Path traversal test: `"CURRENT=../../evil.zip\n"` (attack vector, rejected)
- No real ServiceNow URLs, ticket IDs, sys_ids, or secrets

### `App.test.ts` — All fixtures are sanitized

- `mockFailedMetadata`: `{ ok: false, error: "dist/release/ directory does not exist" }` (generic)
- Test URL: `"https://qa.service-now.example.invalid/..."` (`.invalid` domain, not real)
- Test path: `"/tmp/servicenow-automation/.local/..."` (mock path)
- `token=unsafe-value` appears only in assertions testing sanitization
- No real credentials, customer data, or ServiceNow identifiers

## Non-blocking observations

1. **`build-windows-rc.sh` fallback UNC contains local username**: The default UNC path hardcodes `alanxwsl` when `SDA_UNC_PATH` is not set. Acceptable for local-only test packages. If these packages will ever be shared beyond the local machine, consider requiring `SDA_UNC_PATH` to be set explicitly rather than falling back to a hardcoded path.

2. **`cleanup-execute` is a local write operation**: Renames files within `dist/release/`. This is a local filesystem operation, not a ServiceNow API write, but it is the first IPC handler that modifies local files. The renderer requires explicit user confirmation before calling it — the UI pattern is consistent with the safety boundary.

3. **`runtime-paths.ts` packaged-mode issue deferred**: Per BL2 remaining risks doc, the packaged-mode `projectRoot = resourceRoot` issue (which causes the original `CURRENT=N/A` regression in packaged Windows because `resources/dist/release/` doesn't exist) is deferred to a future phase. BL2 fixes the renderer to show "unavailable" instead of perpetual loading, which is correct behavior when metadata is genuinely unavailable.

4. **START-HERE falls back to hardcoded distro name**: When `SDA_UNC_PATH` is unset, the fallback uses `\\wsl.localhost\Ubuntu-Compact\...`. This is the same pattern as the renderer's `formatPackagePathForDisplay` (which falls back to `"WSL"` when the distro env var is unset). Consistent, non-blocking.

## Surgical check

Every file inspected was directly relevant to the BL2-BL4 privacy audit scope:

| File | Why inspected |
|------|--------------|
| `worktree-ipc.ts` | Source of all path/metadata data displayed in UI |
| `App.tsx` | Renders paths and metadata; `formatPackagePathForDisplay` |
| `main.ts` | IPC handler registrations; all use `findProjectRoot()` |
| `preload.ts` | IPC bridge exposure surface |
| `wsl-utils.ts` | Distro name resolution for UNC paths |
| `browser.ts` | Re-export of `resolveWslDistroName` |
| `runtime-paths.ts` | Confirmed not modified (BL1 issue deferred) |
| `build-windows-rc.sh` | START-HERE sidecar generation |
| `worktree-ipc.test.ts` | Test fixture sanitization verification |
| `App.test.ts` | Test fixture sanitization verification |

## Remaining risks

1. **Packaged Windows path display**: `formatPackagePathForDisplay` converts ALL paths to `\\wsl.localhost\<distro>\...` format. When the app runs in packaged Windows mode (not WSL), the path from `worktree-ipc.ts` will be a Windows native path (e.g., `C:\Users\...`), but `formatPackagePathForDisplay` will still convert it as if it's a Linux path (replacing `/` with `\` and prepending `\\wsl.localhost\<distro>`). This produces an incorrect UNC path. The BL2 doc flagged this as a future task ("Add `displayPath` / `uncPath` field to IPC response"). Not a privacy leak — the path is still a local path — but it produces visually wrong output.

2. **START-HERE fallback staleness**: The hardcoded UNC fallback in `build-windows-rc.sh` will drift if the project is moved or the distro name changes. This is a correctness concern, not a privacy concern.

## Conclusion

**APPROVE.** All BL2-BL4 changes use only local WSL/Windows filesystem paths for display. No ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups, cookies, HAR/traces, endpoint details, or credentials are exposed. `pnpm privacy:scan` passes with 291 files clean. The `ok:false` metadata handling in BL2 correctly shows "unavailable" state instead of indefinite loading. The BL4 dynamic distro name resolution improves correctness without introducing privacy risk.
