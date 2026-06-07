# Phase AO2 — Next Visible Local Product Scope UX/Copy Spec

Date: 2026-06-07
Status: design handoff only — no implementation in this task
Audience: Alan first, then `sna-frontend-workbench`
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Goal

Define the exact UX and copy for the next visible local product scope so implementation can be surgical and low-risk.

This phase is intentionally narrow:
- it does not add new runtime actions
- it does not change ServiceNow behavior
- it does not introduce demo clutter
- it does not weaken safety boundaries
- it stays local-only and read-only

Primary story:
1. The operator opens the Release Readiness Handoff card.
2. The current local package is shown first and clearly.
3. Old archive entries are no longer presented as a manual list.
4. The card explains that older builds are archival only.
5. The quickstart checklist and human-only boundaries remain visible.

## 1. Research inputs

Public reference patterns used as direction, not branding:
- Codex-style command center: keep navigation/context separate from active work and execution status.
- Claude Code-style workbench: keep the current artifact in focus while the rest of the shell stays calm.
- Antigravity-style manager/editor/artifact model: separate source management, working artifact, and runtime evidence.
- Modern agent workbench pattern: readiness and disabled reasons belong next to the action, not hidden in logs.

OpenDesign note:
- the project already uses a warm editorial baseline
- this spec keeps that warm, paper-like direction while making the local handoff card more obviously current-package-first

Mockup note:
- GPT Images 2 was attempted with sanitized fake data for two warm-light layout concepts
- both attempts returned `FalClientHTTPError`, so no raster mockup was produced in this run

## 2. Layout wireframe in text

This scope changes only the Release Readiness Handoff card in the center work area.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Release Readiness Handoff                                                    │
│ Alan should test this file                                  Latest local pkg │
├──────────────────────────────────────────────────────────────────────────────┤
│ Current package path                                                         │
│ SHA256 / mtime / What changed                                                │
│                                                                              │
│ Older local builds are archival only. The current test target is the Latest │
│ local package shown above.                                                   │
│                                                                              │
│ Why retest matters                                                           │
│ - Confirms the dynamic metadata block is the single source of truth          │
│ - Confirms runtime readiness and quickstart display                         │
│ - Confirms archival builds are not promoted visually                        │
│                                                                              │
│ Human-only boundaries                                                        │
│ - No live ServiceNow login                                                   │
│ - No Save / Submit / Update / Resolve / Close                               │
│ - No external write paths                                                    │
│ - No raw customer or ticket data                                             │
│                                                                              │
│ Runtime readiness note                                                       │
│ Start QA Chromium is disabled until the tool-owned runtime is ready.         │
│                                                                              │
│ Quickstart checklist                                                         │
│ 1. Open the latest local package first.                                      │
│ 2. Double-click the packaged Windows app.                                    │
│ 3. Run the dedicated Chromium readiness step from the runtime rail.          │
│ 4. Wait for CDP to show connected before considering Verify.                 │
│ 5. Stop if the package is stale, the runtime is missing, or the state        │
│    is ambiguous.                                                             │
│                                                                              │
│ Local actions: Copy path | Copy SHA256 | Copy summary                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

Visible ordering rules:
1. Handoff eyebrow + title first
2. Latest badge second
3. Dynamic package metadata block third
4. Generic archival-only note fourth
5. Why retest matters fifth
6. Human-only boundaries sixth
7. Runtime note seventh
8. Quickstart checklist eighth
9. Local actions last

The old `Package archive` panel is removed from this ordering.

## 3. Surface responsibilities

### 3.1 Release Readiness Handoff card

The card answers:
- What is the latest local package?
- What metadata proves that package identity?
- What copy tells the operator that older builds are archival only?
- What should the human do next?

Include:
- `Release Readiness Handoff` eyebrow
- `Alan should test this file` title
- `Latest local package` badge
- dynamic path / SHA256 / mtime / what-changed metadata block
- generic archival-only note
- why-retest support text
- human-only boundaries
- runtime readiness note
- quickstart checklist
- local copy actions

Rules:
- keep the current package visible first
- do not show a manual archive list
- do not imply any archived build is current
- keep the card calm and readable at a glance
- preserve the read-only, local-only message

### 3.2 Supporting cards nearby

The following adjacent content stays unchanged in this phase:
- Worktree Acceptance card
- Local Repo Hygiene + Archive Demotion card
- runtime rail status cards
- copy buttons and metadata fetch behavior

## 4. State matrix

| State | Card content | Expected copy |
|---|---|---|
| Loading metadata | path, SHA256, mtime, and summary show loading placeholders | `Loading...` in the metadata fields |
| Ready | dynamic metadata is populated | `Latest local package` and `newest dated local build, checksum verified, local-only` |
| Empty | no package metadata exists yet | `No package found` and `N/A` placeholders |
| Archival context | no manual archive list is rendered | `Older local builds are archival only.` |
| Read-only boundary | human-only rules are visible | `No Save / Submit / Update / Resolve / Close` |

State rules:
- loading and empty states keep the card layout stable
- the archive panel never appears in any state
- the generic archival-only note may remain visible in ready, loading, or empty states
- the quickstart checklist remains visible even when metadata is unavailable

## 5. Main components

