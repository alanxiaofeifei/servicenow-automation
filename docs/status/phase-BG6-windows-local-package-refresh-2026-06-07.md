# Phase BG6 — BG6 Windows Local Package Refresh

**Date:** 2026-06-07
**HEAD:** `019c502`
**Profile:** `sna-windows-runtime`
**Task:** `t_f6f632ec`

---

## Gate results

| Gate        | Result | Details                             |
|-------------|--------|-------------------------------------|
| pnpm build  | ✅ PASS | 30+57 modules, all bundles built   |
| pnpm typecheck | ✅ PASS | 7 workspace projects, no errors    |
| pnpm test   | ✅ PASS | 370/370 — 17+34+95+55+169          |
| privacy:scan | ✅ PASS | 288 files, no leaks                |

## Artifact

| Property | Value |
|----------|-------|
| Package | `servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |
| Size    | 118,607,518 bytes |
| SHA-256 | `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb` |
| START-HERE | Present — correct BG6 package name, UNC path, and SHA-256 |
| Location | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\`
