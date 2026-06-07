# Phase AN4 — QA Acceptance and Manual Checklist

**Date:** 2026-06-07  
**Phase:** AN4 — Three-column operator workbench polish  
**QA Verdict:** PASS (READY-FOR-MANUAL-VALIDATION-ONLY)  
**Assignee:** sna-qa-acceptance  
**Branch:** next/post-release-operator-cockpit-ab-20260606

---

## 1. Automated Gates

| Gate            | Result | Detail                          |
|-----------------|--------|---------------------------------|
| pnpm build      | PASS   | All 7 workspace projects build  |
| pnpm typecheck  | PASS   | All 6 workspace projects pass   |
| pnpm test       | PASS   | 150/150 desktop, 95/95 adapters, 55/55 CLI — all pass |
| pnpm privacy:scan| PASS  | 288 files scanned, 0 violations |

---

## 2. QA Focus Items — Code Review

### 2.1 Three Columns Visually Distinct

**Evidence (App.tsx):**
- Line 3962–3963: `<aside className="workbench-sidebar">` → `<p className="workbench-column-header eyebrow">SOURCES</p>`
- Line 4173–4174: `<section className="workbench-center">` → `<p className="workbench-column-header eyebrow">WORK PRODUCT</p>`
- Line 5051–5057: `<aside className="workbench-runtime-rail expanded">` → `<p className="workbench-column-header eyebrow">RUNTIME</p>`

**Evidence (styles.css):**
- Line 2705–2708: `.workbench-sidebar { border-right: 1px solid var(--warm-hairline); padding-right: 0.85rem; }`
- Line 2710–2712: `.workbench-runtime-rail { border-left: 1px solid var(--warm-hairline); padding-left: 0.85rem; }`
- Line 5276–5280: `.workbench-column-header { padding: 8px 14px 4px; color: var(--sna-muted); }`
- Line 5282–5284: `.workbench-sidebar { background: rgba(255, 248, 238, 0.85); }` (warm tint, left)
- Line 5286+: `.workbench-runtime-rail.expanded { background: rgba(240, 247, 252, 0.55); border-radius: 22px; }` (cool tint, right)

**Copy changes (4 languages, 11 strings):**
- "Browser actions" → "Runtime actions" (en-US eyebrow, title, collapsedTitle)
- "浏览器操作" → "运行时操作" (zh-CN)
- "瀏覽器操作" → "執行時操作" (zh-TW)
- "Acciones del navegador" → "Acciones de ejecución" (es-ES)

### 2.2 Keyboard Navigation and Disabled Reasons Visible

**Evidence:**
- `*:focus-visible { outline: 2px solid var(--sna-brand); outline-offset: 2px; border-radius: 8px; }` (styles.css)
- Disabled reasons are plain-language across all 4 languages:
  - `disabledProductionReason`: "Disabled: Production is read-only in this workbench..."
  - `disabledTargetReason`: "Disabled: configure an allowed QA target in Settings first."
  - `disabledBusyReason`: "Disabled: another browser or step is still working."
- Disabled action reasons use `.worktree-accept-action-disabled-reason { color: #b54a3a; font-style: italic; }` (red italic, visible in UI)

### 2.3 Workbench Stays Local-Only — No Raw Sensitive Values

- No real ServiceNow URLs, ticket IDs, sys_ids in source code
- All test references use sanitized `qa.service-now.example.invalid`
- Cookie/storage-state/HAR/trace patterns absent from this phase
- `linuxToWslUncPath` function is clipboard-only (Copy path, Copy summary buttons); the UI does not render raw WSL UNC paths or SHA256 hashes directly
- Test assertions for `\\wsl.localhost` and raw SHA256 were removed (no longer asserted in UI output)
- Safety footer: "Manual review only. ServiceNow Save/Submit/Update/Resolve/Close stays manual."
- Boundary chip everywhere: "Local only"

### 2.4 Autofill Remains Separated from Save/Submit/Update/Resolve/Close

- The runtime rail explicitly separates Start QA Chromium → Verify current Incident → Autofill
- Safety copy: "AI drafts and fills allowed fields only. Human reviews and submits in ServiceNow."
- No new Save/Submit/Update/Resolve/Close automation introduced

