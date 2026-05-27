# Windows operator quickstart

Use this for the field-trial build of ServiceNow Automation.

Status note for K9 on 2026-05-26: the Windows app field-trial path has now passed supervised manual acceptance for the text-field-only, no-save flow. Alan confirmed that dedicated Chromium opened, the current-ticket check reached the ready state on a new QA Incident form, and Autofill filled only Short description, Description, and Work notes without Save/Submit/Update/Resolve/Close.

## Open the app

Double-click the approved ServiceNow Automation desktop shortcut or the Windows launcher prepared from `scripts/windows/Start-ServiceNow-Automation.cmd`.

Keep the black command window open while the app is running. The desktop launcher now calls a WSL bootstrap script that loads Node/NVM safely, starts an existing desktop build directly, and rebuilds only when build output is missing or stale.

If the app does not open, copy only the visible error text and the printed startup log path. Startup logs are written under `.local/startup-logs/`, which is git-ignored and must not contain ServiceNow URLs, cookies, sessions, HARs, screenshots, or ticket content.

## Operator flow

1. In the app, keep environment mode on QA.
2. Edit/review the draft fields in the Ticket Draft panel.
3. In `ServiceNow Automation operator`, click `1. Start QA Chromium`.
4. In the dedicated Chromium window, log in manually if needed and open a QA Incident form. The app now reuses the same tool-owned QA test profile, so ServiceNow saved sign-in can persist between launches without touching the user's daily Chrome/Edge profile.
5. Return to the app and use the check-current-ticket action.
6. Review the field plan shown in the app.
7. Use Autofill only for the allowed fields.
8. Review the QA Incident form manually in Chromium.
9. Only the human operator decides whether to Save/Submit in ServiceNow.

## Current boundary

The operator runtime may fill only the approved QA/dev form fields after the current-ticket check passes. The currently executable path is text-field-only unless a later privacy review approves more. It does not click Save, Submit, Update, Resolve, or Close. It does not upload files, send email, export cookies/sessions/HAR/screenshots, or call the ServiceNow API.

Default QA values are intentionally not published in this public quickstart. Confirm the private operator profile before any supervised QA/dev attempt; it should cover requester/person, category/subcategory, location, channel, assignment group, assigned-to behavior, route-out state, and work-notes prefix.

Route-out behavior remains separate and manual-confirm until a later reviewed slice approves the relevant non-text fields.
