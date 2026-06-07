# Phase BC2 — UX/copy spec — local validation checklist launcher

Goal: make the existing Open checklist control launch the local runbook with clear, sanitized copy and predictable disabled/loading/error states.

Button label: `Open checklist`.
Tooltip (enabled): `Open the local validation runbook in this worktree.`
Tooltip (disabled): `Checklist opens after the runbook path is resolved and the worktree API is available.`

State copy:
- Loading: `Locating the local validation runbook…`
- Empty: `Checklist not available yet. The runbook file is missing from this worktree.`
- Disabled: `Checklist unavailable until the local runbook path is ready.`
- Error: `Could not open the checklist. Check that the docs/test file exists and retry.`

Enable when the local runbook path is known and the worktree API can open files; disable while metadata is loading or when the path is missing.

Current-package / runbook handoff header wording:
- `Current package (BC6 refresh): servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip`
- `UNC path: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip`
- `Package notes: SHA256 and file size remain filled by the BC6 build output; do not invent values.`

Manual checklist header/copy: `Manual checklist — open the current package first, then confirm Start QA Chromium, CDP ready, and read-only Verify behavior.`

Sanitization rule: no sys_ids, no ticket IDs, no customer data, no raw ServiceNow URLs, and no extra paths beyond the UNC zip path above.