### 2.5 Acceptance Copy Remains Sanitized

- Manual validation checklist copy uses generic descriptions (no real project names, no real URLs, no ticket numbers)
- Worktree acceptance card, hygiene card, and runtime rail all use sanitized, generic copy
- State chips: Dirty, Fresh, Archival only, History — all generic

---

## 3. Manual Checklist (for Alan)

These items require Windows desktop testing by Alan.

### 3.1 Prerequisites
- [ ] Run `pnpm build` (passes, but rebuild after any local changes)
- [ ] Run `cd apps/desktop && npx electron-vite preview` or launch the packaged build

### 3.2 Three-Column UI Verification
- [ ] Window opens with the three-column shell
- [ ] Left column header reads **SOURCES**
- [ ] Center column header reads **WORK PRODUCT**
- [ ] Right column header reads **RUNTIME**
- [ ] Column headers use muted, smaller type (eyebrow style)
- [ ] Left sidebar has a visible right border separating it from center
- [ ] Right runtime rail has a visible left border separating it from center
- [ ] Left sidebar has a warm/cream background tint
- [ ] Expanded runtime rail has a cool/blue background tint
- [ ] Center column feels like the primary workspace (largest width)

### 3.3 Keyboard Navigation
- [ ] Tab navigation cycles through interactive elements in logical order
- [ ] Focused elements show a visible outline (brand-colored, 2px, rounded)
- [ ] Focus ring does not overlap/become hidden by column borders

### 3.4 Disabled States and Reasons
- [ ] "Start QA Chromium" button shows a clear disabled reason if no QA target is configured (e.g., "Disabled: configure an allowed QA target in Settings first.")
- [ ] "Verify current Incident" button shows a clear disabled reason until CDP is ready
- [ ] "Autofill current Incident" remains separated from any save/submit action
- [ ] Disabled reason text is readable (red italic, not hidden or collapsed)

### 3.5 Runtime Rail Collapsed State
- [ ] Runtime rail can be collapsed
- [ ] Collapsed state shows a hint: "Collapsed. Expand to access Start QA Chromium, Verify, and Autofill."
- [ ] Collapsed title reads "Runtime actions"
- [ ] Collapse/expand animation is smooth (no layout jump)

### 3.6 Local-Only Safety Boundaries
- [ ] No raw ServiceNow URL, ticket ID, sys_id, credential, or session data appears in the UI
- [ ] Safety footer copy is visible: "Manual review only. ServiceNow Save/Submit/Update/Resolve/Close stays manual."
- [ ] "Local only" boundary chip is visible in relevant cards
- [ ] Copy-paste actions do not leak raw UNC paths or SHA256 hashes into the main UI (clipboard-only is acceptable)

### 3.7 Runtime Titles (4 Languages)
- [ ] en-US: Runtime actions
- [ ] zh-CN: 运行时操作
- [ ] zh-TW: 執行時操作
- [ ] es-ES: Acciones de ejecución

---

## 4. Verdict

**PASS** — All 4 automated gates pass. Code review confirms the three-column polish (SOURCES / WORK PRODUCT / RUNTIME headers, border separation, background tints, 11 copy-string changes across 4 languages, focus-visible keyboard navigation, clear disabled reasons, local-only safety boundaries). No raw sensitive values exposed.

**Status:** READY-FOR-MANUAL-VALIDATION-ONLY

Alan should proceed with the manual checklist in Section 3 above on their Windows desktop.

---

## 5. Files Verified

- `apps/desktop/src/App.tsx` — Three-column headers, copy strings, disabled reasons
- `apps/desktop/src/styles.css` — Column borders, background tints, focus-visible, column header styling
- `apps/desktop/src/App.test.ts` — 4 new test assertions for column headers and CSS borders

No unrelated file changes detected.

## 6. Safety / Privacy

- No raw ServiceNow URLs, ticket IDs, sys_ids, credentials, sessions, cookies, storage state, HAR, traces, or screenshots in code or tests
- No ServiceNow API writes (no Save/Submit/Update/Resolve/Close automation)
- No remote upload, PR, merge, tag, or release
- Clipboard functions exist but only for local path copy operations — no sensitive data exposed in primary UI
- Privacy scan: 288 files, 0 violations
