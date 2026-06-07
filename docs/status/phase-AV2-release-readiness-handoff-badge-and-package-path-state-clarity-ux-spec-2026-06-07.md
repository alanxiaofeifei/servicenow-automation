# Phase AV2 — Release Readiness Handoff Badge and Package-Path State Clarity — UX/Copy Spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Preflight

Goal
- Define the smallest visible polish change needed for the Release Readiness Handoff card.
- Make `handoff-latest-badge` read like a compact, low-emphasis status chip instead of plain text.
- Distinguish package-path loading from package-path unavailable states with explicit copy.
- Keep the current package summary, clipboard actions, and local-only IPC behavior unchanged.
- Keep the current package path obvious and easy for Alan to verify on Windows.

Known facts
- The Release Readiness Handoff surface already exists.
- The current badge text is `Latest local package`.
- The path display currently reuses one generic loading-style string for multiple states.
- The summary section already distinguishes loading vs unavailable correctly and should stay that way.
- A prior broader workbench spec already established the warm/light editorial direction and first-class settings approach.

Assumptions
- Alan wants the smallest possible UX change that still makes the current package state legible at a glance.
- The latest/current package indicator should remain low-emphasis, not turn into a banner or callout.
- The path field should remain obviously testable without introducing any new package-selection behavior.

Ambiguities
- Whether the badge should keep its exact text or need a minor accessibility wording tweak.
- Whether the path line should remain in the same place and only change copy/styling, or also gain a small state hint nearby.
- Whether disabled-button tooltips should share one state message or vary slightly per control.

Chosen smallest approach
- Preserve the existing card structure and the current indicator’s placement.
- Style the badge as a small warm-neutral chip with low visual weight.
- Split the path wording into explicit loading and unavailable states.
- Leave summary copy, clipboard actions, and local-only behavior untouched.

