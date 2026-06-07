# Archive Demotion Convention — dist/release/

**Date:** 2026-06-07  
**Profile:** `sna-ui-designer`  
**Task:** `t_355cee01`

## Convention summary

This document defines how to read archival vs current packages in `dist/release/` without changing any artifacts.

1. How to tell archival from current:
   - Read the `CURRENT.txt` marker produced by BG3.
   - The package named by `CURRENT.txt` is current; every other package in `dist/release/` is archival.

2. Lifecycle of an archival package:
   - No automated cleanup.
   - Archival packages remain in place for auditability and manual comparison.
   - Retirement is manual after N phases or at Alan's discretion.

3. How phase prefixes are disambiguated:
   - Match by shared phase prefix.
   - The `.sha256` sidecar and `-START-HERE-WINDOWS.txt` companion file belong to the ZIP with the same prefix.
   - Example: `bf6` ZIP, `bf6.sha256`, and `bf6-START-HERE-WINDOWS.txt` are one package set.

4. When and how the current-package marker updates:
   - Each time a new Windows package is built and gated, update `CURRENT.txt` to the new phase prefix / package name.
   - The marker should always point at the latest validated current package.

5. Explicitly not addressed:
   - Automated `dist/release/` cleanup
   - GitHub Release promotion
   - Version numbering policy

## Reader rule

If there is any ambiguity, trust `CURRENT.txt` first, then use the phase prefix to group the ZIP, checksum, and START-HERE companion files.
