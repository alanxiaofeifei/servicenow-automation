# Phase AB1 — Next Post-Release Local Product Scope

**Date:** 2026-06-06
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AB0 base:** `main` @ `34b36c6380a56cf0dc1101cbe460aef533a3b3aa` (v0.1.0-rc.1 merge commit)
**AB0 HEAD:** `1bb2e230405f67e428bf56788bbf487861194ddd`
**Profile:** `sna-orchestrator`

---

## 1. State summary after v0.1.0-rc.1

**What shipped.** v0.1.0-rc.1 (PR #140, Alan manual validation PASS, published as GitHub prerelease) includes:

- Three-column Operator Workbench (CSS grid: left sidebar / center work product / right runtime rail)
- Demo Scenario Library (6 presets, collapsible in left sidebar)
- Guided Demo Stepper (6-step non-interactive guide in center column)
- Local KB Recommendations (cards with evidence, confidence, support group)
- Monthly Excel Fill Queue (local placeholder panel, no live export)
- Product-Review Report export (Blob-download Markdown from History page)
- Reordered workbench flow (Selected source → Cleaned summary → Incident draft → Guided Review Path → KB → Monthly Excel)
- U-phase copy polish (Start QA Chromium, Verify current Incident, Autofill current Incident)
- Multilingual copy (EN, zh-CN, es-ES) for all runtime action labels and disabled reasons
- User Guide, Demo Script, Security docs, Field-Trial script refreshed
- Windows double-click launcher and repair helpers
- Dedicated Chromium browser runtime helpers
- 382 passing tests, 244-file privacy scan PASS, clean SHA256 artifact

**Known residual gaps (carried from multiple prior phases):**

| Gap | First documented | Status |
|-----|-----------------|--------|
| Windows double-click on clean machine | Phase T1 | NOT TESTED — the #1 manual gap |
| Demo Scenario Library "Fake" text count test brittle | Phase T1 | Not fixed — test breaks if scenario labels change |
| Flaky `Runtime.evaluate response` test under parallel WSL | Phase T4 | Documented but unaddressed |
| Settings helper text still says old "Start, Check Page, Autofill" | Phase V1 | Minor cosmetic |
| Center-column empty states are blank | Three-column spec §7 | Not yet implemented |

---

## 2. Improvement 1 — Clean-Machine Windows Validation Procedure (docs only)

**Goal:** Produce a runbook document that Alan can use to validate the Windows double-click experience on a clean Windows machine (no Node, no pnpm, no uv, no WSL).

**Non-goals:**
- Performing the test itself (Alan does this)
- Building an installer or auto-update mechanism
- Changing the Windows artifact layout or packaging

**Acceptance criteria:**
1. Document exists at `docs/test/windows-clean-machine-validation-2026-06-06.md`
2. Lists prerequisites (what NOT to install; what IS required)
3. Provides step-by-step: unzip → double-click → observe → click-through checklist
4. Covers all 12 items from Y2 section 5.1 (clean-machine checklist)
5. Includes expected diagnostics for startup failures (log path, sanitized error message)
6. Includes a return channel for Alan's results (pass/fail with notes)

**Likely scope:** 1 new file in `docs/test/`
**Change budget:** 1 file, ~80 lines of Markdown
**Verification:** Alan reads and uses the document
**Safety boundaries:** No code changes; no runtime modifications; no ServiceNow references
**Assigned profile:** `sna-release-docs`
**Dependencies:** None

---

## 3. Improvement 2 — Settings Copy Consistency Pass (frontend + docs)

**Goal:** Fix the `apps/desktop/src/App.tsx` copy object so the Settings panel's helper text refers to runtime actions by their current display names (`Start QA Chromium`, `Verify current Incident`, `Autofill current Incident`) instead of the old `Start, Check Page, and Autofill` terminology. Sweep all other UI copy for similar inconsistencies.

**Non-goals:**
- Changing runtime button labels (they are correct already)
- Changing label -> disabled-reason mapping
- Changing any behavior, logic, or state management
- Adding new i18n strings (existing translations suffice)

**Acceptance criteria:**
1. The old "Start, Check Page, and Autofill" phrasing is gone from all UI copy objects (EN, zh-CN, es-ES)
2. The collapsed/expanded sections in the runtime rail toolbar refer to `Start QA Chromium`, `Verify`, and `Autofill` consistently
3. The Settings environment helper text uses the current label set
4. All four mandatory gates pass (build, typecheck, test, privacy:scan)
5. No runtime behavior changes — only string literal changes in copy objects

**Likely scope:** `apps/desktop/src/App.tsx` (copy object string literals only)
**Change budget:** ~10-20 string replacements, zero logic changes
**Verification:** Manual visual check of Settings panel + automated test suite
**Safety boundaries:** No runtime logic; pure copy; privacy scan covers new strings
**Assigned profile:** `sna-frontend-workbench`
**Dependencies:** None (standalone copy change)

---

## 4. Improvement 3 — Fix Brittle & Flaky Tests (frontend tests)

**Goal:** Two targeted test fixes:

a) **Demo Scenario Library "Fake" text count** — The test asserts a specific count of "Fake" / "QA TEST" text occurrences. Replace with a more robust assertion: count scenario items by `id` or `label` presence instead of counting text fragments. The count should match `demoManualPasteScenarios.length` (currently 6).

