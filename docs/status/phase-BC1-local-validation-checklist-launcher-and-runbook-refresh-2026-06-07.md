# Phase BC1 — Local Validation Checklist Launcher and Runbook Refresh — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_b3c34536`

---

## 1. Latest final gate / backlog state

### BB7 final gate — COMPLETE through BB6 (READY-FOR-MANUAL-VALIDATION-ONLY)

The latest completed gate is **BB7**, which is **READY-FOR-MANUAL-VALIDATION-ONLY** for the refreshed BB6 Windows package.

Current local Windows package baseline:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bb6-20260607-local.zip
```

Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bb6-20260607-local.zip
```

### What BB7 already confirmed locally

- BB4 QA acceptance — PASS
- BB5 privacy/security — APPROVE
- BB6 package refresh — PASS
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS
- No real ServiceNow login, browser/API write, attachment upload, Microsoft Graph / Excel Web write, Teams/Outlook/phone ingestion, or push/PR/release actions were performed

### Two visible friction points remaining

When Alan opens the workbench after BB7, he sees:

1. **"Open checklist" button is disabled.** At line 4315 of `apps/desktop/src/App.tsx`, the button has `disabled` hardcoded with tooltip "Manual checklist document is available in the project docs directory." but no click handler. The button looks like it should work but doesn't.

2. **Runbook points at the wrong package.** `docs/test/windows-clean-machine-validation-2026-06-07.md` still references package `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` and its UNC path. The current validated package is `bb6`, not `ay6`.

---

## 2. Why this scope now

### What Alan sees today

The workbench handoff section shows "Open checklist" alongside functional buttons (Copy path, Copy summary, Open folder). The disabled button invites a click but delivers nothing. This is a visible friction point — not a crash, not a bug, but a UX dead-end that erodes trust in the handoff section.

Separately, the validation runbook that Alan is expected to follow when doing manual validation on a clean Windows machine references package information that is four phases old (ay6 → az6 → ba6 → bb6). Anyone reading the runbook without context will attempt to validate the wrong package.

### Why this is the right next scope

- **Visible** — the disabled button is the most obvious friction point in the workbench handoff area
- **Low risk** — wiring a button to open a local file is pure IPC plumbing; no new UI surface, no behavioral changes
- **Low effort** — refresh the runbook copy from ay6 → current BB6 package; this is a text update
- **Local-only** — both changes are trivially local: open a local doc, edit a local doc
- **Useful for Alan** — closes the loop on the handoff section and makes the runbook accurate before any manual validation attempt

---

## 3. Scope — what BC includes

### Deliverable A — This scope document (BC1)

Documents:
- The latest gate state (BB7)
- The checklist launcher and runbook refresh gap
- Why this is the next visible local product scope
- BC2–BC7 task chain
- Safety boundaries and change budget

### Deliverable B — BC2–BC7 downstream task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **BC2** | UX/copy spec — local validation checklist launcher | `sna-ui-designer` | BC1 | Define the Open checklist button label, tooltip, local-doc target, empty/loading/error copy, and the exact sanitized wording for the current-package/runbook handoff. Output: spec doc. |
| **BC3** | Implementation — local checklist launcher and runbook refresh | `sna-frontend-workbench` | BC2 | Wire the button to open the local runbook path (`docs/test/windows-clean-machine-validation-2026-06-07.md`), refresh the runbook to the current BC6 package/UNC path, and update tests. No new visible surface beyond the existing handoff/checklist area. |
| **BC4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | BC3 | Verify the button opens the correct local doc, the runbook shows the current BC6 package path first, and the manual checklist is scannable and sanitized. |
| **BC5** | Privacy/security audit | `sna-privacy-security` | BC3 | Verify no raw sensitive values leak into the Open-checklist button copy or runbook; no ServiceNow, no external writes, no uploads. |
| **BC6** | Windows local package refresh | `sna-windows-runtime` | BC4 + BC5 | Rebuild a fresh BC-dated Windows package after QA/security approval and publish the exact UNC path Alan should test. |
| **BC7** | Final local readiness gate | `codex-gpt55-control` | BC6 | Produce the final readiness gate with an exact UNC path and a sanitized verdict. |

### Dependency shape

```text
BC1 ──→ BC2 ──→ BC3 ──→ BC4 ──┐
                         │     ├──→ BC6 ──→ BC7
                         └──→ BC5 ──┘
```

BC3 is the only code-change task. BC4 and BC5 can run in parallel after BC3 completes. BC6 requires both QA and privacy/security sign-off.

---

## 4. What the checklist launcher must solve

