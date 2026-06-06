# Demo Scenario Library

## Overview

The Demo Scenario Library provides an in-app catalog of fake/local incident presets
that instantly show the intake → draft → KB → report value without requiring real
ServiceNow data. It lives in the left sidebar of the operator workbench.

## Location

- **UI**: Left sidebar, between the intake source selector and the source list.
- **Component**: Inline JSX inside `App.tsx`, rendered as a `<details>` collapsible
  element with class `workbench-demo-library`.

## Data source

Renders `demoManualPasteScenarios` (imported from
`@servicenow-automation/adapters/browser`), which provides 6 preset scenarios:

| ID | Label | Source Channel |
|---|---|---|
| `vpn-issue` | QA TEST — Fake Chat intake: VPN connection issue after password change | Teams message |
| `shared-mailbox-evidence` | QA TEST ONLY — Fake shared mailbox item with attachment evidence | Shared mailbox item |
| `phone-confirmation` | QA TEST ONLY — Fake phone intake requiring confirmation | Phone call |
| `self-service-normalization` | QA TEST ONLY — Self-service ticket requiring normalization | Self-service ticket |
| `remote-support-teams` | QA TEST ONLY — Remote support / Teams troubleshooting checklist | Teams message |
| `account-login-issue` | QA TEST ONLY — Mock account access demo issue | ServiceNow Chat transcript |

All labels include "QA TEST ONLY" or "Fake" markers. Source channel is derived from
`sourceChannelForScenario()` in `App.tsx`.

## Interaction

- Clicking a scenario card calls `selectScenario(scenario.id)`, which:
  1. Sets `selectedScenarioId` to the clicked scenario.
  2. Finds and selects the matching queue item in the source list.
  3. Resets field overrides, copy draft state, and checklist.
- The selected scenario shows a highlighted state (accent border + dot).

## Safety

- All content is fake/local/demo only.
- Safety notice at the bottom of the library section:
  "Fake/local/demo data only. No real ServiceNow, Teams, mailbox, phone, or API connection."
- No Save/Submit/Update/Resolve/Close automation.
- No real ServiceNow operations, API calls, or browser automation.

## State management

- `selectedScenarioId` state tracks the active scenario.
- `details` element is closed by default (collapsible accordion) to save space.
- The `open` attribute is intentionally not set — user opens the library when needed.

## Key files

- `apps/desktop/src/App.tsx` — section rendering and `selectScenario` handler.
- `apps/desktop/src/styles.css` — `.workbench-demo-library*` and `.workbench-demo-item*` rules.
- `apps/desktop/src/App.test.ts` — test for library rendering and demo labeling.
- `packages/adapters/src/manual-paste.ts` — `demoManualPasteScenarios` data source.

## Future improvements

- Add more scenario presets (printer queue, laptop performance, shared mailbox access).
- Support custom scenario creation by operators.
- Add scenario metadata tags (category, severity, channel type).
