# QA/dev No-Write Controlled Browser Launch

This runbook describes the first safe browser slice for the ServiceNow Automation Workbench.

## Purpose

Open an allowlisted QA/dev ServiceNow URL in an isolated browser profile so Alan can manually log in and confirm the environment is reachable.

This runbook does **not** approve any real ServiceNow write action.

## Safety boundary

Allowed:

- Generate a no-write browser launch dry-run.
- Open a controlled browser window for an allowlisted QA/dev URL only after explicit `--execute --confirm-no-write-launch` flags.
- Manual login by Alan.
- Observe the page manually.
- Close/reset the local ignored browser profile.

Forbidden:

- No submit.
- No update.
- No save.
- No close.
- No create change.
- No upload attachment.
- No send email.
- No automatic ticket field fill.
- No DOM automation.
- No screenshots/HAR/traces/storage-state committed to Git.
- No external AI with real ticket/customer data.
- No production-shadow browser launch until #19 is complete.

## Commands

WSL-launched Windows Chrome/Edge executables and Windows drive paths such as `/mnt/c/...` are blocked until the project implements and verifies a Windows-compatible isolated profile path. Do not use Alan's default Windows browser profile for QA/dev launch validation.

Dry-run preview only:

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser launch --mode qa --json
```

Optional real browser open after GPT-5.5 Pro checkpoint and Alan approval:

```bash
SDA_BROWSER_EXECUTABLE=/path/to/chromium \
  pnpm --silent --filter @servicenow-automation/cli sda \
  browser launch --mode qa --execute --confirm-no-write-launch --json
```

Reset ignored runtime profile:

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser reset --mode qa --json
```

## URL policy

The launch layer refuses:

- mock mode
- production-shadow mode
- target URL outside the configured allowlisted host
- non-HTTPS target URL
- URL userinfo, e.g. `https://user:pass@host/...`
- query strings and hash fragments, because they can contain `sys_id`, tokens, sessions, or ticket-specific data

Denied launch results must not echo raw credential-bearing URLs or sensitive query/hash values.

## Approval model

Browser launch is not a write action, but it still requires explicit no-write confirmation for execution:

```text
--execute --confirm-no-write-launch
```

Any future write action remains separately gated by `RealActionGate`, including:

- `submit_incident`
- `update_incident`
- `save_incident`
- `close_incident`
- `create_change`
- `upload_attachment`
- `send_email`

## First manual field-trial script

Do not perform this until #25 GPT-5.5 Pro checkpoint is complete.

1. Confirm Git working tree is clean.
2. Run `pnpm build && pnpm typecheck && pnpm test`.
3. Run browser launch dry-run and inspect JSON safety envelope.
4. Confirm no raw credential-bearing URL, query, hash, cookie, session, or storage-state is printed.
5. Execute controlled browser launch with `--execute --confirm-no-write-launch`.
6. Alan manually logs in.
7. Do not open a real Incident ticket unless the page is already a non-sensitive landing page.
8. Do not type into any ticket field.
9. Do not click Save/Submit/Update/Close.
10. Close browser.
11. Reset profile if needed.
12. Record only non-sensitive observations: reachable/not reachable, login success/fail, browser executable used, timestamp.
