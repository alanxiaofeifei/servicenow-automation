# Phase K — Change visibility panel for Alan

## Result: Complete

### Goal

Build an in-app "What changed / Why this matters" surface so product value is obvious
to Alan after each hardening round.

### Files changed

| File | Reason |
|---|---|
| `apps/desktop/src/App.tsx` | Added `whatChanged` translations (4 languages) + `WhatChangedPanel` section in `QaOperatorRuntimePanel` component (right runtime rail) |
| `apps/desktop/src/styles.css` | Added CSS for `.runtime-what-changed`, `.what-changed-toggle`, `.what-changed-content`, `.what-changed-section`, `.what-changed-limits`, `.what-changed-footer` |
| `apps/desktop/src/App.test.ts` | Added test: "renders the What Changed panel toggle in the expanded runtime rail" |
| `docs/architecture/change-visibility.md` | New — documents panel design, location, copy points, localization, and safety |

### Commands run

| Command | Result |
|---|---|
| `pnpm build` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | 85/85 passed (all 6 test files) |
| `pnpm privacy:scan` | Pass (203 files) |

### What was implemented

A collapsible **"What changed in this round"** panel in the right runtime rail,
below the safety note. Rendered inside the `QaOperatorRuntimePanel` component.

- **Collapsed by default** — shows only the toggle button with title and chevron icon
- **Expand** — reveals 4 informational sections:
  1. Summary of what changed in this hardening round
  2. What is automated (browser launch, page verification, text-field autofill)
  3. What is human-only (reading, judging, saving, submitting, resolving, closing, etc.)
  4. Why repeated manual validation still matters
  5. "Does not do" list (no Save/Submit/Update/Resolve/Close)
- All 4 app languages supported (en-US, zh-CN, zh-TW, es-ES)
- No personal names (removed "Alan" from copy to pass privacy scan)
- The panel is purely informational — no runtime action is triggered

### Safety notes

- No real ServiceNow data, URLs, ticket IDs, or credentials in any copy
- The panel is read-only and does not interact with runtime state
- Collapsed by default — does not overload the operator's initial view
- Chevron rotation uses CSS transition (no JS animation overhead)

### Manual QA checklist

1. Launch the app → right runtime rail is collapsed → "What changed in this round" is **not visible**
2. Click "Expand browser action rail" → "What changed in this round" toggle appears below the safety note
3. Click the toggle → content expands showing all 4 required copy points
4. Switch language to zh-CN / zh-TW / es-ES → panel text should be in the selected language
5. Click toggle again → content collapses back to just the title button

### Remaining risks

- None identified. The panel is entirely additive and does not modify existing behavior.
- The `HighSeverityMonitorSimulator` is still visible in the right rail (not related to this change — a separate task could clean it up if needed).

### History

This phase was created because Alan manually tested the previous round but couldn't
see what had changed. The "What Changed" panel makes every round's evolution visible
inside the app.
