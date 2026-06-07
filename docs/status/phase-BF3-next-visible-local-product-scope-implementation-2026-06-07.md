# Phase BF3 — BE6 Package Restoration and Validation Readiness — Implementation

**Date:** 2026-06-07
**HEAD:** `019c502`
**Profile:** `sna-frontend-workbench`
**Task:** `t_7260a865`
**Parent scope:** BF1 — BE6 Package Restoration and Validation Readiness

---

## 0. Preflight

**Goal:** Implement BF1 scope for BE6 Package Restoration and Validation Readiness.

**Deliverables:**
- A. Verify/rebuilt BE6 Windows package (ZIP already present from BE6 build)
- B. Update runbook bd6→be6 references
- C. Generate package-specific START-HERE-WINDOWS.txt
- D. Update build script template for future package-specific START-HERE generation
- E. Pass all 4 gates (build, typecheck, test, privacy:scan)
- F. Write this status document

**Scope boundary:** No production code changes. No ServiceNow API operations. No new features.

---

## 1. Deliverable A — BE6 Windows package

**Status:** COMPLETE (ZIP was already present from BE6 build phase)

The BE6 ZIP at `dist/release/` existed with verified integrity. No rebuild was necessary.

| Property | Value |
|----------|-------|
| Package name | `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` |
| SHA256 | `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` |
| Size | `118,607,550 bytes (~113.1 MB)` |
| SHA256 sidecar | Verified OK |

**Note on hash change:** The ZIP was re-packed to include the package-specific START-HERE file inside the archive, changing the SHA256 from `bf7d0e79...` to `b1383e95...`. The new sidecar and START-HERE both reference the current hash.

---

## 2. Deliverable B — Runbook refresh

**Status:** COMPLETE

**File:** `docs/test/windows-clean-machine-validation-2026-06-07.md`

All stale `bd6` references were replaced with current `be6` values:

| Location | Old value | New value |
|----------|-----------|-----------|
| Header (Package) | `...-bd6-...` | `...-be6-...` |
| §1 Purpose | `bd6` | `be6` |
| §3 Package location | `bd6` package | BE6 package |
| §3 UNC path | `...-bd6-...` | `...-be6-...` |
| §3 SHA256 | `3054053c...` | `b1383e95...` |
| §3 Size | `118,604,358 bytes` | `118,607,550 bytes` |
| §3 Gate results | 220 tests | 459 tests |
| §3 START-HERE | Generic name | `...-be6-...-START-HERE-...` |
| §4.1 Step 3 extract folder | `...-bd6-...` | `...-be6-...` |
| §4.4 Step 15 PowerShell cd | `...-bd6-...` | `...-be6-...` |

Runbook structure, validation steps, and safety rules are unchanged — only package-specific values refreshed.

---

## 3. Deliverable C — Package-specific START-HERE

**Status:** COMPLETE

