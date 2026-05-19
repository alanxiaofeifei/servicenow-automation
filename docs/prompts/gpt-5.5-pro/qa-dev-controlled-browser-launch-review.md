# GPT-5.5 Pro Review Prompt — QA/dev Controlled Browser Launch

You are reviewing a private ServiceNow Automation Workbench for service desk operations.

## Review goal

Perform a safety / privacy / architecture / field-trial readiness review before the first real QA/dev controlled browser session is used against a ServiceNow login page.

This is **not** a request to approve real submit/update/save/close. The intended next trial is no-write browser launch only.

## Repository

`alanxiaofeifei/servicenow-automation`

## Current expected prerequisites

Review only after all are true:

- `#23 Treat ServiceNow Save as a gated real write action` is complete.
- `#24 QA/dev no-write controlled browser launch` is complete.
- `pnpm build` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- No screenshots, HAR files, cookies, storage state, sessions, traces, field-test notes, or real ticket data are staged for Git.

## Important project facts

- The app has mock/demo and CLI/headless dry-run workflows.
- Real write actions are centrally modeled by `RealActionGate`.
- Write actions include at least:
  - submit incident
  - update incident
  - save incident
  - close incident
  - create change
  - upload attachment
  - send email
- `Save` is a real write action even though it keeps the Incident page open.
- QA/dev write actions require explicit Alan approval and allowlisted HTTPS target validation.
- Production shadow write actions are always denied.
- Browser session data must stay under ignored local runtime folders.
- DeepSeek / external AI is still blocked until redaction gate `#17` is complete.
- Production shadow mode is still blocked until checklist `#19` is complete.

## Implemented no-write command surface

Dry-run only:

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser launch --mode qa --json
```

Optional real browser open after this review and Alan approval:

```bash
SDA_BROWSER_EXECUTABLE=/path/to/chromium \
  pnpm --silent --filter @servicenow-automation/cli sda \
  browser launch --mode qa --execute --confirm-no-write-launch --json
```

The command must remain no-write: manual login only, no DOM automation, no field fill, no submit/update/save/close.

## Files to inspect

Please inspect these if GitHub access is available:

1. `packages/core/src/real-action-gate.ts`
2. `packages/core/src/real-action-gate.test.ts`
3. `packages/profiles/src/target-url.ts`
4. `packages/profiles/src/target-url.test.ts`
5. `packages/adapters/src/browser-session.ts`
6. `packages/adapters/src/browser-session.test.ts`
7. `apps/cli/src/cli.ts`
8. `apps/desktop/src/App.tsx`
9. `.gitignore`
10. `docs/field-trial/shadow-mode-runbook.md`
11. `docs/field-trial/qa-dev-no-write-browser-launch.md`
12. The implementation files for issue `#24` once available.

## Questions to answer

Return:

1. Verdict: `Ready`, `Ready with conditions`, or `Not ready` for first QA/dev no-write controlled browser session.
2. Top 5 safety/privacy risks.
3. Must-fix before opening a real QA/dev ServiceNow login page.
4. Must-fix before collecting page title/current URL metadata.
5. Must-fix before any real QA/dev submit/update/save/close workflow.
6. Must-fix before production shadow mode.
7. Whether `Save` is correctly treated as a real write action.
8. Whether controlled browser launch is sufficiently separated from any write action.
9. Whether URL redaction and target allowlist handling are strong enough.
10. A recommended 30–60 minute manual field-trial script that records no sensitive ticket/user data.

## Non-negotiable constraints

- No production auto-submit.
- No production auto-update.
- No production auto-save.
- No production auto-close.
- No QA/dev real write unless RealActionGate authorizes it with explicit Alan approval.
- No raw credential-bearing URLs in JSON, logs, UI, screenshots, or Git.
- No cookies, sessions, HAR, screenshots, traces, or storage-state files in Git.
- No external AI with unredacted customer/ticket data.
- The first QA/dev browser test must be no-write: open, manual login, observe, close/reset.

## Output format

Please use this structure:

```text
Verdict: <Ready | Ready with conditions | Not ready>

Top risks:
1. ...

Must fix before QA/dev no-write browser session:
- ...

Must fix before any QA/dev write:
- ...

Must fix before production shadow:
- ...

Save action assessment:
- ...

Recommended first field-trial script:
1. ...

Final recommendation:
- ...
```
