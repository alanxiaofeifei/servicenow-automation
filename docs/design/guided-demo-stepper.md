# Guided demo/review stepper

## Purpose
Add a compact, non-interactive guided stepper to the center column of the desktop operator workbench so the product story reads:
source -> review context -> draft ticket -> check KB -> verify/report -> optional QA/dev text-field assistance.

The stepper is a storytelling and orientation aid only. It must not imply that ServiceNow saves, submits, updates, resolves, or closes tickets automatically.

## Wireframe

Center column, above the TicketDraft fields:

- Selected source card
- Cleaned summary card
- Guided demo path card
- TicketDraft card
- ServiceNow field preview / autofill plan cards
- KB / recommendation detail cards

Text layout for the stepper card:

- Title row: "Guided demo path" + short chip summary
- Intro copy
- Ordered step list with 6 items
- Footer safety note

## Column responsibilities

### Left column
- source/loading feed
- intake queue
- todo list
- history
- mode/function switching
- settings entry point

### Center column
- selected source detail
- cleaned/normalized source
- guided demo stepper
- generated TicketDraft
- ServiceNow required/common field preview
- autofill plan
- KB/recommendation detail when selected

### Right column
- runtime actions
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- templates/settings
- CDP readiness status
- safety boundary
- environment controls
- recent run evidence

## State matrix

| Step | Label | Completed when | Current when | Locked when |
| --- | --- | --- | --- | --- |
| 1 | Choose source | A queue item is selected | Never, this is the always-complete opener | Never |
| 2 | Review cleaned context | Sanitized source text exists | Sanitized source text exists but later stages are not ready | No source context yet |
| 3 | Draft TicketDraft | Short description, description, and work notes are populated | Draft is partially filled | No draft context yet |
| 4 | Check KB recommendations | At least one KB match exists | Draft is ready but no KB match exists | No cleaned context yet |
| 5 | Verify and report | QA target is configured, browser ready, and page fingerprint is verified | Target exists but browser/page verification is incomplete | Production or no target configured |
| 6 | Optional QA/dev text-field assistance | Selector-verified autofill plan is ready | Verification is ready but autofill is not yet ready | No verified QA/dev scope |

## Main components

- Card shell using the existing warm/light workbench card styling
- Intro text that explains the stepper is local-only and human-reviewed
- Ordered step list with:
  - step number badge
  - title
  - status badge
  - short explanatory note
- Safety footer that repeats the "AI drafts and fills allowed text fields only" boundary

## Empty/loading/error states

- Empty source: step 2 remains current with a note that cleaned source text is waiting
- Empty draft fields: step 3 remains current with a prompt to keep editing
- No KB matches: step 4 stays current and explains that no local recommendation matched yet
- No QA target: step 5 is locked and explains that a QA/dev target must be configured
- No verified browser/page state: step 5 stays current with a note that browser readiness and page fingerprint are missing
- Autofill plan blocked: step 6 is locked and explains the selector-verified plan requirement

## Button enable/disable logic

This card has no interactive controls.

If future iterations add controls, they should remain disabled unless:
- the step is relevant to local demo state,
- the action is read-only or advisory,
- the copy makes the human-review boundary explicit,
- no ServiceNow save/submit/update/resolve/close action is implied.

## Copy text

Recommended visible copy:

- Eyebrow: Guided review path
- Title: Guided demo path
- Chip: Choose source -> review context -> draft ticket -> check KB -> verify/report -> optional QA/dev text-field assistance
- Intro: Follow the story without guessing. This is a compact, local-only guide for the operator flow; the human still reviews every change and performs ServiceNow actions manually.
- Footer: AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.

## Accessibility notes

- Use large step hit areas even though the card is non-interactive.
- Keep status colors paired with text labels, not color alone.
- Use high-contrast warm neutrals that stay legible under astigmatism-friendly conditions.
- Keep the chip and step notes concise to avoid dense wall-of-text reading.
- Preserve keyboard/focus order by placing the card before the TicketDraft fields in DOM order.

## GPT Images 2 mockups generated

- None in this run. The stepper was designed from the existing warm/light workbench language and validated with local markup/tests.

## Implementation handoff for sna-frontend-workbench

- Add the stepper card to the center column before the TicketDraft card.
- Derive step states from local sanitized state only.
- Keep the feature non-interactive and advisory.
- Reuse the existing workbench card, badge, and muted text styles so the UI stays cohesive.
- Keep the safety footer visible so the user cannot confuse the guide with automation.
