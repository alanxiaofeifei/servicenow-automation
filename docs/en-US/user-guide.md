# ServiceNow Automation User Guide

## Purpose

ServiceNow Automation helps a service desk agent turn scattered support context into a structured, editable Incident draft.

The current local demo is intentionally simple and stable: it uses manual paste, local demo knowledge articles, deterministic mock extraction, and a mock ServiceNow form. The workbench is organized as a warm-light three-column interface so the demo story is easy to follow.

## Workbench map

### Left column
- Demo Scenario Library — collapsible section with 6 preset fake scenarios (VPN, Windows, Account Access, etc.). Click any scenario to populate the full intake → draft → KB → report pipeline.
- source / loading information feed
- intake queue
- todo list
- history (including Product-Review Report export button)
- mode / function switching
- bottom-left settings access

### Center column (operator workflow order)
1. **Selected source** — raw sanitized intake text from the chosen scenario.
2. **Cleaned summary** — normalized, extracted facts from the raw source.
3. **Incident draft** — editable TicketDraft fields (Short description, Description, Work notes, Category, Subcategory, Assignment group, Impact, Urgency, Priority).
4. **Guided demo path** — compact stepper showing source → clean → draft → KB → verify/report → optional QA assistance. Read-only reference; derived from local state.
5. **Local KB recommendations** — KB card(s) with title, match confidence, matched evidence keywords, sanitized excerpt, and recommended support group with routing reason.
6. **Monthly Excel fill queue** — current/previous month selectors with ticket-fill decision buttons ("Fill this ticket into monthly Excel" / "Do later — keep in pending queue"). Local UI placeholder — no Microsoft Graph or Excel Web write.

### Right column
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
3. Choose one fake scenario from the Demo Scenario Library (left sidebar) or the intake queue.
4. Review the selected source and the cleaned source in the center column.
5. Review the Incident draft and edit fields as needed.
6. Follow the Guided demo path stepper to track pipeline progress.
7. Check the KB / recommendation detail and the recommended support group.
8. Use the Monthly Excel fill queue to mark ticket disposition (local placeholder — no actual Excel write).
9. Use the runtime rail in order:
   - Start QA Chromium
   - Verify current Incident
   - Autofill current Incident
10. Export a Product-Review Report from the History page if desired.
11. Read the recent run evidence before handing control back to the human.
12. Keep the final ServiceNow action manual.

## Expected output

The tool should show:

- Demo Scenario Library (collapsible, left sidebar)
- source / loading feed
- intake queue
- todo list
- history (with Product-Review Report export)
- selected source detail
- cleaned source
- Incident draft fields
- Guided demo path stepper
- Local KB recommendations with evidence and support group
- Monthly Excel fill queue with fill/defer buttons
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
- No Microsoft Graph or Excel Web writes.
- No real ServiceNow URLs, ticket IDs, sys_ids, cookies, sessions, or page fingerprints in the demo.

## QA/dev testing note

A future QA/dev mode may open or guide a real test instance where the user is authorized. That mode must still require manual login and explicit human approval before any real test submission.

## Production shadow-mode note

Production use, if attempted, must remain shadow-mode by default: compare the generated draft with the agent's manual action. Do not auto-submit, auto-close, or auto-update production records.