Keep the component set small. Do not introduce a large design system.

### 5.1 Card structure
- `ReleaseReadinessHandoffCard`
- `ReleaseHandoffHeader`
- `LatestLocalPackageBadge`
- `LocalPackageMetadataStrip`
- `ArchivalOnlyNote`
- `WhyRetestSection`
- `HumanOnlyBoundariesSection`
- `RuntimeReadinessNote`
- `QuickstartChecklist`
- `LocalActionsRow`

### 5.2 Content inside the metadata strip
- current package path
- SHA256
- mtime
- what changed

### 5.3 Removed component
- `Package archive` panel with hardcoded archive entries

## 6. Empty, loading, and error states

### Empty states
Use one sentence, one next action, and one calm placeholder.

Recommended copy:
- `No package found`
- `Open or build the latest local package to populate this handoff.`

### Loading states
Use plain placeholders rather than busy visual noise.

Recommended copy:
- `Loading...`
- `Waiting for package metadata...`

### Error states
Explain the safe stop point, not just the failure.

Recommended copy:
- `Local scan failed — refresh the workspace and try again.`
- `Stop if the package identity is unclear.`

Rules:
- keep the previous safe state visible if possible
- do not imply ServiceNow changed when it did not
- do not hide the missing-package state behind a generic error banner
- keep the quickstart checklist visible so the operator still knows the next safe step

## 7. Button enable / disable logic

### Copy path
Enabled when:
- metadata exists

Disabled or fallback behavior when:
- metadata is loading or absent

Copy text:
- with metadata: copy the real package path
- without metadata: copy `(no package found)` if the existing behavior is preserved

### Copy SHA256
Enabled when:
- metadata exists

Disabled or fallback behavior when:
- metadata is loading or absent

Copy text:
- with metadata: copy the real SHA256
- without metadata: copy `(no package found)` if the existing behavior is preserved

### Copy summary
Enabled when:
- metadata exists

Disabled or fallback behavior when:
- metadata is loading or absent

Copy text:
- with metadata: `filename — newest dated local build, checksum verified, local-only`
- without metadata: `(no package found)` if the existing behavior is preserved

General rules:
- these are local copy actions only
- they are not runtime actions
- their placement must not change
- disabled or fallback behavior must be honest and obvious

## 8. Copy text

### Keep unchanged
- `Release Readiness Handoff`
- `Alan should test this file`
- `Latest local package`
- `SHA256`
- `mtime`
- `What changed`
- `Human-only boundaries`
- `Runtime readiness note`
- `Quickstart checklist`
- `Local actions`
- `Copy path`
- `Copy SHA256`
- `Copy summary`

### Replace or remove
- remove the `Package archive` heading and all hardcoded archive entries
- replace the phase-letter-specific warning text with a generic archival-only note

Recommended replacement note:
- `Older local builds are archival only. The current test target is the Latest local package shown above.`

### Refresh the support copy
Replace the current retest bullets so they refer to the live dynamic metadata block rather than the removed archive list.

Recommended replacement bullets:
- `Confirms the dynamic metadata block is the single source of truth.`
- `Confirms runtime readiness and quickstart display.`
- `Confirms archival builds are not presented as current.`
- `Confirms AE metadata still matches the artifact.`

### Avoid in the primary UI
- phase-letter-specific archive lists
- wording that implies stale packages may still be current
- demo-style clutter
- raw URLs, raw ticket IDs, raw sys_ids, raw fingerprints

## 9. Accessibility notes

- minimum 44px hit targets for all interactive controls
- visible focus ring on every button
- keyboard order should remain stable
- disabled or fallback copy must be readable without hover
- keep contrast comfortable in the warm/light theme
- use clear section headings and avoid dense paragraphs
- selected or active states must not rely on color alone
- keep the generic archival note short enough to read in one glance

## 10. Acceptance wording

### Implementation pass criteria
- The Release Readiness Handoff card shows the dynamic package metadata block first.
- The hardcoded `Package archive` panel is gone.
- The warning text is generic and archival-only.
- The quickstart checklist and human-only boundaries remain visible.
- The copy buttons still behave as local copy actions.
- No new runtime action is introduced.
- No ServiceNow behavior changes.

### QA fail criteria
- Any hardcoded archive entry remains visible.
- Any phase-letter-specific archive copy remains visible.
- The current package identity is not shown first.
- The card suggests an archival build is current.
- Copy actions stop working or change their placement.
- Any live ServiceNow automation appears.

## 11. Implementation handoff for `sna-frontend-workbench`

Implement this spec with the smallest possible UI-only polish pass.

Suggested files to inspect first:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Implementation intent:
- keep the existing shell and behavior intact
- remove the stale archive panel only
- replace the warning copy with a generic archival-only note
- keep the current package metadata block intact
- preserve the warm/light visual language
- keep disabled or fallback copy honest and plain-language
- keep the local actions row unchanged

Acceptance checklist for the implementer:
- warm/light local handoff card is obvious at a glance
- dynamic metadata is the single current-package source of truth
- no manual archive list remains
- no demo clutter or mode-tab noise is introduced
- local copy actions still work
- no live ServiceNow actions are added
- no raw sensitive data appears in the UI
