# ServiceNow Automation English Overview

ServiceNow Automation is a private rebuild project for a human-in-the-loop ServiceNow Automation Workbench for service desk agents.

It converts support context into structured ServiceNow-ready ticket drafts, knowledge-backed troubleshooting steps, and safe form-fill workflows while preserving human review and final submission.

## Demo acceptance target

By 2026-06-05, the project should demonstrate three safe scenarios:

1. VPN issue
2. Windows performance issue
3. Account/login issue

Each scenario must show:

```text
Issue input
→ structured extraction
→ KB/rule match
→ editable TicketDraft
→ mock ServiceNow form fill
→ manual final submit only
```

## Non-negotiable safety rule

The product is not an auto-submit or auto-close bot. It is an agent workbench that reduces repetitive ticket-writing work while keeping ITSM controls intact.
