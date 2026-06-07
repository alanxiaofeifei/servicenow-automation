# ServiceNow Automation v0.1.0 Public Release Notes

ServiceNow Automation v0.1.0 (public) is a Windows desktop application for supervised local
ServiceNow ticket-drafting assistance. This is the first **public preview** release.

> **Gate status: READY FOR ALAN MANUAL VALIDATION ONLY**
> Branch: `next/post-release-operator-cockpit-ab-20260606`
> Commit: `023ca00 BL6 final local public candidate gate`
>
> This release artifact passed all local automated gates (build, typecheck, 335 tests,
> privacy scan, checksum verification, ZIP integrity). It has **not yet** been manually
> validated on a clean Windows machine.
>
> This is a **local package validation gate** only — it does not represent production
> readiness, live ServiceNow approval, or cross-platform certification.

## Artifact

| Item | Value |
|---|---|
| Package | `servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| SHA256 | `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692` |
| Size | 118,610,088 bytes |
| Format | Portable ZIP (no installer — double-click `ServiceNow Automation.exe`) |
| ZIP integrity | PASS — 87 entries, no corruption |

## What's included

- Electron desktop app (`ServiceNow Automation.exe` + `resources/app.asar`).
- Windows double-click launcher and runtime repair helpers.
- Dedicated Chromium-for-Testing browser runtime helper scripts.
- SHA256 checksum sidecar for package verification.
- START-HERE guide with safety instructions.

## What's new in this release

### Three-Column Operator Workbench

The main workspace is organized into three columns:

1. **Left column** — source inbox, workbench navigation, knowledge base, history, settings.
2. **Center column** — the primary operator flow: Selected source detail → Cleaned summary →
   Incident draft (editable text fields) → Guided demo path → Local KB recommendations →
   Monthly Excel fill queue.
3. **Right column** — runtime actions and status (QA Chromium launcher, CDP connection status,
   Verify-only controls).

### Release Readiness Handoff

A handoff card at the top of the workbench shows the current local package path, a source-of-truth
marker, a summary of the current package metadata, and a manual validation checklist. Package
details are collapsible to keep the primary workflow uncluttered.

### PO Re-Acceptance Checklist

A built-in checklist covering all 8 product-owner criteria:

1. Windows double-click launches the app without crash.
2. Startup failure shows sanitized diagnostics (plain-language overlay, no raw stack traces).
3. "Start QA Chromium" opens a visible dedicated Chromium-for-Testing window.
4. CDP connection status is visible in the runtime rail.
5. "Verify current Incident" is disabled until CDP is connected.
6. Verify-only mode is read-only — inspects the page but never fills fields, submits, or calls
   Save / Update / Resolve / Close.
7. Three-column workbench layout is stable.
8. The packaged Windows artifact path is shown correctly and points to the local package.

### Local Repo Hygiene + Archive Demotion

Built-in tools to scan `dist/release/` for stale artifacts, preview cleanup, and archive old
builds locally. No upload, PR, merge, tag, or release actions.

### Worktree Acceptance

An acceptance panel that lets operators confirm the current package, review diffs, mark as
reviewed, and copy summary — all locally, with no ServiceNow writes.

### Local KB Recommendations

Visible knowledge-base recommendation cards showing each suggestion's title, match confidence,
matched evidence keywords, and sanitized excerpt.

### Monthly Excel Fill Queue

A workbench panel with current/previous month selectors and ticket-fill decision buttons.
Safety text confirms no Microsoft Graph or Excel Web write is performed. Placeholder UI only
— no live Excel integration.

### Reordered Workbench (Incident Draft above Guided Path)

The central workbench flows in logical operator order:
1. Selected source detail
2. Cleaned summary
3. Incident draft (editable text fields only)
4. Guided demo path (stepper)
5. Local KB recommendations
6. Monthly Excel fill queue

### Localized UI (Simplified Chinese)

Primary workbench labels, navigation, and release-readiness sections support Simplified Chinese.
Additional locale support (Traditional Chinese, Spanish) is prepared for extension.

## What to test (manual validation)

Before GitHub public release, validate on a clean Windows machine:

1. Extract the ZIP on Windows.
2. Double-click `ServiceNow Automation.exe` and confirm it opens without crash.
3. Confirm the three-column layout is stable and no sidebar/source repetition bug appears.
4. Confirm the primary center workflow order is correct.
5. Confirm release/package details are collapsible and do not overlap the main workflow.
6. Switch to 简体中文 and confirm primary workbench labels are localized.
7. Start QA Chromium locally, wait for CDP connected, and use Verify-only behavior.
8. Do not perform any live ServiceNow writes or submit/update/resolve/close actions.

## Safety boundary

This public preview does **not** approve live ServiceNow operation.

**Forbidden:**
- automatic login to any ServiceNow instance
- Save / Submit / Update / Resolve / Close automation
- upload / email / bulk action
- ServiceNow API write
- production write or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups,
  browser endpoints, page fingerprints, or real field values

**What the app does safely:**
- Drafts and fills allowed text fields in a local read-only context.
- Humans review all drafted content before any real ServiceNow submission.
- All operations are local or mock — no real ServiceNow data is touched.

## Install summary

1. Download the ZIP and `.sha256` file from the release assets.
2. Verify checksum: `sha256sum -c servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256`
3. Extract the ZIP on Windows.
4. Double-click `ServiceNow Automation.exe`.
5. Test mock workflows only.

## Known limitations

- Clean-machine (fresh Windows without WSL) double-click validation: **NOT YET TESTED**
- Live ServiceNow integration: **NOT READY** — this release is for supervised demo/local use only
- Cross-platform (macOS/Linux): **NOT TESTED**
- Auto-update mechanism: **NOT IMPLEMENTED**
- Inner package metadata SHA256 field: currently empty (external checksum sidecar is authoritative)
