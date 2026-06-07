# Phase BL5 — Windows public-release candidate package

Date: 2026-06-07 (build completed 2026-06-08 00:19 CST)
Phase: BL5
Status: Built and verified

## Package artifact

**Path:**
`/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-public-20260607.zip`

**Windows UNC path:**
`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-public-20260607.zip`

**SHA256:**
`e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692`

**Size:** 118,610,088 bytes (113 MB)
**Mtime:** 2026-06-08 00:19:35 CST

### Accompanying files

- `dist/release/servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256` — checksum sidecar
- `dist/release/servicenow-automation-windows-v0.1.0-public-20260607-START-HERE-WINDOWS.txt` — operator instructions

## Source changes included

This package incorporates all BL3/BL4 screenshot-fix changes:

### Apps (uncommitted working tree)

| File | Changes |
|------|---------|
| `apps/desktop/src/App.tsx` | 551 lines changed — workbench center reordered per spec (Selected source → Cleaned summary → Incident draft → Guided path → KB → Monthly Excel), release/package details inside collapsed `<details>`, translated `SOURCES` and `WORK PRODUCT` via `workbenchCopy` (4 languages) |
| `apps/desktop/src/styles.css` | 19 lines added — three-column CSS Grid layout, collapsed detail styles |
| `apps/desktop/src/App.test.ts` | 26 lines changed — test updates for reordered content |

### Scripts (committed)

| File | Changes |
|------|---------|
| `scripts/generate-release-metadata.sh` | Phase extraction regex updated to handle both `-rc.1-PHASE-YYYYMMDD-local` and `-PHASE-YYYYMMDD` naming patterns |

## Gates

| Gate | Status |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (335 tests: 185 desktop + 95 adapters + 55 CLI) |
| `pnpm privacy:scan` | PASS (507 files) |

## Package verification

| Check | Status |
|-------|--------|
| SHA256 checksum | PASS — `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692` |
| ZIP integrity | PASS — no errors |
| Forbidden entries | PASS — none found |
| `resources/app.asar` present | PASS |
| `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` present | PASS |
| `resources/scripts/local-cdp-bridge.py` present | PASS |
| `resources/release-metadata.json` present | PASS |
| `ServiceNow Automation.exe` present | PASS |
| Inner sidecar filename | PASS — `servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| Inner sidecar phase | PASS — `PUBLIC` |
| Inner sidecar UNC path | PASS — `\\wsl.localhost\Ubuntu-Compact\...` |
| START-HERE wording | PASS — no-write safety, correct SHA256, correct UNC path |
| START-HERE automation restriction | PASS — "No Save / Submit / Update / Resolve / Close" |

## Known remaining issues

1. **~20+ hardcoded English secondary labels** — per BL3 CONDITIONAL_PASS, secondary labels (release details, repo hygiene, worktree, guided path, KB, monthly Excel) remain English-only. These are acceptable for public release as the primary workflow labels (SOURCES, WORK PRODUCT, intake queue) are now translated.
2. **Text size/contrast** — BL3 CONDITIONAL_PASS. No CSS changes made to global font sizes or contrast ratios. Acceptable for initial public release.
3. **No upload/push/release performed** — this task is build+verify only per BL5 scope. GitHub Release, tag, or PR should happen in BM tasks after final gates pass.

## Verification by Alan

Manual Windows validation needed:
1. Extract the ZIP on a clean Windows machine
2. Double-click `ServiceNow Automation.exe` — should open without crash
3. Verify three-column layout with collapsed release details
4. Run Start QA Chromium from the runtime actions rail
5. Wait for CDP connected → Verify button enables
6. Use Verify-only mode (read-only, no Save/Submit/Update/Resolve/Close)

## Safety & privacy

- No raw ServiceNow URLs, ticket IDs, sys_ids, credentials, cookies, sessions, HAR, traces, or field values in any artifact
- No Save / Submit / Update / Resolve / Close automation introduced
- All demo data is fake/mock, clearly marked QA TEST ONLY
- Privacy scan: 507 files pass
- START-HERE explicitly warns about no-write restrictions
