# Phase AN5 — Privacy/Security Audit: Three-Column Workbench Polish

Date: 2026-06-07
Status: complete
Audience: Alan, `sna-orchestrator`
Privacy level: sanitized. No real ServiceNow URLs, ticket IDs, sys_ids, credentials, or customer data.

## 0. Verdict

**APPROVE** — no blocking issues.

## 1. Scope audited

Phase AN3 three-column Operator Workbench polish, as delivered by parent task `t_80980f4b`:

- **11 copy-string changes** across 4 languages: "Browser actions" → "Runtime actions" (title, collapsedTitle, eyebrow in en-US/zh-CN/zh-TW/es-ES)
- **2 CSS border rules**: `border-right` on `.workbench-sidebar`, `border-left` on `.workbench-runtime-rail`
- **4 test assertions**: SOURCES header, WORK PRODUCT header, CSS border selectors in stylesheet, RUNTIME header in expanded rail
- **1 default change**: `initialRuntimeRailExpanded` from `false` → `true`
- **Column header labels**: SOURCES, WORK PRODUCT, RUNTIME added to UI markup
- **Focus-visible CSS polish**: `outline: 2px solid var(--sna-brand)` with offset and border-radius

Files touched: `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, `apps/desktop/src/App.test.ts`

## 2. Gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | 150/150 PASS (desktop), 55/55 PASS (cli) |
| `pnpm privacy:scan` | PASS (288 files) |

## 3. Privacy audit findings

### 3a. Copy-string changes — CLEAN

All 11 copy changes are straightforward label renames. No ServiceNow URLs, ticket IDs, sys_ids, credentials, cookies, sessions, HAR, traces, screenshots, customer names, or write-path semantics introduced.

| Language | Field | Before | After | Safe? |
|----------|-------|--------|-------|-------|
| en-US | `runtime.title` | "Browser actions" | "Runtime actions" | ✓ |
| en-US | `runtime.collapsedTitle` | "Browser actions" | "Runtime actions" | ✓ |
| zh-CN | `runtime.eyebrow` | "浏览器操作栏" | "运行时操作栏" | ✓ |
| zh-CN | `runtime.title` | "浏览器操作" | "运行时操作" | ✓ |
| zh-CN | `runtime.collapsedTitle` | "浏览器操作" | "运行时操作" | ✓ |
| zh-TW | `runtime.eyebrow` | "瀏覽器操作欄" | "執行時操作欄" | ✓ |
| zh-TW | `runtime.title` | "瀏覽器操作" | "執行時操作" | ✓ |
| zh-TW | `runtime.collapsedTitle` | "瀏覽器操作" | "執行時操作" | ✓ |
| es-ES | `runtime.eyebrow` | "Panel del navegador" | "Panel de ejecución" | ✓ |
| es-ES | `runtime.title` | "Acciones del navegador" | "Acciones de ejecución" | ✓ |
| es-ES | `runtime.collapsedTitle` | "Acciones del navegador" | "Acciones de ejecución" | ✓ |

Rationale confirmed: "Runtime actions" is the AN2 spec term already used as eyebrow text; aligning title/collapsedTitle removes the "Browser" term and puts distance between the UI label and ServiceNow browser operations.

### 3b. CSS border rules — CLEAN

```css
.workbench-sidebar {
  border-right: 1px solid var(--warm-hairline);
  padding-right: 0.85rem;
}

