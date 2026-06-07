Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip

# Phase BL6D — Final Local Readiness Gate: Exact Package Path Screenshot Fix

**Date:** 2026-06-07  
**Task:** `t_ee44b50e`  
**Verdict:** READY FOR ALAN MANUAL VALIDATION ONLY

## Current package Alan should test

Alan should test **only** this latest BL3E Windows local package. BL3D is not the current test artifact because operator verification found its packaged inner `resources/release-metadata.json` still referenced stale BL3C identity; BL3E supersedes BL3D for the screenshot regression gate.

| Field | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| SHA-256 | `eef7bb4a25a18e48679449ed0586e645a2b3d4d72abca08e3e4b093c28ae06f1` |
| Size | 118,610,250 bytes |
| Source marker | `dist/release/CURRENT.txt` -> `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| START-HERE sidecar | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local-START-HERE-WINDOWS.txt` |
| SHA sidecar | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip.sha256` |

## BL2D-BL5D / BL2E-BL5E readiness chain

| Surface | Result | Evidence |
|---|---:|---|
| BL2D exact display path | PASS | BL3E package metadata uses the exact WSL UNC with `Ubuntu-Compact`. |
| BL3D package | SUPERSEDED | BL3D zip exists, but its inner sidecar was operator-confirmed stale (`phase: BL3C`); it is not the final screenshot test artifact. |
| BL4D / BL5D | SUPERSEDED | BL4D false-pass risk and BL5D were superseded after the BL3D inner sidecar issue was found. |
| BL2E sequencing fix | PASS | `scripts/generate-release-metadata.sh` now generates pre-build inner metadata with `checksumScope: "external"`, empty `sha256`, and current filename/path from `CURRENT.txt`. |
| BL3E package refresh | PASS | Latest package is `bl3e`; outer and inner sidecars both identify BL3E. |
| BL4E QA | PASS | QA approved BL3E package identity, exact `Ubuntu-Compact` path, no CURRENT=N/A regression, and unchanged Service Desk card order. |
| BL5E privacy/security | APPROVE | Privacy/security audit found zero secrets, zero live ServiceNow data, and no blocking issues across BL2E-BL4E/BL3E metadata surfaces. |

## Package sidecar verification for the screenshot acceptance gate

| Check | Result | Evidence |
|---|---:|---|
| `dist/release/CURRENT.txt` | PASS | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| Exact Windows UNC from local path | PASS | `wslpath -w` returned `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip`. |
| Outer `dist/release/release-metadata.json` | PASS | `filename=...bl3e...zip`, `phase=BL3E`, `source=packaged-metadata`, exact `Ubuntu-Compact` UNC path, SHA-256 `eef7bb4a25a18e48679449ed0586e645a2b3d4d72abca08e3e4b093c28ae06f1`. |
| Inner `resources/release-metadata.json` in ZIP | PASS | `filename=...bl3e...zip`, `phase=BL3E`, `source=packaged-metadata`, `checksumScope=external`, `sha256=""`, exact `Ubuntu-Compact` UNC path. |
| Inner sidecar stale BL3C/BL3D regression | PASS | The sidecar actually read by packaged Electron identifies BL3E, not BL3C or BL3D. |
| SHA sidecar | PASS | From `dist/release`: `servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip: OK`. |
| ZIP metadata entry | PASS | `unzip -t` reported `resources/release-metadata.json OK` and no errors for that entry. |

## Required final local gates rerun for BL6D

| Gate | Result | Evidence |
|---|---:|---|
| `pnpm build` | PASS | Desktop main/preload/renderer and CLI build passed; renderer bundle emitted under `apps/desktop/out/renderer/assets/`. |
| `pnpm typecheck` | PASS | All 7 workspace projects completed typecheck. |
| `pnpm test` | PASS | 475 tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, CLI 55, desktop 185. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=302` after staging this BL6D status doc. |
| `hermes profile show codex-gpt55-control` | PASS | Profile resolved at `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5`; gateway running. |
| `hermes tools list` | PASS | CLI returned enabled/disabled built-in tool list. |
| `hermes gateway status` | PASS | Gateway running in WSL manual mode; SNA profiles reported running. |

## Manual validation instructions for Alan

1. Paste this exact UNC path into Windows File Explorer:
   `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip`
2. Confirm the ZIP filename is exactly:
   `servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip`
3. Confirm the SHA-256 is exactly:
   `eef7bb4a25a18e48679449ed0586e645a2b3d4d72abca08e3e4b093c28ae06f1`
4. Extract locally and read the START-HERE sidecar before launching.
5. In the packaged app screenshot, verify the current package display is BL3E and the path uses the exact `\\wsl.localhost\Ubuntu-Compact\...\bl3e-20260607-local.zip` UNC path. The UI must not show `CURRENT=N/A`, `Current package path is still loading.`, BL3C, BL3D, or generic `\\wsl.localhost\Ubuntu\...`.

## Safety boundary

- No real ServiceNow login, browser operation, API write, Save / Submit / Update / Resolve / Close, attachment upload, Microsoft Graph / Excel Web write, or production/prod-shadow write was performed.
- No real customer/ticket/browser/session data, screenshots, HAR, traces, cookies, storage-state, raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups, field values, or credentials are included here.
- No push, PR, merge, tag, GitHub Release, publish, or external write was performed.
- This verdict authorizes Alan manual validation only; it is not release approval and does not authorize live ServiceNow operation or any external write.

## Conclusion

READY FOR ALAN MANUAL VALIDATION ONLY.

Old BL6 `t_dbe1c194` is superseded by BL6D and may be archived after operator review.
