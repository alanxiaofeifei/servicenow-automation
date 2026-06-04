# 3–5 Minute Demo Script

## 1. Opening (0:00–0:30)

Service desk agents spend time turning scattered support context into clean ServiceNow tickets. This demo shows a human-in-the-loop workbench that converts pasted issue context from multiple intake channels into an editable Incident draft, matches local knowledge articles, recommends support groups, generates a dry-run report, and fills a safe mock ServiceNow form.

## 2. Safety statement

This is not an auto-submitter. The tool automates drafting, not accountability. Final operation remains manual.

This demo uses **fake/sanitized data only**. Do not show real ServiceNow pages, real tickets, customer data, browser endpoints, page fingerprints, cookies, sessions, HARs, traces, screenshots, or recordings.

Forbidden: Save, Submit, Update, Resolve, Close, upload, email, bulk action, and any ServiceNow API write.

## 3. VPN scenario walkthrough (0:30–2:30)

1. Show the app opened with demo mode ON, real ServiceNow OFF, auto-submit disabled.
2. Click **Load VPN Demo** — the Intake Queue shows the default "Teams note: VPN connection issue after password reset" item with a source channel badge.
3. **Intake Source Review** — point out the source type selector (Teams note / self-service / chat / shared mailbox / manual paste). Show raw vs cleaned context.
4. **TicketDraft** — highlight the generated fields: Short Description, Description, Work Notes, Category (Network), Subcategory (VPN), Assignment Group, Impact, Urgency, Priority.
5. **KB Match** — show the knowledge article match for VPN issues, with score and matched keywords. Show support group recommendation ("Demo Network Support — 95% confidence").
6. **Missing Info and Risk Flags** — review what the tool identified as needing confirmation.
7. **Risk Control Gate** — read the stop-before-write confirmation.
8. **Mock ServiceNow Incident Preview** — show the form preview. Point out that Submit / Save / Update / Close are disabled in demo mode.
9. **Excel Dry-Run Report** — show the dry-run preview row with QA readiness fields. Demonstrate Copy CSV Row and Copy Markdown buttons.
10. Edit one draft field to prove the agent remains in control.

## 4. Quick additional scenarios (2:30–3:00)

Briefly switch to:

- **Windows Demo** — same flow, different category.
- **Mock Account Access Issue Demo** — no browser login, showing intake from a different source channel.

Explain that the same multi-source intake → draft → KB → report flow applies to common service desk triage categories.

## 5. Business value line (3:00–3:30)

The value is reduced repetitive ticket writing, more consistent field selection, built-in KB matching and support routing, better work notes, dry-run reporting evidence, and safer handoff to support teams — all while keeping final submit manual and human-in-the-loop.

## 6. Interview closing line

This project demonstrates how I combine real service desk workflow understanding with practical AI-assisted automation design while respecting ITSM control boundaries. The complete source, documentation, and demo package are available in the repository.
