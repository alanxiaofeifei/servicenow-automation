# Phase X1 — Settings helper copy polish

**Date:** 2026-06-05
**Branch:** `next/product-clarity-demo-polish-20260605`
**Commit:** `ee85e17`

## Goal

Fix the known non-blocking cosmetic mismatch from W3: Settings environment helper
text still said `Start, Check Page, and Autofill` (old terms). Update to current
safe language consistent with local demo / Service Desk Workflow Cockpit copy.

## Changed files

| File | Changes |
|------|---------|
| `apps/desktop/src/App.tsx` | 6 occurrences: safety notes, en-US `environmentHelper`, en-US `urlDescriptionProduction`, es-ES `environmentHelper`, evidence detail card, safety constraints table |
| `apps/desktop/src/App.test.ts` | 2 test expectations (en-US and es-ES) |

## Replacement pattern

All occurrences of the old wording were updated:

- `"Start, Check Page, and Autofill"` → `"Start QA Chromium, Verify, and Autofill"`
- `"Start / Check Page / Autofill"` → `"Start QA Chromium / Verify current Incident / Autofill"`
- Spanish: `"Start, Check Page y Autofill"` → `"Start QA Chromium, Verify y Autofill"`

This matches the Phase U2 button label convention where:
- `Start` → `Start QA Chromium`
- `Check Page` → `Verify current Incident`
- `Autofill` stays as `Autofill`

## What was NOT changed

- Runtime behavior, integration behavior, safety boundaries — untouched.
- `docs/status/*.md` historical records — these document prior findings and are
  intentionally left as-is.
- Test line 705 (`expect(output).not.toContain("Browser connection ready; Check Page enabled.")`)
  — this is a negative assertion verifying the old term is absent, which is
  correct behavior.

## Gates

| Gate | Result |
|------|--------|
| `pnpm build` | ✅ Pass |
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ Pass (242 tests across all workspaces) |
| `pnpm privacy:scan` | ✅ Pass (230 files) |

## Remaining risks

None. This is a purely cosmetic copy change — no functional impact.
