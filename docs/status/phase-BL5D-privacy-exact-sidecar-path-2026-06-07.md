# Phase BL5D — Privacy/security audit of BL2D-BL4D exact sidecar path display

**Date:** 2026-06-07
**Worker:** sna-privacy-security (task t_78a08c9a)
**Parent:** t_588e5465 (BL4D QA exact packaged path acceptance)
**SPDX-License-Identifier:** BSD-3-Clause (see LICENSE.md for terms)

## Verdict: APPROVE

No blocking privacy or security issues found. All BL2D-BL4D path display changes expose only sanitized local filesystem paths, filenames, and SHA256 hashes. No ServiceNow data, credentials, secrets, or real customer/ticket information is exposed.

## Scope audited

BL-phase commits: `4ec96f3` (BL2C) → `b4397ee` (BL3D) → `e760ea4` (BL4D)

Core code changes are all in BL2C (`4ec96f3`):
- `scripts/generate-release-metadata.sh` — generates sidecar JSON from local artifacts
- `apps/desktop/electron/worktree-ipc.ts` — IPC handler reads sidecar, plumbs `displayPath`
- `apps/desktop/electron/worktree-ipc.test.ts` — 50 tests including 6 sidecar tests
- `apps/desktop/src/App.tsx` — `formatPackagePathForDisplay()`, `displayPath` in UI
- `apps/desktop/src/App.test.ts` — 2 displayPath-specific tests
- `apps/desktop/package.json` — `extraResources` bundling, `generate:release-metadata` script
- `apps/desktop/electron/packaging-config.test.ts` — script expectation update

BL3D and BL4D are docs-only commits (status documents).

## Data flow audit

```
generate-release-metadata.sh
  $LINUX_ABS  = realpath("dist/release/$CURRENT_FILENAME")   → local path
  $WINDOWS_UNC = wslpath -w "$LINUX_ABS"                      → local UNC path
  release-metadata.json.windowsUncPath = $WINDOWS_UNC         → local data only
        ↓
worktree-ipc.ts::readReleaseMetadataSidecar()
  displayPath = parsed.windowsUncPath ?? undefined            → verbatim from sidecar
        ↓
App.tsx::formatPackagePathForDisplay(path, ok, displayPath)
  if (displayPath) return displayPath;                        → verbatim, no derivation
  else fallback: `\\wsl.localhost\${distroName}${path}`        → local env var only
```

All data originates from local `realpath`/`wslpath -w` on `.zip` artifacts in `dist/release/`. No external network, API, or ServiceNow data involved.

## What IS exposed (safe)

| Data | Source | Sensitivity |
|------|--------|-------------|
| Local package filename | `CURRENT.txt` in dist/release/ | None — artifact name |
| SHA256 hash | `sha256sum` on local zip | None — integrity hash |
| File size / mtime | `stat` on local zip | None — file metadata |
| Linux path | `realpath` on local zip | Local dev path only |
| Windows UNC path | `wslpath -w` on local zip | Local dev path only |
| WSL distro name | `resolveWslDistroName()` from env | Local WSL config |

## What is NOT exposed (confirmed clean)

- No ServiceNow URLs, hosts, or endpoints
- No ticket IDs or sys_ids
- No customer names or employee emails
- No credentials, tokens, secrets, or API keys
- No cookies, sessions, or storage-state
- No HAR, traces, screenshots, or videos
- No page fingerprints or approval phrases
- No production KB content
- No ServiceNow API write automation (Save/Submit/Update/Resolve/Close)

## Gates

| Gate | Status | Details |
|------|--------|---------|
| `pnpm build` | Not re-run | No code changed in this audit |
| `pnpm typecheck` | Not re-run | No code changed in this audit |
| `pnpm test` | Not re-run | No code changed in this audit |
| `pnpm privacy:scan` | **PASS** | 299 files, 0 findings |

## Evidence reviewed

1. **Privacy scan (299 files):** `pnpm privacy:scan` — PASS, zero findings
2. **Source code review:**
   - `scripts/generate-release-metadata.sh` — uses `realpath` + `wslpath -w` on local zip only
   - `apps/desktop/electron/worktree-ipc.ts` — `windowsUncPath` → `displayPath` plumbing only
   - `apps/desktop/src/App.tsx` — `formatPackagePathForDisplay` returns `displayPath` verbatim
   - `packages/adapters/src/wsl-utils.ts` — `resolveWslDistroName()` reads WSL env vars only
3. **Test data review:**
   - `worktree-ipc.test.ts` — all test filenames are synthetic (e.g., `servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip`)
   - `App.test.ts` — displayPath tests use synthetic UNC paths; one test (line 1715) contains local WSL username as part of a synthetic dev path
4. **Docs review:**
   - BL2D, BL3D, BL4D, BL6 status docs — all contain local filesystem paths and SHA256 only
   - BL4D line 19/70, BL3D lines 23/48/67-69 — exact UNC paths with WSL username, all local dev paths
5. **Sensitive pattern scan:** Grep for ServiceNow URLs, tokens, secrets, credentials, session, cookie, sys_id, ticket patterns in BL-phase code — only match is a safety-disclaimer copy line

## Non-blocking observations

1. **WSL username in docs/tests:** The developer's WSL username (`alanxwsl`) appears in committed status docs and one test as part of local filesystem paths. This is inherent to documenting a development tool's local path display behavior and does not constitute a ServiceNow privacy leak. The paths are all under the project's own `dist/release/` directory.
2. **Test path hygiene:** One test (`App.test.ts` line 1715) uses a synthetic path with the WSL username; a cleaner variant (`App.test.ts` line 1741) uses a path without a username. Future tests could prefer the cleaner style, but this is not a blocking issue.
3. **Sidecar SHA256 self-reference:** BL3D doc notes that the inner sidecar references the previous BL3C package SHA256 (packaging sequencing artifact). The outer sidecar and `.sha256` file are authoritative — no security impact.

## Files changed (this audit)

- `docs/status/phase-BL5D-privacy-exact-sidecar-path-2026-06-07.md` — this document

## Remaining risks

- **Manual Windows acceptance:** The packaged app needs manual double-click verification on a clean Windows machine to confirm the exact UNC path renders correctly. This is a product acceptance concern, not a privacy/security one.
- **Non-WSL environments:** Path display falls back gracefully; no security concern.

## Safety boundaries confirmed

- No Save/Submit/Update/Resolve/Close automation
- No ServiceNow API writes
- No real browser operations
- No real customer/ticket data
- No credential/secret leakage
- No push/PR/merge/tag/release performed
- All paths are local filesystem paths only
