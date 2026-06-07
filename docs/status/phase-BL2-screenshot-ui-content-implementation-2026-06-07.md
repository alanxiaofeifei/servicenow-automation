# Phase BL2 — Screenshot-driven UI/content fixes — Implementation

Date: 2026-06-07 23:55
Status: Implementation complete
Gates: pnpm build ✅ | pnpm typecheck ✅ | pnpm test ✅ (186/186) | pnpm privacy:scan ✅ (507 files)

## Changes made

### 1. Hardcoded "SOURCES" → translated via workbenchCopy (App.tsx:4064)
The left sidebar column header "SOURCES" was hardcoded English. Now uses `{workbenchCopy.nav.sources}`, which shows "Sources" in English, "来源" in zh-CN, "來源" in zh-TW, "Fuentes" in es-ES.

### 2. Hardcoded "WORK PRODUCT" → translated via workbenchCopy (App.tsx:4253)
The center column header "WORK PRODUCT" was hardcoded English. Now uses `{workbenchCopy.workProduct}`, which shows "Work product" in English, "工作产品" in zh-CN, "工作產品" in zh-TW, "Producto de trabajo" in es-ES.

### 3. "PO Re-Acceptance Checklist" → lowercase (App.tsx:4624, App.test.ts:1877)
Per the BL1 spec, the uppercase "Re-Acceptance" casing was inconsistent. Changed to "PO re-acceptance checklist" for natural English casing.

### 4. New translation keys added
Added `workProduct` and `sources` to all four language translation profiles (en-US, zh-CN, zh-TW, es-ES) in the operatorWorkbenchTranslations object.

## Files changed (my changes only)

| File | Lines changed | Reason |
|------|--------------|--------|
| `apps/desktop/src/App.tsx` | ~20 lines (16 translation entries + 3 render references) | Hardcoded strings → translations, copy fix |
| `apps/desktop/src/App.test.ts` | 1 line | Updated test assertion to match new copy |

## Why each file was necessary

- **App.tsx**: Contains the render code where "SOURCES", "WORK PRODUCT", and "PO Re-Acceptance Checklist" are defined, plus the translation objects.
- **App.test.ts**: Contains a test assertion that checks for "PO Re-Acceptance Checklist" — needed updating to match the new lowercase copy.

## Safety/privacy status

- No real ServiceNow URLs, ticket IDs, sys_ids, credentials, or customer data touched.
- No runtime behavior changes.
- No new browser automation or write capabilities.
- All operations are purely UI copy/translation changes.

## Remaining risks

- None identified. This is a copy-only change to three UI strings and their translation tables. All four gates pass.
- The workspace has additional uncommitted changes from prior BL2 phases (not part of this task).

## Verification

- `pnpm build` — passes
- `pnpm typecheck` — passes (all packages)
- `pnpm test` — 186/186 pass (104 in App.test.ts, 82 in other packages)
- `pnpm privacy:scan` — 507 files pass
