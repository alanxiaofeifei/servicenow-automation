# Phase AH2 — Worktree Acceptance Checkpoint UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only worktree acceptance checkpoint surface with package path, freshness, and dirty/accepted boundary clarity

## 0. Preflight

Goal
- Define a calm, local-only three-column checkpoint surface that makes the dirty/accepted boundary obvious at a glance.
- Surface the exact local Windows package path, its freshness, and the boundary copy Alan needs before manual acceptance.
- Keep safety copy compact and explicit so the surface feels like an operator workbench, not a demo wall or release dashboard.

Known facts
- Parent task AH1 established that the worktree is not clean and the remaining changes were never explicitly accepted by Alan.
- The current local Windows package selected for the checkpoint is:
  `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip`
- That package is the newest dated local Windows build found in `dist/release/` and is treated as the current manual validation checkpoint.
- The package checksum is verified in the local status docs and the checkpoint must remain local-only.
- This task is design/spec only; no live ServiceNow login, browser automation, upload, write, push, PR, merge, tag, release, or cron changes are allowed.

Assumptions
- Alan wants the package path visible without opening a drawer.
- Alan wants the dirty/accepted boundary explained in short language, not a long audit log.
- The UI should remain usable on a clean Windows machine and in repo docs without extra tooling.
- The accepted state is a human decision, not an automated action.

Ambiguities
- Whether the acceptance checkpoint will be shown as a standalone docs surface, a desktop panel, or both.
- Whether the package freshness should be shown as a compact badge or a metadata strip.
- Whether the dirty/accepted boundary should be a chip, a footer note, or both.

Chosen smallest approach
- Specify a three-column, read-only checkpoint with the package path as the first visible artifact detail.
- Use progressive disclosure: only the selected item and its boundary state are expanded by default.
- Keep the surface local-only and human-reviewed, with explicit disabled reasons for all gated actions.

Files likely affected
- `docs/status/phase-AH2-worktree-acceptance-ux-spec-2026-06-07.md` only

Verification plan
- Check that the exact local Windows package path appears in the spec and is clearly treated as the current checkpoint artifact.
- Check that the layout, state matrix, and button logic clearly separate dirty worktree state from accepted/manual-validation state.
- Check that no copy implies live ServiceNow writes, uploads, or release actions.
- Check that disabled states explain why they are disabled.

## 1. Purpose

Turn the worktree acceptance checkpoint into one visible place where Alan can answer, in one glance:

1. What is the exact local Windows package path I should validate?
2. Is that package fresh and current, or stale?
3. Is the worktree still dirty, or has it been explicitly accepted?
4. What boundary copy keeps this local-only and human-reviewed?
5. What can I safely do next without implying a ServiceNow write?

This is not a release dashboard and not a live ServiceNow control panel.
It is a local-only acceptance checkpoint for worktree state, package freshness, and human sign-off clarity.

## 2. Research and design references

Design cues used for this spec:

- Linear-style command center patterns: left queue, center detail, right actions, with one selected item and visible progress/state.
- Claude Code desktop patterns: task-oriented workspace, side-by-side review, visible state, and compact controls.
- The earlier AF/AG/H series docs in this repo: calm warm-light surfaces, short labels, progressive disclosure, and explicit safety boundaries.
- Open Design / command-center thinking: visible current item, compact metadata, and no vertical card dump.

Design takeaways for this task:

- Put the current package path first and keep it visually dominant.
- Make the dirty/accepted boundary a first-class state, not a footnote.
- Keep freshness visible so stale artifacts are not mistaken for the current checkpoint.
- Use short labels that can be scanned comfortably under bright office lighting.

## 3. Layout wireframe in text

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Worktree Acceptance Checkpoint                                                                              │
│ Current local Windows package: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip │
│ Freshness: newest dated local package · checksum verified · local-only                                     │
├───────────────────────────────────────────────┬──────────────────────────────────────────────┬─────────────────┤
│ Left: dirty / accepted queue                  │ Center: selected checkpoint detail            │ Right: actions   │
│                                               │                                              │ + safety         │
│ [Dirty]  tracked changes still open           │ Selected: worktree boundary                   │ Review diff      │
│ [Fresh]  AG local Windows package             │ - exact package path                         │ Copy package path│
│ [Stale]  earlier local package(s)             │ - freshness / checksum / mtime               │ Open dist/release│
│ [History] last validation round               │ - dirty vs accepted explanation              │ Mark reviewed    │
│ [Settings] checkpoint preferences             │ - what is safe to do next                    │ Copy summary     │
│                                               │                                              │ Disabled actions  │
│                                               │                                              │ explain why      │
├───────────────────────────────────────────────┴──────────────────────────────────────────────┴─────────────────┤
│ Footer strip: local-only · no live ServiceNow write · human-reviewed boundary · no upload / PR / merge / tag │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- The left column is the navigation and queue view: what is dirty, what is fresh, what is stale, and what was checked last.
- The center column is the evidence view: selected package, freshness, and the exact dirty/accepted boundary text.
- The right column is for local actions and explicit safety copy only.
- The footer strip should keep the local-only and human-reviewed boundary visible even when a detail card is expanded.

