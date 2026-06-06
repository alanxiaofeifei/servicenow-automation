# Phase AC1 — Alan test package handoff

> This is the **one file Alan should test.**

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD commit:** `77475d8`

---

## Alan should test this local Windows package:

**`servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip`**

| Property | Value |
|---|---|
| SHA256 | `ea94272dd1a399c04851c26867e50dfd533affeb08953de2895ea308ebd786f1` |
| Size | 118,588,267 bytes (~113 MB) |
| Build | Byte-for-byte identical to canonical rc.1 (same HEAD `77475d8`) |

---

## Paths

### Windows UNC (from File Explorer, cmd.exe, or PowerShell)

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
```

Copy this path into File Explorer's address bar. Copy the zip to your Windows Desktop before extracting.

### Linux (WSL)

```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
```

### Checksum file

```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256
```

---

## Unzip and launch steps

1. Copy the zip from the UNC path above to your Windows Desktop.
2. Right-click and **Extract All**.
3. Open the extracted folder. Read **START-HERE-WINDOWS.txt** first.
4. Double-click **`ServiceNow Automation.exe`**.
5. The app should open a visible operator window with the three-column workbench layout.

---

## Pass/fail checklist

This is the same checklist from Phase AB4 (QA acceptance). Verify these items on screen:

### 1. Left sidebar section labels (all 4 locales)

| Locale | Expected | Pass/Fail |
|--------|----------|-----------|
| English | Loading feed / Intake queue / Todo list | □ |
| Chinese (Simplified) | 加载的状态 / 待领取队列 / 待办列表 | □ |
| Chinese (Traditional) | 正在載入 / 待領取佇列 / 待辦事項 | □ |
| Japanese | フィード読み込み中 / 受付キュー / やることリスト | □ |

### 2. URL settings card

| Label | Expected | Pass/Fail |
|-------|----------|-----------|
| First field | **QA URL** | □ |
| Second field | **Dev URL** | □ |
| Third field | **Production URL** | □ |

### 3. Center card title

| Element | Expected | Pass/Fail |
|---------|----------|-----------|
| Card title | **Selected source detail** | □ |

### 4. Guided demo stepper

| Element | Expected | Pass/Fail |
|---------|----------|-----------|
| Eyebrow text | **Guided path** (was "Guided review path") | □ |

### 5. Language switcher

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Switch EN → ZH-CN → ZH-TW → JA → EN | Labels reload correctly in each locale | □ |

### 6. Runtime action buttons

| Button | Expected | Pass/Fail |
|--------|----------|-----------|
| Start QA Chromium | Same label, same position, same behavior | □ |
| Verify current Incident | Same label, same position, same gating | □ |
| Autofill current Incident | Same label, same position, same gating | □ |

### 7. Safety / no-write boundary

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Safety section | Visible and reads same as previous releases | □ |
| No text implies Save/Submit/Update/Resolve/Close | No new copy violates this rule | □ |

---

## What NOT to test

- **Real ServiceNow login** — do not open production, QA, dev, or any ServiceNow instance.
- **CDP connectivity** — cosmetic change only; no CDP code changed.
- **Autofill behavior** — no autofill code changed.
- **Empty state helpers** — translations exist but no JSX renders them yet.
- **Browser status rendering** — translations exist but not yet wired.
- **API writes, attachment uploads, or bulk actions** — all out of scope.

---

## ⛔ Do NOT test live ServiceNow

**Strict prohibition during this validation round:**

- ❌ No automatic or manual ServiceNow login
- ❌ No Save / Submit / Update / Resolve / Close operations
- ❌ No ServiceNow API writes
- ❌ No production or production-shadow writes
- ❌ No attachment uploads or email actions
- ❌ No screenshots, HAR recordings, trace captures, or video from real ServiceNow pages
- ❌ No cookies, sessions, or storage-state export
- ❌ No pasting raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

**If the app prompts for a ServiceNow URL or credentials, stop and do not enter anything real.** Use only mock/demo workflows.

---

## Verification commands (run by tooling, not by Alan)

```bash
# Checksum verification
sha256sum -c dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256
# → OK

# Archive contents verified
# - resources/app.asar                     ✓
# - resources/scripts/local-cdp-bridge.py  ✓
# - resources/scripts/.../cdp.ps1          ✓
# - START-HERE-WINDOWS.txt                 ✓
# - ServiceNow Automation.exe              ✓
```
