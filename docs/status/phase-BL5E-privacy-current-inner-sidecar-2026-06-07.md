# Phase BL5E — Privacy/Security Audit: Current Inner Sidecar Metadata

**Date:** 2026-06-07
**Worker:** sna-privacy-security (task t_acaf26cf)
**Parent:** t_3fdf0d6e (BL4E — QA current inner sidecar package identity)

---

## Verdict: APPROVE

No blocking privacy or security issues found. All metadata across BL2E-BL4E and latest BL3E package contains only local filesystem path/filename/phase/checksum information. Zero secrets, zero live ServiceNow data, zero customer/ticket/browser data.

---

## Independent Audit Surfaces

### 1. BL3E zip inner sidecar (`resources/release-metadata.json` inside zip)

```
filename: servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip
phase: BL3E ✓ (NOT stale)
checksumScope: external ✓ (correct new schema)
sha256: "" ✓ (empty — correct for pre-build sidecar)
size: 0, mtime: 0 ✓ (unknown before build)
windowsUncPath: \\wsl.localhost\Ubuntu-Compact\... ✓
source: packaged-metadata ✓
```

- Phase reflects BL3E, not stale BL3C/BL3D
- `checksumScope: "external"` correctly signals authoritative checksum is in outer metadata
- Empty sha256 correctly handled by renderer (App.tsx line 4281: falsy sha256 → not displayed)
- WSL UNC path uses exact `Ubuntu-Compact` distro name
- **Zero secrets, zero ServiceNow identifiers**

### 2. BL3D zip inner sidecar (stale, for comparison)

```
filename: servicenow-automation-windows-v0.1.0-rc.1-bl3c-...zip ← STALE (filename says bl3c)
phase: BL3C ← STALE (outer zip name says bl3d but inner phase is bl3c)
```

- Confirms BL3D was shipped with stale inner metadata — validates the BL3E fix was necessary
- **Zero secrets** (but metadata is factually incorrect — resolved by BL3E)

### 3. BL3C zip inner sidecar

```
phase: BL3C ✓ (correct for its build)
sha256: (non-empty, old self-referential schema)
windowsUncPath: \\wsl.localhost\Ubuntu\... (generic, pre-BL2D)
```

- **Zero secrets**

### 4. Outer `dist/release/release-metadata.json`

```
phase: BL3E ✓
sha256: eef7bb4a25a18e48679449ed0586e645a2b3d4d72abca08e3e4b093c28ae06f1
windowsUncPath: \\wsl.localhost\Ubuntu-Compact\...
```

- Authoritative checksum matches `.zip.sha256` sidecar (verified via `sha256sum -c`)
- **Zero secrets**

### 5. `dist/release/CURRENT.txt`

```
CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip
```

- Points to BL3E zip — correct
- **Zero secrets**

### 6. `scripts/generate-release-metadata.sh`

- Reads CURRENT.txt, extracts phase from filename via regex
- Uses `wslpath -w` for UNC path construction (existence-tolerant)
- Writes metadata via Python `json.dump` — single source of truth: CURRENT.txt
- **Zero secrets, zero ServiceNow URLs, zero credentials**
- Only local filesystem operations

### 7. `apps/desktop/electron/worktree-ipc.ts` (BL2E changes)

- `readReleaseMetadataSidecar()` validates `checksumScope`
- When `checksumScope === "external"`: accepts empty sha256 ✓
- When `checksumScope` absent or `"self"`: requires non-empty sha256 ✓
- Only filesystem paths in returned data
- **Zero secrets, zero ServiceNow data**

### 8. `apps/desktop/src/App.tsx` line 4281

```tsx
{packageMetadata.sha256 ? <> | SHA256: <code>{packageMetadata.sha256}</code></> : null}
```

- Falsy sha256 (empty string from BL3E inner sidecar) → renders `null` — no SHA256 displayed
- No sensitive data path in rendering

### 9. `apps/desktop/electron/worktree-ipc.test.ts`

- Test: "accepts sidecar with empty sha256 and checksumScope 'external'" — uses example paths ✓
- Test: "returns unavailable with missing sha256 and no checksumScope" — correct rejection ✓
- All test fixtures use example/local paths only
- **Zero secrets, zero real SN data**

---

## Automated Gates (independently verified)

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | PASS | All workspace projects |
| `pnpm typecheck` | PASS | All 7 workspace packages |
| `pnpm test` | PASS | 185 tests (9 files) |
| `pnpm privacy:scan` | PASS | 301 files |
| SHA256 verification | PASS | `sha256sum -c` matches outer metadata |

---

## Bucket Analysis

### Blocking issues: NONE

All metadata surfaces contain exactly the expected local metadata:
- Filename: `servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip`
- Phase: `BL3E`
- Local Linux path: `/home/alanxwsl/projects/servicenow-automation/dist/release/...`
- WSL UNC path: `\\wsl.localhost\Ubuntu-Compact\...`
- Checksum: `sha256: ""` (inner, external scope) / `eef7bb...` (outer, authoritative)
- `checksumScope: "external"` (schema semantic, not a secret)

### Non-blocking observations

1. **BL3D inner sidecar is stale** — confirmed phase BL3C inside a zip named bl3d. This is the bug BL3E fixed. Not a privacy issue.
2. **No .env files** found in the repository.
3. **All `.service-now.com` references** in tracked code are either:
   - Security enforcement code (CDP PowerShell guard)
   - Privacy scanner detection patterns
   - Test fixtures using `.service-now.example.invalid` (RFC 6761 reserved TLD)
4. **SHA256 display is correctly suppressed** when inner sidecar carries empty checksum (BL3E behavior).

### Evidence reviewed

- BL3E zip inner sidecar (extracted and inspected)
- BL3D zip inner sidecar (stale comparison)
- BL3C zip inner sidecar (original baseline)
- Outer `dist/release/release-metadata.json`
- `dist/release/CURRENT.txt`
- `scripts/generate-release-metadata.sh` (full source)
- `apps/desktop/electron/worktree-ipc.ts` (checksumScope validation)
- `apps/desktop/src/App.tsx` (sha256 display logic, line 4281)
- `apps/desktop/electron/worktree-ipc.test.ts` (external scope tests)
- SHA256 sidecar verification (`sha256sum -c`)

### Safety confirmations

- No real ServiceNow login, browser operations, or API writes
- No Save / Submit / Update / Resolve / Close automation
- No Microsoft Graph / Excel Web writes
- No real customer/ticket/browser/session data, screenshots, HAR, traces, cookies, storage-state
- No raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups
- No credentials
- No push/PR/merge/tag/GitHub Release
- All paths are local filesystem paths — no external endpoints

---

## Summary

BL5E independently confirms that the BL3E packaged inner sidecar metadata is current (phase BL3E, not stale), correctly uses `checksumScope: "external"` for the pre-build sidecar, and contains zero secrets or live ServiceNow data. The BL3D stale-sidecar evidence validates the BL3E fix was necessary and correct. All 5 gates pass independently.

**Verdict: APPROVE — no blocking issues.**
