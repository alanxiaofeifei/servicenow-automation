# Phase AS2 — UX / Copy Spec for the Next Visible Local Product Scope

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan first, then `sna-frontend-workbench` after approval
Privacy level: sanitized. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Goal
Adopt AR2 as-is for the worktree acceptance surface; only refresh the stale current-package reference to `{phase}`.

## 1. Layout
Left: package feed / history / settings. Center: current package detail / diff / checklist. Right: actions / state / disabled reasons.
Boundary copy: `Local only · {phase} is current · Older aliases are archival only`.

## 2. Exact labels
Buttons: `Review diff`, `Copy package path`, `Open dist/release`, `Mark reviewed`, `Copy summary`.
States: `Fresh`, `Dirty`, `Reviewed`, `Accepted`, `Loading`, `Archival only`.
Summary: `Worktree: {Fresh|Dirty} · Review: {pending|done} · Acceptance: {not yet accepted|accepted} · Package: {phase} current · Path: {exact path}`.

## 3. Disabled-state copy
- `Worktree status is still loading.`
- `No local changes to review.`
- `Package metadata is still loading.`
- `No current package path is available yet.`
- `Package path is still loading.`
- `No local dist/release folder is available yet.`
- `Review the current diff first.`
- `Archival-only aliases cannot be marked reviewed.`
- `Wait for package metadata.`
- `Nothing current to summarize yet.`

## 4. Local-only boundary + handoff
This surface is local-only: no ServiceNow write path, no Save / Submit / Update / Resolve / Close, no push / PR / merge / tag / release delivery.
Alan’s manual handoff is: confirm the current package, review the diff, copy the package path, open dist/release, mark reviewed, then copy the summary.

## 5. OpenDesign / mockup note
OpenDesign warm-light framing was used. GPT Images 2 mockup generation was attempted with sanitized fake data, but the provider returned an error, so no raster mockup was generated in this run.

## 6. Implementation handoff
`sna-frontend-workbench` should make the current package path explicit, keep disabled reasons inline, preserve the three-column shell, and avoid adding any demo clutter or new affordances.