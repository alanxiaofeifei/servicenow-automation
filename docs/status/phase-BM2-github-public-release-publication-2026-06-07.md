# Phase BM2 — GitHub public release publication

Date: 2026-06-08 00:41 CST (+0800)
Task: BM2 — push PR, merge, tag, and publish GitHub Release
Workspace: `/home/alanxwsl/projects/servicenow-automation`

## Publication result

PUBLIC RELEASE PUBLISHED.

GitHub writes performed in BM2 only, after BL6 and BM1 parent gates completed and Alan's BM public-release authorization was present on the task.

## PR and merge

| Item | Value |
|---|---|
| PR | #141 (URL redacted; verified via `gh pr view 141`) |
| PR title | `v0.1.0 public release — Windows Operator Preview` |
| Source branch | `next/post-release-operator-cockpit-ab-20260606` |
| Base branch | `main` |
| PR state | MERGED |
| Merged at | 2026-06-07T16:39:18Z |
| Merge commit | `4626cf41b2e20ae91c11e0a4add2989726b8386d` |
| Check readback | No GitHub checks were reported for the branch; local gates below passed before merge. |

## Tag and GitHub Release

| Item | Value |
|---|---|
| Tag | `v0.1.0` |
| Tag type | annotated Git tag |
| Tag object | `ea57d37f4dfea7881c9cb5db471e2ff927080a31` |
| Tagged commit | `4626cf41b2e20ae91c11e0a4add2989726b8386d` |
| Release reference | Tag `v0.1.0` (URL redacted; verified via `gh release view v0.1.0`) |
| Release title | `ServiceNow Automation v0.1.0 — Windows Operator Preview` |
| Release state | non-draft, non-prerelease |
| Published at | 2026-06-07T16:40:45Z |
| Release target | `main` |

## Release assets

| Asset | Size | SHA256 / readback |
|---|---:|---|
| `servicenow-automation-windows-v0.1.0-public-20260607.zip` | 118,610,088 bytes | `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692` |
| `servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256` | 123 bytes | `7e954302287fa5493efa4ff3db39ea8fbd1a57c8964a4b186f4e1cadff11d905` |

Asset names read back from GitHub Release (download URLs redacted):

- `servicenow-automation-windows-v0.1.0-public-20260607.zip`
- `servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256`

## Local gates and package verification

Local gates run during BM2 before PR merge:

| Gate | Result |
|---|---|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 335 tests |
| `pnpm privacy:scan` | PASS — 513 tracked files before BM1 docs; PASS — 515 tracked files after BM1 docs staged |

Package verification before release:

| Check | Result |
|---|---|
| Current marker | `CURRENT=servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| `sha256sum -c` | PASS |
| ZIP integrity | PASS — 87 entries |
| Release metadata entry | `resources/release-metadata.json` |
| Metadata phase | PUBLIC |
| Metadata package | `servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| Forbidden release entry scan | PASS — 0 matches for git/env/cookies/storage-state/HAR/screenshots/traces/key material |

## Profile, tools, and gateway verification

Required acceptance checks before reporting done:

| Check | Result |
|---|---|
| `hermes profile show codex-gpt55-control` | PASS — active profile path `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`, gateway running |
| `hermes tools list` | PASS — terminal, file, code_execution, browser, vision, skills, todo, memory, session_search enabled; unrelated toolsets disabled |
| `hermes gateway status` | PASS — gateway running in WSL manual mode; `codex-gpt55-control` profile gateway PID present |
| `gh auth status` | PASS — authenticated as `alanxiaofeifei`; token value not printed in this document |
| `gh api user` | PASS — authenticated user read back as `alanxiaofeifei` |
| `gh repo view` | PASS — repository readback `alanxiaofeifei/servicenow-automation`, default branch `main` |

## Safety boundary

No real ServiceNow login, browser operation, ServiceNow API write, Microsoft Graph/Excel Web write, attachment upload, Teams/Outlook/phone ingestion, or Save / Submit / Update / Resolve / Close automation was performed.

No real customer/ticket/browser/session data was added to release notes, PR text, tag text, release text, or this status document.

## Notes

- The repository reported no GitHub checks for PR #141, so the merge decision used the required local BM2 gates and clean GitHub merge-state readback.
- The release is a GitHub Release artifact publication only. It does not approve live ServiceNow production use.
