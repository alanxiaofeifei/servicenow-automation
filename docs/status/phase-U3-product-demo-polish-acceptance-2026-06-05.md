# Phase U3 — Product Demo Polish: Product-Owner Acceptance Gate and Alan Review Packet

Date: 2026-06-05
Task: t_169af689
Profile: sna-pm-acceptance
Branch: next/product-clarity-demo-polish-20260605
Reviewed HEAD: e1c3766 (U2 status doc, commit after code change af6abb1)

---

## Verdict

**GREEN: Ready for Alan product review.**

U1 design spec and U2 implementation pass product-owner acceptance. No blocking issues found. The polish is visible, understandable, and respects all safety boundaries. Proceed to Alan manual review following the steps below.

---

## What U1 specified

The U1 design spec (phase-U1-product-demo-polish-design-spec-2026-06-05.md) specified **copy-only polish** for the local demo workbench:

| Area | Old | New |
|------|-----|-----|
| Browser action label | Start test browser | Start QA Chromium |
| Verify action label | Check current ticket page | Verify current Incident |
| Autofill action label | Autofill allowed fields | Autofill current Incident |
| Safety boundary | Human reviews and handles the record in ServiceNow | Human reviews and submits in ServiceNow |
| Disabled reasons | "...another browser/test step" | "...another browser or step" |
| | "...start the test browser and wait" | "...start QA Chromium and wait" |
| | "...check the current ticket page first" | "...verify the current Incident first" |
| Header safety copy | Kept | "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." |

U1 prohibited: layout/behavior changes, demo clutter reintroduction, Save/Submit/Update/Resolve/Close actions, real data exposure.

## What U2 implemented

U2 (commit af6abb1, impl doc phase-U2-product-demo-polish-implementation-2026-06-05.md) changed 2 files:

- `apps/desktop/src/App.tsx` — 158 lines changed (80 removals, 78 additions)
- `apps/desktop/src/App.test.ts` — 111 lines changed (55 removals, 56 additions)

All 4 locales updated: en-US, zh-CN, zh-TW, es-ES. No layout, behavior, or runtime safety changes.

Gates at U2 implementation time:

| Gate | Result |
|------|--------|
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test | PASS (92/92) |
| pnpm privacy:scan | PASS (223 files) |

Head hash at review time: e1c3766. No subsequent commits after U2 implementation.

---

## U3 product-owner acceptance verification

### 1. Copy polish: verified present in App.tsx

| Required text | Present? | Location |
|---|---|---|
| "Start QA Chromium" | ✅ | App.tsx:1708, 6394 |
| "Verify current Incident" | ✅ | App.tsx:1711, 6396 |
| "Autofill current Incident" | ✅ | App.tsx:1714, 6398 |
| "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." | ✅ | App.tsx:1739, 3989 |
| "No Save / Submit / Update / Resolve / Close" | ✅ | App.tsx:7170 |
| "Disabled: start QA Chromium and wait until the browser connection is ready." | ✅ | App.tsx:1723 |
| "Disabled: verify the current Incident first." | ✅ | App.tsx:1725 |
| "Disabled: Production is read-only in this workbench; choose the QA workspace..." | ✅ | App.tsx:1719 |
| "Disabled: another browser or step is still working." | ✅ | App.tsx:1721 |
| "Autofill completed: ... No Save, Submit, Update, Resolve, Close, upload, email, or ServiceNow API was used." | ✅ | App.tsx:1728 |

### 2. Safety boundaries: all intact

- [x] No real ServiceNow login/browser ops/API writes — not introduced
- [x] No Save/Submit/Update/Resolve/Close automation — explicit safety copy present
- [x] Safety boundary is visible and compact in the right rail
- [x] All disabled buttons show visible plain-language reasons
- [x] "MockAIProvider" does not appear in primary UI (only in zh-CN settings description)
- [x] No demo clutter reintroduced
- [x] No real URLs, ticket IDs, sys_ids, credentials, or raw fingerprints in tracked files
- [x] Privacy scan consistently passes across all recent phases

