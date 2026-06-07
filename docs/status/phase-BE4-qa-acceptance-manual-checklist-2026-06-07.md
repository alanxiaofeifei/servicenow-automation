# Phase BE4 — QA Acceptance and Alan Manual Checklist

**Date:** 2026-06-07
**QA profile:** `sna-qa-acceptance`
**Task:** `t_df848c51`
**Parent task (BE3):** `t_735ae481` — P0 Re-Acceptance Checklist card implementation
**Privacy level:** sanitized. No real ServiceNow URLs, ticket IDs, sys_ids, credentials, sessions, or browser evidence appear in any artifact.

---

## VERDICT: PASS — ready for Alan manual validation

All automated gates pass. All 10 QA acceptance criteria from the BE3 handoff are verified by source inspection. The P0 checklist card is faithful to the BE2 spec copy, structurally correct, and privacy-clean.

---

## 1. Automated gates

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm typecheck` | **PASS** | All 7 workspace projects typecheck clean |
| `pnpm test` | **PASS** | 169/169 tests pass (65 desktop + 55 CLI + 95 adapters + 34 ai + 17 profiles + 6 kb + 83 core) |
| `pnpm build` | **PASS** | desktop (main+preload+renderer) + CLI build clean |
| `pnpm privacy:scan` | **PASS** | 288 files scanned — no issues |

**Commands run:**
```
cd /home/alanxwsl/projects/servicenow-automation
pnpm typecheck   → exit 0
pnpm test        → exit 0, 169 tests pass
pnpm build       → exit 0
pnpm privacy:scan → exit 0, 288 files clean
```

---

## 2. QA acceptance criteria verification

All 7 acceptance criteria from the BE3 handoff (section 5) are verified by source inspection:

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | P0 checklist card renders below Release Readiness Handoff card | **PASS** | App.tsx line 4244 (handoff) → line 4330 (P0 checklist) → line 4475 (repo-hygiene). Correct ordering. |
| 2 | All 8 P0 criteria rows visible in table | **PASS** | App.tsx lines 4364-4435. 8 `<tr>` elements with criteria #1 through #8. |
| 3 | Safety banner and safety rules prominent and readable | **PASS** | Line 4337: `p0-checklist-safety-label` with accent-colored banner. Lines 4342-4349: 4 safety rules in styled `<ul>`. |
| 4 | Runbook diff and BC7 closure collapsible on click | **PASS** | Line 4438: `<details className="p0-checklist-detail">` for runbook diff. Line 4460: `<details>` for BC7 closure. Both start closed, expandable. |
| 5 | Reminders show ❌ and ✅ with correct aria labels | **PASS** | Lines 4467-4470: `<span role="img" aria-label="cross mark">❌</span>` and `<span role="img" aria-label="check mark">✅</span>`. |
| 6 | No real ServiceNow URLs, ticket IDs, or credentials | **PASS** | grep for `service-now.com`, `[0-9a-f]{32}` (sys_id), `INC[0-9]{6,}` returns zero matches in the P0 card section. All references are sanitized phase names (AE, AF, AD, AN, AQ, AP, BD, BE, PR #97). |
| 7 | No Save/Submit/Update/Resolve/Close automation language | **PASS** | The card only references these actions in safety warnings: "Do not click Save / Submit / Update / Resolve / Close" (line 4347) and "no Save/Submit buttons exist" (line 4414). No functional Save/Submit/Update/Resolve/Close behaviors exist. |

---

## 3. Copy fidelity check

The rendered card copy matches the BE2 UX spec (section 5, exact labels and copy) and the BE2 checklist doc verbatim:

| Section | BE2 spec copy | Rendered card (App.tsx) | Match |
|---------|--------------|------------------------|-------|
| Eyebrow | "P0 Re-Acceptance Checklist" | Line 4333: `P0 Re-Acceptance Checklist` | ✓ |
| Title | "Use this checklist to re-validate all 8 P0 criteria from PR #97." | Line 4334: `Use this checklist to re-validate all 8 P0 criteria from PR #97.` | ✓ |
| Safety label | "Local-only: Verify only. No live ServiceNow writes." | Line 4337: `Local-only: Verify only. No live ServiceNow writes.` | ✓ |
| Target package | "BE6 cumulative package (AE through BD)" | Line 4340: `BE6 cumulative package (AE through BD)` | ✓ |
| Safety list | All 4 items | Lines 4345-4348: all 4 items | ✓ |
| P0 criteria | 8 rows with exact text | Lines 4364-4435: all 8 rows, verbatim | ✓ |
| Runbook diff | Table with 7 aspect rows | Lines 4449-4456: 7 rows | ✓ |
| BC7 closure | Full BC7 statement | Line 4462: full closure text | ✓ |
| Reminders | 4 items with ❌/✅ | Lines 4467-4470: all 4 items | ✓ |

