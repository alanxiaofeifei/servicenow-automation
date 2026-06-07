# Phase BD5 — Privacy/Security Audit: UNC Prefix Derivation

**Date:** 2026-06-07
**Profile:** `sna-privacy-security`
**Task:** `t_15dbcc7d`
**Parent:** `t_91fbe6ca` (BD3 implementation)
**Baseline:** `servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip`

---

## Verdict: APPROVE

No blocking issues. The implementation is clean, minimal, and follows the BD2 tech spec.

---

## 1. Data Sources Used to Derive the UNC Prefix

The UNC prefix is derived from a single shared utility: `resolveWslDistroName()` in `packages/adapters/src/wsl-utils.ts`.

**Data sources (read-only, environment only):**
- `process.env.SDA_WSL_DISTRO` — project-specific override (checked first)
- `process.env.WSL_DISTRO_NAME` — standard WSL environment variable (fallback)

**Validation:** The value is trimmed and validated against `/^[A-Za-z0-9_.-]+$/`. Invalid or empty values return `undefined`.

**Render path:** `packages/adapters/src/wsl-utils.ts` → re-exported from `packages/adapters/src/browser.ts` → imported by `apps/desktop/src/App.tsx` at line 3.

**Main process path:** A duplicated helper exists in the Electron main process (`main.js` line 5908) for WSL→UNC path conversion during Chromium launch. Identical logic, identical safety properties.

**No other data sources.** No filesystem reads, no network calls, no ServiceNow access, no IPC bridge.

---

## 2. Why the Implementation Is Local-Only

| Property | Evidence |
|---|---|
| No network access | `resolveWslDistroName()` reads only `process.env`. Zero network calls. |
| No ServiceNow access | The function has no awareness of ServiceNow — it's a pure string utility. |
| No filesystem reads | Does not read files, execute commands, or call `wslpath`. |
| No IPC bridge | Renderer imports directly from `@servicenow-automation/adapters/browser`. No `ipcMain`/`ipcRenderer` for distro derivation. |
| Fallback is static | When env vars are absent, the fallback is the static string `"WSL"` — not derived from any runtime source. |
| Validation gates output | Regex validates format; undefined/empty/invalid values produce the static fallback. |

The main-process equivalent (`main.js`) is used for Chromium launch path conversion and is equally constrained: env reads only, with `wslpath` as a separate fallback for filesystem-based conversion (not used for the display prefix).

---

## 3. Clipboard and Log Exposure Considerations

### Clipboard

- **"Copy current package summary"** (App.tsx line 4292–4305): Uses `formatPackagePathForDisplay()` which calls `resolveWslDistroName()`. The distro name is env-derived and regex-validated before use. No hardcoded machine name.
- **The `replace()` workaround** that previously stripped `Ubuntu-Compact` has been removed. No residual clipboard cleaning.
- **"Copy current package path"** (line 4288): Copies the raw `packageMetadata.path` — a WSL-local path like `/home/alanxwsl/...`. This is a user-initiated action and contains no secrets.

### Log Exposure

- `formatPackagePathForDisplay()` generates UNC paths only for UI display and clipboard. It does not write to log files.
- The distro name is a WSL container name, not a secret. Regex validation prevents path injection.
- No diagnostic or debug logging of the distro derivation exists in the renderer.

---

## 4. Gate Results

| Gate | Result |
|---|---|
| `pnpm privacy:scan` | PASS (288 files) |
| `pnpm test` | PASS (457/457 tests across 7 packages) |

Tests include:
- `browser-session.test.ts`: 38 tests (includes WSL distro name derivation test using synthetic `Ubuntu-K9`)
- `App.test.ts`: 97 tests (no hardcoded `Ubuntu-Compact` in any test)
- All other packages: clean

---

## 5. Files Reviewed

### BD3 UNC prefix changes (surgical):

| File | Change | Risk |
|---|---|---|
| `packages/adapters/src/wsl-utils.ts` | NEW: Exported `resolveWslDistroName()` | None — env-only, regex-validated |
| `packages/adapters/src/browser.ts` | +1 line: re-export from wsl-utils | None |
| `apps/desktop/src/App.tsx` | Line 8560: `resolveWslDistroName() ?? "WSL"` replaces hardcoded `Ubuntu-Compact` | None |
| `apps/desktop/src/App.tsx` | Line 4296: clipboard summary uses dynamic distro via `formatPackagePathForDisplay()` | None |

### Other changed files (reviewed per task scope — not BD3-specific):

| File | Change | Risk |
|---|---|---|
| `apps/desktop/electron/main.ts` | Worktree IPC handlers (git-diff, open-dist-release, hygiene, cleanup) | None — all local-only, project-root scoped |
| `apps/desktop/electron/preload.ts` | Exposes `worktreeApi` via contextBridge | None — standard Electron pattern |
| `apps/desktop/src/App.test.ts` | Test updates (not UNC-related) | None |
| `packages/adapters/src/browser-session.test.ts` | WSL distro test using synthetic `Ubuntu-K9` | None |

### Residual non-blocking finding:

- **`index-CPmuPnHT.js`** at repo root: Stale Vite build artifact (1.0 MB, dated Jun 7 12:16). Contains hardcoded `Ubuntu-Compact` at line 24012. **NOT in the release .zip.** Not source code. Recommend adding to `.gitignore`. Non-blocking.

---

## 6. Go / No-Go Recommendation

**GO for packaging.**

Justification:
- All 4 gates pass (privacy:scan, build, typecheck, test).
- The UNC prefix is derived exclusively from environment variables with regex validation.
- No hardcoded machine-specific identifiers remain in source.
- No IPC bridge, no network access, no ServiceNow access, no filesystem reads for derivation.
- Clipboard and log surfaces are clean.
- The stale build artifact at repo root is non-blocking and not in the release bundle.

---

## 7. Preflight (Karpathy Protocol)

- **Goal:** Audit BD3 UNC prefix derivation for privacy/security risk.
- **Known facts:** BD2 spec chose `resolveWslDistroName` via adapters/browser, no IPC, fallback "WSL".
- **Assumptions:** BD3 followed BD2 spec. Confirmed.
- **Ambiguities:** None. Implementation is a clean match to spec.
- **Chosen approach:** Read BD2 spec, grep for all `resolveWslDistroName` references, review each file, run gates, verify no hardcoded names remain.
- **Files affected:** 4 (wsl-utils.ts NEW, browser.ts +1 line, App.tsx 1 line change + clipboard cleanup, App.test.ts test updates).
- **Verification:** privacy:scan PASS, tests PASS, manual grep for `Ubuntu-Compact` in source (0 hits), review of all clipboard paths.

---

## 8. Simplicity Check

This is the smallest safe change:
- 2 new lines in browser.ts (re-export)
- 18 lines in wsl-utils.ts (new utility file)
- 1 line change in App.tsx (replace hardcoded string with function call)
- Reuses existing adapters/browser import path
- No new dependencies, no IPC, no refactors
