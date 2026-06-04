# ServiceNow Automation — Interview & Pitch Package

## 90-Second Elevator Pitch

"I built a human-in-the-loop ServiceNow Automation Workbench for service desk agents. It takes support context from multiple channels — Teams chat, self-service, shared mailbox, manual paste — and turns it into a structured, editable Incident draft with KB article matching, support group recommendations, and a dry-run report. Everything is local, deterministic, and demo-only. No real ServiceNow API, no browser automation, no auto-submit. The agent reviews and edits every field before anything reaches the mock form. The goal is to reduce repetitive ticket preparation time while keeping the human accountable for every submission. The full source, documentation, and a packaged Windows RC are ready for supervised QA trial."

## Interview Bullets

### For the Hiring Manager

- The project started from scratch as a deliberate new rebuild — no legacy code carried forward. Previous prototype (archived separately) informed requirements; this codebase is clean TypeScript/React/Electron.
- Architecture is intentionally local-first (no cloud dependency, no ServiceNow API calls in P0). JSON profiles and local files for storage; Zod for validation.
- All P0 features are implemented: multi-source intake connectors, ticket drafting with field mapping, KB article keyword matching, support group recommendation with confidence scoring, missing info detection, risk control gate (stop-before-write), and Excel/CSV/Markdown dry-run reporting.
- Deterministic mock AI provider throughout — no real LLM call. The adapter pattern allows a real provider later without changing the core model.
- Safety-first by design: every write path is gated by action-specific approval phrases. Submit, Save, Update, Resolve, and Close each require separate explicit approval. The demo mode disables all of them.
- Regression audit confirmed: desktop is effectively text-field-only via forced runtime plan filtering; no full-field autofill exposed; CLI is plan/fixture/dry-run only.
- Windows RC packaging is complete (portable zip + SHA256 + START-HERE guide). Verified checksum, forbidden content audit (zero matches), critical resource audit (all present).

### For the Service Desk Lead

- The workbench mirrors real operational stages: intake, source review, ticket drafting, field mapping, KB reference, support routing, and reporting.
- The multi-source intake (Teams note, self-service, chat, shared mailbox, manual paste) models how real desk agents receive context — not just email.
- KB matching is local keyword-based (no external AI, no ServiceNow KM API). It searches demo articles on the short description and returns scores, matched keywords, recommended support groups, and handling steps.
- The Excel dry-run report is an audit trail for QA readiness: it records scenario ID, required field check, approval phrase gate, stop rule check, QA isolation check, and trial result — without connecting to any workbook or writing anything.
- QA readiness is bakeoff-tested: manual fill runbook, safe smoke checklist, and controlled single-ticket gate exist for the first supervised trial.
- The packaged Windows RC can be extracted and launched with a double-click. WSL not required on Windows; the Electron app runs natively.
- Demo-only constraint built in: fake usernames, fake ticket IDs, fake KB articles, fake email addresses. The privacy scan enforces this across all 190+ source files.

## Safety Statement (What It Does / Does Not Do)

### Does

- Accepts pasted issue context from multiple source types (Teams note, self-service, chat, shared mailbox, manual paste)
- Cleans and normalizes context (raw vs cleaned view)
- Generates structured TicketDraft JSON with standard ServiceNow fields
- Matches local demo KB articles by keyword scoring
- Recommends support groups with confidence and evidence
- Flags missing information and risk indicators
- Shows a Risk Control Gate before any form interaction
- Displays a mock ServiceNow Incident Preview (clearly labeled "MOCK / DEMO")
- Generates dry-run Excel row preview (CSV / Markdown copy)
- Provides text-field-only automated fill of demo mock form fields
- Packages portable Windows zip with launcher, runbooks, and checksum

### Does NOT

- Save, Submit, Update, Resolve, or Close any ServiceNow record
- Call any ServiceNow API (REST, SOAP, GraphQL, or KM)
- Connect to any real ServiceNow instance (Polaris, Utah, Washington, Vancouver, or Xanadu)
- Open, control, or inspect any real browser page
- Use real LLM / AI provider calls
- Log in to any external service
- Export HAR, trace, screenshot, video, cookie, session, or storage state
- Upload, email, or bulk-create anything
- Use real customer data, employee names, ticket IDs, sys_ids, or URLs

## Key Differentiators

- **Greenfield rebuild** — not a refactor of legacy code. Conscious architectural decisions from day one.
- **Deterministic-first** — mock AI provider means the demo is predictable, testable, and safe. Real AI is a future adapter swap, not a core dependency.
- **Safety instrumentation** — action-specific approval phrases, stop-before-write gate, write-path audit, privacy scan gate.
- **QA-ready** — runbooks, checklists, controlled single-ticket smoke checklist, and dry-run evidence format exist alongside the code.
- **Packaged for a reviewer** — Windows RC zip with START-HERE guide, manual test checklist, and verified checksum. No build-from-source required to evaluate.
