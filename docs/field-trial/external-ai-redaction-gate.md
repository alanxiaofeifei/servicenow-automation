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

## Demo results (2026-05-29)

Verified the external AI redaction gate with fake sanitized payloads only. No real ServiceNow data, customer text, provider network calls, or API keys were used.

### Test summary

- **34 tests total** (11 original + 23 new) — all pass
- **3 test files**: `redaction-gate.test.ts`, `deepseek-provider.test.ts`, `mock-ai-provider.test.ts`
- **Test categories**: pass-through (6), block-sensitive (8), edge cases (9), existing (3), deepseek (4), mock (4)
- **Zero real network calls** — all provider tests use injected fake transports
- **Zero gate logic changes** — gate behavior unchanged, only tests added

### Pass-through (sanitized fake data)

All 6 pass-through tests verify that clean, sanitized content with no sensitive patterns passes the gate without modification:

| Test | Input | Result |
|------|-------|--------|
| Fake incident description | VPN troubleshooting narrative | PASS — 0 findings, safeToSend=true |
| Multi-field intake | Short description + description + work notes | PASS — 0 findings, content preserved verbatim |
| Fake host refs (no scheme) | `fake-portal.example.invalid`, `wiki.example.invalid/kb/faq` | PASS — no URL redaction (no scheme present) |
| Fake user display names | "Fake Person", "Demo Manager" | PASS — 0 findings |
| INC without digits | "INC VPN network", "INC support portal" | PASS — not caught as ticket-id (no 5+ digit suffix) |

### Block-sensitive

All 8 block-sensitive tests verify the gate correctly redacts patterns matching the 7 redaction rules:

| Rule | Test input | Findings |
|------|------------|----------|
| URL | `https://fake-portal.example.invalid/incidents/active` | [REDACTED_URL] |
| Email | `fake.user` + `@` + `example.invalid` (dynamic construction) | [REDACTED_EMAIL] |
| Ticket ID | Dynamically constructed `INC` + 7-digit, `RITM` + 7-digit strings | [REDACTED_TICKET_ID] |
| sys_id | 32-hex string `ffff...` | [REDACTED_SYS_ID] |
| Local path (Windows) | `C:\Users\FakeOperator\Documents\case-log.txt` | [REDACTED_PATH] |
| Local path (Linux) | `/home/fakeuser/logs/case-output.log` | [REDACTED_PATH] |
| Credential | `token=...`, `api_key: ...`, `secret: ...`, `passwd=...` | [REDACTED_CREDENTIAL] |
| Phone | `+1 555-123-4567`, `(02) 1234 5678` | [REDACTED_PHONE] |

All redacted outputs were verified NOT to contain the original sensitive values.

### Edge cases

9 edge-case tests cover boundary behavior:

- **Empty input** → fails closed (`redacted-preview-empty`)
- **Whitespace-only** → fails closed
- **Stable preview id** → identical inputs produce identical ids
- **Distinct preview id** → different inputs produce different ids
- **Content preservation** → non-sensitive content survives multiple redactions
- **Disclosure present** → every preview includes the disclosure message
- **Mismatched approval** → rejected with `preview-mismatch`
- **Wrong acknowledgement** → rejected with `disclosure-not-acknowledged`
- **Error type guard** → `isExternalAIBlockedError()` correctly identifies the error type

### Not tested (per safety boundaries)

- Real external AI provider network calls (not in scope)
- Real ServiceNow data, customer text, or internal communications
- Browser launch, autofill, CDP, or packaging code
- Production or production-shadow content
- API keys (never present in code or tests)

### Gate behavior summary

- **Pass-through count**: 6 scenarios verified clean
- **Block count**: 8 scenarios verified redacted (all 7 rule types)
- **Edge cases**: 9 boundary behaviors verified
- **Gate logic**: No bugs found — no separate fix card needed
- **App.tsx**: No AI-gate status indicator exists — criterion 6 is a documented no-op