.workbench-runtime-rail {
  border-left: 1px solid var(--warm-hairline);
  padding-left: 0.85rem;
}
```

Pure CSS using existing project CSS variables. No URLs, no data, no identifiers.

### 3c. Test assertions — CLEAN

Four assertions added, all validating UI layout/CSS, not ServiceNow data:

```typescript
expect(output).toContain("SOURCES");
expect(output).toContain("WORK PRODUCT");
expect(styles).toContain(".workbench-sidebar {\n  border-right:");
expect(styles).toContain(".workbench-runtime-rail {\n  border-left:");
```

And in the expanded runtime rail test:
```typescript
expect(output).toContain("RUNTIME");
```

No raw ServiceNow values, no identifiers, no credentials.

### 3d. Runtime rail default — CLEAN

`initialRuntimeRailExpanded` default changed from `false` to `true`. This is a UI behavior change only — the runtime rail now starts expanded. No security impact. Tests updated to explicitly pass `false` where default-shell behavior is tested.

### 3e. Column headers — CLEAN

SOURCES, WORK PRODUCT, RUNTIME are local-only UI labels. They name the three columns of the operator workbench and contain no ServiceNow data.

### 3f. Focus-visible polish — CLEAN

```css
*:focus-visible {
  outline: 2px solid var(--sna-brand);
  outline-offset: 2px;
  border-radius: 8px;
}
```

Accessibility improvement. No data, no identifiers, no URLs.

## 4. Privacy improvements observed

The AN3 changeset also removed two previously hardcoded test assertions that exposed local system details:

```diff
-    expect(output).toContain("\\\\wsl.localhost");
-    expect(output).toContain("4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde");
```

These were replaced with dynamic path generation (`linuxToWslUncPath`) in the non-AN3 worktree acceptance code. The AN3 diff alone does not add any new UNC paths or hashes to tests.

## 5. Targeted scans

| Scan target | Files | Hits | Nature |
|-------------|-------|------|--------|
| `service-now.com` | App.test.ts | 1 | Deny-path assertion (`.not.toContain`) |
| `sys_id`, `INC*`, `TASK*` | App.tsx | 1 | Safety disclaimer text |
| `token=`, `password=`, `credential` | App.tsx, App.test.ts | 48 | All are type defs, safety copy, or deny-path assertions |
| `wsl.localhost` | App.test.ts | 1 | Deny-path assertion (`.not.toContain`) |
| SHA256 hash literal | App.test.ts | 0 | Previously present; now removed (privacy improvement) |

**Zero actual secrets, credentials, or identifiers found.**

## 6. Local-only boundary

The "Runtime actions" label and column headers maintain the existing local-only boundary:

- No new Save/Submit/Update/Resolve/Close copy or semantics
- No new ServiceNow URL/host references
- No new credential, session, or cookie paths
- No new browser automation or DOM write capability
- Existing safety copy (disabled button reasons, "Manual review only", "Local only") unchanged

## 7. Non-blocking note

The `linuxToWslUncPath` helper (added in non-AN3 work but present in the working tree) hardcodes the WSL distro name `Ubuntu-Compact`. This is a local system path convention, not a ServiceNow secret, credential, or customer identifier. Non-blocking.

## 8. Evidence reviewed

- Full `git diff` of `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, `apps/desktop/src/App.test.ts`
- All 4 gate outputs (build, typecheck, test, privacy:scan)
- Targeted regex scans for ServiceNow hosts, ticket IDs, credentials, UNC paths, hashes
- AN3 parent task handoff doc at `docs/status/phase-AN3-three-column-workbench-implementation-2026-06-07.md`
- Contextual review of all 48 "credential"/"token" string matches (all safety copy)

## 9. Handoff

### Verdict

**APPROVE** — the AN3 three-column polish introduces no privacy or security issues. All copy, CSS, tests, and behavior changes are local-only and contain zero ServiceNow data, secrets, or write-path semantics.

### Files changed (this audit)

- `docs/status/phase-AN5-privacy-security-audit-2026-06-07.md` (this file)

### Commands run

```
pnpm build         → PASS
pnpm typecheck     → PASS
pnpm test          → 150/150 desktop + 55/55 cli PASS
pnpm privacy:scan  → PASS (288 files)
git diff HEAD -- apps/desktop/src/App.tsx apps/desktop/src/styles.css apps/desktop/src/App.test.ts
```

### Remaining risks

None. The AN3 changes are cosmetic (labels + borders + column headers). No runtime behavior, IPC, browser launch, CDP, or autofill code was modified.

### Suggested next phase

- AN6: Windows local package refresh to verify the three-column borders render correctly in the packaged Electron window.
