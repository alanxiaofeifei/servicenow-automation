# Phase AM5 — Privacy/Security Audit for Stale dist/release Cleanup Workflow

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-privacy-security`
**Task:** `t_abf62bef`

---

## VERDICT: APPROVE

No blocking privacy or security issues found. All changes are local-only with explicit safety boundaries.

---

## 1. Gate Results

| Gate | Result | Evidence |
|---|---|---|
| `pnpm build` | PASS | 7 of 8 workspace projects built; desktop: main 306 kB, preload 1.63 kB, renderer 145.99 kB CSS + 1,099.35 kB JS |
| `pnpm typecheck` | PASS | All 7 workspace packages typechecked clean |
| `pnpm test` | PASS | 440 total tests: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 150 |
| `pnpm privacy:scan` | PASS | TRACKED_PRIVACY_SCAN_PASS files=288 |

---

## 2. Files Audited

### Modified files

| File | Change size | Audit result |
|---|---|---|
| `.gitignore` | +1 line | CLEAN — added comment documenting `.local/video-analysis/` gitignore coverage |
| `apps/desktop/electron/main.ts` | +76 lines | CLEAN — 8 new IPC handlers; all use `findProjectRoot()`, no user-supplied paths |
| `apps/desktop/electron/preload.ts` | +24 lines | CLEAN — exposes `worktreeApi` via `contextBridge`; standard Electron pattern |
| `apps/desktop/src/App.tsx` | ~855 lines | CLEAN — repo hygiene card, worktree acceptance checkpoint, cleanup workflow; all copy is local-only with explicit safety boundaries |
| `apps/desktop/src/App.test.ts` | +215/-2 lines | CLEAN — privacy improvement: removed 2 lines containing `\\wsl.localhost` and a SHA256 hash from test assertions; new tests use only fake/mock data |
| `apps/desktop/src/styles.css` | +685 lines | CLEAN — CSS only; no URLs, no sensitive patterns |

### New files

| File | Contents | Audit result |
|---|---|---|
| `apps/desktop/electron/worktree-ipc.ts` | 451 lines — 8 IPC handler functions for worktree operations | CLEAN — all paths constructed from `projectRoot`; home directory sanitization in git diff; no user-supplied paths; no ServiceNow data; archive demotion uses `renameSync` (not deletion) |
| `apps/desktop/electron/worktree-ipc.test.ts` | 310 lines — unit tests for worktree IPC | CLEAN — mock paths only (`/home/user/projects/test-repo`); no real data |
| `scripts/hygiene/cleanup-stale-artifacts.sh` | 129 lines — shell script for archive demotion | CLEAN — uses `mv` (rename, not delete); all paths derived from script location; `--dry-run` mode; canonical zip + newest kept; stale moved to `dist/.release-archive/` |
| `docs/status/phase-AM1*.md` through `docs/status/phase-AM7*.md` | 7 docs | CLEAN — all docs declare explicit local-only boundaries; no ServiceNow URLs, ticket IDs, sys_ids, credentials, or real field values |

---

## 3. Sensitive Pattern Scans

| Scan target | Files searched | Result |
|---|---|---|
| Real ServiceNow hosts (`.service-now.com`, etc.) | All changed `.ts`, `.tsx`, `.md`, `.css`, `.sh` | Only found in deny-path test: `expect(report).not.toContain(".service-now.com")` |
| Ticket IDs, sys_ids | All changed `.ts`, `.tsx`, `.md` | Only found in safety copy and deny-path assertions: `not.toContain("sys_id")` |
| Cookies, sessions, credentials, secrets | All changed `.ts`, `.tsx`, `.md` | Zero matches |
| Sensitive URLs in CSS | `styles.css` diff | Zero matches |

---

## 4. Privacy-Positive Changes

1. **Removed `\\wsl.localhost` from test assertions** — App.test.ts lines that asserted WSL UNC path and SHA256 hash were removed, reducing local environment fingerprint exposure in test output.

2. **Explicit safety boundaries in all new UI copy** — Every new card and dialog includes:
   - "Local only" chip
   - "No ServiceNow actions"
   - "No upload / PR / merge / tag / release"
   - "This surface only reports local repository state"
   - "Acceptance is a human decision"

3. **Archive demotion uses rename, not deletion** — `handleCleanupExecute` and `cleanup-stale-artifacts.sh` both use `mv`/`renameSync` on the same filesystem. No data is deleted; stale artifacts are preserved in `dist/.release-archive/`.

4. **No user-supplied paths** — All 8 IPC handlers (`worktree-git-diff`, `worktree-open-dist-release`, `worktree-open-workspace-root`, `worktree-status`, `worktree-package-metadata`, `hygiene-scan`, `cleanup-preview`, `cleanup-execute`) construct paths exclusively from `findProjectRoot()`. The renderer cannot inject paths.

5. **Home directory sanitization** — `handleWorktreeGitDiff` sanitizes the user's home directory from git diff output before returning it to the renderer.

6. **Disabled buttons explain why** — All disabled action buttons (e.g., "Cleanup preview" on Verified items, "Archive demotion" on N/A items) include `title` attributes explaining why they are unavailable. No silent failures.

---

## 5. Non-Blocking Observations

1. **`linuxToWslUncPath` generates WSL UNC paths** — The `App.tsx` function converts Linux paths to `\\wsl.localhost\Ubuntu-Compact\...` format for the "Copy package path" feature. This is a standard WSL local networking convention, not a routable URL or credential. It is the same convention as the WSL `\\wsl.localhost` path that Windows itself uses for filesystem access to WSL distros.

2. **AM1 scope doc contains WSL UNC path in status footer** — Line 412 of `phase-AM1-...md` includes the WSL UNC path as a reference for the operator. This is local-only metadata documenting the package location.

3. **AM7 doc contains local filesystem path** — Line 70 references `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`. This is a standard local filesystem path, not a credential or confidential host.

None of these are blocking — they are all local-only references within the scope of the worktree documentation.

---

## 6. Red-Zone Compliance

| Prohibition | Status |
|---|---|
| No real ServiceNow login/browsing/API write | CONFIRMED — zero instances |
| No Save / Submit / Update / Resolve / Close | CONFIRMED — no automation of write actions |
| No attachment upload | CONFIRMED |
| No Microsoft Graph / Excel Web writes | CONFIRMED |
| No real Teams/Outlook/phone ingestion | CONFIRMED |
| No secrets, cookies, storage state, HAR, trace, screenshots | CONFIRMED — zero instances in all changed files |
| No real URLs, ticket IDs, sys_ids, requester names, assignment groups | CONFIRMED — only deny-path tests and safety copy found |
| No push, PR, merge, tag, GitHub Release | CONFIRMED — worktree is dirty, nothing pushed |
| No recursive cron job creation/modification | CONFIRMED |

---

## 7. Remaining Risks

- **None.** The cleanup workflow is purely local: it reads local repo state, displays it in the desktop app, and (when the user confirms) renames local files within the same filesystem. No network, no ServiceNow, no release operations are involved.

---

## 8. Suggested Next Task

`AM6` — Windows local package refresh: rebuild a fresh AM-dated Windows package after the cleanup workflow changes, verify checksum and freshness, and place it in `dist/release/` for the AM7 final gate.

---

*This audit was conducted on the local worktree only. No external AI review, remote API call, or cloud service was used. All evidence is sanitized.*
