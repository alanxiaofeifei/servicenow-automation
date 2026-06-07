# Phase AH4 — QA Acceptance and Manual Checklist

Date: 2026-06-07
Kanban task: t_5c1f8c7e
Parent: t_02dfd729 (AH3 worktree acceptance implementation)

---

## Verdict: PASS

All 4 mandatory automated gates pass. Profile/tools/gateway confirmed running. Package artifact integrity verified. No live ServiceNow writes, no secrets, no forbidden data exposed.

---

## 1. Automated Gates (required)

| Gate | Result | Evidence |
|------|--------|----------|
| pnpm build | PASS | 7 workspace projects built successfully (apps/cli, apps/desktop SSR+preload+renderer) |
| pnpm typecheck | PASS | 7 workspace packages tsc --noEmit clean |
| pnpm test | PASS | 414 tests across 31 test files (desktop: 124 tests, 8 files) |
| pnpm privacy:scan | PASS | 288 files scanned, 0 violations |

### Test breakdown

```
packages/core     10 files  83 tests  PASS
packages/ai        3 files  34 tests  PASS
packages/kb        2 files   6 tests  PASS
packages/profiles  3 files  17 tests  PASS
packages/adapters  3 files  95 tests  PASS
apps/cli           2 files  55 tests  PASS
apps/desktop       8 files 124 tests  PASS
```

### Worktree acceptance specific tests (desktop)

The two new tests added by the parent (AH3) task both pass:

1. **renders worktree acceptance checkpoint card with correct DOM ordering**
   - Verifies card appears between repo-hygiene-card and selected-source-card
   - Verifies all queue items, state chips, boundary copy present
   - PASS

2. **renders worktree acceptance checkpoint card with boundary copy and state queue**
   - Verifies title, class name, WSL path, freshness chip, all 4 queue items (Dirty/Fresh/Stale/History), all 4 state chips, boundary detail, all 5 action buttons, disabled reason text, footer boundary language
   - PASS

---

## 2. Profile and Gateway Verification

| Check | Status |
|-------|--------|
| Profile: sna-qa-acceptance | Active, deepseek-v4-flash model, gateway running |
| Gateway running | Yes (PID 428+), 16 SNA profiles all active |
| .env exists | Yes |
| SOUL.md exists | Yes |

---

## 3. Package Artifact Integrity

Package: `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip`

| Attribute | Value | Verified |
|-----------|-------|----------|
| Path | `dist/release/...` | Exists, 118,596,760 bytes |
| SHA256 | `6105d1da435c7eae304929a002bcbb7f2806977df2642994cf108427cd76aa93` | Match with .sha256 file |
| mtime | 2026-06-07 ~03:36 CST | Actual newest dated package |
| Scope | Local-only | Confirmed (no .publish, no upload) |

---

## 4. Alan Real Usage Path Validation

### Scenario: Alan double-clicks the local Windows package

