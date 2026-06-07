# Phase AE4 — QA Acceptance and Alan Manual Checklist for Release-Readiness Handoff Panel

**Date:** 2026-06-07
**Profile:** sna-qa-acceptance
**Parent task:** t_e4b1a7b6 (Phase AE3 — Release-Readiness Handoff Card Implementation)

---

## 1. Verdict: PASS

All acceptance criteria satisfied, all four mandatory gates pass, no stale paths, no red-zone wording, no automation implication.

---

## 2. Mandatory Gates

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | **PASS** | electron-vite build clean, 27 SSR + 1 preload + 56 renderer modules |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 100/100 desktop tests, 389 total across all packages |
| `pnpm privacy:scan` | **PASS** | 266 files tracked, no privacy violations |

---

## 3. Package Metadata Verification

The handoff card hardcodes metadata for the latest AD-phase local build. Each value was verified against the actual artifact:

| Property | Hardcoded in UI | Actual file | Match |
|----------|----------------|-------------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` | Same file in `dist/release/` | ✅ |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` | Resolves to `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` | ✅ |
| **SHA256** | `7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006` | `sha256sum` confirms match | ✅ |
| **mtime** | `2026-06-07 01:32 CST` | `stat` confirms `2026-06-07 01:32:24 CST` | ✅ |
| **Freshness** | Latest local build (ad > ab) | `ad` built at 01:32, `ab` at 01:04 — `ad` is newer | ✅ |

SHA256 file at `dist/release/` also confirms the checksum.

---

## 4. Acceptance Criteria Verification

### AC1: Manual checklist verifies exact path, checksum, and what-changed summary
✅ The card displays:
- Full Windows UNC path in `<code>` as the first visible content after the card title
- SHA256 checksum in a compact metadata strip
- Change summary ("Browser readiness display + center panel states (3 runtime files modified)")
- Three "Copy" buttons (path, SHA256, summary) using `navigator.clipboard.writeText()`

### AC2: Panel/doc does not point to an older package or stale release artifact
✅ Verified `dist/release/` contents:
- The handoff card targets the `ad` (AD phase) build, which is the newest package (01:32 CST)
- The older `ab` package (01:04 CST) is NOT referenced anywhere in the handoff card code
- No stale paths or dangling references found

### AC3: No red-zone wording or automation implication
✅ Verified:
- Handoff card uses safety boundary language only: "No live ServiceNow login", "No Save / Submit / Update / Resolve / Close", "No external write paths", "No raw customer or ticket data"
- All action buttons are labeled "Copy path", "Copy SHA256", "Copy summary" — clipboard API only
- "Open checklist" button is disabled with tooltip: "Open the latest local handoff before reviewing the checklist."
- No Save/Submit/Update/Resolve/Close action buttons
- No ServiceNow API write, browser automation, or field fill implied
- No raw ServiceNow URLs, ticket IDs, sys_ids, or credentials exposed in the card

### AC4: Required gates pass
✅ See Section 2 above — all four gates pass clean.

### AC5: Status doc clearly states pass/fail and residual manual validation notes
✅ This document. Verdict: **PASS**.

---

## 5. Card Content Verification

| Element | Present | Details |
|---------|---------|---------|
| Eyebrow + title | ✅ | "Release Readiness Handoff" / "Alan should test this file" |
| Path line as `<code>` | ✅ | Full UNC path, first content after title |
| Metadata strip (SHA256/mtime/changed) | ✅ | 3-column `dl` layout |
| Three-panel grid | ✅ | Package facts / Why retest matters / Human-only boundaries |
| Copy path button | ✅ | `navigator.clipboard.writeText()` |
| Copy SHA256 button | ✅ | `navigator.clipboard.writeText()` |
| Copy summary button | ✅ | `navigator.clipboard.writeText()` |
| Open checklist button (disabled) | ✅ | `disabled={true}` with tooltip |
| Center order preserved | ✅ | Handoff card first, followed by selected-source-card |

---

## 6. Test Coverage

The handoff card has dedicated test coverage (App.test.ts lines 1613-1634):

```
it("renders release-readiness handoff card before the center cards")
```

