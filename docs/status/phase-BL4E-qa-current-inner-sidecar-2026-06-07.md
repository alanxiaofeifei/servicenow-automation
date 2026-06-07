# Phase BL4E — QA current inner sidecar package identity

**Date:** 2026-06-07
**Worker:** sna-qa-acceptance
**Parent:** t_f9502978 (BL3E — Windows local package refresh with current inner sidecar identity)
**Supersedes:** t_588e5465 (BL4D — false-pass risk flagged)

---

## Verdict: PASS

All 4 acceptance criteria independently verified from code evidence + 4 automated gates green.

---

## Criteria Verification

### Criterion 1: Inner `resources/release-metadata.json` phase is BL3E, not stale BL3C/BL3D

**Evidence (BL3E zip — inner metadata):**
```
$ unzip -p dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip resources/release-metadata.json
{
  "version": 1,
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "phase": "BL3E",
  "windowsUncPath": "\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\...",
  "source": "packaged-metadata"
}
```

**Sibling verification (BL3D zip — stale inner metadata for comparison):**
```
$ unzip -p dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip resources/release-metadata.json
{
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip",
  "phase": "BL3C",    ← STALE (filename says bl3d but phase is bl3c)
  ...
}
```

BL3D clearly contains stale inner phase (BL3C). BL3E zip correctly contains `"phase": "BL3E"` and matching `"filename"`. The `generate-release-metadata.sh` fix (BL3E commit fe96f19) resolved the regex and stale-phase problem.

---

### Criterion 2: Displayed path uses exact `Ubuntu-Compact` UNC

**Evidence (BL3E zip inner metadata — `windowsUncPath`):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip
```

Contains exact `Ubuntu-Compact` (not generic "Ubuntu", not "ubuntu-22.04", not any other variant).

**Evidence (source code mapping):**
- `apps/desktop/electron/worktree-ipc.ts` line 207-209 maps `parsed.windowsUncPath` directly to `displayPath`
- `apps/desktop/src/App.tsx` line 4260-4265 renders `CURRENT=<filename>` badge with `packaged metadata` green badge when `source === "packaged-metadata"`

---

### Criterion 3: No Loading/CURRENT=N/A regression

**CURRENT.txt:**
```
CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip
```
No `N/A` — correctly points to BL3E zip.

**Source code behavior:**
- `App.tsx` line 4261: `CURRENT=${packageMetadata.filename ?? 'N/A'}` — N/A is a safe fallback when metadata is absent (not a regression)
- `App.tsx` line 4514: `Loading...` shown when `packageMetadata?.ok` is falsy — expected placeholder, not a regression
- Test `App.test.ts` line 1694 tests the `CURRENT=N/A` scenario — correct coverage of edge case

No Loading/CURRENT=N/A regression present.

---

### Criterion 4: Service Desk card order unchanged

**Git diff evidence (BL3E commit fe96f19):**
Only changed files:
1. `scripts/generate-release-metadata.sh` — metadata generation fix
2. `docs/status/phase-BL3E-windows-local-package-refresh-current-inner-sidecar-2026-06-07.md` — status doc

No changes to `App.tsx`, `App.test.ts`, or any card-ordering logic.

**Service Desk monitoring groups (App.tsx line 785-789) — unchanged:**
```
1. Demo Service Desk
2. Demo Identity Access
3. Demo Network Operations
4. Demo Employee Portal
```

**Standard Service Desk preset (App.tsx line 2488+) — unchanged.**

---

## Automated Gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS (all 7 workspace projects) |
| `pnpm test` | PASS (475 tests across all packages) |
| `pnpm privacy:scan` | PASS (300 files) |

---

## Summary

BL4E QA independently confirms that the BL3E Windows local package contains current inner sidecar identity (`phase: BL3E`, not stale BL3C/BL3D), the UNC path uses exact `Ubuntu-Compact`, there is no Loading/CURRENT=N/A regression, and Service Desk card order is unchanged. The BL3D zip is confirmed to have stale inner metadata (claims phase BL3C despite filename saying bl3d), validating the BL3E fix was necessary and correct.
