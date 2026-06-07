# Phase BD2 — Renderer-side WSL distro name derivation tech spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_adaa9eaf`

---

## 1. Goal

Define the smallest safe way for `apps/desktop/src/App.tsx` to derive the WSL distro name used by `formatPackagePathForDisplay()` without hardcoding `Ubuntu-Compact` in the renderer.

---

## 2. Known facts

- `formatPackagePathForDisplay()` currently hardcodes `\\wsl.localhost\\Ubuntu-Compact` in `apps/desktop/src/App.tsx`.
- `packages/adapters/src/browser-session.ts` already has a private `resolveWslDistroName()` that reads:
  - `process.env.SDA_WSL_DISTRO`
  - then `process.env.WSL_DISTRO_NAME`
- That helper already validates the value with `/^[A-Za-z0-9_.-]+$/`.
- `apps/desktop/src/App.tsx` already imports from `@servicenow-automation/adapters/browser`.
- The current user-visible fallback states for missing package path data must stay unchanged.

---

## 3. Assumptions

- The renderer can safely consume the same env-based distro derivation used by the adapters package.
- No new IPC channel is needed for this derivation.
- The renderer is allowed to use a small shared helper from the adapters package without introducing a new dependency layer.

---

## 4. Decision

Use the existing env-var derivation as a shared utility, exported through the adapters package and imported directly by the renderer.

Chosen approach:

- Export `resolveWslDistroName()` from `packages/adapters/src/browser-session.ts`.
- Re-export it from `packages/adapters/src/browser.ts` so the renderer can access it via the existing browser subpath.
- Import it in `apps/desktop/src/App.tsx` from `@servicenow-automation/adapters/browser`.
- Do not introduce IPC.
- Do not duplicate the env check in the renderer.

Exact import path and function name:

- `@servicenow-automation/adapters/browser`
- `resolveWslDistroName`

---

## 5. Fallback behavior

If no valid distro name is available, `formatPackagePathForDisplay()` should use a visible placeholder rather than silently generating a broken-looking path.

Fallback rule:

- if `resolveWslDistroName()` returns a value, use it
- otherwise use `"WSL"`

Resulting display shape:

- `\\wsl.localhost\\<distro>\\home\\...`
- fallback example: `\\wsl.localhost\\WSL\\home\\...`

This keeps the path visibly synthetic and avoids embedding a machine-specific hardcoded distro name.

---

## 6. State matrix

| State | `resolveWslDistroName()` | Display result |
|---|---|---|
| WSL distro explicitly configured | valid distro string | `\\wsl.localhost\\<distro>\\...` |
| Standard WSL env available | valid distro string | `\\wsl.localhost\\<distro>\\...` |
| Env missing or invalid | `undefined` | `\\wsl.localhost\\WSL\\...` |
| No package path yet | n/a | keep existing loading / unavailable text |

---

## 7. Test plan

### 7.1 Adapters helper tests

Add or extend tests in `packages/adapters/src/browser-session.test.ts` to prove the exported helper still derives the distro name correctly.

Cases:

1. `SDA_WSL_DISTRO` wins over `WSL_DISTRO_NAME`.
2. `WSL_DISTRO_NAME` is used when `SDA_WSL_DISTRO` is absent.
3. Blank or invalid values are rejected.
4. Valid names pass through unchanged.

### 7.2 Renderer path-format tests

Update `apps/desktop/src/App.test.ts` so the release readiness handoff assertions do not depend on the hardcoded `Ubuntu-Compact` string.

Preferred assertions:

- the output still contains `\\wsl.localhost`
- the output uses a distro name provided by test env setup or a regex that accepts any valid distro segment
- the copy / summary text still renders correctly

### 7.3 Fallback test

Add one renderer-side test that clears both env vars and verifies the fallback path uses `WSL`.

### 7.4 Negative regression check

Confirm the clipboard-summary path no longer needs to strip a hardcoded `Ubuntu-Compact` prefix once the shared helper is in place.

---

## 8. Minimal implementation shape for BD3

BD3 should be a small surgical change:

1. Export `resolveWslDistroName()` from `packages/adapters/src/browser-session.ts`.
2. Re-export it from `packages/adapters/src/browser.ts`.
3. Import it in `apps/desktop/src/App.tsx`.
4. Replace the literal `Ubuntu-Compact` in `formatPackagePathForDisplay()`.
5. Remove the workaround `replace(/^\\\\wsl\.localhost\\\\Ubuntu-Compact/, "")` from the clipboard summary path.
6. Update tests to set or mock the distro env explicitly.

---

## 9. Acceptance criteria

This spec is complete when the downstream implementation can satisfy all of the following:

- the renderer no longer hardcodes `Ubuntu-Compact`
- the same shared helper is used for distro derivation
- the import path is `@servicenow-automation/adapters/browser`
- missing distro information produces a visible fallback (`WSL`)
- tests cover both the normal and fallback derivation paths
- no new IPC or external dependency is introduced

---

## 10. Implementation handoff for `sna-frontend-workbench`

- Use the existing adapters/browser entrypoint instead of adding a new bridge.
- Keep the change local to the path-formatting code and its tests.
- Treat `WSL` as the renderer fallback only; do not expand scope to broader path logic.
- Preserve current loading / unavailable messages exactly as they are.
- After implementation, run the usual local checks and verify the release readiness handoff still renders a valid UNC-style path.

---

## 11. Safety / privacy note

This change is local-only and does not touch ServiceNow, network writes, credentials, or any user data surfaces. It only changes how the desktop UI formats a displayed local package path.