The existing handoff section has four action buttons:
1. **Copy current package path** — works (wired to clipboard)
2. **Copy current package summary** — works (wired to clipboard)
3. **Open package folder** — works (wired to `openDistRelease`)
4. **Open checklist** — hardcoded disabled with no wire

The fix scope is narrow: wire button 4 to open the local runbook doc, and update the runbook content to reflect the current BC6 package.

### Target user experience

Alan clicks **Open checklist** and the project's validation runbook opens in the default `.md` handler (or VS Code / web browser, depending on OS association). The runbook shows the current BC6 package path and UNC path at the top. No URLs, no tickets, no raw paths beyond the UNC path for the zip.

### Non-goals

This is **not** a new UI feature, not a redesign, and not a new IPC handler.

- no new ServiceNow login, browsing, or API writes
- no Save / Submit / Update / Resolve / Close
- no attachment upload
- no Microsoft Graph / Excel Web writes
- no real Teams / Outlook / phone ingestion
- no screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- no push, PR, merge, tag, GitHub Release, publish, or cron changes
- no new external dependencies or network calls
- no new UI cards, panels, or layout changes
- no new IPC handlers unless reusing an existing pattern

---

## 5. Safety boundaries

### Safe

- Reuse the existing `getWorktreeApi()` pattern used by "Open package folder" (line 4309–4312)
- Use `shell.openPath()` or similar Electron renderer API to open the local `.md` file
- Runbook refresh is a direct text-file edit: update package name, UNC path, SHA256, file size, and package version references
- Both changes are local-file-only

### Red-zone prohibitions

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- No new IPC handlers unless the existing `openDistRelease` bridge already supports a sibling method — add only what's needed
- No new UI cards, panels, or layout changes

---

## 6. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BC2 | `docs/status/phase-BC2-local-checklist-launcher-ux-spec-2026-06-07.md` | < 50 lines |
| BC3 | `apps/desktop/src/App.tsx`, `apps/desktop/src/App.test.ts`, `docs/test/windows-clean-machine-validation-2026-06-07.md` | < 30 lines total |
| BC4 | QA checklist doc | < 60 lines |
| BC5 | Security audit doc | < 30 lines |
| BC6 | Build/packaging scripts | < 20 lines |
| BC7 | Gate document | < 40 lines |

**Total estimated change budget:** very small, local-only, and bounded.

---

## 7. Required gates for downstream tasks

Each downstream task must satisfy the chain gates independently:

- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm privacy:scan`
- Windows local package refresh before QA handoff
- Final local readiness gate before Alan manual validation

---

## 8. Implementation notes for BC3

### BC3-A: Wire Open checklist button

The button at line 4315 of `apps/desktop/src/App.tsx` is currently:

```tsx
<button type="button" className="local-draft-button" disabled title="Manual checklist document is available in the project docs directory.">
  Open checklist
</button>
```

Target behavior:

```tsx
<button type="button" className="local-draft-button" onClick={() => {
  const api = getWorktreeApi();
  if (api) void api.openValidationRunbook();
}}>
  Open checklist
</button>
```

This needs a corresponding IPC bridge method `openValidationRunbook` (or reuse `shell.openPath`) that opens the absolute path to:
`docs/test/windows-clean-machine-validation-2026-06-07.md`

### BC3-B: Refresh runbook package references

Update `docs/test/windows-clean-machine-validation-2026-06-07.md`:

| Field | Old value (ay6) | New value (bb6 → bc6) |
|-------|----------------|----------------------|
| Package name in header | `ay6` | `bc6` (after BC6 rebuild) |
| Package filename | `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` | `servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip` |
| UNC path | `...ay6...` | `...bc6...` |
| SHA256 | `4dd85b722a986d6e06d646493918f22a6a45c982548704ca78afa7477e0d7598` | (to be filled from BC6 build output) |
| File size | `118,603,008 bytes (~113.1 MB)` | (to be filled from BC6 build output) |
| Header package tag | `AF1 refresh` | `BC6 refresh` |
| All `ay6` references in the body text | `ay6` | `bc6` |

Placeholder notes should make it clear that SHA256, file size, and exact package name are filled by BC6.

---

## 9. Status

```
Phase BC1 — Local Validation Checklist Launcher and Runbook Refresh

State: COMPLETE (definition only, no implementation)
Deliverable: this document + downstream task chain
Current gate base: BB7 (READY-FOR-MANUAL-VALIDATION-ONLY)
Current branch: next/post-release-operator-cockpit-ab-20260606
Scope: wire the disabled Open-checklist button to open the local runbook doc,
        refresh the runbook from ay6 to the current BC6 package.
        Local-only; no new UI surface, no behavioral changes, no ServiceNow.
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