Files likely affected
- `docs/status/phase-AV2-release-readiness-handoff-badge-and-package-path-state-clarity-ux-spec-2026-06-07.md` only for this task.
- Later implementation would likely touch `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, and possibly `apps/desktop/src/App.test.ts`.

Verification plan
- Check that the spec stays strictly local-only and does not imply any ServiceNow write path.
- Check that loading and unavailable path copy are explicitly different and not both phrased as generic loading.
- Check that the badge is described as a compact chip and not as a new layout element.
- Check that the manual checklist gives Alan a clear Windows verification path.

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Material Design 3 chips: chips are small rounded rectangles with subtle outline treatment and low visual separation from primary actions.
- The repo’s bound Open Design context (`claude` + `web-prototype-taste-editorial`): warm off-white surfaces, editorial hierarchy, and muted chips for low-emphasis metadata.
- The existing Release Readiness Handoff spec: keep the surface local, calm, and surgical; do not expand the layout.

Design takeaways for this task:
- Use a chip, not a label masquerading as body text.
- Keep the badge visually quieter than the main content.
- Make state text explicit so loading and unavailable do not look identical.
- Avoid any copy that makes the latest/current package indicator feel like an action or a warning.

## 2. UX direction

This task does not change the workbench structure. It only clarifies one handoff card so Alan can quickly answer:

1. Is this the latest/current local package indicator?
2. Is the package path still loading, or is it unavailable?
3. Can I trust the summary and clipboard actions to remain unchanged?

The card must read as a calm local handoff surface, not a release dashboard, demo panel, or log dump.

### Mandatory order inside the card

```text
Release Readiness Handoff
[Latest local package chip]
Current package path
Current package summary
Copy / open actions
Manual checklist
```

Rules:
- The badge stays in the existing handoff card header area; only its treatment changes.
- The badge is low-emphasis and compact, not a primary CTA.
- The current package path remains the first content line that helps Alan test the build.
- The summary stays as-is except where the existing implementation already distinguishes loading and unavailable.
- No broad layout redesign, no new navigation, no new mode switch.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Release Readiness Handoff                                                     │
│ [Latest local package]                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Current package path                                                          │
│ └─ Current package path loading... / Current package path is unavailable. /  │
│    \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\... │
│                                                                              │
│ Current package summary                                                       │
│ └─ (existing summary copy unchanged)                                          │
│                                                                              │
│ [Copy current package path] [Copy current package summary] [Open package folder] [Open checklist] │
│                                                                              │
│ Manual checklist                                                              │
│ - ...                                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

Recommended visual treatment:
- Render `Latest local package` as a warm-neutral chip with subtle outline or fill.
- Keep the chip visually smaller than the main action buttons.
- The path line should use code-style or value-row styling so Alan can scan and copy it quickly.
- The loading and unavailable path states must be readable without relying on color alone.
- The action row should keep its current behavior; only the copy/open affordances should get clearer disabled-state copy where needed.

## 4. Exact labels and button text

### Card labels
- `Release Readiness Handoff`
- `Current package path`
- `Current package summary`
- `Manual checklist`

### Badge text
- Keep the visible text as `Latest local package`.
- Do not reword it unless implementation needs a purely accessibility-related adjustment.
- If an accessibility-only label is needed, keep the same meaning and avoid introducing new product language.

### Buttons
- `Copy current package path`
- `Copy current package summary`
- `Open package folder`
- `Open checklist`

### State text rules
- Loading path copy: `Current package path loading...`
- Unavailable path copy: `Current package path is unavailable.`
- Available path copy: the converted WSL UNC path, unchanged from current behavior.

### Tooltip rules
- Tooltips must clearly distinguish loading from unavailable.
- Loading tooltip example: `Current package path is still loading.`
- Unavailable tooltip example: `Current package path is unavailable.`
- Do not collapse both states into one generic waiting message.

## 5. Visual treatment for the badge chip

The badge should feel like a compact, low-emphasis status marker.

Suggested styling direction:
- Shape: rounded rectangle, not a full-width banner.
- Size: small label-sized chip, roughly 12–13px text with modest horizontal padding.
- Weight: medium or semibold, but not bold enough to compete with the main title.
- Color: warm neutral surface with a subtle border; avoid saturated colors.
- Placement: adjacent to the handoff title area or within the same header cluster as the existing implementation.
- Hierarchy: lower visual weight than any actionable button.

Do not:
- turn it into a pill that feels like a filter or mode toggle,
- make it louder than the path itself,
- add an icon that suggests a system alert,
- expand it into a separate status banner.

## 6. State matrix

| State | Badge | Package path | Package summary | Actions | Tooltip / disabled reason |
| --- | --- | --- | --- | --- | --- |
| Loading | Hidden unless current package path exists; if shown, keep chip styling only | `Current package path loading...` | Existing loading summary copy stays unchanged | Copy/open actions disabled if they require the path | `Current package path is still loading.` |
| Unavailable | Same chip styling, no louder treatment | `Current package path is unavailable.` | Existing unavailable summary copy stays unchanged | Copy/open actions disabled if they require the path | `Current package path is unavailable.` |
| Available | `Latest local package` chip visible and compact | Exact WSL UNC path visible | Existing summary copy visible and unchanged | Copy/open actions enabled | Normal enabled-state tooltip behavior |

Notes:
- Loading and unavailable must never reuse the same path string.
- The summary area can keep its existing state distinctions; do not re-specify or rename that behavior.
- The badge should remain a latest/current indicator, not a path-state indicator.

## 7. Main components

Keep the component set small and local to the existing handoff card.

- `ReleaseReadinessHandoffCard`
- `HandoffLatestBadgeChip`
- `CurrentPackagePathLine`
- `CurrentPackageSummaryRow`
- `HandoffActionRow`
- `ManualChecklistPanel`
- `LoadingUnavailableHint`

Component rules:
- Do not introduce a new page.
- Do not introduce a new mode switch.
- Do not add new IPC surfaces.
- Keep copy actions local-only.
- Keep the summary formatter and clipboard behavior stable.

## 8. Empty, loading, and error copy

### Empty
- `No current package selected yet.`
- `Wait for the latest local build to appear.`

### Loading
- `Current package path loading...`
- `Current package metadata is still loading.`

### Unavailable
- `Current package path is unavailable.`
- `Current package metadata is unavailable.`

### Helpful supporting text
- `Wait for the current package to resolve before copying.`
- `The path and summary become available once local metadata resolves.`

### Archive/reference clarification
- Not applicable to this task.
- Do not introduce archival labeling here; that would widen scope beyond the AV1 polish gap.

## 9. Manual-review checklist for Alan

- Confirm the badge reads as a small, low-emphasis chip, not as unstyled text.
- Confirm the badge still says `Latest local package`.
- Confirm the package path says `Current package path loading...` while loading.
- Confirm the package path says `Current package path is unavailable.` when metadata fetch fails.
- Confirm the loading and unavailable states are visually distinct, not just differently worded in a hidden tooltip.
- Confirm the summary, clipboard actions, and local-only behavior still match the current release handoff.
- Confirm the path is still easy to test on Windows and remains the obvious current local package reference.
- Confirm the surface still feels surgical, not redesigned.

## 10. Accessibility notes

- Keep the badge text readable at a glance and do not rely on color alone to show it is the current package marker.
- Preserve keyboard navigation for the copy/open actions.
- Keep disabled reasons adjacent to the disabled controls, not buried in a distant help block.
- Use large enough touch/click targets for the action row.
- If the badge is visually compact, ensure it still has a clear accessible name matching the visible text.
- Make the loading vs unavailable distinction plain-language so screen-reader users hear a meaningful difference.

## 11. GPT Images 2 mockup notes

Attempted sanitized mockup generation with `image_generate` using fake/local-only data:
- warm-light handoff card with a compact `Latest local package` chip
- separate loading and unavailable path states with distinct copy

Result:
- the image generation attempt failed with `FalClientHTTPError`
- no usable raster mockup was produced in this run

Retained prompt direction for a later image-capable rerun:
- warm parchment canvas
- low-emphasis warm-neutral badge chip
- code-style path line
- explicit loading and unavailable path copy
- no real URLs, no ticket IDs, no customer data

## 12. Implementation handoff for `sna-frontend-workbench`

This spec is intentionally narrow. The implementation should:
- add chip styling to `handoff-latest-badge` without changing the card layout,
- split the path display into loading vs unavailable text,
- keep summary copy and clipboard behavior intact,
- preserve local-only IPC behavior,
- preserve the current package path as the obvious test target for Alan.

Likely implementation shape:
- add a small chip rule in `styles.css`,
- pass explicit state into the path formatter or equivalent call site,
- keep the summary formatter untouched unless a test requires a minimal update,
- add or adjust tests only for the new state wording and badge treatment.

The minimal success condition is visual clarity, not a broader release-workbench redesign.