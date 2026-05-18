# ServiceNow Environment Strategy

This project now has three delivery tracks before Alan's bench transition.

## Track 1 — Demo / Mock Mode

Purpose: stable internal-transfer and interview demonstration.

- Manual Paste input
- MockAIProvider
- local demo KB
- editable TicketDraft
- mock ServiceNow form
- no production ServiceNow dependency
- no auto-submit

This is the fallback path that must always work.

## Track 2 — QA / Dev ServiceNow Test Mode

Purpose: validate whether the workflow maps correctly into a safe ServiceNow test/development environment.

Known QA target, private repository only:

```text
https://yageoqa.service-now.com/now/nav/ui/classic/params/target/home_splash.do%3Fsysparm_direct%3Dtrue
```

Rules:

- Use only QA/dev instances where Alan is authorized.
- Login is manual; do not store credentials.
- Browser sessions/cookies must stay in ignored local runtime paths.
- Prefer drafting and form-fill rehearsal before any actual QA submit.
- Any actual QA incident creation must be deliberate and manually approved by Alan.
- Record only generic findings in GitHub issues; never commit screenshots or ticket text.

Implementation direction:

- Add a profile environment selector: `mock`, `qa`, `dev`, `production-shadow`.
- Add a QA-safe adapter after the mock vertical slice is stable.
- The QA adapter may prepare fields or guide navigation, but final submit requires explicit human action.

## Track 3 — Production Shadow Mode

Purpose: Alan's own small-scope, tightly monitored validation after QA/dev confidence.

Rules:

- Use only Alan's own authorized production work.
- Default mode remains shadow comparison: draft suggestions vs Alan's manual action.
- No automated production submit, close, or update.
- No external AI with unredacted real content.
- Stop immediately if any unexpected write action could occur.

## Why this matters

A mock-only demo is useful for hiring/transfer storytelling, but Alan also needs confidence that the tool can help in real ServiceNow workflow before access ends. The strategy is therefore:

1. Keep mock demo stable.
2. Add QA/dev test path.
3. Only then attempt production shadow-mode use.

## Public Showcase Warning

Before any public release or showcase, remove:

- `yageoqa.service-now.com`
- customer names
- real URLs
- real assignment groups
- real ticket text
- screenshots
- any ServiceNow environment-specific configuration