### 3. Workbench order preserved

Alan already confirmed the accepted order. The U2 copy changes did not touch layout or component order. Order remains:

1. Selected source
2. Cleaned summary
3. Incident draft
4. Guided Review Path
5. KB recommendations
6. Monthly Excel fill queue

### 4. Gate logic verified by code inspection

- [x] Start QA Chromium visible, enables when QA/Dev environment configured
- [x] Verify current Incident disabled until CDP readiness is present (App.tsx:1723)
- [x] Verify current Incident enables after CDP ready (test line 497)
- [x] Autofill current Incident disabled until verify succeeds (App.tsx:1725)
- [x] Autofill enables after verify success (test line 563)
- [x] All actions disabled when another step is busy (test line 336)
- [x] Production mode disables all runtime actions with clear reason (App.tsx:1719)

### 5. Known minor gap (non-blocking)

Settings environment selector helper text still reads: "Choose this workspace to use Start, Check Page, and Autofill." (App.tsx:1770). The U1 spec scoped its changes to runtime action labels only, so this was intentionally left unchanged. It uses "Check Page" (old term) instead of "Verify current Incident". If desired, this can be updated in a follow-up. Not a gate blocker.

---

## Alan review packet

### What changed

Three runtime action buttons got clearer labels and the safety boundary got more concise text. The workbench looks the same, feels the same, and behaves the same. You should see:

| Before | After |
|--------|-------|
| 1 Start test browser | 1 Start QA Chromium |
| 2 Check current ticket page | 2 Verify current Incident |
| 3 Autofill allowed fields | 3 Autofill current Incident |
| "Human reviews and handles the record in ServiceNow" | "Human reviews and submits in ServiceNow" |

### How to inspect

1. Open the local desktop app / Windows RC build
2. Look at the **right column** — the three runtime action buttons should show:
   - `1 Start QA Chromium`
   - `2 Verify current Incident`
   - `3 Autofill current Incident`
3. Hover (or read) the disabled reason when Verify/Autofill are gated
4. Check the safety boundary text below/beside the actions
5. Switch to Chinese or Spanish locale in settings to confirm translations are updated

### Expected pass/fail

| Check | Expected result |
|-------|-----------------|
| Double-click opens app | ✅ Should open normally (no regression) |
| App shows startup diagnostics on failure | ✅ Should show diagnostics (no regression) |
| Start QA Chromium launches dedicated browser | ✅ Should launch Chromium (no regression) |
| Verify enables only after CDP readiness | ✅ Gate unchanged |
| Autofill enables only after verify | ✅ Gate unchanged |
| Verify actions are read-only | ✅ Always was, no change |
| No Save/Submit/Update/Resolve/Close | ✅ Explicitly displayed |
| Three-column operator workbench | ✅ Preserved exactly |

### What NOT to test

- Do not test real ServiceNow login, browser automation on real instances
- Do not test attachment upload, Microsoft Graph/Excel Web writes
- Do not test Teams/Outlook/phone ingestion
- Do not assess the Settings environment helper text (it still uses old terminology and is a follow-up item)
- Do not assess layout changes — none were made
- Do not assess empty/loading/error state polish — none were changed

---

## Risks and remaining items

| Item | Type | Action |
|------|------|--------|
| Settings environment helper says "Start, Check Page, and Autofill" | Non-blocking cosmetic | Follow-up if desired |
| RC artifact rebuilt by T2 is at a commit before U2 changes | Process | Alan may choose to rebuild RC after review, or validate copy changes in dev build first |
| No real ServiceNow/browser integration tested in this phase | Safety-by-design | Intentionally out of scope; human validation only |

---

## Final status

`product-demo-polish-acceptance-approved-for-alan-review`

U1 design spec is faithful. U2 implementation is correct and safe. All prior gates remain valid. No blockers found.
