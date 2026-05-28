# ServiceNow Automation User Guide

## Purpose

ServiceNow Automation helps a service desk agent convert scattered support context into a structured, editable Incident draft.

The P0 version is intentionally simple and stable: it uses manual paste, local demo knowledge articles, deterministic mock AI extraction, and a mock ServiceNow form.

## How to use the P0 demo

1. Open the desktop app.
2. Choose one scenario:
   - Load VPN Demo
   - Load Windows Demo
   - Load Mock Account Access Demo — no browser login
3. Review the captured context.
4. Review and edit the TicketDraft fields.
5. Check KB Matches, Missing Info, and Risk Flags.
6. Read the Risk Control Gate.
7. Confirm human review before fill.
8. Use the mock ServiceNow form to rehearse how fields would map.
9. Do not treat the mock form as production submission.

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