b) **`waits for matching Runtime.evaluate response` flake** — This CDP-focused test times out under parallel WSL execution due to resource contention. Add a longer timeout, or use `{retry: 3}` / `--workspace-concurrency=1` in the test config, or refactor the mock to avoid real CDP back-and-forth during parallel runs.

**Non-goals:**
- Changing scenario data or labels
- Changing CDP runtime logic
- Refactoring the test runner or workspace config strategy
- Adding new tests (fix the flake only)

**Acceptance criteria:**
1. The "Fake" text count test uses `demoManualPasteScenarios.length` instead of a magic text count
2. The `Runtime.evaluate` flake test passes consistently under both `pnpm test` (parallel default) and `pnpm -r --workspace-concurrency=1 test` (sequential)
3. All 382+ tests pass consistently on repeated runs
4. Four mandatory gates pass

**Likely scope:** `apps/desktop/src/App.test.ts` (test assertions + timeout config)
**Change budget:** ~10 lines changed, 1 file
**Verification:** Run the full test suite 3 times sequentially; verify zero flakes
**Safety boundaries:** Test-only changes; no runtime code touched
**Assigned profile:** `sna-qa-acceptance`
**Dependencies:** None

---

## 5. Improvement 4 — CDP Readiness Status Indicator (frontend)

**Goal:** Add a visible CDP (Chrome DevTools Protocol) readiness indicator in the runtime rail (right column) so the operator can see the browser connection status at a glance — not just infer it from the verify button's enabled/disabled state.

Current state: The verify button's disabled reason says "start QA Chromium and wait" when CDP isn't ready, and the button enables when CDP is connected. But there's no dedicated indicator showing "Browser: Connected / Disconnected / Connecting".

**Acceptance criteria:**
1. A status chip/badge appears in the runtime rail showing browser connection state:
   - "Browser: disconnected" (idle, no browser launched)
   - "Browser: connecting" (launch in progress)
   - "Browser: connected" (CDP endpoint ready, verify enabled)
   - "Browser: error" (launch failed — show sanitized diagnostic)
2. The indicator updates reactively as `cdpEndpointReady` changes
3. The verify button's disabled reason remains as-is (redundancy is fine)
4. All four mandatory gates pass
5. No change to runtime gating logic, button enabled/disabled behavior, or CDP connection flow

**Non-goals:**
- Changing CDP connection logic or state management
- Adding CDP endpoint details (host:port) to the indicator
- Adding reconnect or retry buttons
- Changing the existing button gating matrix

**Likely scope:** `apps/desktop/src/App.tsx` (new JSX in operator-runtime-panel section), `apps/desktop/src/styles.css` (new status-chip styles)
**Change budget:** ~30 lines TSX + ~20 lines CSS in 2 files
**Verification:** Manual visual check + test suite
**Safety boundaries:** UI-only; no CDP write access, no new IPC/preload surface
**Assigned profile:** `sna-frontend-workbench`
**Dependencies:** None (but can be QA-reviewed by `sna-qa-acceptance` after implementation)

---

## 6. Improvement 5 — Empty/Loading State Polish for Center Column (frontend)

**Goal:** Replace the current blank center-column area (when no source is selected) with meaningful empty-state guidance, and add loading states for the workbench cards.

Current state: When no queue item is selected, the center column shows the workbench cards (Selected source, Cleaned summary, etc.) filled with placeholder text. Some cards are blank. The user sees an empty workbench and has to guess the next step.

