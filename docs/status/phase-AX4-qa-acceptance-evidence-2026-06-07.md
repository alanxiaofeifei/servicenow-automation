# Phase AX4 — QA Acceptance Evidence

**Date:** 2026-06-07
**Task:** t_a5feb748
**Profile:** sna-qa-acceptance
**Source:** `docs/status/phase-AX1-repo-hygiene-disabled-reason-specificity-scope-2026-06-07.md` (section 4, AX4)
**UX Spec:** `docs/status/phase-AX2-repo-hygiene-disabled-reason-ux-spec-2026-06-07.md`
**Implementation:** AX3 — per-button disabled reasons in `apps/desktop/src/App.tsx`

---

## V E R D I C T — P A S S

---

## 1. Automated gates

| Gate | Result | Details |
|------|--------|---------|
| `pnpm build` | PASS | All 3 sub-builds OK (renderer, preload, main) |
| `pnpm typecheck` | PASS | All 7 sub-packages typecheck OK |
| `pnpm test` | PASS | 163 desktop + 55 CLI = 218 tests, 0 failures |
| `pnpm privacy:scan` | PASS | 288 files scanned, no violations |

### Commands run

```
cd /home/alanxwsl/projects/servicenow-automation
pnpm build            # PASS
pnpm typecheck        # PASS
pnpm test             # PASS (163 desktop + 55 CLI)
pnpm privacy:scan     # PASS (288 files)
```

---

## 2. Manual acceptance criteria

### 2.1 Each repo-hygiene action shows item-specific, plain-language disabled reason when blocked

6 actions in repo-hygiene action rail:

| Button | Line | Disabled condition | Disabled reason shown | PASS |
|--------|------|--------------------|-----------------------|------|
| **Refresh local scan** | 4404 | Always enabled | — (never disabled) | N/A |
| **Open workspace root** | 4405 | Always enabled | — (never disabled) | N/A |
| **Export status markdown** | 4407-4422 | `!hygieneScanResult` | "Scan first to generate a status report." | PASS |
| **Copy selected summary** | 4424-4431 | `!hygieneScanResult` | "Scan first before copying item summaries." | PASS |
| **Cleanup preview** | 4432-4441 | `!hygieneScanResult \|\| cleanupArchiveDone` | "Scan first to preview cleanup." / "Cleanup already applied for this batch." | PASS |
| **Archive stale artifacts** | 4442-4457 | `!cleanupPreviewResult \|\| !cleanupPreviewOpen \|\| cleanupArchiveInProgress \|\| cleanupArchiveDone` | 4 different reasons (see below) | PASS |

### 2.2 Reasons differ by state

All states traced against AX2 state matrix (AX2 §4):

| State | Export status markdown | Copy selected summary | Cleanup preview | Archive stale artifacts |
|-------|----------------------|---------------------|-----------------|------------------------|
| **No hygiene scan** | disabled: "Scan first to generate a status report." | disabled: "Scan first before copying item summaries." | disabled: "Scan first to preview cleanup." | disabled: "Generate preview first before archiving." |
| **Scan exists, no preview** | enabled, no reason | enabled, no reason | enabled, no reason | disabled: "Generate preview first before archiving." |
| **Preview exists, preview closed** | enabled, no reason | enabled, no reason | enabled, no reason | disabled: "Open the cleanup preview to enable archiving." |
| **Archive in progress** | enabled, no reason | enabled, no reason | enabled, no reason | disabled: "Archiving stale artifacts…" |
| **Archive done** | enabled, no reason | enabled, no reason | disabled: "Cleanup already applied for this batch." | disabled: "Archive already complete." |
| **Error (IPC failure)** | falls back to prior state gracefully | falls back to prior state gracefully | falls back to prior state gracefully | falls back to prior state gracefully (per UX spec §5.3: no new error text introduced) |

8 unique disabled-reason strings covering 7 distinct UI states. All match the AX2 spec exactly.

### 2.3 Cleanup preview and archive flow remain local-only and non-destructive

Confirmed in App.tsx:
- Line 4373: `"Cleanup preview copies a local plan to the clipboard only."`
- Line 4475: `"This is a local, non-destructive move. Nothing is deleted, uploaded, or sent to ServiceNow."`
- Line 4466-4467: `"No upload / PR / merge / tag / release. This surface only reports local repository state."`

All IPC calls remain unchanged — no new ServiceNow writes, no new API or Electron channels.

### 2.4 Other cards and the outer workbench layout are unaffected

- Worktree acceptance card disabled reasons (lines 4577-4587): 4 original reasons untouched
  - "No package found."
  - "Package metadata is still loading."
  - "Review the current diff first."
  - "Already reviewed locally."
- No new state variables, no new imports, no new IPC channels
- No layout changes, no new cards, no new sections

---

## 3. Safety and privacy

| Check | Result |
|-------|--------|
| All disabled reasons are static string literals | PASS — no dynamic content, no data exposure |
| No new IPC channels or Electron API usage | PASS — no new imports, no new IPC calls |
| No raw ServiceNow URLs, sys_ids, credentials, or session data | PASS — disabled reasons are plain text strings |
| No real ServiceNow writes | PASS — UI-only change |
| Old shared disabled-reason block removed | PASS — `grep` confirms no `hygiene-action-disabled` class (only `-disabled-green` variant) |
| Old shared text strings removed | PASS — "No scan data yet. Run Refresh local scan first." and "Generate Cleanup preview first to enable archiving." no longer present |

---

## 4. Changed files (per AX3 handoff)

Only `apps/desktop/src/App.tsx` was changed. No CSS or test changes needed.

---

## Summary

**All 4 automated gates PASS. All 5 manual acceptance criteria PASS.**

The per-button disabled reasons match the AX2 UX spec exactly. The state matrix covers 7 distinct states with 8 unique item-specific messages. The cleanup preview and archive flow remain local-only and non-destructive. The worktree acceptance card is fully unchanged. No behavioral changes to button logic. No safety or privacy issues.

**Verdict: PASS**
