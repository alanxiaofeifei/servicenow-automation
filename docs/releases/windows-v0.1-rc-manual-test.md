# Windows v0.1 RC manual test quickstart

This checklist is for supervised local testing of the packaged Windows Operator Preview artifact.

> **Note**: The authoritative next-morning validation checklist is at
> `docs/status/phase-V1-next-morning-alan-manual-validation-checklist-2026-06-05.md`.
> This doc is a supplement for package-content verification; use the V1 checklist
> for full product validation.

## Scope

The release-candidate package proves that the packaged Windows app can start and run mock/synthetic workflows without relying on a WSL source checkout or dev `node_modules` at runtime.

It does not approve live ServiceNow operation.

## Hard stop rules

Stop immediately if any path asks you to perform or automate:

- automatic login
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- ServiceNow API write
- production write or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

## Package contents

The RC zip is a packaged Electron Windows artifact. It should contain the app executable, `resources/app.asar`, and packaged helper resources under `resources/scripts/...`.

It intentionally does not include:

- `.git/`
- `.local/` startup logs
- source-tree `private/` notes
- cookies, sessions, HARs, traces, screenshots, recordings, or storage-state exports

The old WSL source-tree launcher is dev/field-trial fallback only and is not acceptance proof for this packaged artifact.

## Build and checksum

From WSL inside a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm release:windows:rc
```

The RC wrapper writes:

```text
dist/release/servicenow-automation-windows-v0.1.0-rc.2.zip
dist/release/servicenow-automation-windows-v0.1.0-rc.2.zip.sha256
```

Verify checksum from a trusted shell:

```bash
sha256sum -c servicenow-automation-windows-v0.1.0-rc.2.zip.sha256
```

## Test steps

1. Extract the RC zip on Windows.
2. Double-click the packaged `ServiceNow Automation` executable.
3. In the desktop app, test mock workflows only:

   - Load VPN Demo
   - Load Windows Demo
   - Load Mock Account Access Demo — no browser login
   - edit a draft field
   - inspect KB matches / missing info / risk flags
   - inspect Mock ServiceNow form only

4. Optional dedicated browser smoke:

   - use `about:blank` only
   - confirm the profile is tool-owned
   - confirm CDP is loopback-only unless explicit dev-only flags are supplied
   - stop before any real QA login or field interaction

## What to report back

Report only:

- pass/fail for checksum
- pass/fail for packaged Windows app launch
- pass/fail for mock demo workflows
- startup log path if needed
- sanitized visible error text if needed

Do not paste real ServiceNow/customer/ticket/browser data.
