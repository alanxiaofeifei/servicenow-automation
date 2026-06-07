# Phase BC4 — QA acceptance: checklist launcher and runbook refresh

**Date:** 2026-06-07
**Tester:** sna-qa-acceptance
**Verdict:** PASS

---

## Acceptance summary

The BC3 implementation (parent `t_f8e40c32`) is verified in the current working tree of the servicenow-automation project. All acceptance criteria are met.

## Automated gates

| Gate | Result | Details |
|------|--------|---------|
| `pnpm build` | **PASS** | apps/desktop build: Done (496ms main, 13ms preload, 938ms renderer) |
| `pnpm typecheck` | **PASS** | All 7 packages typecheck: Done |
| `pnpm test` (desktop) | **PASS** | 9 test files, 165 tests passed (165) |
| `pnpm test` (all) | **PASS** | 11 test files, 220 tests passed across desktop + CLI |
| `pnpm privacy:scan` | **PASS** | 288 files scanned, TRACKED_PRIVACY_SCAN_PASS |

## Manual acceptance checks

### 1. "Open checklist" button is enabled and wired

**Evidence (App.tsx lines 4311–4317):**
```tsx
<button type="button" className="local-draft-button" onClick={() => {
  const api = getWorktreeApi();
  if (api) void api.openFile('docs/test/windows-clean-machine-validation-2026-06-07.md');
}}>
  Open checklist
</button>
```

- **No `disabled` attribute** — button is unconditionally enabled.
- **`onClick` handler** calls `getWorktreeApi().openFile()` with the correct runbook path.

**IPC chain (complete, 3 layers):**

| Layer | File | Code |
|-------|------|------|
| Renderer | `App.tsx` | `api.openFile('docs/test/windows-clean-machine-validation-2026-06-07.md')` |
| Preload bridge | `preload.ts` (line 21) | `openFile: (relativePath) => ipcRenderer.invoke("sda:worktree-open-file", relativePath)` |
| Main process | `main.ts` (line 303) | `ipcMain.handle("sda:worktree-open-file", ...)` → `handleWorktreeOpenFile(projectRoot, relativePath)` |
| Handler | `worktree-ipc.ts` | `shell.openPath(fullPath)` via `handleWorktreeOpenFile` |

### 2. Runbook shows current BC6 package (not ay6)

**Evidence (runbook header):**
```text
Package: servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```
**UNC path in runbook:**
```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```

File: `docs/test/windows-clean-machine-validation-2026-06-07.md` — all references use `bc6`.

### 3. Manual checklist is scannable and sanitized

**Scannable** — Clear section heading `"Manual checklist"` with numbered steps (lines 4319–4327):

```html
<div className="handoff-manual-checklist">
  <h3 className="handoff-checklist-title">Manual checklist</h3>
  <ol className="handoff-checklist-list">
    <li>Open the current package file listed above.</li>
    <li>Double-click the packaged Windows app to verify it launches.</li>
    <li>Run the Start QA Chromium readiness step from the runtime actions rail.</li>
    <li>Wait for CDP to show connected before considering Verify.</li>
    <li>If anything is stale, unavailable, or ambiguous, stop and check the package metadata.</li>
  </ol>
</div>
```

**Sanitized** — No raw sys_ids, real ServiceNow URLs, credentials, ticket IDs, or sensitive data in any changed file.

### 4. Three-column layout preserved

Layout structure intact:
- `workbench-icon-rail` — left navigation rail
- `workbench-sidebar` (id="left-workbench-sidebar") — left sidebar
- `workbench-center` — center work product area (release card, hygiene card, runtime panel)
- `target-runtime-panel` / `QaOperatorRuntimePanel` — runtime actions and status

### 5. Safety copy preserved

All `safetyBoundaryTitle`, `safetyNote`, `safetyNotes` entries remain unchanged across all 4 locales (English, Simplified Chinese, Traditional Chinese, Spanish).

### 6. No ServiceNow write, login, or attachment upload

All changed files operate on local file system only:
- `worktree-ipc.ts` — `shell.openPath()`, `execFileSync()`, `readdirSync()`, `statSync()`, `readFileSync()`
- No HTTP/network calls
- No ServiceNow API tokens or credentials
- No browser automation (CDP is in separate existing files)

## Changed files (from parent BC3 implementation)

| File | Change |
|------|--------|
| `apps/desktop/src/App.tsx` | Enabled "Open checklist" button, wired to `openFile`, exported interfaces |
| `apps/desktop/electron/worktree-ipc.ts` | Added `handleWorktreeOpenFile` handler |
| `apps/desktop/electron/preload.ts` | Added `openFile` IPC bridge |
| `apps/desktop/electron/main.ts` | Registered `sda:worktree-open-file` IPC handler |
| `apps/desktop/src/App.test.ts` | Test coverage for button wiring |
| `apps/desktop/electron/worktree-ipc.test.ts` | 39 tests for worktree IPC handlers |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Package references updated ay6→bc6 |

## Commands run for verification

```bash
cd /home/alanxwsl/projects/servicenow-automation
pnpm build
pnpm typecheck
pnpm vitest run   # apps/desktop — 165 tests pass
pnpm test         # all packages — 220+ tests pass
pnpm privacy:scan
```

## Evidence artifacts

- Git status shows all BC3 changes as uncommitted (modified/new)
- `worktree-ipc.ts` (new file, ~370 lines) with `handleWorktreeOpenFile`
- `worktree-ipc.test.ts` (new file, 39 tests)
- Button in `App.tsx` has `onClick` handler with `openFile('docs/test/windows-clean-machine-validation-2026-06-07.md')`
- Runbook header shows `bc6` package reference

---

**Verdict: PASS** — All acceptance criteria satisfied.
