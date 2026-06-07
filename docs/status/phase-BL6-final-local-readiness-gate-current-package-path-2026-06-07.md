Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip

# Phase BL6 — Final Local Readiness Gate for Current Package Path Screenshot Regression

Date: 2026-06-07
Scope: local-only repo/docs/tests/mock/artifact verification. No live ServiceNow login, browser operation, API write, Save/Submit/Update/Resolve/Close, Microsoft Graph/Excel Web write, push, merge, tag, release, PR creation, screenshots, HAR, cookies, storage state, raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups, or real customer/ticket data were used.

## Conclusion

BLOCKED.

The BL6 final gate cannot honestly mark the BL line READY FOR ALAN MANUAL VALIDATION ONLY yet. The latest local package and required gates are present, and the packaged app should no longer fall back to only an unavailable/loading state when `resources/release-metadata.json` is available. However, the built renderer still derives the displayed WSL UNC path from an empty bundled `process.env` shim and falls back to `\\wsl.localhost\WSL\...`; it does not use the exact verified Windows UNC path above. That fails the updated final-gate requirement that Alan have a first-screen exact Windows UNC path/latest package identity.

## Latest package verified

| Field | Evidence |
|---|---|
| Current marker | `dist/release/CURRENT.txt` → `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip` |
| Exact Windows UNC path from `wslpath -w` | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip` |
| SHA256 | `bf6d1a85ba28bc2aa604c3b24d35957228712730ceb9c36bbf1b871f6aa896fb` |
| Size | `122692307` bytes |
| Archive contents | 87 files; includes `resources/app.asar` and `resources/release-metadata.json` |
| Outer sidecar | `dist/release/release-metadata.json`, valid JSON, `phase=BL3C`, `source=packaged-metadata` |
| Inner sidecar | `resources/release-metadata.json` inside the ZIP is present and valid JSON |

## Required gates rerun for BL6

| Gate | Result |
|---|---|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 471 tests (83 core + 34 ai + 6 kb + 17 profiles + 95 adapters + 55 cli + 181 desktop) |
| `pnpm privacy:scan` | PASS — `TRACKED_PRIVACY_SCAN_PASS files=297` |

## BL1–BL5 verification

| Phase | Gate finding |
|---|---|
| BL1 root cause | Confirmed packaged mode reused Electron `resources` as project root, causing missing `dist/release/CURRENT.txt`; renderer dropped `ok:false`, producing `CURRENT=N/A` and indefinite loading. |
| BL2 renderer/IPC fix | Renderer now stores `ok:false`; IPC reads `CURRENT.txt` first and returns typed source states. This fixes indefinite loading for failed metadata and enforces current-marker precedence in repo/dev mode. |
| BL2C sidecar fallback | Added `release-metadata.json` sidecar reader, packaged-mode fallback, package config bundling, and renderer `packaged metadata` source label. |
| BL3/BL3C package refresh | Latest package is `servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip`; ZIP includes `resources/release-metadata.json`. |
| BL4 QA | Earlier QA conditional pass is superseded by the operator final-gate update: unavailable-only packaged behavior is not enough. |
| BL5 privacy/security | Privacy audit approved the local-only path/metadata changes; BL6 reran privacy scan and it still passes. |

## Screenshot regression acceptance check

| Requirement | BL6 status | Evidence |
|---|---|---|
| No indefinite `Loading` when metadata IPC returns `ok:false` | PASS | `App.tsx` sets `packageMetadata` for every IPC response; unavailable state renders `Current package metadata is unavailable.` and `Current package path is unavailable.` |
| No misleading `CURRENT=N/A` for a valid current package in repo/dev mode | PASS | `CURRENT.txt` points to the BL3C ZIP and IPC returns `source: current-txt` when `dist/release/` exists. |
| Packaged app has bundled metadata instead of unavailable-only fallback | PASS with caveat | `apps/desktop/package.json` bundles `../../dist/release/release-metadata.json` to `resources/release-metadata.json`; `worktree-ipc.ts` reads it when `dist/release/` is absent; ZIP listing confirms the inner sidecar exists. |
| Packaged first screen shows latest package identity, not `CURRENT=N/A` | LIKELY PASS | Renderer shows `release-metadata.json → CURRENT=<filename>` when `source=packaged-metadata`; sidecar contains the BL3C filename. This still requires Alan's Windows double-click validation. |
| Packaged first screen shows exact Windows UNC path | FAIL / BLOCKER | Built renderer output has `define_process_env_default = {}` and formats paths as `\\wsl.localhost\${resolveWslDistroName() ?? "WSL"}${path...}`. With the bundled env shim empty, the displayed path falls back to `\\wsl.localhost\WSL\...`, not the exact verified `\\wsl.localhost\Ubuntu-Compact\...` path. The sidecar contains a `windowsUncPath` field, but the IPC/renderer currently ignore it. |
| Package checksum shown in app is authoritative | CAVEAT | Outer sidecar and `.sha256` match the current ZIP. Inner sidecar checksum is inherently stale after self-referential ZIP mutation; this is documented in BL3C and should be labelled if surfaced. |

## Blocking issue to fix before READY

Add a display-path field that the packaged metadata path can use directly:

1. Update `readReleaseMetadataSidecar()` / `handleWorktreePackageMetadata()` to return a `displayPath` or `windowsUncPath` from the sidecar when present.
2. Update `PackageMetadataResult` and the renderer to render/copy that display path directly instead of re-deriving a WSL UNC path from bundled renderer env.
3. Regenerate the release sidecar/package so the sidecar's Windows UNC path matches `wslpath -w` for this machine (`Ubuntu-Compact`, not the stale `Ubuntu` value currently in the sidecar JSON).
4. Add tests for packaged metadata path display so the first-screen handoff cannot regress to `\\wsl.localhost\WSL\...` or `CURRENT=N/A`.
5. Rerun `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm privacy:scan`.

## Safe manual note for Alan

The exact file to test remains the UNC path on the first line of this document. Do not use this BL6 result as release-ready approval yet; it is a blocked local-readiness finding until the packaged handoff card can show/copy the exact Windows UNC path from sidecar/display metadata.
