# Phase AF3 — Windows Operator Packaging / Runtime Readiness Polish — Implementation

Date: 2026-06-07
Status: implemented, all gates pass
Parent: t_f9467549 (AF2 UX/copy spec)
Branch: `next/post-release-operator-cockpit-ab-20260606`

## Purpose

Implement the approved AF2 spec in the desktop app — update the release-readiness-handoff-card with:
- latest AE package metadata
- stale-package archival list with demotion styling
- stale-package warning banner
- dedicated Chromium runtime readiness section (chips + note)
- quickstart/checklist strip

## Changes made

### `apps/desktop/src/App.tsx` (release-readiness-handoff-card, lines 4006-4103)

| Before | After |
| --- | --- |
| Path: `rc.1-ad-20260607-local.zip` | Path: `rc.1-ae-20260607-local.zip` |
| SHA256: `7f5ca5a7...8006` | SHA256: `4a9c7a38...cde` |
| mtime: `01:32 CST` | mtime: `02:00 CST` |
| "Browser readiness display + center panel states" | "Stale-archive list, runtime readiness copy, quickstart checklist, updated AE metadata" |
| "Package facts" panel with inline list | "Package archive" panel with `<dl>` stale-archive list (`handoff-archive-list`) |
| No stale warning | Stale warning banner (`handoff-stale-warning`) |
| No runtime readiness section | Runtime readiness chip row + note (`handoff-runtime-section`) |
| No quickstart strip | Quickstart checklist strip (`handoff-quickstart-strip`) |
| "Open checklist" button (disabled) | Removed — replaced by quickstart strip |

### `apps/desktop/src/styles.css` (appended after line 6531)

Added CSS for:
- `.handoff-stale-warning` — warm yellow warning banner
- `.handoff-archive-list` / `.archive-entry` / `.archive-latest` / `.archive-stale` — archival list with visual demotion
- `.handoff-runtime-section` / `.handoff-chip` / `.handoff-chip-blocked` — runtime readiness chips
- `.handoff-quickstart-strip` / `.handoff-quickstart-title` / `.handoff-quickstart-list` — quickstart checklist

### `apps/desktop/src/App.test.ts` (lines 1613-1639)

- Updated SHA256 from `7f5ca5a7...` to `4a9c7a38...`
- Updated UNC path assertion to `\\wsl.localhost`
- Removed `Open checklist` and `disabled=""` assertions
- Added assertions for: `handoff-stale-warning`, `handoff-archive-list`, `handoff-runtime-section`, `handoff-quickstart-strip`, `"Dedicated Chromium runtime: not found yet"`, `"CDP readiness: disconnected"`, `"Quickstart checklist"`

## Gates

| Gate | Result |
| --- | --- |
| `pnpm typecheck` | Pass |
| `pnpm test` | 100/100 pass |
| `pnpm build` | Pass |
| `pnpm privacy:scan` | 273 files pass |

## Acceptance verification

| Acceptance criterion | Status |
| --- | --- |
| Surface unambiguously points Alan to the newest dated Windows package (AE) | ✓ Path, metadata, and archive list all reference rc.1-ae |
| Old rc/ad/ab artifacts are visibly stale | ✓ Archive entries marked "Stale" with 0.72 opacity, muted colors, no highlights |
| Local quickstart / runtime readiness copy matches approved spec | ✓ Runtime chips show "not found yet" / "disconnected" states; quickstart has 5 exact steps from spec |
| No unsafe action becomes newly available | ✓ No write paths, no live ServiceNow, no submit/save/update |

## Why each touched file was necessary

- **App.tsx**: the handoff card lives here — all content changes are in this one card section
- **styles.css**: new layout elements (archive list, chips, warning, quickstart) need new styles
- **App.test.ts**: must assert the new content and stop asserting removed elements

## Remaining risks

- The runtime readiness chips and quickstart checklist are static placeholder content. A future phase (AF4+) may wire them to actual runtime detection or CDP status.
- Backslash escaping in JSX UNC paths is fragile — verified by successful test run.
- Demoted stale packages use opacity + color, not color alone (accessibility requirement from AF2 spec).

## Suggested next task

Phase AF4 — wire the handoff runtime readiness chips to actual Chromium/CloakBrowser detection state instead of static placeholder text.
