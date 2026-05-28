# External AI Redaction Gate Runbook

This runbook covers the optional external AI provider path for Issue #17.

The current implementation is a local safety gate, not a production external-AI rollout.

## Current status

Allowed in this slice:

- Build a redaction preview from fake or already-sanitized source context.
- Block external provider use by default.
- Require an explicit approval object tied to the exact redaction preview id.
- Require caller acknowledgement that content will leave the local app.
- Use tests with fake data and injected fake transports only.

Not allowed in this slice:

- No live ServiceNow access.
- No browser login.
- No Save / Submit / Update / Resolve / Close.
- No upload / email / bulk action.
- No ServiceNow API write.
- No production write.
- No production-shadow write.
- No external AI call using real customer, employee, ticket, chat, email, screenshot, HAR, trace, recording, cookie, session, browser endpoint, page fingerprint, local path, or credential content.

## Gate model

A non-mock provider must pass all of these gates before any transport can run:

1. Provider explicitly enabled.
2. API key supplied from environment or a secret manager, never source code.
3. Redaction preview generated from current input.
4. Preview has no residual sensitive-pattern blockers.
5. Operator/caller approval references the exact preview id.
6. Operator/caller confirms the external-send disclosure.
7. A transport is explicitly injected by the caller.

If any gate is missing, the provider fails closed.

## Current DeepSeek provider behavior

`DeepSeekProvider` is disabled by default.

It has no built-in network transport. Tests inject a fake transport, so the repository does not make external API calls during validation.

The environment factory enables the provider only when both are true:

```text
SDA_EXTERNAL_AI_ENABLED=true
SDA_EXTERNAL_AI_PROVIDER=deepseek
```

The API key must come from environment/secret-manager plumbing such as:

```text
SDA_DEEPSEEK_API_KEY
```

Do not commit actual keys or local secret-manager output.

## UI copy requirement before real use

Before wiring this to a renderer or CLI command, the UI/CLI must show copy equivalent to:

```text
External AI is optional and disabled by default. Only the redacted preview below may leave the local app. Do not continue if the preview still contains real names, ticket IDs, URLs, browser/session artifacts, screenshots, traces, local paths, credentials, or raw field values.
```

The action must stay disabled until the operator confirms the exact preview id and disclosure.

## Test policy

Tests must use fake data only. Avoid contiguous real-looking ticket IDs, sys_ids, hostnames, paths, tokens, screenshots, traces, HAR, cookies, sessions, or browser endpoints in fixtures.

If a test needs a sensitive-looking value to prove redaction, construct it from safe fragments inside the test rather than committing real-looking values directly.

## Stop conditions

Stop and do not send externally if:

- the provider is not explicitly enabled;
- the API key is missing;
- no redaction preview exists;
- the preview id does not match the approval;
- the disclosure acknowledgement is missing;
- the preview contains residual sensitive patterns;
- the operator is using real QA/prod content without a separate approval checkpoint;
- any output would be pasted into a public issue, PR, prompt, or external model without review.
