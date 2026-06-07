# Phase BI4 — QA Acceptance and Alan Manual Checklist — Current-Package Label/Path Clarity Refresh

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-qa-acceptance`
**Task:** `t_15c88d02`

---

## Verdict: **PASS** ✅

All 6 acceptance checks pass. All 4 automated gates green. All manual checklist criteria verified by source inspection and/or automated execution.

---

## Automated gate results

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | **PASS** | 7 workspace packages, all SSR + renderer build succeeds |
| `pnpm typecheck` | **PASS** | All 7 packages (`core`, `ai`, `kb`, `profiles`, `adapters`, `cli`, `desktop`) typecheck clean |
| `pnpm test` | **PASS** | **459/459 tests pass** — core(83) + kb(6) + ai(34) + profiles(17) + adapters(95) + cli(55) + desktop(169) |
| `pnpm privacy:scan` | **PASS** | **288 tracked files** — no secrets, credentials, raw URLs, ticket IDs, sys_ids, or cookies |
| `sha256sum -c` | **PASS** | All **10** dist/release packages verify against their sidecars (ay6 → bh6) |
| `CURRENT.txt` | **PASS** | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip` — correct |

---

## Acceptance criteria verification

### 1. Exact Windows UNC path appears first, easy to copy

**PASS** ✅ — The handoff card (App.tsx lines 4263–4266) shows the current package path at the top of the card, immediately after the "Source of truth" marker. A "Copy current package path" button (line 4303) and "Copy current package summary" button (line 4308) provide one-click clipboard access with clear disabled-state reasons for unloaded metadata.

### 2. Current package filename, SHA-256, and mtime clearly visible

**PASS** ✅ — The "Current package summary" line (lines 4268–4283) shows:
- Filename in **bold**
- SHA-256 in `<code>` block
- mtime formatted via `formatPackageMtimeForDisplay`
- Archival-only aliases in trailing notation

### 3. Archival aliases clearly secondary, never mistaken for live

**PASS** ✅ — Multiple visual layers distinguish archives:
- `<span className="handoff-chip handoff-chip-archival">` in the "Archival-only aliases" section (line 4286)
- In Worktree Acceptance: `"Archival only"` state chip (line 4685), archival items display "Older aliases are archival only. Do not use as the current package anchor." (line 4709)
- Footer italic note: "Discovered from local release metadata. Older aliases are archival only." (line 4739)
- Page header: "Local only · bh6 is current · Older aliases are archival only" (line 4675)
- Manual checklist step: "Confirm older aliases remain archival only" (line 4752)

### 4. BG6 appears only in archival context

**PASS** ✅ — Single BG6 occurrence (line 4478) is inside the BC7 closure statement, explicitly marked as archival:
> "All BC implementation was present in the archival BG6 cumulative package."

All 13+ other stale BG6 hardcoded references in P0 checklist/handoff card were replaced with dynamic `currentPhase` expressions (verified by diff inspection).

### 5. Manual checklist starts from explicit package anchor

**PASS** ✅ — The Worktree Acceptance manual checklist (lines 4744–4753) opens with:
1. "Confirm the current package is bh6 and not an archival-only alias."
2. "Confirm the exact package path matches the current bh6 path shown above."

Both dynamically render the current phase when loaded, never inferring from context.

### 6. No raw ServiceNow artifacts in source

**PASS** ✅ — grep for `service-now.com`, `servicenow.com`, `incident.do`, `sys_id` on all `*.ts` and `*.tsx` files returns **0 matches**. Privacy scan passes on 288 tracked files.

---

## Alan manual checklist (can copy to Windows)

### Prerequisites
- Clean Windows machine with packaged ZIP downloaded from WSL `dist/release/`
- ZIP phase: **bh6** — confirm via `CURRENT.txt` marker

### Package identity

| Property | Value |
|----------|-------|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip` |
| SHA-256 | `583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d` |
| mtime | 2026-06-07 20:36 UTC |
| Sidecar | Matching SHA-256 file present |
| Archival aliases | ay6, az6, ba6, bb6, bc6, bd6, be6, bf6, bg6 — all archival only |

### Windows UNC test path

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
```

> Copy the path from the "Copy current package path" button in the app or use the handoff card's displayed path. The path above is the canonical WSL-accessible UNC — it dynamically derives the WSL distro name.

### P0 manual validation steps (record pass/fail in app)

| # | Criterion | Pass condition |
|---|-----------|----------------|
| 1 | Windows double-click launches app | Window opens within 3–10s, title "ServiceNow Automation" |
| 2 | Startup failure shows sanitized diagnostics | Delete `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\`, launch again → overlay with reason + "Copy diagnostic" button |
| 3 | Start QA Chromium opens visible window | Click "Start QA Chromium" → visible Chromium window opens; CDP chip transitions disconnected → connecting → connected |
| 4 | CDP readiness visible in app | Runtime rail shows green "connected" chip |
| 5 | Verify enables only after CDP | Before Chromium: Verify disabled (gray). After connected: enabled. |
| 6 | Verify-only is read-only (no writes) | Verify inspects page only. No fields filled, no navigation to ServiceNow URLs, no Save/Submit buttons. |
| 7 | Three-column Operator Workbench | Left = source/nav/history/settings. Center = detail/TicketDraft/field plan. Right = runtime actions/templates/status/safety. |
| 8 | Packaged Windows artifact path correct | Handoff card shows dynamic WSL-distro-derived UNC path (not hardcoded Ubuntu-Compact) |

### After testing

- Record pass/fail per criterion in the app's P0 Re-Acceptance Checklist card
- Include SHA-256 of the tested ZIP and exact error text (sanitized) for any failures
- No screenshots, HAR, trace, cookies, or raw ServiceNow URLs in recorded results

---

## Safety / Privacy

- No live ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids
- Verified: zero raw `service-now.com` / `servicenow.com` / `sys_id` / `incident.do` patterns in desktop source
- All 288 tracked files pass privacy scan
- No real ServiceNow URLs or credentials in codebase

---

## Red-zone compliance

| Prohibition | Status |
|-------------|--------|
| No live ServiceNow operations | ✅ Not performed |
| No screenshots/HAR/trace/cookies | ✅ No capture tools used |
| No raw URLs/ticket IDs/sys_ids | ✅ Verified zero matches in source |
| No push, PR, merge, tag, release | ✅ No git write operations |
| No cron changes | ✅ Not touched |
