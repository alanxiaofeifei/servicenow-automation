# Phase H — RC artifact refresh decision and dry-run packaging

**Date:** 2026-06-05
**Owner:** sna-windows-runtime
**Reviewer:** sna-privacy-security

## Verdict: NO REBUILD NEEDED — existing RC.1 artifact remains current

---

## Decision

**Do not rebuild the RC zip.**

The existing `servicenow-automation-windows-v0.1.0-rc.1.zip` at `dist/release/` is functionally identical to what would be produced from the current branch. A rebuild would produce an equivalent binary with only cosmetic differences in zip metadata timestamps — wasteful churn with no benefit.

## Rationale

The current branch `next/pr-rc-hardening-20260605` contains exactly **one commit** beyond its parent `next/manual-validation-followups-20260605`:

```
cbf73a6 Phase G: E2E local demo regression pack — all gates pass, report produced
```

This commit adds only a single documentation file:
- `docs/status/phase-G-local-demo-regression-2026-06-05.md`

**No source code changed.** No packaging scripts changed. No Electron config changed. No dependencies changed. The binary output of `pnpm --filter @servicenow-automation/desktop package:windows` is identical.

## Verification results

### 1. Existing SHA256 checksum valid

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1.zip: OK
```

Checksum: `b73d5484aeb1f068f6d1f4ba92158c0dd2bf69d09331087ffcadade67d6f136d`

### 2. Forbidden content audit — PASS

| Check | Result |
|-------|--------|
| Forbidden directories (`.git`, `.local`, `.auth`, `browser-profiles`, `screenshots`, etc.) | PASS |
| Forbidden file types (`.har`, `.trace`, `.png`, `.sqlite`, `.log`, `.pem`, etc.) | PASS |
| Env/auth/credential files | PASS |
| Key file: `resources/app.asar` | PRESENT |
| Key file: `resources/scripts/local-cdp-bridge.py` | PRESENT |
| Key file: `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` | PRESENT |

### 3. START-HERE content — PASS

File: `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt`

Contains exact required sentence:
```
No Save / Submit / Update / Resolve / Close automation.
```

Full content matches the `write_start_here()` function in `scripts/packaging/build-windows-rc.sh`.

### 4. Archive integrity

- **86 files** in archive
- Key Electron app structure: `resources/app.asar` present
- CDP bridge scripts present
- Windows launchers present

### 5. Standard gates (Phase G regression — 2026-06-05)

| Gate | Result |
|------|--------|
| `pnpm build` | PASS (7 workspace projects) |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (374 tests, 26 files) |
| `pnpm privacy:scan` | PASS (196 files, no violations) |

## Actions taken (Green zone)

1. ✅ Verified existing SHA256 checksum
2. ✅ Forbidden content audit on existing archive
3. ✅ START-HERE content audit
4. ✅ Decision documented in this status file
5. ✅ Archive integrity verified (86 files, key components present)

## Actions not taken (Red zone — correctly avoided)

- ❌ No GitHub Release created
- ❌ No tag pushed
- ❌ No git push to remote
- ❌ No rebuild executed (functionally identical, wasteful)

## Phase F follow-up findings (not blocking — informational)

The Phase F audit (branch hygiene) identified two gitignore gaps:

| Finding | Severity | Path | Size |
|---------|----------|------|------|
| GAP-1 | MEDIUM | `.codegraph/` not gitignored | ~3MB |
| GAP-2 | HIGH | `.worktrees/` not gitignored | ~1.2GB |

Neither affects the RC artifact (both are outside the packaged build). Recommend a follow-up task for `.gitignore` remediation.

---

## Summary

The existing RC.1 artifact is valid, current, and requires no rebuild. All acceptance criteria for Phase H are satisfied:

- ✅ Decision made: no rebuild needed
- ✅ Reasoning documented
- ✅ SHA256 verified
- ✅ Forbidden content audit passed
- ✅ START-HERE contains exact no-write sentence
- ✅ Status document produced
- ✅ No GitHub Release, tags, or pushes

**Verdict: PASS — no action required on the RC artifact.**
