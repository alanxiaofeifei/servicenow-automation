# Next Development Round — Orchestrator Task Graph — 2026-06-05

## Snapshot
| Property | Value |
|---|---|
| **Goal** | Turn manually validated RC into more product-ready Service Desk Workflow Cockpit |
| **Repository** | alanxiaofeifei/servicenow-automation |
| **Branch** | `next/manual-validation-followups-20260605` |
| **Base branch** | `nightly/release-candidate-20260604` |
| **Manual validation** | Alan ran Windows app launch + autofill success on 2026-06-05 |
| **Validation commit** | `20e5cdf` on RC branch — record Alan manual RC validation success |

## Task Graph

```
Phase A ──────────────────────────────────────────────┐
  (sna-frontend-workbench)                             │
Phase B ──────────────────────────────────────────┐   │
  (sna-ui-designer)                                │   │
Phase C ─── depends on Phase A ───────────────────┤   │
  (sna-release-docs)                               │   │
Phase D ──────────────────────────────────────┐   │   │
  (sna-qa-acceptance)                          │   │   │
Phase E ─── depends on A, B, C, D ────────────┤   │   │
  (sna-release-docs)                           │   │   │
                                               │   │   │
Phase A  (t_a141802b) ────────────────────────►├───┤   │
Phase B  (t_e2d7d002) ────────────────────────►│   ├───┤
Phase C  (t_8a131a16) ────────────────────────►│   │   ├──► Phase E (t_98ea8e48)
Phase D  (t_11d0aeda) ────────────────────────►├───┘   │   (sna-release-docs)
                                               │       │
                                            [parallel]  │
                                                      [aggregator]
```

## Phase Details

| Phase | ID | Profile | Status | Parents | Priority |
|---|---|---|---|---|---|
| **A** — Validation evidence integration | t_a141802b | sna-frontend-workbench | **ready** | — | 40 |
| **B** — Autofill safety UX polish | t_e2d7d002 | sna-ui-designer | **ready** | — | 40 |
| **C** — Local validation report export | t_8a131a16 | sna-release-docs | **todo** (waits A) | Phase A | 30 |
| **D** — Safety regression expansion | t_11d0aeda | sna-qa-acceptance | **ready** | — | 40 |
| **E** — Release/PR readiness package | t_98ea8e48 | sna-release-docs | **todo** (waits A,B,C,D) | Phases A-D | 20 |

## Phase A Acceptance Criteria
- Validation/Run History panel in desktop app
- Sanitized facts only: app launch ok, browser ready, page inspected, 3 fields planned, 3 filled, no prohibited action
- Tests for sanitized-only evidence display
- No raw ServiceNow URLs, ticket IDs, sys_ids, etc.

## Phase B Acceptance Criteria
- Clearer labels: "manual login only", "inspection before fill", "text fields only", "review manually"
- Success state emphasizes no Save/Submit/Update/Resolve/Close
- Existing tests pass

## Phase C Acceptance Criteria
- Local Markdown/CSV export of validation result
- Dry-run/sanitized status only
- No Excel Web/Graph write, no real ticket metadata

## Phase D Acceptance Criteria
- Expanded tests asserting allowed text fields only
- Assertions for cleaned/sanitized evidence mode
- No UI wording implies Save/Submit/Update/Resolve/Close

## Phase E Acceptance Criteria
- Draft PR description prepared
- Release checklist updated
- Docs updated with "validated manually by Alan on 2026-06-05"
- Do NOT push, merge, tag, or create GitHub Release
- Write next-round-ready-for-alan-review or next-round-blocked

## Safety Boundaries (all phases)
- **GREEN**: code edits, tests, docs, builds — autonomous
- **AMBER**: requires profile approval for merge/tag/PR
- **RED**: hard stop — no real ServiceNow saves/submits, no live API writes, no screenshots/HAR/cookies export

## Available SNA Profiles
- sna-frontend-workbench: UI implementation
- sna-ui-designer: UI design
- sna-browser-cdp: Chromium/CDP
- sna-servicenow-form: form inspection/autofill safety
- sna-windows-runtime: runtime/packaging
- sna-qa-acceptance: QA/testing
- sna-privacy-security: privacy/safety review
- sna-pm-acceptance: product acceptance
- sna-release-docs: PR/docs/release
- codex-gpt55-control: code/runtime safety (AMBER approval gate)