## 4. Column responsibilities

### Left column — dirty/accepted queue and history
Owns the list of checkpoint items and their current state.

It should answer:

- What is still dirty?
- Which package is the current fresh checkpoint?
- Which earlier packages are stale?
- What was the last validation round?
- Where do I change checkpoint preferences?

Include:

- current checkpoint row
- dirty worktree row
- stale package row(s)
- validation history summary
- bottom-left settings entry point

Rules:

- Do not make the left side a long audit log.
- Do not bury the current package under stale history.
- Keep each row short enough to scan in one pass.

### Center column — selected checkpoint detail
Owns the selected package and the dirty/accepted boundary explanation.

It should answer:

- What exact package am I validating?
- Is it fresh, verified, and local-only?
- What does dirty/accepted mean here?
- What remains unresolved?
- What text should Alan read before deciding?

Include:

- exact Windows UNC package path
- freshness badge
- checksum / mtime strip
- dirty vs accepted explanation
- last validation round summary
- compact safety boundary note

Rules:

- The package path must be visible without opening a drawer.
- Preserve the order: path → freshness → boundary explanation → next step.
- Avoid a wall of raw paths or build metadata.
- Keep the last safe state visible even if freshness is still resolving.

### Right column — local actions and safety boundary
Owns the local-only action set and the explicit safety copy.

It should answer:

- What local action can I take now?
- Is the checkpoint ready, loading, or failed?
- What is disabled, and why?
- What boundary keeps this local-only and human-reviewed?

Include:

- Review diff
- Copy package path
- Open dist/release
- Mark reviewed / accept boundary note
- Copy summary
- compact safety badge
- disabled-state explanations

Rules:

- No action may imply ServiceNow login, browser automation, or write operations.
- No action may imply upload, PR, merge, tag, or release.
- Disabled actions must explain their reason in plain language.
- Keep boundary copy compact and always visible.

## 5. State matrix

| State | Left column | Center column | Right column |
| --- | --- | --- | --- |
| Empty | No checkpoint selected yet; current package hinted at | Shows the prompt to open the latest local package first | Review / copy actions disabled with reasons |
| Dirty worktree | Dirty row highlighted | Shows the exact boundary text and what remains open | Review diff enabled; accept disabled until review rules are met |
| Fresh package selected | Current Windows package highlighted | Shows path, freshness, checksum, and mtime immediately | Copy/open actions available |
| Stale package selected | Older package row selectable but clearly not current | Warning explains this is archival only | Current-package actions de-emphasized or disabled |
| Accepted boundary pending | Dirty changes are visible but not yet accepted | Shows acceptance criteria and short sign-off copy | Mark reviewed remains available; accept stays disabled if gates fail |
| Accepted and fresh | Dirty rows are resolved or explicitly accepted | Boundary text flips to confirmed / reviewed | Copy summary and open package remain available |
| Checksum mismatch | Freshness badge becomes warning/error | Last safe package remains visible if one exists | Most actions disabled until metadata is restored |
| Error | No safe checkpoint metadata can be trusted | Center keeps last safe known info and explains the failure | Actions stay disabled until metadata is restored |

Notes:

- Avoid spinner-only states.
- Use muted placeholders or short status text while metadata is resolving.
- Keep the last safe package visible whenever possible.
- A stale package must never look current by color alone.

## 6. Main components

- title bar with worktree acceptance checkpoint title
- current-package banner with the exact UNC path
- freshness strip for checksum / mtime / local-only status
- dirty/accepted boundary card
- dirty worktree queue list
- stale-package list with demotion styling
- validation history summary
- compact safety badge / chip
- local-only actions row
- footer boundary note
- bottom-left settings entry

## 7. Empty, loading, and error states

### Empty states
Use one sentence and one next action.

Recommended copy:
- `No checkpoint selected yet.`
- `Open the latest local Windows package to begin.`
- `The path, freshness, and boundary text will appear here.`

### Loading states
Use muted placeholders, not a spinner wall.

Example copy:
- `Resolving the current checkpoint...`
- `Loading freshness and checksum...`
- `Preparing the dirty / accepted boundary summary...`

### Error states
Show the exact step that failed.

Example copy:
- `The current package could not be resolved.`
- `Checksum verification is unavailable right now.`
- `Open the last safe checkpoint or refresh the local package list.`
- `The surface remains local-only; no remote action was attempted.`

## 8. Button enable / disable logic

