# Phase V2 — Release-docs alignment for Alan validation packet

**Date:** 2026-06-05
**Task:** t_55870ac5
**Branch:** `next/product-clarity-demo-polish-20260605`
**Profile:** `sna-release-docs`
**Status:** COMPLETE — docs aligned, gates pass

## Summary

Aligned release documentation with the V1 next-morning Alan manual validation
checklist so Alan has one coherent validation packet. Three docs were updated;
the user guide and demo script were already aligned and required no changes.

## What was checked

| Document | Status | Action taken |
|----------|--------|--------------|
| `docs/releases/windows-v0.1-rc-draft-release-notes.md` | ❌ MISALIGNED | Fixed validation claim that implied Alan already validated this branch |
| `docs/releases/windows-v0.1-rc-manual-test.md` | ❌ MISALIGNED | Added V1 checklist cross-reference; updated rc.1→rc.2 artifact references |
| `docs/en-US/user-guide.md` | ✅ Already aligned | No changes needed |
| `docs/en-US/demo-script.md` | ✅ Already aligned | No changes needed |
| `docs/demo/field-trial-demo-flow-script.md` | ✅ Already aligned | No changes needed (supplementary narrative, no contradictory claims) |
| `docs/releases/windows-v0.1-rc-plan.md` | ✅ Already aligned | No changes needed (Chinese planning doc, no validation claims) |

## Changes made

### 1. `docs/releases/windows-v0.1-rc-draft-release-notes.md`

**Problem:** The "Manual validation" notice at the top claimed:
> "Alan ran Windows app launch + UX review on 2026-06-05 (commit `269b9fe`)"
> referencing `docs/status/alan-manual-validation-pass-2026-06-05.md`.

This was from a **previous branch** (`next/pr-rc-hardening-20260605`), not the
current branch. The V1 checklist explicitly says "Alan manual validation:
PENDING." Alan could be misled into thinking no fresh validation is needed.

**Fix:** Split into two sections:
- **Prior-round validation** — keeps the historical fact, names the old branch
- **Current-branch validation: PENDING** — points to the V1 checklist

Also added a cross-reference to the V1 checklist in the "What to test" section.

### 2. `docs/releases/windows-v0.1-rc-manual-test.md`

**Problems:**
- Had no reference to the V1 checklist (reader would not know about it)
- Referenced `rc.1` artifact paths and checksum command for a release now at `rc.2`

**Fix:**
- Added a note at the top naming the V1 checklist as the authoritative
  next-morning validation reference
- Updated artifact paths from `rc.1` to `rc.2`

## Gates

| Command | Result |
|---------|--------|
| `pnpm privacy:scan` | See below |
| `pnpm build` | N/A — docs only, no code changes |
| `pnpm typecheck` | N/A — docs only, no code changes |
| `pnpm test` | N/A — docs only, no code changes |

## Verification

- All changes are `*.md` doc files only
- No source code (.ts, .tsx, .py, .json) touched
- No real ServiceNow data, ticket IDs, sys_ids, credentials, or customer PII added
- No live/write capability claims made or strengthened
- Current accepted UI facts preserved (KB recommendations visible; Monthly Excel
  fill queue is local/dry-run; Incident draft below Cleaned summary, above
  Guided Review Path)

## Validation packet paths

The complete validation packet for Alan:

| Purpose | Path |
|---------|------|
| **Next-morning validation checklist** (start here) | `docs/status/phase-V1-next-morning-alan-manual-validation-checklist-2026-06-05.md` |
| Release notes (with honest validation status) | `docs/releases/windows-v0.1-rc-draft-release-notes.md` |
| User guide (workbench map + expected output) | `docs/en-US/user-guide.md` |
| Demo script (3-5 min walkthrough) | `docs/en-US/demo-script.md` |
| Package manual test (supplement to V1 checklist) | `docs/releases/windows-v0.1-rc-manual-test.md` |

## Remaining notes

- **Settings environment helper text** still uses old labels ("Start, Check Page,
  and Autofill") in App.tsx — flagged by V1 checklist as non-blocking cosmetic;
  updating the UI code is out of scope for this docs-only phase
- **Field-trial demo flow script** (`docs/demo/field-trial-demo-flow-script.md`)
  is a supplementary narrative that tells a consistent story; it does not need
  alignment with the V1 checklist because it doesn't make validation claims
