# Phase AL5 — Privacy/Security Audit for Repo Hygiene Polish

**Date:** 2026-06-07
**Auditor:** sna-privacy-security
**Parent:** AL3 (dynamic repo-hygiene scan implementation — t_916238e0)
**Verdict:** APPROVE

---

## Gate Results

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (439 total: 83 core + 34 ai + 6 kb + 17 profiles + 95 adapters + 55 cli + 148 desktop) |
| `pnpm privacy:scan` | PASS (288 tracked files) |

---

## Audit Items

### 1. .gitignore verification — PASS

- `.local/`, `.local*/`, `**/.local/`, `**/.local*/` patterns (lines 14-17) comprehensively cover all local runtime directories including `.local/video-analysis/`.
- Comment on line 18 (`# .local/video-analysis/ — local-only workflow artifacts (gitignored)`) is documentation only — does not weaken gitignore coverage.
- `.codegraph/` and `.worktrees/` are gitignored (lines 19-20).
- Secrets/browser artifact patterns present: `.env`, `*.har`, `*.session.json`, `storage-state*.json`, `.pem`, `.key`, `.pfx`, browser-profiles, screenshots, traces.
- No sensitive paths or URLs in gitignore.

### 2. Stale dist/release/ artifacts — PASS

- `handleHygieneScan()` (worktree-ipc.ts:189-224) scans `dist/release/` for `.zip` files, sorts by mtime, and flags all but the newest as stale.
- Filenames follow pattern `servicenow-automation-windows-v0.1.0-rc.1-{phase}-{date}-local.zip` — pure build artifact names; no secrets, URLs, ticket IDs, sys_ids, credentials.
- UI displays count and total size only; individual filenames appear in `staleArtifactDetails` but these are safe build labels.
- Cleanup preview (App.tsx:4449-4457) is read-only clipboard copy — no file deletion occurs.
- No raw paths exposed beyond `dist/release/` directory name.

### 3. .local/video-analysis/ — PASS

- `handleHygieneScan()` (worktree-ipc.ts:226-231) checks existence only via `existsSync()`.
- Returns sanitized messages only:
  - Exists → "Directory exists but is local-only / gitignored."
  - Absent → "Directory does not exist; the backlog item is closed as N/A."
- No directory contents, file listings, paths, sizes, or metadata exposed.
- UI state chip: "Closed as N/A" — correct and non-leaking.

### 4. Export status markdown — PASS

- App.tsx:4396-4413 constructs markdown from sanitized scan results only:
  - Status labels: "Verified", "Pending", "Clean", "Closed as N/A"
  - Pre-computed detail strings from backend (gitignoreDetails, staleArtifactDetails, videoAnalysisDetails)
  - Footer: `*Local only · No ServiceNow actions · No upload / PR / merge / tag / release*`
- No raw URLs, ticket IDs, sys_ids, file paths, credentials, or session data.

### 5. Boundary copy — PASS

Multiple layers of boundary disclaimers verified:
- Card eyebrow: "Local only · No ServiceNow actions · No upload / PR / merge / tag / release"
- Card title: "Local Repo Hygiene + Artifact Boundary"
- Export footer disclaimers (see item 4)
- Handoff card: "No live ServiceNow login", "No Save / Submit / Update / Resolve / Close", "Human-only boundaries"
- Worktree acceptance: "Local only · No live ServiceNow action, upload, PR, merge, tag, or release is implied"
- Hygiene evidence section: "This surface only reports local repository state"

### 6. No live ServiceNow actions — PASS

All AL3 operations are local-filesystem-only:
- `handleWorktreeGitDiff` — runs `git diff --stat HEAD`, sanitizes home dir
- `handleWorktreeOpenDistRelease` — `shell.openPath()` to file manager
- `handleWorktreeOpenWorkspaceRoot` — `shell.openPath()` to file manager
- `handleWorktreeStatus` — runs `git status --porcelain`
- `handleWorktreePackageMetadata` — reads filesystem metadata + SHA256
- `handleHygieneScan` — reads `.gitignore` content, directory listing, file existence

No ServiceNow API calls, browser automation, form submission, Save/Submit/Update/Resolve/Close actions.

### 7. Untracked files check — PASS

Untracked files from AL3 (will become tracked on commit):
- `apps/desktop/electron/worktree-ipc.ts` — reviewed in full; no sensitive data
- `apps/desktop/electron/worktree-ipc.test.ts` — no sensitive patterns
- `.todo-ag1-check-gitignore.sh` — no sensitive patterns
- AG/AH/AL-series docs — no URLs, credentials, or sensitive metadata found

### 8. Home directory sanitization — PASS

`handleWorktreeGitDiff` (worktree-ipc.ts:23-26) replaces `$HOME` with `~` in git diff output before returning to renderer. No raw home directory paths leak.

---

## Non-Blocking Observations

1. **Filenames in stale artifact details**: While build artifact filenames are not sensitive, if the naming convention ever changes to include customer names or environment identifiers, this would need revisiting. Current pattern is safe.

2. **Export is clipboard-only**: The "Export status markdown" button writes to clipboard rather than a file. This is safer (no file-system export path) but the user should be aware the content is only as sanitized as the scan results.

---

## Summary

All 4 gates pass. All 8 audit items pass. No blocking privacy or security issues. The AL3 repo-hygiene changes are local-only, read-only, and properly bounded with disclaimers. No sensitive data leaks in scan results, UI copy, exported markdown, or untracked files.
