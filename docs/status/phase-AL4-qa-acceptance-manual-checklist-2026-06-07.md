# Phase AL4 — QA Acceptance + Alan Manual Checklist

Date: 2026-06-07
Status: PASS

## Automated gates

| Gate | Result |
|---|---|
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test | PASS — 438/438 (148 desktop + 55 CLI + 95 adapters + 34 AI + 17 profiles + 6 KB + 83 core) |
| pnpm privacy:scan | PASS — 288 files |

## Acceptance criteria — code review results

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `.gitignore` verification renders as **Verified** | PASS | `<span class="repo-hygiene-state-chip verified">Verified</span>` at App.tsx:4284 |
| 2 | Stale `dist/release/` artifacts render as **Pending** local cleanup candidate | PASS | `<span class="repo-hygiene-state-chip pending">Pending</span>` at App.tsx:4299; details show stale file count & size |
| 3 | `.local/video-analysis/` renders as **Closed as N/A**, local-only / gitignored | PASS | `<span class="repo-hygiene-state-chip closed">Closed as N/A</span>` at App.tsx:4314; videoAnalysisDetails says "Directory does not exist; the backlog item is closed as N/A" or "Directory exists but is local-only / gitignored." |
| 4a | **Refresh local scan** button present and re-triggers `api.hygieneScan()` | PASS | Button at App.tsx:4371; handler at 4349-4369 re-calls `api.hygieneScan()` and updates state |
| 4b | **Open workspace root** button present (replaced old "Open dist/release" in hygiene card) | PASS | Button at App.tsx:4390; title "Open workspace root in file manager"; IPC via `sda:worktree-open-workspace-root` → `handleWorktreeOpenWorkspaceRoot()` which calls `shell.openPath(projectRoot)` with a fixed internally-computed path |
| 4c | **Export status markdown** button present | PASS | Button at App.tsx:4417; builds a full markdown summary of all 3 items and copies to clipboard via `navigator.clipboard.writeText()` |
| 4d | **Copy selected summary** button present | PASS | Button at App.tsx:4434; copies only the currently selected item's summary |
| 4e | **Cleanup preview** button present, correctly disabled for non-stale items with clear reason | PASS | Button at App.tsx:4457; `disabled={selectedHygieneItem !== 1 || hygieneScanResult.staleArtifactCount <= 0}`; title "No cleanup is needed for a verified item." / "This item is closed as N/A." / "No cleanup candidate selected." / "Preview cleanup for stale dist/release/ artifacts" |
| 5 | Panel stays **local-only**, no ServiceNow writes or release action implied | PASS | Eyebrow: "Local only · No ServiceNow actions · No upload / PR / merge / tag / release" (line 4263); footer: `<span class="repo-hygiene-boundary-chip">Local only</span>` + "This surface only reports local repository state. No live ServiceNow action is performed here." (lines 4461-4462) |

## Alan manual checklist — Windows local validation

### Prerequisites
- App is running on Windows (built Electron app or `pnpm dev`)
- Workspace branch: `next/post-release-operator-cockpit-ab-20260606`

### Step-by-step checks

#### 1. Locate the hygiene card
Look for the card titled **"Local Repo Hygiene + Artifact Boundary"** in the center column. It should appear between the release-readiness handoff card (top) and the worktree acceptance checkpoint card (below).

