# Change Visibility Panel — What Changed / Why This Matters

## Purpose

Provide an in-app visible surface that explains what changed in the latest hardening
round, why manual validation still matters, what is automated vs. human-only, and
what the app explicitly does not do. This panel prevents Alan from feeling the app is
unchanged between rounds.

## Where it lives

The panel is a collapsible section in the **right runtime rail**, inside the
`QaOperatorRuntimePanel` component, rendered immediately after the safety note.

| State | Behaviour |
|---|---|
| Collapsed (default) | Shows the toggle button with title "What changed in this round" and a chevron icon |
| Expanded | Shows summary text, automated/human-only sections, "why repeated validation" note, "does not do" list, and footer |

## Copy points covered

1. **What changed in the latest hardening round** — title and summary text
2. **Why repeated manual validation still matters** — `whyRepeatedValidation` field
3. **What is automated vs. what remains human-only** — `whatIsAutomated` / `whatIsHumanOnly` fields
4. **What this app does not do** — `doesNotDo` array with 4 items (no Save/Submit/Update/Resolve/Close etc.)

## Localisation

Translations are provided in all 4 app languages:

- English (en-US)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Spanish (es-ES)

All translations live in the `whatChanged` field under `runtime` in
`englishOperatorWorkbenchCopy` and the locale overrides of `operatorWorkbenchTranslations`.

## Files changed

- `apps/desktop/src/App.tsx` — added `whatChanged` translations, `WhatChangedPanel` section in `QaOperatorRuntimePanel`
- `apps/desktop/src/styles.css` — added `.runtime-what-changed`, `.what-changed-toggle`, `.what-changed-content`, etc.
- `apps/desktop/src/App.test.ts` — added test verifying toggle renders only in expanded rail

## Safety

- No real ServiceNow data is referenced
- No raw URLs, ticket IDs, or credentials appear in the panel text
- The panel is purely informational and does not trigger any runtime action
- Collapsed by default to avoid overwhelming the operator
