# Phase BL4D — QA exact packaged path acceptance for screenshot regression

**Date:** 2026-06-07
**Worker:** sna-qa-acceptance (task t_588e5465)
**Parent:** t_f9f3bc8c (BL3D — rebuild package with exact sidecar UNC display path)
**SPDX-License-Identifier:** BSD-3-Clause (see LICENSE.md for details)

## Verdict: PASS

All four acceptance criteria verified from code/build/archive evidence.
All four automated gates pass.

## Package under test

| Field | Value |
|---|---|
| **CURRENT.txt** | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip` |
| **SHA256** | `399f5f4574924ca8b61c9a50fcbd002da563c8959a0231f99baeefa7cae5de82` |
| **windowsUncPath** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip` |
| **Distro** | `Ubuntu-Compact` (not `WSL` generic) |

## Acceptance criteria

### Criterion 1: No indefinite Loading for metadata failure

**PASS**

- `App.tsx` line 4288-4291: When `packageMetadata?.ok === false`, renders "Current package metadata is unavailable." (terminal state, not "still loading")
- `App.tsx` line 8765-8767: `formatPackagePathForDisplay` returns "Current package path is unavailable." when `ok === false` with no path
- IPC handler `handleWorktreePackageMetadata`: Returns `{ ok: false, error: "..." }` on failure — no retry loop, no infinite spinner
- Test `App.test.ts` lines 1687-1708: Explicitly verifies `ok === false` renders "unavailable" text, asserts `expect(output).not.toContain("still loading")`

**Code evidence:**
```typescript
// App.tsx:4288-4290
packageMetadata?.ok === false
  ? "Current package metadata is unavailable."
  : "Current package metadata is still loading."

// App.tsx:8763-8767
function formatPackagePathForDisplay(...): string {
  if (displayPath) return displayPath;
  if (!path) {
    if (ok === false) return "Current package path is unavailable.";
    return "Current package path is still loading.";
  }
```

### Criterion 2: Valid current package does not show CURRENT=N/A

**PASS**

- `CURRENT.txt` on disk: `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip` — valid `.zip` filename
- `release-metadata.json` also contains valid filename
- `App.tsx` line 4261: `CURRENT=${packageMetadata?.filename ?? 'N/A'}` — the `?? 'N/A'` only triggers when `filename` is null/undefined (metadata unavailable path), NOT when metadata is valid
- Test `App.test.ts` line 1694: Verifies `CURRENT=N/A` appears ONLY in the metadata-failure test case (ok === false)

**Code evidence:**
```typescript
// App.tsx:4260-4263 — source-of-truth line
{packageMetadata?.source === "packaged-metadata"
  ? `release-metadata.json → CURRENT=${packageMetadata.filename ?? 'N/A'}`
  : `dist/release/CURRENT.txt → CURRENT=${packageMetadata?.filename ?? 'N/A'}`}
```

### Criterion 3: Packaged metadata uses exact sidecar display path, not `\\wsl.localhost\WSL\...`

**PASS**

- `release-metadata.json` `windowsUncPath`: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...` — exact UNC path with actual distro name `Ubuntu-Compact`
- `worktree-ipc.ts` line 194: `displayPath: parsed.windowsUncPath ?? undefined` — passes exact sidecar `windowsUncPath` as `displayPath` to renderer
- `App.tsx` line 8763: `formatPackagePathForDisplay` returns `displayPath` directly when provided — uses sidecar exact path verbatim
- Fallback at line 8769-8770: `resolveWslDistroName() ?? "WSL"` — only uses generic `WSL` if no distro name can be resolved; actual env always has `WSL_DISTRO_NAME` on real WSL
- Test `App.test.ts` lines 1711-1725: Verifies `displayPath: "\\\\wsl.localhost\\Ubuntu-Compact\\..."` renders correctly
- `resolveWslDistroName()` (`wsl-utils.ts`): Checks `SDA_WSL_DISTRO` then `WSL_DISTRO_NAME` — validates with `/^[A-Za-z0-9_.-]+$/` regex, sanitized

**Code evidence:**
```typescript
// App.tsx:8762-8771 — display path rendering
function formatPackagePathForDisplay(path: string | undefined, ok?: boolean, displayPath?: string): string {
  if (displayPath) return displayPath;
  if (!path) {
    if (ok === false) return "Current package path is unavailable.";
    return "Current package path is still loading.";
  }
  const distroName = resolveWslDistroName() ?? "WSL";
  return `\\\\wsl.localhost\\${distroName}${path.replace(/\//g, "\\")}`;
}

// worktree-ipc.ts:194 — sidecar displayPath plumbing
displayPath: parsed.windowsUncPath ?? undefined,
```

### Criterion 4: UI preserves Service Desk order

**PASS — DOM order confirmed:**

| Order | Section | DOM element | App.tsx line |
|---|---|---|---|
| 1 | Selected source detail | `<section className="workbench-card selected-source-card">` | 4839 |
| 2 | Cleaned summary | `<section className="workbench-card cleaned-summary-card">` | 4876 |
| 3 | Incident draft | `<section className="workbench-card incident-draft-card">` | 4900 |
| 4 | Guided demo path | `<section className="workbench-card guided-demo-stepper-card">` | 4939 |
| 5 | Local KB recommendations | `<section className="workbench-card kb-recommendations-card">` | 4979 |
| 6 | Monthly Excel fill queue | `<section className="workbench-card monthly-excel-fill-card">` | 5031 |

Test `App.test.ts` lines 163-191: Index-based assertion verifying Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue order. Also verifies guided demo step titles and data-step-status attributes.

## Automated gates

| Gate | Status | Details |
|---|---|---|
| `pnpm build` | **PASS** | All workspace projects build clean |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 238 tests total (183 desktop + 55 CLI) |
| `pnpm privacy:scan` | **PASS** | 298 files scanned, no violations |

## Files changed

1. `docs/status/phase-BL4D-qa-exact-packaged-path-acceptance-2026-06-07.md` — This status document

## Safety

- No real ServiceNow URLs, credentials, cookies, sessions, or ticket data exposed.
- No real ServiceNow browser operations performed.
- No GitHub push, PR, merge, tag, or release.
- No Microsoft Graph / Excel Web writes.
- All code inspections are local-only. No real customer/ticket data touched.
