# GPT-5.5 Pro Review Prompt — Windows Dedicated Chromium `about:blank` Smoke

## Role

You are GPT-5.5 Pro acting as an independent safety, privacy, and architecture reviewer for Alan's ServiceNow Automation project.

## Current request

Review GitHub issue #32 and the current implementation for the Windows dedicated Chromium `about:blank` smoke command.

We are **not** asking for approval to open QA ServiceNow.

We are asking whether the project is ready for a local no-write Windows dedicated Chromium `about:blank` smoke stage only.

## Context

Previous checkpoint result:

```text
NO-GO for Windows Chromium QA login-page / post-login field trial.
READY WITH CONDITIONS only for continuing local architecture validation,
path classification tests,
and designing an about:blank / local safe-page smoke test.
```

Reason for the NO-GO:

```text
The first real Windows launch should be about:blank or a safe local page, not QA ServiceNow.
```

Issue #31 added Windows runtime/profile classification helpers.
Issue #32 adds a dedicated smoke command separate from ServiceNow browser launch.

## Files to review

```text
apps/cli/bin/sda.mjs
apps/cli/src/cli.ts
apps/cli/src/cli.test.ts
packages/adapters/src/browser-session.ts
packages/adapters/src/browser-session.test.ts
docs/field-trial/windows-dedicated-chromium-about-blank-smoke.md
```

## Intended command

Dry-run:

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser smoke \
  --browser-executable '%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe' \
  --profile-root '%LOCALAPPDATA%\ServiceNowAutomation\Profiles\smoke\session-smoke-001' \
  --target about:blank \
  --json
```

Real launch, only if approved:

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser smoke \
  --browser-executable '<expanded Windows tool-owned Chromium path>' \
  --profile-root '<expanded Windows tool-owned disposable profile path>' \
  --target about:blank \
  --execute \
  --confirm-no-write-launch \
  --json
```

## Required safety properties

The implementation should satisfy all of these:

```text
- `browser smoke` is separate from `browser launch`.
- `browser smoke` does not call ServiceNow target validators.
- `browser smoke` only accepts about:blank.
- HTTP, HTTPS, file, ServiceNow, query, hash, and userinfo targets are blocked.
- blocked target output does not echo sensitive target details.
- dry-run is default.
- real launch requires --execute and --confirm-no-write-launch.
- runtime path must classify as tool-owned dedicated Chromium.
- daily Chrome/Edge runtime paths are blocked.
- profile root must validate as tool-owned disposable profile.
- daily Chrome/Edge/Firefox profile roots are blocked.
- WSL/Linux ServiceNow browser launch behavior is not weakened.
- no DOM automation.
- no page inspection.
- no browser artifact export.
- no ticket field fill.
- no Save / Submit / Update / Close.
- no ServiceNow API call.
```

## Verification already expected from Hermes before asking you

```text
pnpm --filter @servicenow-automation/adapters test
pnpm --filter @servicenow-automation/cli test
pnpm build
pnpm typecheck
pnpm test
CLI smoke dry-run JSON check
blocked target/runtime/profile smoke checks
privacy scan of diff and smoke JSON
independent pre-commit review
```

## Please answer in this exact structure

```text
Verdict: READY FOR ABOUT:BLANK SMOKE / READY WITH CONDITIONS / NO-GO

Summary:
- ...

Blocking issues:
- ...

Conditions before real about:blank launch:
- ...

Runtime/profile isolation assessment:
- ...

No-write boundary assessment:
- ...

Allowed next step:
- ...

Still forbidden:
- ...
```

## Important boundary

Do **not** approve QA ServiceNow login-page testing in this checkpoint unless you explicitly believe another checkpoint is unnecessary. The expected safe answer should normally limit approval to `about:blank` smoke only.
