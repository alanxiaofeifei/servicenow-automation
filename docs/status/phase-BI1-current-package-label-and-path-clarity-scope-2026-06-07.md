# BI1 — Current-Package Label and Path Clarity: Scope / Active Surface Refresh

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Parent scope task:** `t_c08db089`
**Verdict:** SCOPE-DEFINED — see child tasks for execution

---

## 1. Current package anchor (Alan's testable artifact)

**Package name:** `servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip`

**Windows UNC path (paste into File Explorer):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
```

**Linux path:**
```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
```

### Package facts

| Property | Value |
|---|---|
| Size | 119,120,505 bytes (114 MB) |
| SHA-256 | `583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d` |
| Sidecar | Present, hash matches |
| START-HERE | `...bh6-20260607-local-START-HERE-WINDOWS.txt` — correct references |
| CURRENT.txt | `CURRENT=...bh6-20260607-local.zip` — correct |

This is the artifact Alan should test. All archival aliases (ay6, az6, ba6–bg6) are secondary.

---

## 2. Surface freshness audit

### 2.1 Correct surfaces (bh6-aligned — no change needed)

| Surface | Current label | Status |
|---|---|---|
| `CURRENT.txt` | bh6 | ✅ Correct |
| `dist/release/...bh6-20260607-local-START-HERE-WINDOWS.txt` | bh6 | ✅ Correct |
| `dist/release/...bh6-...zip.sha256` | bh6 | ✅ Correct |
| `docs/status/phase-BH6-windows-local-package-refresh-2026-06-07.md` | bh6 | ✅ Correct (records the BH6 package build) |
| `docs/status/phase-BH7-release-readiness-handoff-2026-06-07.md` | bh6 | ✅ Correct (BH7 handoff correctly identifies bh6) |

### 2.2 Stale surfaces (bg6 — need refresh to bh6)

| Surface | Current label | Stale? | Lines affected |
|---|---|---|---|
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | bg6 | **STALE** | 6 occurrences: lines 5, 13, 59, 79, 92, 150 |

The runbook currently describes the `bg6` package. It needs to describe `bh6`:
- **Line 5:** Package header `bg6` → `bh6`
- **Line 13:** Prose "the `bg6` package" → `bh6`
- **Line 55:** "The BG6 Windows local package to test" → BH6
- **Line 59:** UNC path to bg6 ZIP → bh6 ZIP
- **Line 64:** SHA256 (bg6's `1d1d9dbed6...e6cb`) → bh6's `58392907...d5d1d`
- **Line 67:** Size (118,607,518 bytes) → 119,120,505 bytes
- **Line 79:** START-HERE filename → bh6
- **Line 92:** Extraction folder name → bh6
- **Line 150:** CD path → bh6

### 2.3 Archival/historical surfaces (no change — correct for their phase)

| Surface | Reference | Reason not to change |
|---|---|---|
| `docs/status/phase-BH1-...scope-2026-06-07.md` | bg6 | Defines scope for bf6 → bg6 transition. Historical record. |
| `docs/status/phase-BH2-...ux-spec-2026-06-07.md` | bg6 | UX spec written for bg6. Historical record. |
| `docs/status/phase-BH4-...checklist-2026-06-07.md` | bg6 | QA acceptance at the time bg6 was current. Historical record. |
| `docs/status/phase-BG4-...checklist-2026-06-07.md` | bg6 | QA acceptance at the time bg6 was current. Historical record. |
| `docs/status/phase-BG6-...refresh-2026-06-07.md` | bg6 | Records the bg6 package build. Historical record. |
| `dist/release/...bg6-...START-HERE-WINDOWS.txt` | bg6 | Archival artifact in the dist/release/ archive zone. |
| `dist/release/...bg6-...zip.sha256` | bg6 | Archival sidecar. |

These are handoff records of past phases and archival artifacts. Changing them would rewrite phase history.

---

## 3. Label history summary

| Phase | Package became current | Transition |
|---|---|---|
| BG6 → BH1 scope | bg6 | bh0/ay6/az6...bf6 → bg6 |
| BH6 (BH6 package refresh) | **bh6** | bg6 → **bh6** |
| **BI1 (current)** | **bh6** | Marking the runbook stale surface |

The gap: BH6 advanced CURRENT.txt and START-HERE to bh6, but the runbook was **not** refreshed. The runbook is the primary instruction surface Alan copies to his Windows test machine.

---

## 4. Scope boundaries

### In scope
- Refresh `docs/test/windows-clean-machine-validation-2026-06-07.md` from bg6 → bh6 (package facts, UNC path, prose references)
- All 6 stale bh6 references in the runbook to be updated
- Verify SHA256 consistency: runbook SHA256 should match bh6 sidecar
- Re-run gates after refresh: `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm privacy:scan`
- `sha256sum -c` on the bh6 ZIP as final gate

### Out of scope (not this phase)
- No code changes to `src/`, `scripts/`, or `packages/`
- No rebuild of the ZIP (bh6 stays as-is)
- No changes to archival bg6 artifacts in `dist/release/`
- No changes to historical status docs
- No push, PR, merge, tag, GitHub Release, publish, or cron
- No live ServiceNow operations of any kind

---

## 5. Child task plan

| Task | Assignee | Description |
|---|---|---|
| BI2 — Runbook refresh: bg6 → bh6 | `sna-frontend-workbench` | Update all 6 stale bg6 references in the runbook to bh6. Package name, UNC path, SHA256, size, START-HERE filename, extraction folder, CD path. |
| BI3 — Runbook refresh QA acceptance | `sna-qa-acceptance` | Verify BI2 changes are correct and complete. Confirm runbook references bh6 everywhere, SHA256 matches sidecar. |
| BI4 — Runbook refresh privacy/security | `sna-privacy-security` | Verify no stale bg6 references remain in the runbook post-refresh. Confirm no sensitive data introduced. |

---

## 6. Required gates (for BI2 completion)

- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS
- `sha256sum -c` on bh6 ZIP — PASS

---

## 7. Safety boundaries

- No live ServiceNow login, browsing, API writes, Save / Submit / Update / Resolve / Close, attachment upload, Microsoft Graph / Excel Web writes, real Teams/Outlook/phone ingestion.
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values.
- No push, PR, merge, tag, GitHub Release, publish, or cron changes.
- Runbook edits only — no source code, no build scripts, no packaging configuration.
