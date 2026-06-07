# Phase BM1 — Public release notes and PR/GitHub Release body

Date: 2026-06-08 CST
Task: BM1 — public release notes and PR/GitHub Release body
Workspace: `/home/alanxwsl/projects/servicenow-automation`
Branch: `next/post-release-operator-cockpit-ab-20260606`
Commit: `023ca00 BL6 final local public candidate gate`

## Gate status

NOT MERGE-READY — GitHub writes are not authorized in BM1.
This document contains the draft PR body and GitHub Release body for human review.

## Inputs

BL6 final gate result: READY FOR ALAN MANUAL VALIDATION ONLY
BL5 package facts:
  - Package: `servicenow-automation-windows-v0.1.0-public-20260607.zip`
  - SHA256: `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692`
  - Size: 118,610,088 bytes
  - ZIP entries: 87, integrity PASS
  - Phase: PUBLIC
  - Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-public-20260607.zip`
  - Current marker: `CURRENT=servicenow-automation-windows-v0.1.0-public-20260607.zip`
  - Automated gates: build PASS, typecheck PASS, 335 tests PASS, privacy:scan PASS (513 files)

Screenshot visual findings from BJ6 (incorporated into BL1–BL5 fixes):
  - Sidebar/source panel repetition fixed
  - Release/checklist area overcrowding resolved (three-column grid, collapsible details)
  - Status/text conflicts resolved
  - Copy/content improvements (removed "Alan should test this file first", "SOURCE OF TRUTH", "No archives aliases")
  - Chinese localization added for primary workbench labels
  - Workflow order: Selected source detail → Cleaned summary → Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue

## Deliverable 1: Updated release notes file

Path: `docs/releases/windows-v0.1.0-public-release-notes.md`

Follows the existing release-notes convention at `docs/releases/windows-v0.1-rc-draft-release-notes.md`.

Covers:
- Artifact metadata (name, SHA256, size, format, integrity status)
- Gate status (READY FOR ALAN MANUAL VALIDATION ONLY)
- What's included in the package
- What's new (Three-Column Workbench, Release Readiness Handoff, PO Checklist, Repo Hygiene, Worktree Acceptance, KB Recommendations, Excel Queue, localized UI, reordered workbench)
- Manual validation checklist
- Safety boundary (forbidden vs safe operations)
- Known limitations

## Deliverable 2: GitHub PR body — v0.1.0 public release

When ready to create the PR (after Alan manual validation PASS), use this body:

---

### Title

`v0.1.0 public release — Windows Operator Preview`

### Body

```
## Summary

ServiceNow Automation v0.1.0 (public) is the first public preview of a Windows desktop
application for supervised local ServiceNow ticket-drafting assistance. This release focuses
on local/safe operation: the app drafts and fills allowed text fields only, and humans
review all content before any real ServiceNow submission.

## What's included in the release artifact

- Electron desktop app (`ServiceNow Automation.exe` + `resources/app.asar`)
- Windows double-click launcher and runtime repair helpers
- Dedicated Chromium-for-Testing browser runtime helper scripts
- SHA256 checksum sidecar for package verification
- START-HERE guide with safety instructions

## Key features

- **Three-Column Operator Workbench**: source inbox / center workflow / runtime actions
- **Release Readiness Handoff**: collapsible card with current package path, source-of-truth marker,
  manual validation checklist
- **PO Re-Acceptance Checklist**: 8 criteria covering app launch, diagnostics, Chromium startup,
  CDP readiness, Verify-only safety, layout stability, package path accuracy
- **Local Repo Hygiene + Archive Demotion**: scan stale release artifacts, preview cleanup, archive
  locally — no upload/PR/merge/tag/release
- **Worktree Acceptance**: review diffs, mark packages as reviewed, copy summary — all local
- **Local KB Recommendations**: match confidence, evidence keywords, sanitized excerpts
- **Monthly Excel Fill Queue**: placeholder UI with safety text — no live Excel integration
- **Simplified Chinese localization**: primary workbench labels and navigation
- **Reordered workbench**: Selected source → Cleaned summary → Incident draft → Guided demo path →
  KB recommendations → Excel fill queue

## Automated gates passed

| Gate | Result |
|---|---|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 335 tests |
| `pnpm privacy:scan` | PASS — 513 tracked files |

## Package verification

| Check | Result |
|---|---|
| SHA256 checksum | PASS — e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692 |
| ZIP integrity | PASS — 87 entries, no corruption |
| Forbidden release entries | PASS — 0 matches for .git, env files, cookies, storage-state, HAR, screenshots, traces, PEM/key material |
| Phase | PUBLIC |

