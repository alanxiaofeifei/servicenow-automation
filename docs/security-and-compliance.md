# Security and Compliance Boundaries

## Non-negotiable safety rule

```text
AI Draft → Human Review → Fill Form → Human Final Submit
```

The product must never silently submit, close, or change real ServiceNow tickets.

## Never upload or publish

- Real customer names in public material
- Real employee names/emails
- Functional mailbox credentials
- Real ServiceNow URLs
- Real Teams chat screenshots
- Real Outlook emails
- Real ticket numbers
- Real assignment-group routing tables
- Cookies/session storage
- Browser userDataDir
- Local SQLite DBs containing work data
- Videos recorded inside real customer tools
- Copied customer KB article text unless rewritten and anonymized

## AI must not

- Auto-submit Incident
- Auto-close Incident
- Auto-create Change
- Auto-send user emails
- Auto-edit production ticket fields without review
- Bypass SSO/MFA/session controls
- Store passwords
- Invent facts not present in source context
- Use real company data for public demos

## Demo data policy

P0 uses fake users, fake domains, fake ServiceNow URLs, fake assignment groups, and rewritten demo KB articles.

Example safe values:

```text
Caller: Alex Chen <alex.demo@example.com>
Assignment Group: DEMO-SD-WINDOWS
CI: DEMO-LAPTOP-001
ServiceNow URL: https://demo.service-now.local
```

## Public portfolio policy

Do not make this private repo public. If a public showcase is needed, create a separate sanitized repository or static page with fake profiles, fake KB, fake screenshots, and no private docs.
