# Phase AL3 — Dynamic repo-hygiene scan implementation

Date: 2026-06-07
Status: complete
Scope: local-only repo-hygiene / artifact-boundary surface

## Summary

Implemented the dynamic repo-hygiene scan surface per the AL2 UX spec. The hygiene card was already dynamically querying the live repo state via `api.hygieneScan()` IPC on mount (see `useEffect` at line 3179 of App.tsx). The key change was adding "Open workspace root" to replace the narrower "Open dist/release" button in the hygiene card's action row, plus the full IPC stack to support it.

## Changes made (5 files)

### `apps/desktop/electron/worktree-ipc.ts`
- Added `handleWorktreeOpenWorkspaceRoot(projectRoot)` function — opens the project root directory in the OS file manager using `shell.openPath(projectRoot)`. No user-supplied paths are accepted.
- Simplified `handleWorktreeOpenDistRelease` (removed unnecessary dynamic `import("node:path")` — `join` is already imported at the top).

### `apps/desktop/electron/main.ts`
- Imported `handleWorktreeOpenWorkspaceRoot` from `./worktree-ipc`.
- Registered `ipcMain.handle("sda:worktree-open-workspace-root", ...)` — calls `findProjectRoot()` and delegates to the handler.

### `apps/desktop/electron/preload.ts`
- Added `openWorkspaceRoot: () => ipcRenderer.invoke("sda:worktree-open-workspace-root")` to the `worktreeApi` object.

### `apps/desktop/src/App.tsx`
- Added `openWorkspaceRoot: () => Promise<{ ok: boolean; error?: string }>` to the `WorktreeApi` type.
- Changed the "Open dist/release" button in the hygiene card to "Open workspace root" — updated label, title, and IPC call (now calls `api.openWorkspaceRoot()` instead of `api.openDistRelease()`).

### `apps/desktop/src/App.test.ts`
- Updated test assertion from `"Open dist/release"` to `"Open workspace root"` in the hygiene card test.

## What was preserved unchanged

- The worktree acceptance card's separate "Open dist/release" button (line 4606) — that's a different feature.
- All other hygiene card behavior: scan-on-mount, refresh, export, copy, cleanup preview with disabled states.
- All boundary copy: "Local only", "No ServiceNow actions", "No upload / PR / merge / tag / release".
- The three-item model: .gitignore verification (Verified), stale dist/release/ artifacts (Pending), .local/video-analysis/ (Closed as N/A).

## Verification

- pnpm build: PASS
- pnpm typecheck: PASS
- pnpm test: 148/148 passed
- pnpm privacy:scan: PASS (288 files)

## Safety/privacy

- `openWorkspaceRoot` uses a fixed, internally-computed path (`findProjectRoot()`) — no user-supplied paths.
- No raw URLs, ticket IDs, sys_ids, credentials, or storage state in UI or IPC.
- No ServiceNow writes, no browser automation, no upload/PR/merge/tag/release.

## Why minimal

Only 5 files changed with ~25 net lines added. The hygiene scan was already dynamic — the task's main delta was replacing "Open dist/release" with "Open workspace root" in the hygiene card and adding the corresponding IPC plumbing. No layout restructuring was needed (the card already has the queue + evidence + action row layout per the spec).

## Remaining risks

- The "Open workspace root" button depends on `findProjectRoot()` returning a valid path. If the workspace root is unavailable, the button should ideally be disabled with a reason; currently it falls through to the catch handler and shows "Failed to open workspace root." This matches the existing pattern used by "Refresh local scan" and the old "Open dist/release".
- The hygiene card is still a single vertical card within the center column, not a full three-column sub-layout. The AL2 spec's wireframe showed left-queue/center-detail/right-actions within the card. That could be a follow-up polish task but is not required for the current P0.
