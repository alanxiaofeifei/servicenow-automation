# Windows operator quickstart

Use this for the field-trial build of ServiceNow Automation.

## Open the app

Double-click this file on the Windows desktop:

`C:\Users\alanx\Desktop\ServiceNow Automation.cmd`

Keep the black command window open while the app is running. It builds/starts the WSL Electron app and then opens the ServiceNow Automation window.

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