**Difference noted:** The rendered card adds an "Implemented in" column (not in the BE2 spec labels list but present in the BE2 checklist doc). This is an appropriate improvement that makes the criteria more actionable for Alan by showing which phases implemented each criterion.

---

## 4. Product acceptance checklist (for Alan's Windows validation)

This section is the manual checklist Alan will follow on Windows. Copy it for your validation session.

### 4.1 Automated gates (already verified)

- [x] `pnpm typecheck` — PASS
- [x] `pnpm test` — PASS (169/169)
- [x] `pnpm build` — PASS
- [x] `pnpm privacy:scan` — PASS (288 files)
- [x] Copy fidelity — PASS (verbatim match to BE2 spec)
- [x] Privacy — PASS (no raw ServiceNow data in card)

### 4.2 Manual checklist (Alan on Windows)

Use the **P0 Re-Acceptance Checklist** visible in the app's workbench center column in the BE6 package.

| # | Criterion | Verify by | Pass condition | Pass/Fail |
|---|-----------|-----------|---------------|-----------|
| 1 | Windows double-click launches app | Extract BE6 ZIP on clean Windows; double-click `.exe` | Window opens within 3-10s, title "ServiceNow Automation" | ☐ |
| 2 | Startup failure shows sanitized diagnostics | Delete `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\`, re-launch | Overlay shows "Browser runtime not found" with recommendation + "Copy diagnostic" button | ☐ |
| 3 | Start QA Chromium opens visible dedicated Chromium window | Run `prepare-chrome-for-testing.ps1`, launch app, click "Start QA Chromium" | Visible Chromium window opens; CDP chip: disconnected → connecting → connected | ☐ |
| 4 | CDP readiness visible in app | After Start QA Chromium, check runtime rail | Chip shows green "connected" state | ☐ |
| 5 | Verify enables only after CDP readiness | Before Chromium: Verify disabled/gray. After connected: Verify enabled. | Before: disabled. After: enabled. | ☐ |
| 6 | Verify-only is read-only (no writes) | Click Verify after CDP connects | Read-only summary. No fields filled, no navigation, no Save/Submit buttons. | ☐ |
| 7 | Three-column Operator Workbench | Inspect app layout | Three columns: left nav/history/settings, center detail, right runtime actions | ☐ |
| 8 | Packaged Windows artifact path is correct | Check handoff card or package-info section | Path uses dynamic WSL distro name: `\\wsl.localhost\<distro>\...\be6-...-local.zip` | ☐ |

### 4.3 Safety checks during validation

| Check | Description |
|-------|-------------|
| No live ServiceNow writes | All Verify operations inspect only — no Save/Submit/Update/Resolve/Close |
| No field filling | Autofill remains separated from Verify |
| No raw data in logs | App events are sanitized — no ticket IDs, sys_ids, or credentials in diagnostics |
| No unintended navigation | Verify does not navigate to real ServiceNow URLs |

### 4.4 If something fails

1. Note which P0 criterion failed and the exact sanitized error text
2. Record the condition that caused the failure (e.g., "Chromium window didn't appear")
3. Do NOT attempt to fix or work around — report to the development pipeline
4. Attach sanitized log evidence (trim paths, remove real URLs/credentials)

---

## 5. Safety and privacy statement

This BE3 implementation introduces:

- **No** live ServiceNow login, browser navigation, or API writes
- **No** Save / Submit / Update / Resolve / Close automation
- **No** field filling or autofill behavior
- **No** display of real ServiceNow URLs, ticket IDs, sys_ids, credentials, cookies, sessions, tokens, or browser evidence
- **No** new IPC/RPC endpoints, preload bridge methods, or electron main-process changes
- **No** new npm dependencies, build steps, or infrastructure

All changes are local-only React rendering and CSS. The checklist card is a read-only reference surface that mirrors the existing static markdown document. No runtime or safety behavior is altered.

---

## 6. Remaining risks

| Risk | Assessment | Mitigation |
|------|-----------|------------|
| Wide table on narrow windows | 7-column table may overflow <800px viewports | `word-break: break-all` on `<code>`; existing workbench min-width helps |
| Collapsible sections start closed | Alan must click to expand secondary sections | Intentional — progressive disclosure; these are not part of primary flow |
| Copy drift between doc and rendered card | Card copies from BE2 spec verbatim | If checklist doc updates, card JSX needs manual sync |
| Windows-only validation | Linux/Mac Electron behavior not tested | BE6 target is Windows-only; Alan validates on Windows |

---

## 7. Verdict summary

```
PHASE BE4 QA ACCEPTANCE: PASS

All automated gates:      PASS (4/4)
All QA criteria verified:  PASS (7/7)
Copy fidelity to BE2:     PASS (9/9 sections)
Privacy/safety:           PASS (0 issues)
Manual checklist ready:   YES (section 4 above)

The P0 Re-Acceptance Checklist card is correctly rendered,
faithful to spec, privacy-clean, and ready for Alan's
Windows manual validation.
```
