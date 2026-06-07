# Phase BD4 — QA Acceptance + Alan Manual Checklist: Current Package UNC Prefix

**Date:** 2026-06-07
**Profile:** `sna-qa-acceptance`
**Task:** `t_0133e298`
**Board:** `servicenow-automation`
**Branch (main):** `next/post-release-operator-cockpit-ab-20260606`
**Parent:** BD3 implementation (`t_91fbe6ca`)

---

## Verdict

**PASS** ✅

All 4 automated gates pass. The renderer no longer hardcodes `Ubuntu-Compact`. The UNC path is derived dynamically from `SDA_WSL_DISTRO` or `WSL_DISTRO_NAME` env vars. No unsafe or live actions introduced.

---

## 1. Automated Gates

| Gate | Status | Details |
|------|--------|---------|
| `pnpm build` | ✅ PASS | All packages build clean |
| `pnpm typecheck` | ✅ PASS | All 7 workspace packages typecheck |
| `pnpm test` | ✅ PASS | 165 desktop + 52 adapters + 55 CLI = **272 tests pass** |
| `pnpm privacy:scan` | ✅ PASS | **288 files** pass |

**Commands run:**

```
cd /home/alanxwsl/projects/servicenow-automation
pnpm build       # 0 stderr, exit 0
pnpm typecheck   # all 7 projects pass, exit 0
pnpm test        # 272 tests pass (165 desktop, 52 adapters, 55 CLI), exit 0
pnpm privacy:scan # 288 files pass (python3 scripts/privacy_scan_tracked.py), exit 0
```

---

## 2. Manual Verification Checklist

### A. Automated path derivation (no hardcoded distro)

| Check | Result | Evidence |
|-------|--------|----------|
| No `Ubuntu-Compact` in renderer code | ✅ PASS | `grep -r "Ubuntu-Compact" apps/desktop/src/ packages/adapters/src/` → **no results** |
| `formatPackagePathForDisplay()` uses `resolveWslDistroName()` | ✅ PASS | `App.tsx` line 8560: `const distroName = resolveWslDistroName() ?? "WSL";` |
| `resolveWslDistroName()` reads env vars | ✅ PASS | `wsl-utils.ts`: `process.env.SDA_WSL_DISTRO ?? process.env.WSL_DISTRO_NAME` |
| Fallback is "WSL" when env vars absent | ✅ PASS | Line 8560: `?? "WSL"` |
| Regex validation of distro name | ✅ PASS | `/^[A-Za-z0-9_.-]+$/` — prevents injection in path display |
| Safe for browser/Electron renderer | ✅ PASS | No Node.js imports — only `process.env` access |

### B. The current package path on this machine

The actual WSL distro on this machine (`AlanASUS`) is **Ubuntu-Compact**:

```
$ wslpath -w /home/alanxwsl/projects/servicenow-automation/dist/release/
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...
```

The dynamic resolver derives the correct prefix at runtime:

- `resolveWslDistroName()` returns `"Ubuntu-Compact"` via `WSL_DISTRO_NAME` (set by WSL at session start)
- If env var is absent (e.g. test env), fallback `"WSL"` produces `\\wsl.localhost\WSL\...` — visibly synthetic

**Expected rendered path on this machine:**

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```

### C. Test assertions don't depend on personal distro name

| Test file | Assertion | Evidence |
|-----------|-----------|----------|
| `App.test.ts:1652` | `expect(output).toContain("\\\\wsl.localhost")` | ✅ Only checks UNC prefix, not the distro segment |
| `browser-session.test.ts:582-626` | Sets `SDA_WSL_DISTRO=Ubuntu-K9` and verifies UNC path | ✅ Uses synthetic test distro name, not personal value |

### D. No unsafe or live actions introduced

| Check | Result |
|-------|--------|
| New IPC bridge? | ❌ No — the derivation is pure env-based, no IPC change |
| New network/external writes? | ❌ No — only local path string formatting |
| New ServiceNow writes? | ❌ No |
| New cron jobs? | ❌ No |
| New file writes (outside formatting)? | ❌ No |
| Personal info in path logic? | ❌ No — only env var name patterns |

---

## 3. Current Package Baseline Under Test

**Package path (Linux):**
```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```

**Expected UNC display path:**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```

The `formatPackagePathForDisplay` wraps the IPC-provided path correctly with the dynamic distro prefix. The actual path comes from `worktreePackageMetadata()` IPC (main repo) rather than the stale `CURRENT_PACKAGE_RELATIVE_PATH` constant visible in the worktree branch. The worktree's `CURRENT_PACKAGE_RELATIVE_PATH` constant (`...-ae-...`) is outdated — the main repo has already replaced it with a live IPC metadata path.

---

## 4. Path Display / Copy Summary Behavior

| Behavior | Implementation | Status |
|----------|---------------|--------|
| Rendered `code` element | `formatPackagePathForDisplay(packageMetadata?.path, packageMetadata?.ok)` | ✅ Dynamic |
| Copy current package path | `clipboard.writeText(packageMetadata.path)` | ✅ Dynamic |
| Copy current package summary | Builds string from `packageMetadata.{filename, path, sha256, mtime, archivalAliases}` | ✅ Dynamic |
| Fallback display | "Current package path is unavailable." / "Current package path is still loading." | ✅ Clear |

No raw ServiceNow URL, ticket ID, sys_id, credential, session, or cookie appears in any path display logic.

---

## 5. Regression Notes

### Known: `CURRENT_PACKAGE_RELATIVE_PATH` stale on worktree branch

The worktree branch `wt/bd3-current-package-unc-prefix-20260607` still has an older `App.tsx` (8012 lines) with a hardcoded `CURRENT_PACKAGE_RELATIVE_PATH` pointing to `...-ae-...` instead of `...-bc6-...`. The main repo (8635 lines) has superseded this with a full Worktree Acceptance section that reads the package path live via IPC. This is **not a regression** — the worktree branch is a snapshot; the main branch has the correct, dynamic implementation.

### What to watch for

- If `WSL_DISTRO_NAME` or `SDA_WSL_DISTRO` is unset in the Electron renderer context, the display fallback is `WSL` — visibly synthetic but safe.
- The `formatPackagePathForDisplay` function and the new `resolveWslDistroName` in `wsl-utils.ts` are both pure env-isolated functions — no surprising cross-contamination.

### Handoff to next task

No follow-up work recommended. The UNC prefix derivation is complete and tested.

---

## 6. Complete Manual Checklist for Alan

Follow this order on Windows:

1. **Open the current package** from the Worktree Acceptance section
2. **Verify the package path** displays as the expected UNC path (see §3 above)
3. **Click "Copy current package path"** and paste into Notepad — verify it matches `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...\bc6-20260607-local.zip`
4. **Click "Copy current package summary"** and paste — verify it includes filename, SHA256, mtime, and archival aliases
5. **Verify "Current package path is unavailable."** appears when the package metadata fails to load
6. **Run `pnpm test`** to confirm 272+ tests pass
7. **Run `pnpm privacy:scan`** to confirm 288+ files pass
8. **No ServiceNow login, browser automation, API writes, or real ticket data** — keep everything local
9. **No Save/Submit/Update/Resolve/Close** buttons touched
