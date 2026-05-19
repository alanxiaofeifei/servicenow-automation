# GPT-5.5 Pro Review Prompt — Windows Dedicated Chromium Runtime

## Role

You are GPT-5.5 Pro acting as an independent safety, privacy, and architecture reviewer for Alan's ServiceNow Automation Workbench.

Alan is building a Windows-focused, safety-first ServiceNow automation tool. Hermes acts as project manager/gatekeeper, Codex CLI is the primary coding worker, GPT-5.5 Pro provides checkpoint review, and Alan is the final owner/acceptance reviewer.

## Review verdict requested

Return exactly one of:

```text
READY FOR WINDOWS CHROMIUM NO-WRITE FIELD TRIAL
READY WITH CONDITIONS
NO-GO
```

This checkpoint must not approve any ServiceNow write action. It only reviews whether a Windows dedicated/portable Chromium runtime with a tool-owned disposable profile is safe enough for a no-write QA login-page or post-login shell-only field trial.

## Background

The project previously tested WSL Linux Chrome as a development-machine workaround to avoid using Alan's daily Windows Chrome profile. Alan's WSL terminal is not GUI-capable, and the final product is intended for Windows desktop users.

Alan's previous AIA-era ServiceNow tool used a separate fresh Windows Chromium runtime, not the user's normal installed Chrome. Each launch required manual login, and closing the browser cleared the profile/session. That pattern is now the target product architecture.

## Repository

`alanxiaofeifei/servicenow-automation`

## Relevant issues and docs

Please inspect:

1. #31 — Implement Windows dedicated Chromium runtime with disposable profile
2. #30 — GPT-5.5 Pro checkpoint: QA post-login read-only exploration
3. `docs/field-trial/windows-dedicated-chromium-runtime.md`
4. `packages/adapters/src/browser-session.ts`
5. `packages/adapters/src/browser-session.test.ts`
6. `apps/cli/src/cli.ts`
7. `apps/cli/src/cli.test.ts`
8. `packages/core/src/real-action-gate.ts`
9. `packages/core/src/real-action-gate.test.ts`
10. `.gitignore`

## Required architecture invariants

A Windows browser launch is safe only if all are true:

1. Browser executable is a dedicated/tool-owned Chromium runtime, not daily Chrome/Edge.
2. Browser profile directory is tool-owned.
3. Browser profile directory is outside the user's normal Chrome/Edge profile roots.
4. Browser profile directory is disposable or explicitly resettable.
5. Dry-run remains default.
6. Real launch requires explicit confirmation.
7. Manual login remains required.
8. No DOM automation or page capture is enabled by launch.
9. No write actions are enabled by launch.
10. Cleanup/reset can only delete tool-owned profile directories.

## Paths that should be blocked as product runtime by default

Installed daily browsers must not be treated as the dedicated tool runtime:

```text
C:\Program Files\Google\Chrome\Application\chrome.exe
C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
C:\Program Files\Microsoft\Edge\Application\msedge.exe
C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
/mnt/<drive>/Program Files/Google/Chrome/Application/chrome.exe
/mnt/<drive>/Program Files/Microsoft/Edge/Application/msedge.exe
```

## Tool-owned profile roots

Accept only tool-owned profile roots, for example:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Profiles\qa\<session-id>\
%LOCALAPPDATA%\ServiceNowAutomation\Profiles\dev\<session-id>\
```

Never reset or cleanup these user browser profile roots:

```text
%LOCALAPPDATA%\Google\Chrome\User Data\
%LOCALAPPDATA%\Microsoft\Edge\User Data\
%APPDATA%\Mozilla\Firefox\Profiles\
```

## Non-negotiable forbidden actions

This checkpoint must not approve:

- automatic login
- credential storage
- DOM automation
- Playwright page inspection
- page text extraction
- page title/current URL metadata capture
- screenshot / HAR / trace / video
- storage-state / cookie / session export
- field fill
- Save / Submit / Update / Close
- Create Change / Upload Attachment / Send Email
- external AI with real ServiceNow content
- production-shadow
- production testing

## Evidence required before approval

Please verify or require evidence that:

1. Windows daily Chrome/Edge executable paths are blocked or not accepted as dedicated runtime.
2. WSL `/mnt/<drive>/...` executable paths remain blocked from Linux launch code.
3. Dedicated/portable Chromium paths are allowed only with tool-owned profile directories.
4. Profile cleanup/reset cannot target daily browser profile roots.
5. Parent traversal and ambiguous relative profile paths are blocked.
6. Dry-run emits only redacted/safe command preview.
7. Query strings, hash fragments, userinfo, cookies, sessions, and tokens are not echoed.
8. Real launch requires explicit confirmation.
9. No ServiceNow DOM/page capture/write action is enabled.
10. `pnpm build`, `pnpm typecheck`, and `pnpm test` pass.
11. The first real launch test uses `about:blank` or another safe non-ServiceNow target before QA login.
12. A separate no-write field-trial script exists before any QA login.

## Questions to answer

1. Is the dedicated Windows Chromium strategy safer than continuing Linux Chrome in WSL for this product?
2. Does the implementation clearly distinguish daily installed browsers from tool-owned runtime?
3. Is disposable profile cleanup safe enough?
4. Should cleanup happen automatically on close, explicit reset, or both?
5. Is it safe to proceed to a Windows Chromium no-write field trial?
6. If ready, should the first trial be `about:blank`, QA login page, or post-login shell-only?
7. What blockers remain before any ServiceNow page is opened?

## Expected output format

Please respond in Markdown:

```markdown
# Verdict: READY FOR WINDOWS CHROMIUM NO-WRITE FIELD TRIAL / READY WITH CONDITIONS / NO-GO

## Summary

## Blocking issues

## Conditions before field trial

## Runtime isolation assessment

## Disposable profile and cleanup assessment

## No-write boundary assessment

## Safe first field-trial script

## What must remain forbidden

## Final recommendation
```

Remember: this checkpoint cannot approve any ServiceNow write action, automated DOM capture, external AI over real content, production-shadow use, or screenshot/HAR/trace/storage-state/cookie/session collection.
