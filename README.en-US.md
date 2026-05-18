# ServiceNow Automation — English Overview

ServiceNow Automation is a private, portfolio-grade prototype of a **human-in-the-loop ServiceNow Automation Workbench** for service desk agents.

It turns pasted support context into structured Incident drafts, local knowledge-base matches, editable ticket fields, and a safe mock ServiceNow form while keeping final accountability with the human agent.

## What it does

- Accepts manual-paste issue context for a stable P0 workflow.
- Creates a `CapturedContext` from the pasted issue text.
- Uses a deterministic `MockAIProvider` to generate a structured `TicketDraft`.
- Matches local demo knowledge articles for VPN, Windows endpoint, and account/login scenarios.
- Displays editable Short Description, Description, Work Notes, Category, Subcategory, Assignment Group, Impact, Urgency, and Priority.
- Fills a **mock** ServiceNow Incident form for demo and QA/dev rehearsal.
- Shows visible risk controls before any fill action.

## What it does not do

- It does not auto-submit tickets.
- It does not auto-close tickets.
- It does not update production ServiceNow records automatically.
- It does not store passwords, browser cookies, or real ticket data in Git.
- It does not send unredacted customer data to external AI providers.

## Demo scenarios

1. VPN connection issue after password or MFA change.
2. Windows endpoint performance issue after update.
3. Account/login issue requiring access troubleshooting.

Each scenario follows this flow:

```text
Manual Paste
→ CapturedContext
→ MockAIProvider
→ TicketDraft
→ KB Matches
→ Human Review
→ Mock ServiceNow Incident Form
→ Manual final submit only
```

## Documents

- Chinese user guide: `docs/zh-CN/user-guide.md`
- English user guide: `docs/en-US/user-guide.md`
- Chinese demo script: `docs/zh-CN/demo-script.md`
- English demo script: `docs/en-US/demo-script.md`
- Chinese safety statement: `docs/zh-CN/security-and-compliance.md`
- English safety statement: `docs/en-US/security-and-compliance.md`