### Enabled by default
- `Open dist/release` — enabled whenever the workspace path resolves.
- `Copy package path` — enabled when a current package is selected.
- `Copy summary` — enabled when a row is selected.
- `Review diff` — enabled when dirty worktree changes exist.

### Contextual
- `Mark reviewed` — enabled only when the selected package is fresh and checksum-verified.
- `Accept boundary note` — enabled only after the review summary is visible and the checkpoint is fresh.
- `Stale package details` — enabled only when a stale package is selected.

### Disabled with explicit reasons
- `Accept boundary note` disabled before freshness is confirmed with copy: `Disabled: the current package is not yet verified.`
- `Accept boundary note` disabled when the worktree review is incomplete with copy: `Disabled: dirty changes still need review.`
- `Review diff` disabled when no dirty changes exist with copy: `Disabled: there is nothing dirty to review.`
- `Open package` disabled before the workspace path resolves with copy: `Disabled: the local path is unavailable.`
- Any write-like action outside local checkpoint review should not appear in the primary UI at all.

### Never show in the primary surface
- ServiceNow login / browser automation controls
- Save / Submit / Update / Resolve / Close actions
- Upload, PR, merge, tag, release, or cron controls

## 9. Copy text

Recommended primary labels:
- `Worktree Acceptance Checkpoint`
- `Current local Windows package`
- `Fresh and verified`
- `Dirty changes remain`
- `Accepted boundary not yet confirmed`
- `Stale package — do not select`
- `Local-only · human-reviewed`

Recommended boundary copy:
- `This surface is local-only. It does not perform live ServiceNow actions.`
- `AI can help draft review notes, but a human must confirm acceptance.`
- `No Save / Submit / Update / Resolve / Close automation.`
- `No upload, merge, tag, release, or PR action is implied.`

Recommended disabled-state copy:
- `Disabled: the current package is not yet verified.`
- `Disabled: dirty changes still need review.`
- `Disabled: no current package is selected.`
- `Disabled: this row is stale and not the current checkpoint.`

Recommended helper copy for freshness:
- `Newest dated local Windows package found in dist/release.`
- `Checksum verified locally.`
- `Older local packages are demoted to stale history.`

## 10. Accessibility notes

- Default to a warm-light palette; avoid pure black panels and harsh contrast.
- Use large click targets and generous spacing for scanning comfort.
- Prefer short, literal labels over decorative jargon.
- Never rely on color alone to distinguish dirty, accepted, fresh, or stale states.
- Use clear focus rings and visible keyboard navigation for all controls.
- Keep primary action text short enough to read comfortably at a glance.
- Use progressive disclosure instead of always-expanded details walls.
- Avoid thin font weights on the main status strip; use a clear readable weight.
- Keep the most important status in one line, not inside a tooltip.
- If icons are used, they must have text labels.

## 11. GPT Images 2 mockups

Attempts were made to generate sanitized warm-light three-column mockups with GPT Images 2 / image_generate, but the image service returned `FalClientHTTPError` on both attempts.

Result:
- No mockup asset was successfully generated in this run.
- No real data, screenshots, URLs, ticket IDs, or customer information were used in the prompts.

## 12. Implementation handoff for `sna-frontend-workbench`

When Alan approves this concept, the frontend implementation should stay surgical and local to the workbench shell.

Likely touch points:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Implementation intent:
- Preserve the approved three-column workbench shape.
- Surface the exact Windows package path first.
- Keep the dirty/accepted boundary explicit and readable.
- Keep the safety boundary compact and always visible.
- Make disabled states explain why they are disabled.
- Avoid reintroducing demo clutter, vertical dumps, or mode-switch noise.

Acceptance criteria for the implementation worker:
- The layout reads as a calm operator command center.
- The current Windows package path is visible without extra clicks.
- Dirty, fresh, and stale states are visually distinct and textually explained.
- The boundary footer stays visible in all normal states.
- No live ServiceNow action, upload, PR, merge, tag, or release is implied.
- The warm-light accessibility bar is preserved.

## 13. Manual review notes for Alan

Use these notes during approval. They are intentionally short so the decision stays human-readable.

Review questions:
- Is the exact local Windows package path the first thing you notice?
- Can you tell the difference between dirty, reviewed, and accepted without reading a long paragraph?
- Do the disabled reasons feel explicit and local-only, not implied or automated?
- Does `Review diff` feel like inspection only, while `Mark reviewed` feels like a human decision?
- Does `Open dist/release` feel like a local file action, not a deployment action?
- Does `Copy summary` produce a concise handoff rather than a status dump?

Approval notes:
- Approve this concept only if the local acceptance state stays explicit and separate from any ServiceNow workflow.
- Reject any implementation that reintroduces hidden write-like behavior, live ServiceNow implications, or generic demo language.
- If the exact package path changes later, update the top banner copy before implementation starts.

