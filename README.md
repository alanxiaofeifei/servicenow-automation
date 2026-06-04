# ServiceNow Automation

**ServiceNow Automation** is a private, portfolio-grade rebuild project for a human-in-the-loop **ServiceNow Automation Workbench** for service desk agents.

The project goal is to turn support context from manual input, Teams/Web, Outlook/Web, or future adapters into structured ServiceNow-ready ticket drafts, KB-backed troubleshooting steps, and safe form-fill workflows where the human agent remains responsible for final submission.

> Current phase: v0.1.0-rc.1 — Windows Operator Preview.  
> Demo target: 2026-06-05.  
> Safety rule: AI drafts and fills; humans review and submit.  
> Status: All P0 features implemented and tested — intake connectors, ticket drafting, KB matching, support group recommendation, reporting dry-run, and safe mock form fill.

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

## Demo flow (v0.1.0-rc.1)

```text
Source intake (Teams note / self-service / chat / shared mailbox / manual paste)
→ Source review (raw vs cleaned context normalization)
→ Intake source type selection
→ TicketDraft with field mapping (short desc, desc, work notes, category, etc.)
→ Knowledge article matching and support group recommendation
→ Missing info questions and risk flags
→ Risk Control Gate (stop-before-write)
→ Mock ServiceNow Incident Preview (submit disabled in demo mode)
→ Excel dry-run report (CSV / Markdown copy)
→ Final submit remains manual (always human-in-the-loop)
```

## Documentation

- **Demo script (3-5 min):** [`docs/en-US/demo-script.md`](docs/en-US/demo-script.md) — [`docs/zh-CN/demo-script.md`](docs/zh-CN/demo-script.md) (中文)
- **Interview / pitch package:** [`docs/interview/service-desk-cockpit-pitch.md`](docs/interview/service-desk-cockpit-pitch.md)
- **Release notes:** [`docs/releases/windows-v0.1-rc-release-notes.md`](docs/releases/windows-v0.1-rc-release-notes.md)
- **User guide:** [`docs/en-US/user-guide.md`](docs/en-US/user-guide.md) — [`docs/zh-CN/user-guide.md`](docs/zh-CN/user-guide.md) (中文)
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