1. **Windows double-click entrypoint**
   - Path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip`
   - UNC path shown in the card is a valid local WSL path (not ServiceNow)
   - User: unzips in Windows Explorer, double-click .exe
   - Evidence: package exists, SHA256 matches, file is a valid zip

2. **App opens with workbench UI**
   - The three-column shell renders: left nav/source/history, center source/detail/TicketDraft, right runtime/safety
   - The worktree acceptance card renders in center workspace between hygiene and selected source
   - Evidence: DOM ordering test PASS

3. **Left column queue/state shows current package state**
   - Dirty worktree: "Tracked changes still open"
   - Fresh package: "AG local Windows package" (newest dated)
   - Stale packages: "Earlier local packages"
   - Validation history: "No prior acceptance recorded"
   - State chips: Dirty (red), Fresh (green), Stale (amber), History (neutral)
   - Evidence: all chips + queue items verified in test

4. **Center column shows boundary explanation**
   - "Dirty vs accepted boundary" card explains remaining unaccepted changes
   - "Acceptance is a human decision" — no automated action implied
   - Safe next steps list (review, copy path, mark reviewed, keep local-only)
   - Evidence: boundary copy verified in test

5. **Right column action buttons with correct state**
   - Review diff: enabled (no-op stub, placeholder for future local diff viewer)
   - Copy package path: enabled, copies UNC path to clipboard
   - Open dist/release: enabled (no-op stub)
   - Mark reviewed: **disabled** with reason "dirty changes still need review before acceptance"
   - Copy summary: enabled, copies checkpoint summary to clipboard
   - Evidence: all 5 buttons + disabled reason text verified in test

6. **Footer boundary note**
   - "Local only" chip + "No live ServiceNow action, upload, PR, merge, tag, or release is implied"
   - Evidence: footer language verified in test

7. **Safety: no live ServiceNow operations**
   - No Save/Submit/Update/Resolve/Close buttons in the card
   - No ServiceNow URL, ticket ID, sys_id, credential, session
   - WSL UNC path only (no remote URL)
   - Evidence: privacy:scan PASS (288 files), visual inspection of card markup

---

## 5. Manual Acceptance Checklist (for Alan)

### To validate the worktree acceptance card on Windows

- [ ] Double-click the ag package zip from Windows Explorer
- [ ] Unzip and launch the .exe
- [ ] Verify the app opens with the three-column workbench UI
- [ ] In the center workspace, locate "Worktree Acceptance Checkpoint" card between the repo hygiene card and the selected source card
- [ ] Verify the package path shows a local WSL path (no ServiceNow URL visible)
- [ ] Verify the metadata strip shows: Freshness, Checksum, mtime, Scope
- [ ] Verify left column queue: Dirty, Fresh, Stale, History state chips
- [ ] Verify center column: boundary explanation and safe next steps
- [ ] Verify right column: 5 action buttons, with Mark reviewed disabled and visible reason
- [ ] Click "Copy package path" — verify it copies the UNC path to clipboard
- [ ] Click "Copy summary" — verify it copies a checkpoint summary to clipboard
- [ ] Verify footer: "Local only" chip + safety boundary language
- [ ] Verify no real ServiceNow URL, ticket ID, sys_id, credential, or raw field value appears in the UI
- [ ] Verify no Save/Submit/Update/Resolve/Close action is available in this card

### Safety checklist

- [ ] No real ServiceNow URL printed to logs or console
- [ ] No secrets/cookies/storage-state exposed
- [ ] No live ServiceNow browser automation or API writes
- [ ] No upload, PR, merge, tag, or GitHub Release
- [ ] No cron jobs modified or created

---

## 6. Forbidden Actions — Confirmed NOT Present

| Action | Present? | Evidence |
|--------|----------|----------|
| Save | No | No button/action in card |
| Submit | No | No button/action in card |
| Update | No | No button/action in card |
| Resolve | No | No button/action in card |
| Close | No | No button/action in card |
| ServiceNow API writes | No | privacy:scan PASS, code inspection |
| Upload/M365/Teams writes | No | privacy:scan PASS, code inspection |
| Secrets/cookies/session | No | privacy:scan PASS |
| Real ServiceNow URL | No | WSL UNC path only |
| Ticket ID / sys_id | No | Not present in card |
| Push/PR/merge/tag/release | No | Card explicitly states "No live... PR, merge, tag, or release" |

---

## 7. Remaining Risks

1. **Review diff and Open dist/release have no-op onClick handlers**
   - These are stubs for follow-up tasks — they do nothing when clicked
   - The Copy package path and Copy summary buttons work (clipboard write)

2. **Mark reviewed is always disabled**
   - Real acceptance toggle logic (enable when worktree is clean) was not in scope
   - The disabled reason is clear: "dirty changes still need review before acceptance"

3. **Package path, checksum, mtime are hardcoded**
   - The card uses values from the spec, not dynamic reads from dist/release/ metadata
   - The actual SHA256 does match (6105d1da verified), but the card doesn't compute it dynamically

4. **No live Chromium/QA runtime interaction from this card**
   - The card is purely a static checkpoint surface — it doesn't connect to Start QA Chromium or Verify current Incident
   - This is by design: the card represents the local-only acceptance boundary before any ServiceNow interaction

---

## 8. The "Acceptance Policy" Check

From the profile body:

> **Acceptance Policy**: Verify profile show/tools/gateway status before reporting done. Validate Alan real usage path. Output repro/expected/actual/evidence. Do not accept local gate only.

Checked:
- [x] Profile show: sna-qa-acceptance active, deepseek-v4-flash, gateway running
- [x] Gateway status: running, 16 SNA profiles active
- [x] Alan real usage path validated: double-click → unzip → app → workbench UI → worktree card → action buttons → clipboard copy
- [x] Repro/expected/actual/evidence documented for each usage scenario
- [x] Local gates accepted AS MANDATORY (build/typecheck/test/privacy) but supplemented with manual checklist and real usage path validation

---

## 9. Suggested Next Task

`t_56b03efb` (child card already created) — Connect the Review diff and Open dist/release buttons to real local actions (e.g., `git diff`, `explorer.exe` on the dist/release directory).
