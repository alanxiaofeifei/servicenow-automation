# Service Now Automation Demo Scope

## P0 — must be done before 2026-06-05

| Area | P0 feature |
| --- | --- |
| App | Electron + React + TypeScript desktop app scaffold |
| Input | Manual Paste source adapter |
| Data | Sanitized demo profile with fake mappings |
| AI | Structured TicketDraft generator from pasted issue context |
| KB | Local demo knowledge base search for VPN / Windows / account-login issues |
| Review | Human-editable Ticket Draft screen |
| Output | Short Description, Description, Work Notes, Resolution Notes draft, Category, Subcategory, Assignment Group suggestion |
| ServiceNow | Mock ServiceNow form fill first; optional real web-fill only if safe |
| Safety | No auto-submit, no auto-close, no auto-change |
| Docs | Chinese + English Markdown docs |
| Demo | 3 scripted scenarios and 3–5 minute recording plan |

## P1 — only after P0 works

- Embedded/controlled Chromium or Playwright session shell
- Capture visible text from safe Teams Web / Outlook Web pages
- ServiceNowWebAdapter that fills fields but stops before submit
- Local audit/action history
- Copy generated fields to clipboard
- Chinese and English product overview document

## P2 — after June 5

- Outlook Classic adapter
- Microsoft Graph Mail / Teams adapter
- ServiceNow Table API adapter
- Change Request draft workflow
- SQLite FTS or vector search
- Windows installer / signed build
- Separate sanitized public showcase repo/static page

## Explicit non-goals before demo

```text
- Full auto-monitoring of all Teams chats
- Full Outlook Classic integration
- Microsoft Graph integration
- ServiceNow Table API integration
- Auto-submit Incident
- Auto-close Incident
- Auto-create Change
- Real customer data ingestion
- Real customer screenshots in docs/video
- Multi-company plugin marketplace
- Cloud sync
- Full production installer
```

## Demo acceptance criteria

The demo is successful if the app can show this flow three times:

```text
Input issue context
→ Extract problem and fields
→ Match KB/rules
→ Generate TicketDraft JSON
→ User edits/approves fields
→ Fill mock or safe ServiceNow form
→ Final submit remains manual
```