**What you should see:**
- Eyebrow bar: `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- Three selectable queue items:
  1. **.gitignore verification** — chip shows **Verified**
  2. **Stale dist/release/ artifacts** — chip shows **Pending**
  3. **.local/video-analysis/** — chip shows **Closed as N/A**
- An "evidence" section below the queue showing "Selected: **Verified** / **Pending** / **Closed as N/A**"
- A "Show evidence" detail expander under the evidence summary
- An actions row labeled **"Local actions:"** with 5 buttons
- A footer with `Local only` chip and explanatory text

#### 2. Verify the queue items
- Click on **.gitignore verification** — the evidence summary should show the gitignore coverage confirmation text
- Click on **Stale dist/release/ artifacts** — evidence shows stale file count, size, and a note that after cleanup only canonical + latest remain
- Click on **.local/video-analysis/** — evidence shows "Directory does not exist" or "Directory exists but is local-only / gitignored"

#### 3. Test "Refresh local scan"
- Click **Refresh local scan**
- The scan should re-run and update the queue with fresh results
- If no stale files changed, the output should remain the same
- If the workspace state changed (e.g., you deleted a stale file), the counts update

#### 4. Test "Open workspace root"
- Click **Open workspace root**
- This should open the project root directory in Windows File Explorer (or your default file manager)
- This replaces the old "Open dist/release" in the hygiene card (note: "Open dist/release" still exists in the worktree acceptance card — that's different and expected)

#### 5. Test "Export status markdown"
- Click **Export status markdown**
- This copies a full markdown summary to your clipboard
- Paste somewhere and verify it contains:
  - `.gitignore verification` section with status and details
  - `Stale dist/release/ artifacts` section with file count/size
  - `.local/video-analysis/` section with Closed as N/A status
  - Footer: `*Local only · No ServiceNow actions · No upload / PR / merge / tag / release*`

#### 6. Test "Copy selected summary"
- Select a different queue item (e.g., .local/video-analysis/)
- Click **Copy selected summary**
- Paste and verify only that item's summary was copied (not the full export)

#### 7. Test "Cleanup preview" — disabled states
- Select **.gitignore verification** (Verified): the Cleanup preview button should be **disabled** with tooltip "No cleanup is needed for a verified item."
- Select **.local/video-analysis/** (Closed as N/A): the Cleanup preview button should be **disabled** with tooltip "This item is closed as N/A."
- Select **Stale dist/release/ artifacts** (Pending): if there are stale files, the button should be **enabled** with tooltip "Preview cleanup for stale dist/release/ artifacts". Click it to copy a preview string.

#### 8. Verify the local-only boundary
- **No button** in the hygiene card performs a ServiceNow write, upload, PR, merge, tag, or release
- All actions are local-only: file open, clipboard copy, IPC re-scan
- The footer text explicitly states: "This surface only reports local repository state. No live ServiceNow action is performed here."

#### 9. Verify no sensitive data leak
- Search the card text for any raw ServiceNow URL, ticket ID, sys_id, credential, or session — there should be none
- The scan only reads `.gitignore`, `dist/release/`, and `.local/video-analysis/` — all local filesystem paths

### What to ignore / N/A
- **"Open dist/release"** in the worktree acceptance card (below the hygiene card) — this is a separate feature for the packaging workflow
- The **worktree acceptance card** itself — its behavior was validated in earlier phases (AI7). This checklist is only for the hygiene card.
- Any ServiceNow login browser interaction — the hygiene card never touches ServiceNow

### Expected scan output (typical)
```
.gitignore verification → Verified:
  "codegraph/ and worktrees/ gitignore coverage confirmed. Remediation is complete."

Stale dist/release/ artifacts → Pending:
  "Stale ab, ad, ae build artifacts remain. 3 files, 42 MB" (exact numbers vary)

.local/video-analysis/ → Closed as N/A:
  "Directory does not exist; the backlog item is closed as N/A."
```

## Safety/privacy review

| Check | Status |
|---|---|
| No ServiceNow writes | PASS — hygiene card has no write IPC handlers |
| No raw ServiceNow URL/ticket/fingerprint/credential/session | PASS — scan reads local filesystem only |
| No user-supplied paths in IPC | PASS — `openWorkspaceRoot` uses `findProjectRoot()` (fixed internal path) |
| All action buttons are local-only | PASS — file open, clipboard copy, re-scan only |
| Disabled states include clear reason | PASS — each disabled Cleanup preview state has an explanatory tooltip |

## Verdict

**PASS** — all 5 acceptance criteria verified, all 4 automated gates pass, code review confirms correct wiring and safety boundaries.
