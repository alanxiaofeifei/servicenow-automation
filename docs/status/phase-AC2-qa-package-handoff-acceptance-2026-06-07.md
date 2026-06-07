# Phase AC2 — QA acceptance for dated local test package

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD commit:** `d0c70c8`
**QA profile:** `sna-qa-acceptance`
**Workspace:** `/home/alanxwsl/projects/servicenow-automation`

---

## Step 1 — Package existence, integrity, and safety wording

| Check | Status | Evidence |
|-------|--------|----------|
| Package file exists | ✅ PASS | `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip` at `/home/alanxwsl/projects/servicenow-automation/dist/release/` |
| mtime matches 2026-06-07 local time | ✅ PASS | `Jun 7 01:04` — local CST timezone |
| Size matches handoff | ✅ PASS | 118,588,267 bytes (~113 MB) — matches AC0/AC1 docs |
| SHA256 checksum | ✅ PASS | `ea94272dd1a399c04851c26867e50dfd533affeb08953de2895ea308ebd786f1` — `sha256sum -c` returned OK |
| START-HERE safety wording present | ✅ PASS | `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` inside zip contains "No Save / Submit / Update / Resolve / Close automation" and full forbidden list |
| windows-operator-quickstart.md safety wording | ✅ PASS | Contains "does not approve live ServiceNow operation or full-field autofill exposure" |
| windows-v0.1-rc-manual-test.md present | ✅ PASS | Present in zip at `resources/docs/windows-v0.1-rc-manual-test.md` |

**Commands run:**
```bash
ls -la /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
cat /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256
cd /home/alanxwsl/projects/servicenow-automation/dist/release && sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256
unzip -p ...servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt
unzip -p ...resources/docs/windows-operator-quickstart.md
```

---

## Step 2 — Mandatory gates

### `pnpm build`

```
apps/cli build: Done
apps/desktop build: Done
Scope: 7 of 8 workspace projects
```

**Result: BUILD PASS**

---

### `pnpm typecheck`

```
packages/core typecheck: Done
packages/ai typecheck: Done
packages/kb typecheck: Done
packages/profiles typecheck: Done
packages/adapters typecheck: Done
apps/cli typecheck: Done
apps/desktop typecheck: Done
```

**Result: TYPECHECK PASS**

---

### `pnpm test`

| Workspace | Files | Tests | Result |
|-----------|-------|-------|--------|
| packages/core | 10 | 83 | PASS |
| packages/ai | 3 | 34 | PASS |
| packages/kb | 2 | 6 | PASS |
| packages/profiles | 3 | 17 | PASS |
| packages/adapters | 3 | 95 | PASS |
| apps/cli | 2 | 55 | PASS |
| apps/desktop | 6 | 92 | PASS |
| **Total** | **29** | **382** | **ALL PASS** |

**Result: TEST PASS (382/382)**

---

### `pnpm privacy:scan`

```
TRACKED_PRIVACY_SCAN_PASS files=255
```

**Result: PRIVACY SCAN PASS (255 files)**

---

## Step 3 — Handoff clarity: does the AC1 doc tell Alan exactly what to test?

The parent handoff document (`docs/status/phase-AC1-alan-test-package-handoff-2026-06-07.md`) is explicit:

- **Line 3:** `> This is the **one file Alan should test.**`
- **Line 13:** Package name specified: `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip`
- **Lines 27–37:** Dual paths (Windows UNC + Linux WSL)
- **Lines 47–54:** Unzip and launch steps (numbered 1–5)
- **Lines 57–110:** Full 7-item pass/fail checklist with locale tables
- **Lines 113–121:** "What NOT to test" section with 6 clear exclusions
- **Lines 124–138:** "⛔ Do NOT test live ServiceNow" section with 8 explicit forbidden actions

**Result: HANDOFF CLARITY PASS** — Alan can open the doc and know exactly which file to test, what to check, and what not to do.

---

## Step 4 — Manual validation checklist (for Alan's Windows test)

These steps should be performed by Alan on Windows when testing the package.

### Pre-test safety

- [ ] Read the `START-HERE-WINDOWS.txt` before launching.
- [ ] Copy zip to Windows Desktop before extracting.
- [ ] Verify SHA256 via PowerShell: `Get-FileHash ...\servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip`

### Launch test

- [ ] Extract zip. Double-click `ServiceNow Automation.exe`.
- [ ] App opens a visible window — not background/hidden.
- [ ] Three-column workbench layout visible:
  - Left: source/nav/history/settings
  - Center: source/detail/TicketDraft/field plan
  - Right: runtime actions/templates/status/safety

### Content verification checklist (reproduced from AC1)

#### 1. Left sidebar section labels (all 4 locales)

| Locale | Expected | Pass/Fail |
|--------|----------|-----------|
| English | Loading feed / Intake queue / Todo list | ☐ |
| Chinese (Simplified) | 加载的状态 / 待领取队列 / 待办列表 | ☐ |
| Chinese (Traditional) | 正在載入 / 待領取佇列 / 待辦事項 | ☐ |
| Japanese | フィード読み込み中 / 受付キュー / やることリスト | ☐ |

#### 2. URL settings card

| Label | Expected | Pass/Fail |
|-------|----------|-----------|
| First field | QA URL | ☐ |
| Second field | Dev URL | ☐ |
| Third field | Production URL | ☐ |

#### 3. Center card title

| Element | Expected | Pass/Fail |
|---------|----------|-----------|
| Card title | **Selected source detail** | ☐ |

#### 4. Guided demo stepper

| Element | Expected | Pass/Fail |
|---------|----------|-----------|
| Eyebrow text | **Guided path** (was "Guided review path") | ☐ |

#### 5. Language switcher

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Switch EN → ZH-CN → ZH-TW → JA → EN | Labels reload correctly in each locale | ☐ |

#### 6. Runtime action buttons

| Button | Expected | Pass/Fail |
|--------|----------|-----------|
| Start QA Chromium | Same label, same position, same behavior | ☐ |
| Verify current Incident | Same label, same position, same gating | ☐ |
| Autofill current Incident | Same label, same position, same gating | ☐ |

#### 7. Safety / no-write boundary

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Safety section | Visible and reads same as previous releases | ☐ |
| No text implies Save/Submit/Update/Resolve/Close | No new copy violates this rule | ☐ |

### ⛔ Do NOT test (safety boundaries)

- No real ServiceNow login, browser automation, or field interaction
- No Save / Submit / Update / Resolve / Close
- No ServiceNow API writes
- No screenshots, HAR, traces, cookies from live ServiceNow pages
- No pasting ServiceNow URLs, ticket IDs, sys_ids, real field values
- If prompted for credentials — stop

---

## Verdict

**LOCAL ACCEPTANCE PASS**

All 4 mandatory gates pass. Package exists with correct integrity, mtime, and checksum. Safety wording is present and explicit. Handoff doc tells Alan exactly which file to test and what not to test.

### Gate summary

| Gate | Result |
|------|--------|
| Package existence & integrity | PASS |
| Checksum verification | PASS |
| Safety wording (START-HERE) | PASS |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` (382/382) | PASS |
| `pnpm privacy:scan` (255 files) | PASS |
| Handoff clarity | PASS |

### Automated QA evidence

**Commands run:**
```bash
ls -la dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
cd dist/release && sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256
unzip -l dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
unzip -p ...20260607-local.zip ...START-HERE-WINDOWS.txt
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
```

### Rework recommendation

**None.** AC0/AC1 handoff is clear and complete. Package is verified. No rework needed.

---

*QA performed by `sna-qa-acceptance` profile, Hermes Agent, via Kanban task `t_379b9333`*
