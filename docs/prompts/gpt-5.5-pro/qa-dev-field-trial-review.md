# GPT-5.5 Pro Review Prompt — QA/Dev Field-Trial Readiness

> Use this prompt after #18 ServiceNow QA/dev environment mode and #14 BrowserSessionService skeleton are implemented, but before any real QA submit workflow is used.

## Project context

We are building a private, human-in-the-loop ServiceNow Automation Workbench for service desk operations.

The P0 mock/demo vertical slice is complete:

```text
Manual Paste
→ CapturedContext
→ MockAIProvider
→ TicketDraft
→ KB Matches
→ Risk Control Gate
→ Mock ServiceNow Incident Form
→ Manual final submit only
```

The next stage is a controlled QA/dev field trial using an authorized ServiceNow test environment, followed later by a production shadow-mode comparison. The tool must never bypass ServiceNow controls or silently submit/close/update production tickets.

## Current review trigger

Run this review when:

1. #18 QA/dev environment selector/config is complete.
2. #14 BrowserSessionService skeleton is complete.
3. The app can clearly distinguish mock, QA, dev, and production-shadow modes.
4. Browser sessions/cookies are stored only in ignored local runtime folders.
5. QA/dev mode requires manual login.
6. Any real QA/dev submit path is blocked behind explicit Alan approval.
7. Production mode remains shadow-only by default.

## What I need you to review

Please review the architecture and implementation for:

1. **Safety boundaries**
   - Is there any path that could accidentally submit, close, or update a real ServiceNow ticket?
   - Are QA/dev and production-shadow boundaries visible enough in UI and code?
   - Is explicit approval before QA/dev submit strong enough?

2. **Privacy / compliance**
   - Are credentials, cookies, screenshots, HAR files, logs, or real ticket content prevented from entering Git?
   - Are local runtime paths and `.gitignore` rules sufficient?
   - Is the future DeepSeek/external AI path properly separated behind redaction and opt-in approval?

3. **Technical architecture**
   - Is the separation between ManualPasteAdapter, AIProvider, TicketDraft, environment config, and BrowserSessionService clean?
   - Are we keeping real ServiceNow automation behind an adapter boundary?
   - Is it better to use Playwright persistent context or Electron BrowserWindow for QA/dev manual-login testing?

4. **Field-trial readiness**
   - What is the minimal safe QA/dev test plan?
   - What should be recorded during QA/dev tests without capturing sensitive data?
   - What should block moving from QA/dev to production shadow-mode?

5. **P0.5 scope control**
   - Which features must be finished before QA/dev testing?
   - Which features should be explicitly postponed to avoid delaying the June 5 demo?

## Expected output

Please return:

1. Verdict: Ready / Not Ready / Ready with conditions.
2. Top 5 risks.
3. Must-fix before QA/dev test.
4. Should-fix before production shadow-mode.
5. Suggested 24-hour implementation plan.
6. Suggested 3–5 minute demo framing for internal transfer/interview use.

## Non-negotiable constraints

- No production auto-submit.
- No production auto-close.
- No credential storage in source code.
- No real ticket data, screenshots, cookies, sessions, or HAR files in Git.
- QA/dev real submit only with explicit Alan approval.
- Production remains shadow-only by default.
