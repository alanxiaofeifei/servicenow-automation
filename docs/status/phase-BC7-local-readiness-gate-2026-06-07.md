\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip

# Phase BC7 — Final Local Readiness Gate

Date: 2026-06-07
Scope: BC final local readiness gate for the local validation checklist launcher/runbook refresh chain.
Verdict: BLOCKED

## BC6 package path

Expected exact Windows UNC path for the BC6 package:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```

Expected Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip
```

## Local validation performed

| Check | Result | Sanitized evidence |
|---|---|---|
| BC6 ZIP exists | BLOCKED | Expected BC6 ZIP was not present under `dist/release/`. |
| BC6 SHA256 sidecar exists | BLOCKED | Expected `.zip.sha256` sidecar was not present. |
| BC6 START-HERE handoff exists | BLOCKED | Expected `-START-HERE-WINDOWS.txt` handoff was not present. |
| Hermes profile show | PASS | `hermes profile show codex-gpt55-control` returned profile path, model/provider, skills count, and gateway running status without secrets. |
| Hermes tools status | PASS | `hermes tools list` returned enabled/disabled toolset status successfully. |
| Hermes gateway status | PASS | `hermes gateway status` returned running in WSL foreground/manual mode. |
| `pnpm build` | PASS | Desktop main/preload/renderer and CLI build passed. |
| `pnpm typecheck` | PASS | Seven workspace projects typechecked clean. |
| `pnpm test` | BLOCKED | Desktop test suite had 2 failing assertions: one expected compact safety-boundary copy, and one expected the release-readiness handoff card to render a local UNC package path. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| External/write actions | PASS | No real ServiceNow login, browser/API write, Save, Submit, Update, Resolve, Close, attachment upload, Microsoft Graph/Excel Web write, Teams/Outlook/phone ingestion, push, PR, merge, tag, or release action was performed. |

## What remains for manual validation

Manual Windows validation must wait until a BC6 package refresh produces the ZIP, sidecar checksum, and START-HERE handoff at the exact path above, and until the desktop test failures are resolved. After those blockers are cleared, Alan should extract the BC6 ZIP on Windows, read the START-HERE handoff, open the app, use the Open checklist control, and confirm the runbook shows the current BC6 package details while staying local-only.

## Final verdict

BLOCKED.

This is not a release claim, not a merge approval, and not a GitHub Release/tag/PR action. This document is sanitized: it contains no raw sys_ids, no real ServiceNow URLs, no credentials, and no real customer content.
