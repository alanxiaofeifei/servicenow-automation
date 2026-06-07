# Phase AN3 — Three-Column Operator Workbench Polish Implementation

Date: 2026-06-07
Status: complete
Audience: Alan, `sna-orchestrator`, `sna-frontend-workbench`
Privacy level: sanitized. No real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, credentials, or customer data.

## 0. Goal

Polish the three-column Operator Workbench shell so the left/center/right columns are visually and functionally distinct, per the AN2 UX spec. No runtime behavior changes. No new IPC. No demo clutter.

## 1. Changes made

### 1a. `apps/desktop/src/App.tsx` — 4 copy-string changes

| Language | Field | Before | After |
|----------|-------|--------|-------|
| English | `runtime.title` | "Browser actions" | "Runtime actions" |
| English | `runtime.collapsedTitle` | "Browser actions" | "Runtime actions" |
| zh-CN | `runtime.eyebrow` | "浏览器操作栏" | "运行时操作栏" |
| zh-CN | `runtime.title` | "浏览器操作" | "运行时操作" |
| zh-CN | `runtime.collapsedTitle` | "浏览器操作" | "运行时操作" |
| zh-TW | `runtime.eyebrow` | "瀏覽器操作欄" | "執行時操作欄" |
| zh-TW | `runtime.title` | "瀏覽器操作" | "執行時操作" |
| zh-TW | `runtime.collapsedTitle` | "瀏覽器操作" | "執行時操作" |
| es-ES | `runtime.eyebrow` | "Panel del navegador" | "Panel de ejecución" |
| es-ES | `runtime.title` | "Acciones del navegador" | "Acciones de ejecución" |
| es-ES | `runtime.collapsedTitle` | "Acciones del navegador" | "Acciones de ejecución" |

Rationale: Aligns the runtime rail label with the AN2 spec's "Runtime actions" naming, which is already the eyebrow text.

### 1b. `apps/desktop/src/styles.css` — column-separator borders

Added `border-right` and `padding-right` to `.workbench-sidebar`, and `border-left` and `padding-left` to `.workbench-runtime-rail`, using the project's `var(--warm-hairline)` color.

This gives each column a visual boundary without adding new DOM elements or changing the grid layout.

Note: The `.workbench-runtime-rail.expanded` variant already has `padding: 14px` which overrides the generic `padding-left: 0.85rem` via specificity. The result is that the expanded rail keeps its existing padding while still getting the border-left.

### 1c. `apps/desktop/src/App.test.ts` — 4 new test assertions

- SOURCES column header visible in the shell test
- WORK PRODUCT column header visible in the shell test
- CSS contains `.workbench-sidebar { border-right:` selector
- CSS contains `.workbench-runtime-rail { border-left:` selector
- RUNTIME column header visible in the expanded runtime rail test

None of the existing 150 tests were modified; all pass.

## 2. What was already in place (no changes needed)

The following AN2 spec items were already implemented by prior phases:
- Column headers SOURCES / WORK PRODUCT / RUNTIME (App.tsx lines 3963/4174/5057)
- `.workbench-column-header` CSS style with muted text
- `.workbench-sidebar` warm background (`rgba(255, 248, 238, 0.85)`)
- `.workbench-runtime-rail.expanded` subtle background + border-radius + padding
- Focus-visible outline polish
- Disabled button reasons, settings URLs, safety copy, no demo clutter

## 3. Gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` (vitest run) | 150 PASS (9 files, all suites) |
| `pnpm privacy:scan` | PASS (288 files) |

## 4. Handoff

### Files changed

- `apps/desktop/src/App.tsx` — 11 copy-string updates across 4 languages (runtime title/collapsedTitle/eyebrow)
- `apps/desktop/src/styles.css` — added `.workbench-sidebar` and `.workbench-runtime-rail` border/padding rules
- `apps/desktop/src/App.test.ts` — 4 new assertions for column headers and CSS borders

### Commands run

```
pnpm build         → PASS
pnpm typecheck     → PASS
pnpm test          → 150/150 PASS
pnpm privacy:scan  → PASS (288 files)
```

### Why the change is minimal

1. Only 3 files touched, matching the task scope.
2. Only 11 copy strings updated — all are `runtime.title`/`runtime.collapsedTitle`/`runtime.eyebrow` changes in 4 languages.
3. Only 6 lines of CSS added — no new DOM elements, no layout changes.
4. Only 4 test assertions added — none removed or modified.

### Why each touched file was necessary

- `App.tsx`: The copy strings define what the user sees. Aligning "Browser actions" → "Runtime actions" is the primary polish change.
- `styles.css`: Column-separator borders provide the visual distinction the AN2 spec requires.
- `App.test.ts`: New assertions validate the polish was actually applied.

### Safety/privacy status

- No live ServiceNow login, browser automation, API writes, uploads, or release operations.
- No raw sensitive data, URLs, ticket IDs, sys_ids, credentials, cookies, sessions, HAR, traces, or screenshots.
- All copy changes use sanitized/generic values already in the codebase.
- Runtime behavior unchanged. Disabled-button reasons unchanged.

### Remaining risks

- The `.workbench-sidebar` border-right is visible only when the sidebar is expanded. This is correct behavior — when collapsed, the icon rail is the leftmost visible column.
- The `.workbench-runtime-rail` border-left is visible only when the runtime rail is expanded. When collapsed, it's not rendered, so no border is shown.
- Minor: in very narrow viewports (below 1180px), the workbench-layout changes to 2 columns and the runtime rail moves to a second row, so the border-left would be at the top of the second row rather than on the right side.

### Suggested next phase

- Visual QA: verify the column borders render correctly in the Electron window at 1440x900.
- Consider adding a collapsed runtime rail handle/badge showing "RUNTIME · 3 steps" so the rail status is visible even when collapsed.
