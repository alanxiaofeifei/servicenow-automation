# Phase BM3 — Post-public-release verification and Telegram handoff

Date: 2026-06-08 00:55 CST (+0800)
Task: BM3 — verify published GitHub public release, document findings, prepare handoff for Alan
Workspace: `/home/alanxwsl/projects/servicenow-automation`
Predecessor: BM2 (`t_244b58c0`)

## BM2 handoff summary

BM2 reported:
- PR #141 merged to `main` at `4626cf41b2e20ae91c11e0a4add2989726b8386d`
- Annotated tag `v0.1.0` pushed (tag object `ea57d37f4dfea7881c9cb5db471e2ff927080a31`)
- GitHub Release created as non-draft, non-prerelease with two upload assets
- BM2 status doc merged to `main` via PR #142

## BM3 verification

### PR and merge status

| Check | Result |
|---|---|
| `gh pr view 141` | MERGED at 2026-06-07T16:39:18Z |
| Merge commit | `4626cf41b2e20ae91c11e0a4add2989726b8386d` |
| PR URL | [redacted; verified via `gh pr view 141`] |
| `gh pr view 142` (BM2 doc) | MERGED at 2026-06-07T16:43:02Z |
| origin/main HEAD | `7bcd17c` — merge of PR #142 |
| BM2 status doc on origin/main | `docs/status/phase-BM2-github-public-release-publication-2026-06-07.md` — present |

### Release asset verification

| Check | Result |
|---|---|
| `gh release view v0.1.0` | non-draft, non-prerelease, published 2026-06-07T16:40:45Z |
| Release title | `ServiceNow Automation v0.1.0 — Windows Operator Preview` |
| ZIP asset name | `servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| ZIP asset size | 118,610,088 bytes |
| ZIP SHA256 (sidecar) | `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692` |
| Sidecar asset name | `servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256` |
| Sidecar file content | `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692  servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| `gh release download` | PASS — both assets downloaded successfully |
| `sha256sum -c` | PASS — checksum matches downloaded ZIP |
| Download count | **0 downloads** (no one has downloaded the release assets yet) |

### CRITICAL FINDING — Repository is PRIVATE, not public

The repository `alanxiaofeifei/servicenow-automation` is **PRIVATE** (`isPrivate: true`, `visibility: PRIVATE`).

**Impact:**
- The GitHub Release page returns **HTTP 404 for unauthenticated users** when accessed without authentication.
- The release assets are ONLY accessible to GitHub users who have been granted access to the private repo.
- The release is technically a "release on a private repo" — not a truly public release.
- The term "public release" in BM2 and earlier docs is misleading given the repo's visibility setting.

**Evidence:**
- `curl -sI` to the release page returns HTTP 404 without authentication
- `curl -sI` to the repo page returns HTTP 404 without authentication
- `gh repo view` confirms `isPrivate: true, visibility: PRIVATE`
- SSH git operations work fine (authenticated access)

### Repo-level status

| Check | Result |
|---|---|
| Repo visibility | PRIVATE |
| origin/main docs | All release/phase docs present including BM2 status doc |
| Release tag v0.1.0 on origin | Confirmed via `git ls-remote --tags` |
| Release body | Present with release notes, quick start, safety boundary |
| Status doc PR | Merged, present on origin/main |

## Screenshot-based UI content quality assessment

Two screenshots from the current packaged application were reviewed as part of BM3 context. These are NOT part of BM3's delivery scope (the task states "No further code changes unless BM2 explicitly asks") but the findings are noted here for Alan's awareness:

1. **Repo visibility**: The "public release" title is inaccurate — the repo is private
2. **UI content issues documented in earlier tasks remain visible** (see body of this task for the full list of 10 findings shared by Alan in the task)
3. **No code or UI changes were made in BM3** per task scope

## Safety boundary

No real ServiceNow login, browser operation, ServiceNow API write, Microsoft Graph/Excel Web write, attachment upload, Teams/Outlook/phone ingestion, or Save / Submit / Update / Resolve / Close automation was performed in BM3.

No real customer/ticket/browser/session data was added to this document.

## BM4 remediation note

BM4 subsequently remediated the repository visibility mismatch: the repository is now PUBLIC, anonymous access to the release page returns HTTP 200, both release assets return HTTP 200 anonymously, and checksum verification against the anonymous ZIP download passes.

See `docs/status/phase-BM4-public-release-visibility-remediation-2026-06-08.md` for the focused remediation and verification record.

## Summary and handoff for Alan

### What was verified

1. PR #141 is merged to `main` ✓
2. PR #142 (BM2 doc) is merged to `main` ✓
3. Release `v0.1.0` exists as a GitHub Release (non-draft, non-prerelease) ✓
4. Both release assets (ZIP + SHA256) exist, download, and checksum verification passes ✓
5. Release body contains correct release notes ✓
6. **Repository is PRIVATE — release assets are NOT publicly accessible** ✗

### What needs Alan's decision

1. **Repo visibility**: Do you want to make the repo public so the release is truly public? If so, run `gh repo edit alanxiaofeifei/servicenow-automation --visibility public`.
2. **UI content quality**: The screenshots you shared show the remaining UI/content issues from your BJ6 feedback. These were not addressed in the BM series (BM1/BM2 were scope-limited to release publication). A follow-up phase (BN/BO/BP) would be needed for those fixes.
3. **Clean-machine validation**: The release has 0 downloads — no one has tested the packaged app on a clean Windows machine. You'll need to do that manually (download the ZIP from the private repo, verify the checksum, extract, and double-click).

## Next recommended PR work

| Priority | Scope | Notes |
|---|---|---|
| P0 | Address repo PRIVATE status | Either make repo public or correct docs to say "private release" |
| P0 | Clean-machine Windows validation | Download from private repo, verify SHA256, double-click launch |
| P1 | Address BJ6 UI/content issues from screenshots | 10 issues documented in task body |
| P2 | Tag as v0.1.1 or next release after fixes | Subsequent version after addressing above |

## Asset references (authenticated access only — redacted)

- Release: [redacted; see `gh release view v0.1.0`]
- ZIP: [redacted; asset name `servicenow-automation-windows-v0.1.0-public-20260607.zip`]
- SHA256: [redacted; sidecar file `.sha256`]