**Acceptance criteria:**
1. **Empty state** (no source selected):
   - Center column shows a single welcome card: "Select a source from the left queue, or open the Demo Scenario Library to start a demo."
   - All other cards are hidden until a source is selected
2. **Loading/skeleton state** (source selected, draft generating):
   - The Incident draft card shows muted placeholder bars instead of blank fields
   - KB recommendations show muted placeholder cards
   - No spinners — use skeleton/muted placeholders as specified in the three-column design spec (§7)
3. **Error/blocked state** (draft generation fails):
   - The blocked card shows the exact step that failed and the last safe checkpoint
   - Disabled buttons in the runtime rail remain disabled with plain-language reasons
4. All four mandatory gates pass
5. No change to card content or behavior when state is populated/ready

**Non-goals:**
- Changing the card order or the three-column layout
- Adding new cards or functionality
- Changing existing populated-state rendering
- Adding new state management or data fetching

**Likely scope:** `apps/desktop/src/App.tsx` (conditional rendering in center column section), `apps/desktop/src/styles.css` (skeleton/placeholder styles)
**Change budget:** ~40 lines TSX + ~20 lines CSS in 2 files
**Verification:** Manual visual check (select nothing, select item, simulate draft failure) + test suite
**Safety boundaries:** UI-only; no runtime or data flow changes
**Assigned profile:** `sna-ui-designer` + `sna-frontend-workbench`
**Dependencies:** None

---

## 7. Red-zone list (explicitly out of scope)

The following are **not** part of AB1 and must not be implemented:

| Item | Reason |
|------|--------|
| Live ServiceNow login, browser automation, API writes | Red-zone — requires explicit Alan approval |
| Save / Submit / Update / Resolve / Close automation | Red-zone — never automated |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Windows installer or auto-update mechanism | Feature — not polish |
| Cross-platform (macOS, Linux) support | Feature — not polish |
| New demo scenarios or scenario library rework | Explicitly excluded by task scope |
| New language translations beyond existing EN/zh-CN/es-ES | Scope creep |
| New runtime actions or new CDP capabilities | Feature — not polish |
| New state management, IPC, or preload surface | Risk boundary — avoid new extension points |
| Performance benchmarks, load testing | Out of scope for AB polish round |

---

## 8. Suggested dispatch order

```
Improvement 3 (test fixes)    → sna-qa-acceptance     [parallel, 0-dependency]
Improvement 2 (copy polish)   → sna-frontend-workbench [parallel, 0-dependency]
├── Improvement 5 (empty states) → sna-ui-designer (spec) → sna-frontend-workbench
│     [depends on: improvement 2 accepted; same frontend code area]
├── Improvement 4 (CDP indicator) → sna-frontend-workbench [depends on: none, but test area overlaps with improvement 3]
Improvement 1 (docs runbook)  → sna-release-docs      [parallel, 0-dependency]

Verification sweep:
  Aggregate → sna-qa-acceptance    [depends on: all 5 improvements accepted]
  Privacy review → sna-privacy-security  [depends on: all 5 accepted]
  Docs/release summary → sna-release-docs  [depends on: QA + privacy accepted]
```

All 5 improvements can be dispatched in parallel. Improvements 2 and 5 touch the same `App.tsx` file and should be reviewed together for consistency. Improvement 4 touches the runtime rail section of `App.tsx` — separate section, no overlap with 2 or 5.

---

## 9. Gate policy for AB1 implementation/final tasks

All implementation tasks must pass:
- `pnpm build`
- `pnpm typecheck`
- `pnpm test` (retry with `--workspace-concurrency=1` if resource timeout occurs)
- `pnpm privacy:scan`

If any gate fails, the worker must STOP and block with sanitized evidence. No code moves past a red gate.

---

## 10. Status

```text
Phase AB1 — NEXT POST-RELEASE PRODUCT SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Improvements defined: 5
  - P1: Clean-machine validation runbook (docs)
  - P2: Settings copy consistency pass (frontend + docs)
  - P3: Fix brittle & flaky tests (frontend tests)
  - P4: CDP readiness status indicator (frontend)
  - P5: Empty/loading state polish for center column (frontend)

Red-zone items excluded: 13
Dependencies: 0 (all improvements are dispatch-ready in parallel)
Suggested first wave: improvements 1, 2, 3 (docs + copy + tests — lowest risk)
```

This document defines scope only. No implementation, merge, tag, push, or release was performed.
