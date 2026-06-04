# ServiceNow Automation User Guide

## Purpose

ServiceNow Automation helps a service desk agent convert scattered support context into a structured, editable Incident draft.

The v0.1.0-rc.1 version includes: multi-source intake (Teams note, self-service, chat, shared mailbox, manual paste), source review with raw/cleaned context, editable TicketDraft with field mapping, local demo KB article matching with support group recommendation, missing info and risk flags, a Risk Control Gate (stop-before-write), a mock ServiceNow form, and an Excel dry-run report with CSV/Markdown export.

## How to use the v0.1.0-rc.1 demo

1. Open the desktop app (demo mode ON, auto-submit disabled).
2. Choose one scenario:
   - Load VPN Demo
   - Load Windows Demo
   - Load Mock Account Access Demo — no browser login
3. **Intake Source Review** — see the source type (Teams note, self-service, etc.) and review raw vs cleaned context.
4. **TicketDraft** — review and edit the generated fields: Short Description, Description, Work Notes, Category, Subcategory, Assignment Group, Impact, Urgency, Priority.
5. **KB Matching** — check matched knowledge articles, scores, keywords, and support group recommendations.
6. Check Missing Info and Risk Flags.
7. Read the Risk Control Gate — confirm stop-before-write.
8. Use the mock ServiceNow form to rehearse how fields would map.
9. **Excel Dry-Run Report** — preview the report row, copy as CSV or Markdown.
10. Do not treat the mock form as production submission. Submit is disabled in demo mode.

## Expected output

The tool should show:

- Short Description
- Description
- Work Notes
- Category
- Subcategory
- Assignment Group
- Impact
- Urgency
- Priority
- KB Matches
- Missing Info questions
- Risk Flags
- Mock ServiceNow Incident form

## QA/dev testing note

A future QA/dev mode may open or guide a real test instance where the user is authorized. That mode must still require manual login and explicit human approval before any real test submission.

## Production shadow-mode note

Production use, if attempted, must remain shadow-mode by default: compare the generated draft with the agent's manual action. Do not auto-submit, auto-close, or auto-update production records.
