# GPT-5.5 Pro Review Prompt — QA Post-Login Read-Only Exploration

## Role

You are GPT-5.5 Pro acting as an independent safety, privacy, architecture, and field-trial reviewer for Alan's ServiceNow Automation Workbench.

Alan is building a safety-first ServiceNow automation portfolio/work tool. Hermes acts as project manager/gatekeeper, Codex CLI is the primary coding worker, GPT-5.5 Pro provides checkpoint review, and Alan is the final owner/acceptance reviewer.

## Review verdict requested

Return exactly one of:

```text
READY FOR QA POST-LOGIN READ-ONLY EXPLORATION
READY WITH CONDITIONS
NO-GO
```

This checkpoint is **not** asking for approval of any ServiceNow write action. It is only asking whether Alan may do the next manual field trial: manually log in to a QA/dev ServiceNow environment and perform strictly read-only, non-sensitive observation.

## Repository

`alanxiaofeifei/servicenow-automation`

## Current stage summary

The project has completed a no-write controlled browser launch field trial:

- Linux-native Chrome was installed and used in WSL for Alan's current development machine.
- The browser executable was verified as `/usr/bin/google-chrome`, not a Windows `/mnt/...` path and not `.exe`.
- QA dry-run safety validation passed.
- The controlled browser launch used a repo/worktree-local ignored profile directory under `.local/servicenow-browser-profiles/<mode>`.
- Alan manually confirmed that the browser opened successfully, used a new/blank isolated profile, reached the QA login page, and was closed.
- Alan did **not** log in during that stage.
- No DOM automation, field fill, submit, save, update, close, upload, email, ServiceNow API call, screenshot, HAR, trace, storage-state export, or external AI call occurred.

Issues already closed:

- `#26` — First QA no-write controlled browser field trial.
- `#29` — Prepare WSL Linux browser for second QA no-write launch.

Open safety constraints still apply:

- `#17` — External AI / DeepSeek provider remains blocked until a redaction gate exists.
- `#19` — Production shadow-mode remains blocked until a separate checklist is complete.

## Important product-design context from Alan's prior AIA tool

Alan clarified an important historical implementation detail from the previous AIA ServiceNow automation tool:

- The AIA-era tool did **not** call Alan's normal installed Windows Chrome browser.
- It opened a separate, fresh Windows Chromium browser runtime for the tool.
- Each launch used a fresh/manual-login profile.
- After the Chromium window was fully closed, profile/session data was automatically cleared.
- Manual re-login on each launch was intentional and treated as a safety feature.

For the current project, Linux Chrome in WSL is only a development-machine workaround to protect Alan's daily work browser. The eventual product architecture should likely converge toward a dedicated/bundled/portable Chromium runtime with disposable or explicitly resettable profile directories, rather than relying on a user's normal Chrome profile.

Please evaluate this distinction explicitly.

## Current code and docs to inspect

If GitHub access is available, inspect at least:

1. `packages/adapters/src/browser-session.ts`
2. `packages/adapters/src/browser-session.test.ts`
3. `apps/cli/src/cli.ts`
4. `apps/cli/src/cli.test.ts`
5. `packages/profiles/src/service-now-environments.ts`
6. `packages/profiles/src/target-url.ts`
7. `packages/core/src/real-action-gate.ts`
8. `packages/core/src/real-action-gate.test.ts`
9. `.gitignore`
10. `docs/field-trial/qa-dev-no-write-browser-launch.md`
11. `docs/prompts/gpt-5.5-pro/browser-profile-isolation-before-second-qa-launch-review.md`
12. GitHub issue comments for `#26`, `#27`, `#28`, and `#29` if available.

## Proposed next field trial under review

The proposed next field trial is **manual QA post-login read-only exploration**.

Allowed actions only if approved by this checkpoint:

```text
Open controlled isolated browser
→ Alan manually logs in
→ observe only a safe landing page / homepage / navigator shell
→ optionally record only non-sensitive observations such as "login successful", "landing page reachable", "logout visible", "no profile reuse"
→ close browser
→ optionally reset only the verified project-owned disposable profile
```

The next field trial should not rely on any automated DOM access. It is manual observation only.

## Non-negotiable forbidden actions for this stage

This checkpoint must not approve any of the following:

- No automatic login.
- No credential storage in source, config, logs, screenshots, traces, or browser storage committed to Git.
- No DOM automation.
- No Playwright page inspection.
- No page text extraction.
- No reading or exporting ticket/customer/user data.
- No screenshot, HAR, trace, video, storage-state export, cookie export, or session export.
- No Incident form automation.
- No opening real tickets unless Alan can confirm the page is a non-sensitive empty/new form or generic shell; if uncertain, do not open it.
- No field fill.
- No Save.
- No Submit.
- No Update.
- No Close.
- No Create Change.
- No Upload Attachment.
- No Send Email.
- No external AI call using real ServiceNow content.
- No production-shadow launch.
- No testing against production.

## Required evidence before approval

Please verify or demand evidence for:

1. Controlled browser launch is still dry-run by default.
2. Real browser launch still requires `--execute --confirm-no-write-launch`.
3. Browser executable is not a user's daily browser profile path in the approved trial.
4. Browser profile directory is project-owned / tool-owned / disposable and git-ignored.
5. There is no chance that reset deletes Alan's normal work browser profile.
6. Query strings and hash fragments are not included in command previews/logs.
7. Userinfo in URLs is blocked.
8. Production-shadow remains blocked.
9. Write actions remain centrally gated by `RealActionGate`.
10. `Save` is still treated as a real write action.
11. No automated page read/capture capability is enabled by the proposed trial.
12. No customer/ticket data will be recorded in GitHub issue comments, docs, screenshots, or logs.
13. `pnpm build`, `pnpm typecheck`, and `pnpm test` passed after the latest relevant code changes.

## Architecture questions to answer

Please answer these explicitly:

1. Is it safe to proceed from "login page reachable" to "manual login and landing-page-only observation"?
2. Should the next trial continue using Linux Chrome in WSL, or should the project prioritize a dedicated portable/bundled Chromium strategy first?
3. For the final Windows product, is Alan's AIA-style approach — separate Chromium runtime, fresh profile each launch, manual login, profile cleanup on close — a good target architecture?
4. What should be the minimum acceptance criteria for a disposable browser profile implementation?
5. Should automatic profile cleanup happen immediately on browser close, only on explicit reset, or both with safeguards?
6. What telemetry/logging is safe at this stage, if any?
7. What would be the first safe piece of post-login code after manual observation — if any — and what must be built before it?
8. Are there blockers before this next manual QA post-login read-only field trial?

## Recommended output format

Please respond in Markdown with this structure:

```markdown
# Verdict: READY FOR QA POST-LOGIN READ-ONLY EXPLORATION / READY WITH CONDITIONS / NO-GO

## Summary

## Blocking issues

## Conditions before the next field trial

## Browser/runtime isolation assessment

## Disposable profile and reset/cleanup assessment

## Post-login privacy risk assessment

## No-write boundary assessment

## Recommended manual field-trial script

## What must remain forbidden

## Recommended product architecture direction

## Final recommendation
```

Remember: this checkpoint cannot approve any ServiceNow write action, automated DOM capture, external AI over real content, production-shadow use, or screenshot/HAR/trace/storage-state collection. It can only approve or reject a manual QA post-login read-only exploration under strict no-write constraints.
