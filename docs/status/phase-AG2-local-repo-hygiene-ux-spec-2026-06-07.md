# Phase AG2 — Local Repo Hygiene + Artifact Boundary Status Surface UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only repo hygiene and artifact-boundary status surface

## 0. Preflight

Goal
- Define a calm, local-only three-column surface that makes the remaining hygiene work obvious: `.gitignore` verification, stale `dist/release/` cleanup, and `.local/video-analysis/` closure.
- Keep the clean-worktree / artifact-boundary message explicit so Alan can tell what is resolved, what is still pending, and what is already local-only and gitignored.
- Avoid any UI copy that implies live ServiceNow, upload, PR, merge, tag, or release actions.

Known facts
- Parent task results say `.gitignore` remediation for `.codegraph/` and `.worktrees/` is already done and should be shown as verified, not reopened.
- Parent task results say stale `dist/release/` artifacts remain and should be surfaced as the one item still needing cleanup attention.
- Parent task results say `.local/video-analysis/` is local-only and already gitignored; that backlog item should be shown as closed / N/A, not as an open investigation.
- The surface is local-only: it should report repository and artifact state, not perform any live ServiceNow action.

Assumptions
- Alan wants a read-only status surface first, with explicit copy for each local hygiene item.
- The UI should be usable in one glance without expanding every panel.
- The right rail should prioritize local actions and safety state, not a demo playground.

Ambiguities
- Whether the surface is purely a doc-local concept or will later be rendered inside the desktop workbench.
- Whether the stale artifact cleanup should be shown as a single group or as individual files beneath a grouped card.
- Whether the `.gitignore` verification should be a passive badge or an item with an explicit evidence drawer.

Chosen smallest approach
- Specify a compact three-column layout: left for local hygiene queue and navigation, center for details and evidence, right for local-only actions and safety boundary.
- Use progressive disclosure: only one item is expanded by default, and disabled actions explain why they are disabled.
- Treat unresolved work as a short, explicit list, not a long diagnostics wall.

Files likely affected
- `docs/status/phase-AG2-local-repo-hygiene-ux-spec-2026-06-07.md` only

Verification plan
- Check that the spec names the three hygiene items exactly and assigns a state to each.
- Check that the copy never implies live ServiceNow login, browser automation, upload, PR, merge, tag, or release.
- Check that the surface keeps the local-only boundary visible and that disabled actions explain why they are disabled.

## 1. Purpose

Turn the local repo hygiene backlog into a simple operator surface where Alan can answer, in one glance:

1. What local hygiene items are resolved already?
2. What still needs cleanup work?
3. What is already local-only and gitignored and therefore closed as N/A?
4. What local-only action is safe to take next?
5. What boundary copy makes it clear that no live ServiceNow action is involved?

This is not a release dashboard and not a ServiceNow control panel.
It is a local-only status surface for repository hygiene and artifact boundary clarity.

## 2. Research and design references

Design cues used for this spec:

- Modern agent command-center layouts: a left queue, a center detail view, and a right action/safety rail.
- Desktop workbench patterns: current item first, supporting evidence second, actions third.
- The earlier AF/AG phase docs in this repo: concise, explicit copy with strong safety boundaries and short state language.
- Open Design / command-center style thinking: clear selection state, compact metadata, and progressive disclosure instead of a vertical dump.

Design takeaways for this task:

- Surface the current unresolved hygiene work immediately.
- Make closure states visible instead of hiding them in history.
- Keep the local-only boundary as a first-class chip, not as a footnote.
- Use short labels that can be scanned comfortably.

## 3. Layout wireframe in text

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Artifact Boundary                                                                     │
│ Local only · No ServiceNow actions · No upload / PR / merge / tag / release                               │
├───────────────────────────────────────────┬──────────────────────────────────────────┬─────────────────────┤
│ Left: hygiene queue + history             │ Center: selected item detail             │ Right: local actions │
│                                           │                                          │ + safety boundary    │
│ [Verified] .gitignore remediation         │ Selected: `dist/release/` cleanup        │ Refresh local scan    │
│ [Pending]  stale dist artifacts           │ - why it matters                         │ Open workspace root   │
│ [Closed]   .local/video-analysis/ N/A     │ - current state                          │ Export status markdown│
│ [History]  last scan / evidence log       │ - evidence / paths                       │ Copy selected summary │
│ [Filter]   all / pending / closed         │ - what changed / what remains            │ Cleanup preview       │
│ [Settings] local scan scope               │ - boundary copy                          │ Disabled actions show │
│                                           │                                          │ why they're disabled  │
├───────────────────────────────────────────┴──────────────────────────────────────────┴─────────────────────┤
│ Footer strip: clean-worktree status · artifact boundary status · local-only note                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- The left column is the navigation and queue view: what exists, what is open, what is closed.
- The center column is the evidence view: selected item, exact state, and the local files or paths involved.
- The right column is for local actions and explicit safety copy only.
- The footer strip should keep the clean-worktree / boundary message visible even when a card is expanded.

