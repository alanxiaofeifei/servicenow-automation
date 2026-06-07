# AG1-DelA — Stale Artifact Cleanup Report

**Date**: 2026-06-07 03:24 CST
**Script**: `scripts/hygiene/cleanup-stale-artifacts.sh`
**Location**: `dist/release/`

## Before Cleanup

| Category | Count | Size |
|----------|-------|------|
| Total files | 14 | 566 MB |
| Keep (rc.1 canonical + af latest) | 5 | 227 MB |
| Stale (ab, ad, ae builds) | 9 | 340 MB |

## Files Removed

### ab-20260607-local build (Phase AC0)
| File | Size |
|------|------|
| `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip` | 114 MB |
| `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256` | 130 B |
| `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local-START-HERE-WINDOWS.txt` | 1.3 KB |

### ad-20260607-local build (Phase AD6)
| File | Size |
|------|------|
| `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` | 114 MB |
| `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip.sha256` | 130 B |
| `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local-START-HERE-WINDOWS.txt` | 1.3 KB |

### ae-20260607-local build (Phase AE6)
| File | Size |
|------|------|
| `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` | 114 MB |
| `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip.sha256` | 130 B |
| `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local-START-HERE-WINDOWS.txt` | 1.3 KB |

## Files Kept

| File | Size | Role |
|------|------|------|
| `servicenow-automation-windows-v0.1.0-rc.1.zip` | 114 MB | Canonical release package |
| `servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` | 112 B | Canonical checksum |
| `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` | 1.3 KB | Canonical launch guide |
| `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` | 114 MB | Latest local validation build |
| `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip.sha256` | 130 B | Latest build checksum |

## After Cleanup

- **5 files, 227 MB** — only canonical + latest remain
- **340 MB freed**

## Notes

- The `release-issue98-main-20260528/` directory referenced in the scope definition does not exist on disk; no action was needed.
- No tracked files were modified. No `.gitignore`, workflows, or configuration files were touched.
- All 4 acceptance gates verified passing after cleanup:
  - `pnpm build` — PASS
  - `pnpm typecheck` — PASS
  - `pnpm test` — PASS (177 tests)
  - `pnpm privacy:scan` — PASS (288 files)