This test verifies:
- "Release Readiness Handoff" text renders
- "Alan should test this file" renders
- `release-readiness-handoff-card` class present
- UNC path with `\\wsl.localhost` present
- SHA256 checksum `7f5ca5a7...` present
- All four action buttons present (Copy path, Copy SHA256, Copy summary, Open checklist)
- Open checklist button is disabled
- Safety boundary text renders ("No live ServiceNow login", "No Save / Submit / Update / Resolve / Close")
- Handoff card appears before the selected-source card in DOM order

All 100 desktop tests pass, including this handoff-specific test.

---

## 7. Alan-Facing Manual Checklist

Use this checklist on Windows after extracting and launching the `ad` build:

```
RELEASE-READINESS HANDFIELD PANEL — MANUAL CHECKLIST
Package: servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip
====================================================================

1.  [ ] Launch the app (double-click the .exe from the extracted zip)
2.  [ ] Confirm the first card in the center panel is "Release Readiness Handoff"
3.  [ ] Confirm the exact UNC path is visible as the first line after the title
       -> Expected: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...
       -> If path differs, note it here: _________________________
4.  [ ] Confirm SHA256 = 7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006
5.  [ ] Confirm mtime = 2026-06-07 01:32 CST
6.  [ ] Read the "What changed" field and understand why retest is needed
7.  [ ] Confirm the three-panel grid is visible:
         Package facts  |  Why retest matters  |  Human-only boundaries
8.  [ ] Click "Copy path" and paste into Windows File Explorer
       -> File Explorer should resolve to the zip file
9.  [ ] Click "Copy SHA256" and paste into a text editor
       -> Should paste: 7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006
10. [ ] Click "Copy summary" and paste into a text editor
       -> Should paste: "Browser readiness display + center panel states (3 runtime files modified)"
11. [ ] Confirm "Open checklist" button is disabled (greyed out)
       -> Tooltip should read: "Open the latest local handoff before reviewing the checklist."
12. [ ] Scroll down — confirm the 6 existing center cards are present and unchanged:
         Selected source -> Cleaned summary -> Incident draft
         -> Guided demo path -> Local KB recommendations -> Monthly Excel queue
13. [ ] Confirm you do NOT see: Save / Submit / Update / Resolve / Close buttons
14. [ ] Confirm no raw ServiceNow URL, ticket ID, sys_id, or credential is visible

PASS / FAIL / BLOCKED (circle one)
Notes: __________________________________________________________________
```

---

## 8. Safety and Privacy Verification

- **No live ServiceNow actions**: Card is read-only display of local file metadata
- **No credential exposure**: UNC path is local WSL filesystem; no ServiceNow URLs, ticket IDs, sys_ids, or customer data
- **Local-only actions**: All copy buttons use browser clipboard API
- **No red-zone wording**: Safety boundary text uses "No Save / Submit / Update / Resolve / Close" as prohibition language, not action labels
- **No ServiceNow writes**: Card has no network requests, API calls, or database operations

---

## 9. Remaining Risks

1. **Hardcoded metadata**: The UNC path, SHA256, mtime, and change summary are hardcoded strings in `App.tsx` (lines ~4001-4015). These must be manually updated when a new package is built. Consider a future phase to auto-generate from `dist/release/`.

2. **Open checklist is disabled**: The button exists but has no action. Future phase could link to a validation doc or open the manual checklist.

3. **Copy summary is hardcoded**: "Browser readiness display + center panel states (3 runtime files modified)" — this was the AD3 change summary and should be regenerated for each round.

4. **Manual Windows verification**: This QA acceptance is local-gate only. Full product acceptance requires Alan to run the manual checklist on Windows (Section 7 above).

---

## 10. Commands Run

```bash
# Package verification
sha256sum dist/release/servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip
stat --format='%Y' dist/release/servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip
# Gates
pnpm build            # PASS
pnpm typecheck        # PASS
pnpm test             # PASS (389 tests)
pnpm privacy:scan     # PASS (266 files)
```

## 11. Files Affected (QA acceptance only)

This task produces a single deliverable document:
- `docs/status/phase-AE4-qa-acceptance-and-manual-checklist-2026-06-07.md` (this file)

No source code was changed — this is QA acceptance only, per task scope.