## 4. Column responsibilities

### Left column — hygiene queue, state, and history
Owns the list of local hygiene items and their status at a glance.

It should answer:

- Which local hygiene item is currently selected?
- Which items are already verified closed?
- Which item still needs cleanup attention?
- What was the last successful local scan?
- Where do I change the filter or scope?

Include:

- item list with state chips
- history / last-scan summary
- pending / closed filter
- short scope selector for local scans
- bottom-left settings entry point

Rules:

- Do not make the left side a long audit log.
- Do not bury the only open item under closed history.
- Keep each row short enough to scan in one pass.

### Center column — selected item detail and evidence
Owns the detailed state for the selected hygiene item.

It should answer:

- What exactly is selected?
- Why is it pending / closed / N/A?
- What evidence supports the state?
- What file path or folder is involved?
- What remains unresolved, if anything?

Include:

- selected item title
- short state explanation
- evidence paths or counts
- compact before/after summary
- artifact-boundary note
- optional evidence drawer for deeper review

Rules:

- Preserve the order: item → state → evidence → next step.
- Keep the selected state visible even if evidence is loading.
- Avoid a wall of raw paths; show only what helps Alan decide.

### Right column — local actions and boundary status
Owns the local-only action set and the explicit safety boundary.

It should answer:

- What local action can I take now?
- Is the local scan ready, loading, or failed?
- What is disabled, and why?
- What keeps this surface local-only?

Include:

- refresh local scan
- open workspace root
- export status markdown
- copy selected summary
- cleanup preview
- compact boundary badge
- disabled-state explanations

Rules:

- No action may imply ServiceNow login or browser automation.
- No action may imply upload, PR, merge, tag, or release.
- Disabled actions must explain their reason in plain language.
- Keep boundary copy compact and always visible.

## 5. State matrix

| State | Left column | Center column | Right column |
| --- | --- | --- | --- |
| Empty | No scan has run yet; items are hidden | Shows the prompt to run a local scan | Refresh and export actions disabled with reasons |
| Loading | Scan row shows progress | Selected item skeleton appears with muted placeholders | Only refresh / cancel-like local controls remain active |
| Ready with open item | `.gitignore` shows verified; stale `dist/release/` is selected | Shows selected cleanup details and evidence | Cleanup preview enabled; export enabled |
| Ready with only closed items | All items show verified / closed / N/A | Shows the clean-worktree summary | Cleanup preview disabled because nothing is pending |
| Pending cleanup | Stale dist artifacts highlighted as the open item | Shows what remains to remove and why | Cleanup preview and evidence copy enabled |
| Closed / N/A | `.local/video-analysis/` marked closed as local-only and gitignored | Shows local-only / gitignored evidence and closure copy | Cleanup action disabled; explanation shown |
| Error | Items remain visible if last safe state exists | Shows the last safe item and the failure reason | Most actions disabled until local state is restored |

Notes:

- Avoid spinner-only states.
- Use muted placeholders or a short status sentence while data resolves.
- Keep the last safe state visible whenever possible.
- Never let a closed item look more urgent than the open stale-artifact item.

## 6. Main components

- title bar with local-only status
- boundary badge / chip
- hygiene queue list
- item state chips: verified, pending, closed, N/A
- selected item detail panel
- evidence / file-path summary
- cleanup preview panel
- local history strip
- footer boundary note
- bottom-left settings entry

## 7. Empty, loading, and error states

### Empty states
Use one sentence and one next action.

Recommended copy:
- `No local hygiene scan has run yet.`
- `Run a local scan to populate .gitignore, dist/release/, and .local/ state.`
- `This surface only reports local repository state.`

