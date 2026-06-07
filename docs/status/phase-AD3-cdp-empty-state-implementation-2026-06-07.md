# Phase AD3 — CDP readiness and center empty/loading states — implementation

Date: 2026-06-07
Status: implemented, gates pass
Audience: Alan
Scope: local-only ServiceNow Automation cockpit CDP chip + center placeholders

## Summary

Implemented the AD2 UX spec for two visible polish items:

1. **Browser/CDP readiness chip** in the runtime rail header showing four states (disconnected, connecting, connected, error) with no host/port/endpoint details exposed.
2. **Center empty/loading/error placeholders** across all 6 center cards (selected source detail, cleaned summary, incident draft, guided demo path, KB recommendations, monthly Excel fill queue). Card order is preserved; populated content is unchanged.

## Files changed

- `apps/desktop/src/App.tsx` — 100 insertions, 1 deletion
  - Added `CenterState` and `CdpState` types
  - Added `cdpState` and `centerState` useMemo computations from operator runtime state
  - Added `initialCenterState` prop for testability
  - Added center-state conditionals (populated/empty/loading/error) in all 6 center card sections
  - Added `sourceLoading`/`sourceError` translations in all 4 languages (en-US, zh-CN, zh-TW, es-ES)
  - Added `.browser-status-chip` rendering with `aria-label` in runtime rail header
- `apps/desktop/src/styles.css` — 49 insertions
  - `.center-placeholder` base style (muted text)
  - `.center-placeholder.working` (neutral text for loading)
  - `.center-placeholder.blocked` (accent-colored for error)
  - `.browser-status-chip` pill styles for all 4 states (disconnected/connecting/connected/error)
- `apps/desktop/src/App.test.ts` — 74 insertions
  - 4 tests for browser/CDP chip states (disconnected default, connecting during launch, connected when ready, error when launch blocked)
  - 3 tests for center empty/loading/error placeholders across all 6 cards

## Preserved behavior

- Center populated card order unchanged (Selected source → Cleaned summary → Incident draft → Guided demo path → KB recommendations → Monthly Excel fill queue)
- KB visibility preserved
- Monthly Excel fill queue semantics preserved
- No runtime behavior changes
- Settings, safety model, and runtime gates unchanged
- No real ServiceNow endpoint details exposed in browser/CDP chip

## Gates

| Gate | Result |
| --- | --- |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (99 desktop tests, 86 App tests) |
| `pnpm privacy:scan` | PASS (261 files) |

## Remaining risks

- The center state computation (`centerState` useMemo) is driven by `initialCenterState` prop (for testability), `operatorBusyAction`, and `operatorLastResponse`. In production the `initialCenterState` prop is not passed, so the state derives from runtime actions. This is correct but should be verified in manual smoke testing.
- No spinner was introduced — loading uses muted text placeholders per the AD2 spec.
- Manual Windows/Electron acceptance still required for: Start QA Chromium → CDP connected → Verify enabled → Autofill gated.
