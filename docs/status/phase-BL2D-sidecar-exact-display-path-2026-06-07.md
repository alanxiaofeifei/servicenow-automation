# Phase BL2D — Sidecar exact Windows UNC display path

**Date:** 2026-06-07
**Status:** Complete
**Task:** t_f56e3aea

## Problem

When the packaged Electron app displayed the current package path, it re-derived a WSL UNC path from `formatPackagePathForDisplay()` using `resolveWslDistroName()`, which in bundled Electron (no `process.env`) falls back to a generic `\\wsl.localhost\WSL\...` path. The generated sidecar already contained a `windowsUncPath` field with the correct Windows-native UNC path, but the IPC/renderer ignored it.

Additionally, `scripts/generate-release-metadata.sh` used a fragile distro-name derivation (parsing `/etc/wsl.conf` or defaulting to `Ubuntu`) instead of using `wslpath -w`, which produces the exact WSL distro name (e.g., `Ubuntu-Compact`).

## Changes

### 1. `scripts/generate-release-metadata.sh`

- Replaced fragile distro-name derivation (parsing `/etc/wsl.conf`, fallback `Ubuntu`) with `wslpath -w "$ZIP_PATH"` for the exact Windows UNC path.
- Switched `windowsUncPath` data flow from shell-to-Python string interpolation to an environment variable (`SNA_WINDOWS_UNC`) to avoid backslash-escape issues in Python string literals.

**Before:** `\\\\wsl.localhost\Ubuntu\...` (hardcoded distro)
**After:** `\\wsl.localhost\Ubuntu-Compact\...` (from `wslpath -w`)

### 2. `apps/desktop/electron/worktree-ipc.ts`

- Added `displayPath` field to `readReleaseMetadataSidecar()` return type.
- Reads `parsed.windowsUncPath` from the sidecar JSON.
- Added `displayPath` to `handleWorktreePackageMetadata()` return type.
- Both sidecar return paths (project-root and dist/release) propagate `displayPath`.

### 3. `apps/desktop/src/App.tsx`

- Added `displayPath?: string` to `PackageMetadataResult` interface.
- Updated `formatPackagePathForDisplay()` to accept optional 3rd param `displayPath`; when present, returns it directly.
- Updated handoff card JSX:
  - Path display line passes `packageMetadata?.displayPath`.
  - "Copy current package path" button copies `displayPath` when available, falls back to `path`.
  - "Copy current package summary" includes `displayPath` directly when present.

### 4. `apps/desktop/src/App.test.ts`

Added two new tests:
- **"renders displayPath directly when packaged metadata provides windowsUncPath"** — verifies exact `\\wsl.localhost\Ubuntu-Compact\...` path is rendered and `\\wsl.localhost\WSL\...` never appears.
- **"copies displayPath when Copy current package path is clicked with packaged metadata"** — verifies displayPath renders in the path line.

### 5. New: This status doc.

## Verification results

| Gate | Status |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (183 tests, +2 new) |
| `pnpm privacy:scan` | PASS (297 files) |
| Script generates correct `windowsUncPath` | PASS (`Ubuntu-Compact`, not `Ubuntu`) |
| JSON `windowsUncPath` parseable | PASS (backslash-escaped correctly) |

## Acceptance criteria trace

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Add `displayPath`/`windowsUncPath` to `PackageMetadataResult` from sidecar | Done — `displayPath` added, populated from sidecar's `windowsUncPath` |
| 2 | Renderer renders/copies displayPath directly for packaged metadata | Done — `formatPackagePathForDisplay` returns `displayPath` when present; clipboard copies it |
| 3 | If displayPath missing, clear fallback label | Done — `formatPackagePathForDisplay` falls back to existing behavior (re-derived or "unavailable") |
| 4 | Update `generate-release-metadata.sh` to use `wslpath -w` | Done — replaces fragile distro-name derivation |
| 5 | Add tests for exact `\\wsl.localhost\Ubuntu-Compact\...` path | Done — 2 new tests pass |
| 6 | No ServiceNow/customer data | Clean |

## Remaining risks

- **Manual acceptance required:** The fix is verified locally (build, tests, script output), but a packaged Electron build needs to be tested on a clean Windows machine to confirm the displayPath renders correctly in the app window.
- **Non-WSL environments:** `wslpath -w` is WSL-only. On native Linux or macOS, `grep -qi microsoft /proc/version` fails, so `windowsUncPath` is empty, and the existing fallback label applies correctly.
- **Clipboard copy testing:** Clipboard operations (jsdom mock) are verified by rendering the displayPath value; actual clipboard behavior requires manual verification.

## Files changed

- `scripts/generate-release-metadata.sh` — 2 edits
- `apps/desktop/electron/worktree-ipc.ts` — 5 edits (type + return in 3 functions)
- `apps/desktop/src/App.tsx` — 4 edits (interface + function + 2 JSX spots)
- `apps/desktop/src/App.test.ts` — 2 new tests
- `docs/status/phase-BL2D-sidecar-exact-display-path-2026-06-07.md` — this doc

## Why each touched file was necessary

| File | Reason |
|------|--------|
| `generate-release-metadata.sh` | Script generates the sidecar; needed `wslpath -w` for exact distro name |
| `worktree-ipc.ts` | IPC handler reads sidecar and passes data to renderer; needed to plumb `displayPath` |
| `App.tsx` | Renderer interface, display function, and JSX all need `displayPath`-aware logic |
| `App.test.ts` | Two new tests verify the correct behavior for `displayPath` |
| Status doc | Required by task deliverable |
