# ServiceNow Automation

**ServiceNow Automation** is a private, portfolio-grade rebuild project for a human-in-the-loop **ServiceNow Automation Workbench** for service desk agents.

The project goal is to turn support context from manual input, Teams/Web, Outlook/Web, or future adapters into structured ServiceNow-ready ticket drafts, KB-backed troubleshooting steps, and safe form-fill workflows where the human agent remains responsible for final submission.

> Current phase: Post-manual-validation — PR readiness package preparing phases A-D for merge.  
> Manual validation: Alan ran Windows app launch + autofill success on 2026-06-05.  
> Safety rule: AI drafts and fills; humans review and submit.

## Strategic decision

This is a **new rebuild**, not a refactor of the old SD tool.

The previous `service-desk-automation` repository has been archived and should be treated only as a legacy requirements/source-material archive. The old published app/runtime package is not the foundation for this MVP.

## Product positioning

```text
ServiceNow Automation Workbench for Service Desk Agents
```

Not:

```text
A customer-specific ticket bot
A fully automated ticket submitter
A tool that bypasses ITSM controls
```

## P0 demo flow

```text
Input issue context
→ AI or deterministic mock extraction
→ local KB/rules suggest troubleshooting steps
→ TicketDraft JSON is generated
→ user edits/approves fields
→ app fills a mock/safe ServiceNow form
→ final submit remains manual
```

## Documentation

- Chinese product plan: [`docs/product-plan.zh-CN.md`](docs/product-plan.zh-CN.md)
- English product plan: [`docs/product-plan.en-US.md`](docs/product-plan.en-US.md)
- Demo scope: [`docs/demo-scope.md`](docs/demo-scope.md)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Privacy and compliance: [`docs/security-and-compliance.md`](docs/security-and-compliance.md)
- Project management rules: [`docs/project-management.md`](docs/project-management.md)
- Codex first prompt: [`docs/prompts/codex/phase-01-scaffold.md`](docs/prompts/codex/phase-01-scaffold.md)
- GPT-5.5 Pro next support request: [`docs/prompts/gpt-5.5-pro/next-architecture-review.md`](docs/prompts/gpt-5.5-pro/next-architecture-review.md)

## Tech stack direction

- Desktop app: Electron + React + TypeScript + Vite
- Browser automation: Playwright persistent contexts
- Data model validation: Zod
- P0 storage: JSON profiles and local files
- P1/P2 storage: SQLite if needed
- AI layer: deterministic `MockAIProvider` first, real provider later

## Repository safety

This repository is private. Do not commit:

- real customer data
- real employee names/emails
- real ticket numbers
- real ServiceNow URLs
- Teams/Outlook screenshots from production systems
- cookies, sessions, local browser profiles
- local SQLite DBs containing work data
- audio/video recordings from private meetings
- legacy binaries/runtime packages