## Manual validation (required before merging)

This artifact has passed all local automated gates but requires Alan manual validation
on a clean Windows machine before this PR can be merged:

1. Extract the ZIP on Windows.
2. Double-click `ServiceNow Automation.exe` — confirm it opens without crash.
3. Confirm the three-column layout is stable, no sidebar repetition bug.
4. Confirm primary center workflow order is correct.
5. Switch to Simplified Chinese and confirm localization.
6. Start QA Chromium, wait for CDP connected, use Verify-only mode.
7. Do not perform any live ServiceNow writes.

## Safety boundary

**What the app does:**
- Drafts and fills allowed text fields in a local read-only context
- All operations are local or mock — no real ServiceNow data is touched
- Humans review all drafted content before any real ServiceNow submission

**What the app never does:**
- automatic login to any ServiceNow instance
- Save / Submit / Update / Resolve / Close automation
- upload / email / bulk action
- ServiceNow API write
- production write or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- include raw ServiceNow URLs, ticket IDs, sys_ids, requester names,
  assignment groups, browser endpoints, page fingerprints, or real field values

## Known limitations

- Clean-machine (fresh Windows without WSL) double-click validation: NOT YET TESTED
- Live ServiceNow integration: NOT READY — supervised demo/local use only
- Cross-platform (macOS/Linux): NOT TESTED
- Auto-update mechanism: NOT IMPLEMENTED
- Inner package metadata SHA256 field: empty (external SHA256 sidecar is authoritative)
```

---

## Deliverable 3: GitHub Release body — v0.1.0 public release

When ready to create the GitHub Release (after PR merge), use this body:

---

### Release title

`ServiceNow Automation v0.1.0 — Windows Operator Preview`

### Tag

`v0.1.0-public`

### Type

Prerelease

### Body

```
# ServiceNow Automation v0.1.0 (Public Preview)

ServiceNow Automation v0.1.0 is a Windows desktop application for supervised local
ServiceNow ticket-drafting assistance. This is the first public preview release.

**The app drafts and fills allowed text fields only. Humans review all content
before any real ServiceNow submission. No live ServiceNow operations are performed.**

## Assets

- `servicenow-automation-windows-v0.1.0-public-20260607.zip`
- `servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256`

SHA256: `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692`
Size: 118,610,088 bytes | Format: Portable ZIP (no installer)

## Quick start

1. Download the ZIP and `.sha256` file.
2. Verify checksum: `sha256sum -c servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256`
3. Extract the ZIP on Windows.
4. Double-click `ServiceNow Automation.exe`.
5. Test mock workflows only — no real ServiceNow data.

## What's inside

- **Three-Column Operator Workbench** — source inbox, center workflow, runtime actions
- **PO Re-Acceptance Checklist** — 8 criteria for Windows launch, diagnostics, Chromium
  startup, CDP readiness, Verify-only safety, layout stability, package path accuracy
- **Local Repo Hygiene** — scan and archive stale release artifacts locally
- **Worktree Acceptance** — review diffs and mark packages as reviewed
- **Local KB Recommendations** — match confidence and evidence keywords
- **Simplified Chinese localization** for primary workbench labels
- **Reordered workbench flow** — Selected source → Cleaned summary → Incident draft →
  Guided demo path → KB recommendations → Excel fill queue

## Safety

This preview does not perform any live ServiceNow operations. All actions are local
or mock. Humans review every drafted field before real submission.

Forbidden:
- Save / Submit / Update / Resolve / Close automation
- ServiceNow API writes
- Production writes
- Real customer/ticket/browser data in any output

## Known limitations

- Clean-machine Windows validation: NOT YET TESTED
- Live ServiceNow integration: NOT READY
- macOS/Linux: NOT TESTED
- Auto-update: NOT IMPLEMENTED
```

---

## Safety and privacy

This BM1 task produces documents only. No GitHub write was performed. No real ServiceNow
data, ticket IDs, sys_ids, credentials, URLs, or customer information appears in any of
the drafted texts. All wording is public-facing and non-sensitive.

## Next recommended action

After Alan manual validation of the public package passes:
1. Create PR on `next/post-release-operator-cockpit-ab-20260606` → `main` using the
   PR body above.
2. After PR merge, create GitHub Release with tag `v0.1.0-public` using the Release
   body above.
3. Upload `servicenow-automation-windows-v0.1.0-public-20260607.zip` and `.sha256` as
   release assets.
4. Mark the release as Prerelease (not Production) pending clean-machine validation.
