# Shadow-Mode Field Trial Runbook

This runbook defines how Alan can test ServiceNow Automation in a small, personally controlled real environment without turning it into an unsafe production automation bot.

## Purpose

Validate whether the tool helps a Service Desk Agent turn real-world issue context into a cleaner ServiceNow-ready incident draft.

This is not a production rollout.

## Allowed

- Use issues Alan is authorized to view and handle.
- Manually paste a sanitized or minimal issue summary into the app.
- Generate a draft using `MockAIProvider`.
- Compare suggested fields/work notes with Alan's own judgment.
- Use the mock ServiceNow form to rehearse field mapping.
- Record generic observations in local ignored folders.

## Not Allowed

- Auto-submit real incidents.
- Auto-close real incidents.
- Auto-update production ServiceNow fields.
- Scrape or export real tickets in bulk.
- Store real ticket text, screenshots, cookies, HAR files, or browser profiles in Git.
- Send real customer/internal content to DeepSeek or another external AI provider without sanitization and policy approval.

## DeepSeek / External AI Caution

If a DeepSeek provider is added later, use it only after redaction. Treat it as an external system.

Before sending text to an external provider, remove or mask:

- names
- emails
- phone numbers
- ticket IDs
- device names
- URLs
- asset IDs
- internal assignment groups
- customer-specific KB text
- screenshots or attachments

Safer default for field trial:

```text
Real issue context → manual sanitization → app → MockAIProvider
```

Optional later flow:

```text
Real issue context → redaction preview → explicit opt-in → DeepSeekProvider → TicketDraft
```

## Test Steps

1. Pick one authorized issue or support scenario.
2. Rewrite it as a minimal sanitized summary.
3. Paste into the app.
4. Generate `CapturedContext`.
5. Generate `TicketDraft` with MockAIProvider.
6. Review KB matches.
7. Edit fields as a human agent.
8. Fill mock ServiceNow form.
9. Compare the result with what would be manually entered.
10. Record only generic observations in `private/field-tests/`.

## Private Note Template

Save under ignored path:

```text
private/field-tests/YYYY-MM-DD-shadow-test.md
```

Template:

```markdown
# Shadow Test YYYY-MM-DD

## Scenario type
VPN / Windows / Account-login / Other

## Input source
Manual sanitized summary only

## Provider
MockAIProvider / DeepSeekProvider with redaction

## Result quality
Good / needs edit / unusable

## Missing info detected
- ...

## Human changes needed
- ...

## Safety concerns
- ...

## Generic product improvement issue to create
- ...
```

## Pass Criteria

- Draft is useful enough to reduce manual writing.
- Human can edit all important fields.
- KB match is relevant or at least understandable.
- Mock form mapping is clear.
- No production action is automated.
- No real data is committed.

## Stop Criteria

Stop testing if:

- Real sensitive data appears in a Git-tracked file.
- The tool attempts to submit or update a real ticket.
- A provider sends unredacted real text to an external API.
- A scenario requires bypassing access controls or customer policy.
