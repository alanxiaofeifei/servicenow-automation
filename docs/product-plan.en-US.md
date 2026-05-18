# Service Now Automation Product Plan

## Background

This project rebuilds a ServiceNow Automation Workbench from legacy Service Desk automation experience. The legacy repository is now an archived requirements source, not a codebase to refactor.

## Strategic goals

1. Deliver a demoable MVP before 2026-06-05.
2. Support internal transfer and interview storytelling with a portfolio-grade project.
3. Position the work as IT Operations + Service Desk + ServiceNow + AI Automation + Knowledge Management.
4. Use an adapter/profile architecture so the tool can be reused across ServiceNow-based environments.

## Core value

- Reduce repetitive ticket drafting and work-note writing.
- Improve ServiceNow field consistency.
- Convert scattered support context into structured Incident drafts.
- Preserve human review and ITSM compliance.

## Minimum loop

```text
Manual issue input
→ issue extraction
→ local KB match
→ editable TicketDraft
→ human confirmation
→ mock ServiceNow form fill
→ no automatic submit
```

## Success criteria

The MVP succeeds if it can reliably demonstrate three scenarios — VPN, Windows, and account/login — using only sanitized data and a mock/safe ServiceNow form.
