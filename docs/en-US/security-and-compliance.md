# Security and Compliance

## Demo / P0 guardrail

The current demo uses only sanitized, fake, local data.

Allowed in the demo:
- Manual paste of sanitized issue context.
- Demo KB articles with fake or generic content.
- Deterministic mock extraction.
- Mock ServiceNow form.
- Sanitary, local-only runtime evidence.

Not allowed in the demo:
- Real ServiceNow pages or real tickets.
- Customer names, email addresses, or other sensitive details.
- Cookies, sessions, storage state, HARs, traces, screenshots, or recordings.
- Save, Submit, Update, Resolve, Close.
- Any ServiceNow API write.

## QA/dev test mode

QA/dev testing may be added only after the mock workflow is stable. It must use authorized access, manual login, ignored local runtime storage, and explicit approval before any real test submission.

## Production shadow-mode

Production validation must remain shadow-mode unless a separate safety review approves otherwise. The user may compare the generated draft with manual handling, but the tool must not perform automatic production writes.

## Public showcase rule

If the demo is shown publicly, use only sanitized fake examples and keep the runtime evidence compact and local-only.
