# K10 text-only no-save field-trial release handoff

Date: 2026-05-26
Branch: `review/k9-browser-runtime-error-20260526`
Status: release-handoff ready for the current field-trial slice

This document is sanitized. It intentionally omits real ServiceNow URLs, ticket identifiers, page fingerprints, requester/customer/assignment data, exact draft field values, cookies, sessions, credentials, screenshots, HARs, traces, recordings, and browser endpoints.

## Honest release label

Use this wording for K10, demo narration, and reviewer handoff:

```text
ServiceNow Automation — text-only no-save field-trial build
```

This is not:

- full Incident automation
- production automation
- unattended browser automation
- a Save/Submit/Update/Resolve/Close tool
- a bulk ticket creation tool
- an OAuth/password/MFA automation tool
- a final signed standalone Windows installer

## What is accepted for this slice

Alan has provided sanitized manual PASS evidence for the Windows desktop operator flow:

1. The Windows app can open the operator UI.
2. `Start QA Chromium` opens a dedicated/tool-owned Chromium window.
3. The dedicated QA browser uses a tool-owned persistent profile, so a saved ServiceNow sign-in can be reused between launches.
4. The dedicated profile is separate from the user's normal Chrome/Edge profile.
5. Login remains user-controlled; the tool does not type credentials or automate OAuth/MFA.
6. The current-ticket check reaches a ready state on a manually opened QA Incident form.
7. Autofill fills only the approved text fields:
   - Short description
   - Description
   - Work notes
8. Autofill stops before every ServiceNow write action.

## Safety boundary still in force

The current field-trial build must continue to state and enforce:

- no Save
- no Submit
- no Update
- no Resolve
- no Close
- no attachment upload
- no email/customer notification
- no ServiceNow REST/API write
- no production or production-shadow operation
- no automatic login
- no app-managed credential storage
- no cookie/session/storage-state export
- no screenshot, HAR, trace, or recording artifact committed to the repo
- no external AI prompt containing real ServiceNow page content

Autofill success does not imply approval for Save/Submit/Update/Resolve/Close.

## Current operator story

The safest user-facing description is:

```text
The app helps the operator prepare and fill the three reviewed text fields on a QA/dev Incident form.
The operator controls login, verifies the current form, reviews the filled fields, and remains responsible for any final ServiceNow action.
```

Mention the persistent browser profile this way:

```text
The QA browser uses a dedicated tool-owned persistent profile. Saved sign-in can be reused for convenience, but the app does not store or enter credentials and does not reuse the user's daily browser profile.
```

Avoid these claims:

- `fully automated Incident handling`
- `agent submits tickets`
- `production ready`
- `autonomous ServiceNow operator`
- `packaged final Windows release`
- `all required fields are automated`
- old manual-login limitation wording that implies saved sign-in reuse is unavailable
- raw internal credential-policy enum strings

## Suggested recording shot list

Use fake or blurred/sanitized content. Do not show raw ServiceNow URLs, ticket numbers, requester names, assignment groups, field values, browser endpoints, page fingerprints, cookies, sessions, HARs, traces, or developer console output.

1. Show the Windows operator app opening.
   - Narration: `This is the field-trial Windows operator flow, not a production automation release.`
2. Show the warm-light Operator Workbench and the three-step runtime area.
   - Narration: `The app separates browser launch, current-form check, and Autofill.`
3. Click `Start QA Chromium`.
   - Narration: `This opens a dedicated tool-owned QA browser profile. It does not attach to my normal Chrome or Edge profile.`
4. If ServiceNow is already signed in, explain it as saved sign-in reuse.
   - Narration: `The saved sign-in is reused by the dedicated profile; the app is not logging in for me.`
5. Manually open a QA Incident form in the dedicated browser.
   - Do not show the full URL or any real ticket/customer/person data.
6. Return to the app and run the current-ticket check.
   - Narration: `The check is read-only and must pass before Autofill is enabled.`
7. Run Autofill.
   - Show only that the three text fields became filled; blur or crop actual values if needed.
   - Narration: `This fills only Short description, Description, and Work notes.`
8. End on the safety boundary.
   - Narration: `The tool does not Save, Submit, Update, Resolve, or Close. The human operator reviews the form and decides the next ServiceNow action.`

## Reviewer checklist before publishing or demoing

- [ ] The demo title says `text-only no-save field-trial build`.
- [ ] The recording does not show raw ServiceNow URLs or record identifiers.
- [ ] The recording does not show requester/customer/assignment data or exact field values.
- [ ] The recording does not show browser endpoints, page fingerprints, cookies, sessions, HARs, traces, or console output.
- [ ] The narration clearly says login is user-controlled and saved sign-in is only from the dedicated profile.
- [ ] The narration clearly says the build fills only three text fields.
- [ ] The narration clearly says Save/Submit/Update/Resolve/Close are not automated.
- [ ] Any packaging statement is honest: this is a field-trial Windows operator flow, not a final signed standalone installer unless a later packaging gate proves that separately.

## Next slice after K10

Full required/starred-field Autofill is a separate reviewed slice. It must not be described as part of the current release.

That later slice should cover, at minimum:

- Requester
- Category
- Subcategory
- Location
- Channel
- Assignment group
- Assigned to
- State
- route-out behavior: State becomes New and Assigned to is cleared when routing to another assignment group
- Work notes prefix behavior

Because those are reference/select/status/routing controls, they need control-type-specific verification and a separate safety review before any live QA/dev execution.
