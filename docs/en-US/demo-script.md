# 3–5 Minute Demo Script

## 1. Opening

Service desk agents spend time turning scattered support context into clean ServiceNow tickets. This demo shows a local-only operator workbench that turns pasted issue context into an editable TicketDraft, matches local knowledge articles, shows the recommended support group, tracks monthly Excel fill decisions, and preserves the human-in-the-loop safety boundary.

## 2. Safety statement

This is manual, fake, and local only. The demo drafts and fills allowed text fields, but the human still reviews and submits in ServiceNow. Do not show real ServiceNow pages, real tickets, customer data, browser endpoints, page fingerprints, cookies, sessions, HARs, traces, screenshots, or recordings during the demo.

Never present Save, Submit, Update, Resolve, Close, upload, email, bulk action, or any ServiceNow API write as part of the product.

## 3. Walkthrough narrative

1. Start in the **left column** — expand the **Demo Scenario Library** and click one of the 6 preset fake scenarios (e.g. VPN issue). Show the intake queue, todo list, and history.
2. Move to the **center column** — the workbench flows in operator order: **Selected source** → **Cleaned summary** → **Incident draft** → **Guided demo path** → **Local KB recommendations** → **Monthly Excel fill queue**.
3. Point out the **Incident draft** fields — short description, description, work notes, category, subcategory, assignment group, impact, urgency, priority. Edit one field to prove the agent remains in control.
4. Follow the **Guided demo path** stepper — tracks source → clean → draft → KB → verify/report → optional QA assistance.
5. Show the **Local KB recommendations** — title, match confidence, matched evidence keywords, excerpt, and recommended support group with routing reason.
6. Show the **Monthly Excel fill queue** — "Fill this ticket into monthly Excel" / "Do later — keep in pending queue". Emphasize this is a local-only placeholder; no Microsoft Graph or Excel Web write is performed.
7. Move to the **right column** — show runtime actions: Start QA Chromium, Verify current Incident, Autofill current Incident.
8. Point out the CDP readiness status and the plain-language disabled reasons.
9. **Export a Product-Review Report** from the History page — a self-contained Markdown document covering the full demo session.
10. Close by explaining that the human still reviews and submits in ServiceNow.

## 4. Quick second and third scenarios

Briefly switch to:
- Windows issue demo
- Account access / login issue demo — still fake and local only

Explain that the same intake → cleaned source → TicketDraft → KB recommendation → Excel fill → report evidence story applies to common service desk triage categories.

## 5. Business value line

The value is less repetitive ticket writing, clearer reviewable drafts, stronger safety boundaries, built-in KB matching with support group routing, a monthly fill-tracking workflow, and a demo that reads like a real operator workflow instead of a vertical stack of unrelated panels.

## 6. Closing line

This project demonstrates a warm-light, human-in-the-loop ServiceNow workbench where AI helps draft and fill allowed fields, while the human remains in control of the actual ServiceNow record.