### Loading states
Use muted placeholders, not a spinner wall.

Example copy:
- `Scanning local repo state...`
- `Checking .gitignore verification...`
- `Reviewing stale dist/release/ artifacts...`
- `Confirming .local/video-analysis/ closure...`

### Error states
Show the exact step that failed.

Example copy:
- `The local scan could not read the repository state.`
- `Evidence is temporarily unavailable.`
- `Refresh the local scan or open the workspace root.`
- `The surface remains local-only; no remote action was attempted.`

## 8. Button enable/disable logic

### Enabled by default
- `Refresh local scan` — enabled whenever the workspace exists.
- `Open workspace root` — enabled whenever the path resolves.
- `Copy selected summary` — enabled when a row is selected.

### Contextual
- `Cleanup preview` — enabled only when the selected item is the stale `dist/release/` group.
- `Export status markdown` — enabled only after at least one successful local scan.
- `Evidence drawer` — enabled only when evidence exists for the selected item.

### Disabled with explicit reasons
- `Cleanup preview` disabled for `.gitignore` verification with copy: `Disabled: this item is already verified.`
- `Cleanup preview` disabled for `.local/video-analysis/` with copy: `Disabled: the namespace is local-only and gitignored.`
- `Export status markdown` disabled before the first scan with copy: `Disabled: no local scan has produced evidence yet.`
- Any write-like action outside local cleanup should not appear in the primary UI at all.

### Never show in the primary surface
- ServiceNow login / browser automation controls
- Save / Submit / Update / Resolve / Close actions
- Upload / PR / merge / tag / release actions
- Demo / simulator clutter

## 9. Copy text

Use these strings exactly or with only minimal punctuation changes.

### Header copy
- `Local Repo Hygiene + Artifact Boundary`
- `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`

### Item states
- `.gitignore verification — verified`
- `stale dist/release/ artifacts — pending cleanup`
- `.local/video-analysis/ — closed as N/A`

### Boundary copy
- `This surface only reports local repository state.`
- `No live ServiceNow action is performed here.`
- `Disabled actions explain why they are unavailable.`

### Helpful detail copy
- `.gitignore remediation is already complete; this card is for verification only.`
- `Stale dist/release/ artifacts remain and need cleanup attention.`
- `.local/video-analysis/ is local-only and gitignored; the backlog item is closed as N/A.`
- `Last safe local state preserved.`

### Empty/loading/error copy
- `No local hygiene scan has run yet.`
- `Scanning local repo state...`
- `The local scan could not read the repository state.`

## 10. Accessibility notes

- Warm/light theme by default; avoid pure black or harsh contrast.
- Use large click targets, ideally at least 44 px high.
- Make state chips readable by text, not color alone.
- Use short labels and avoid dense paragraphs.
- Preserve clear focus order across the three columns.
- Disabled states must include explanatory text for keyboard and screen-reader users.
- Keep the most important state visible without requiring a hover.
- Use progressive disclosure for evidence, not hidden meaning.

## 11. GPT Images 2 mockups

Attempted mockups for this task:

- Warm-light three-column operator workbench concept with queue / detail / safety rail
- Alternate editorial variant with a more compact queue and evidence-focused center

Result:
- No image was produced in this run because the image generation provider returned `FalClientHTTPError` on repeated attempts.
- The spec therefore proceeds without attached mockups.

## 12. Implementation handoff for `sna-frontend-workbench`

Build this as a read-only local status surface first.

Implementation notes:

- Use the three-column shell from this spec without adding demo clutter.
- Keep `.gitignore` verification, stale `dist/release/` cleanup, and `.local/video-analysis/` closure visible in one place.
- Preserve the local-only boundary in the header and footer.
- Make disabled actions self-explaining.
- Keep closed items visible but visually quieter than the unresolved cleanup item.
- Do not add any live ServiceNow dependency, browser automation, upload flow, or release action.
- Prefer a small, testable UI slice over a broader rework of the workbench.

Suggested frontend entry points:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Acceptance cues for the next implementation pass:

- Alan can immediately see that `.gitignore` is already verified.
- Alan can immediately see that stale `dist/release/` artifacts remain.
- Alan can immediately see that `.local/video-analysis/` is local-only and gitignored and therefore closed as N/A.
- The surface clearly says it is local-only and does not imply live ServiceNow actions.
