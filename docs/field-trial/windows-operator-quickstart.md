# Windows operator quickstart

Use this for the field-trial build of ServiceNow Automation.

Status note for PR #97: this quickstart currently describes the intended operator flow, but manual acceptance on 2026-05-24 found that `Start QA Chromium` produced no visible browser launch and `Verify current Incident` stayed disabled. Treat that as the active P0 blocker until fixed and re-tested from the Windows double-click app.

## Open the app

Double-click this file on the Windows desktop:

`C:\Users\alanx\Desktop\ServiceNow Automation.cmd`

Keep the black command window open while the app is running. The desktop launcher now calls a WSL bootstrap script that loads Node/NVM safely, starts an existing desktop build directly, and rebuilds only when build output is missing or stale.

If the app does not open, copy only the visible error text and the printed startup log path. Startup logs are written under `.local/startup-logs/`, which is git-ignored and must not contain ServiceNow URLs, cookies, sessions, HARs, screenshots, or ticket content.

## Operator flow

1. In the app, keep environment mode on QA.
2. Edit/review the draft fields in the Ticket Draft panel.
3. In `ServiceNow Automation operator`, click `1. Start QA Chromium`.
4. In the new dedicated Chromium window, log in and open a QA Incident form.
5. Return to the app and click `2. Verify current Incident`.
6. Review the field plan shown in the app.
7. Click `3. Autofill current Incident`.
8. Review the QA Incident form manually in Chromium.
9. Only the human operator decides whether to Save/Submit in ServiceNow.

## Current boundary

The operator runtime can fill QA/dev form fields. It does not click Save, Submit, Update, Resolve, or Close. It does not upload files, send email, export cookies/sessions/HAR/screenshots, or call the ServiceNow API.

Default QA values used by the field-trial operator profile:

- Requester: Zheng Zhu
- Category: Desktop
- Subcategory: Password reset
- Location: Shenzhen (YKPC) - CNSNZE
- Channel: Self-service / manual paste
- Assignment group: SN YAGEO Service Desk - China
- Assigned to: Zheng Zhu
- Work notes prefix: SD_China

Route-out behavior remains separate: state should be New, target assignment group should be selected, and Assigned to should be left blank.