**File:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local-START-HERE-WINDOWS.txt`

The START-HERE file now contains (per BF2 UX spec):
- Package name and phase prefix (BE6)
- Copyable Windows UNC path
- SHA-256 checksum (matching current sidecar)
- P0 Re-Acceptance Checklist card reference
- Diagnostic overlay guidance ("copy the visible error text only")
- Safety boundary reminder (No Save/Submit/Update/Resolve/Close)
- Privacy reminder (no raw URLs, ticket IDs, sys_ids, etc.)

The ZIP archive was re-packed to include the package-specific START-HERE inside the archive, so Alan will see the correct content after extraction.

---

## 4. Build script template update

**Status:** COMPLETE

**File:** `scripts/packaging/build-windows-rc.sh`

The `write_start_here()` function was updated:
- Changed from static generic content to parameterized template
- Uses unquoted heredoc with `${VARIABLE}` expansion for dynamic values:
  - `${phase}` — derived from `SDA_RELEASE_VERSION` (e.g., `be6`, `bf6`)
  - `${PACKAGE_NAME}` — derived from `VERSION`
  - `${unc_path}` — constructed UNC path with configurable `SDA_UNC_PATH` override
  - `${sha256}` — passed from actual computed checksum (two-pass: write → zip → compute → re-write)
- Content follows BF2 UX spec: package name, UNC path, SHA256, P0 checklist reference, diagnostic guidance, safety boundary
- Post-build companion rewrite injects the actual SHA256 after zip checksumming

---

## 5. Gate results

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (459 tests: 169 desktop + 55 cli + all packages) |
| `pnpm privacy:scan` | PASS (288 files) |

---

## 6. Files changed

| File | Change | Lines |
|------|--------|-------|
| `dist/release/*-be6-*-START-HERE-WINDOWS.txt` | Replaced generic content with BF2-specified package-specific copy | 1 file, < 30 lines |
| `dist/release/*-be6-*.zip` | Re-packed to include package-specific START-HERE inside archive | Binary (updated) |
| `dist/release/*-be6-*.zip.sha256` | Updated to match re-packed archive | 1 line |
| `scripts/packaging/build-windows-rc.sh` | Updated `write_start_here()` to parameterized BF2 copy + two-pass SHA256 injection | ~20 lines |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Replaced all bd6→be6 references, updated SHA256/size/gate-count | ~15 lines |
| `docs/status/phase-BF3-*.md` | This document | < 80 lines |

**Total change budget:** ~35 lines of doc/template changes + 1 binary re-pack. Within BF1 budget (< 90 lines across 3–4 doc/template files).

---

## 7. Verification summary

- [x] BE6 ZIP exists at expected UNC path with verified SHA256
- [x] SHA256 sidecar matches ZIP checksum
- [x] START-HERE-WINDOWS.txt contains package-specific copy (package name, UNC path, SHA256, P0 checklist reference, diagnostic guidance, safety boundary)
- [x] START-HERE inside ZIP archive matches companion START-HERE outside ZIP
- [x] Runbook no longer contains `bd6` references
- [x] Runbook §3 updated with current SHA256, size, gate count
- [x] Runbook structure and validation steps unchanged
- [x] Build script template produces package-specific START-HERE for future builds
- [x] `pnpm build` — PASS
- [x] `pnpm typecheck` — PASS
- [x] `pnpm test` — PASS
- [x] `pnpm privacy:scan` — PASS
- [x] No production code changes
- [x] No ServiceNow login, browsing, API writes, or external operations
- [x] No push, PR, merge, tag, GitHub Release, or publish
- [x] No new features, no behavioral changes, no test logic changes

---

## 8. What BF3 enables

After BF3 completes, BF4 (QA acceptance), BF5 (privacy/security), BF6 (package verification), and BF7 (final readiness gate) can proceed.

Alan can now:
1. Open the UNC path in File Explorer and see the BE6 ZIP
2. Verify the SHA256 against the sidecar
3. Read package-specific START-HERE with explicit path, checksum, and safety guidance
4. Follow the runbook with current (be6) package references

---

## 9. Safety and privacy

- No real ServiceNow URLs, ticket IDs, sys_ids, cookies, sessions, or credentials in any changed file
- No ServiceNow API operations performed
- All changes are local documentation and packaging
- Safety boundary text present in both START-HERE and runbook
- Privacy reminder included in START-HERE: "Do not paste raw URLs, ticket IDs, sys_ids, requester names, assignment groups, cookies, sessions, or field values"

---

## 10. Remaining risks

1. **SHA256 change from re-packing:** The ZIP SHA256 changed from the originally documented BE6 value (`bf7d0e79...`) to `b1383e95...` because the START-HERE file inside the archive was replaced. The sidecar and runbook both reflect the new value.
2. **Build script's UNC path:** The template uses `Ubuntu-Compact` as default distro name. If the BD3 dynamic WSL distro derivation changes the UNC path, the template's default should be updated to use the same detection.
3. **Test count:** The runbook now lists 459 tests (was 220 with breakdown). This is the current test count at HEAD `019c502`. Future test additions will make this stale again.

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
