# ServiceNow Automation User Guide

## Purpose

ServiceNow Automation helps a service desk agent turn scattered support context into a structured, editable Incident draft.

The current local demo is intentionally simple and stable: it uses manual paste, local demo knowledge articles, deterministic mock extraction, and a mock ServiceNow form. The workbench is organized as a warm-light three-column interface so the demo story is easy to follow.

## Workbench map

Left column
- source / loading information feed
- intake queue
- todo list
- history
- mode / function switching
- bottom-left settings access

Center column
- selected source detail
- cleaned / normalized source text
- generated TicketDraft
- ServiceNow required / common field preview
- autofill plan
- KB / recommendation detail when selected

Right column
- runtime actions
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- templates / settings
- CDP readiness status
- safety boundary
- environment controls
- recent run evidence

## How to use the local demo

1. Open the desktop app.
2. Configure the settings if needed:
   - QA URL
   - Dev URL
   - Production URL
   - default environment
   - safety state
3. Choose one fake scenario from the intake queue.
4. Review the selected source and the cleaned source.
5. Review the TicketDraft and the field preview.
6. Check the KB / recommendation detail.
7. Use the runtime rail in order:
   - Start QA Chromium
   - Verify current Incident
   - Autofill current Incident
8. Read the recent run evidence before handing control back to the human.
9. Keep the final ServiceNow action manual.

## Expected output

The tool should show:

- source / loading feed
- intake queue
- todo list
- history
- selected source detail
- cleaned source
- TicketDraft
- required / common field preview
- autofill plan
- KB recommendation detail
- runtime controls
- CDP readiness
- safety boundary
- recent run evidence

## Safety notes

- Manual review remains required.
- Fake, local-only demo data only.
- No external writes.
- No Save / Submit / Update / Resolve / Close automation.
- No ServiceNow API writes.
- No real ServiceNow URLs, ticket IDs, sys_ids, cookies, sessions, or page fingerprints in the demo.

## QA/dev testing note

A future QA/dev mode may open or guide a real test instance where the user is authorized. That mode must still require manual login and explicit human approval before any real test submission.

## Production shadow-mode note

Production use, if attempted, must remain shadow-mode by default: compare the generated draft with the agent's manual action. Do not auto-submit, auto-close, or auto-update production records.
