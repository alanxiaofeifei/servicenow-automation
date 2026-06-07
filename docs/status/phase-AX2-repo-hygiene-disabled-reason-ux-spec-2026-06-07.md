# Phase AX2 — Repo-Hygiene Disabled-Reason UX Spec

**Date:** 2026-06-07  
**Source:** `docs/status/phase-AX1-repo-hygiene-disabled-reason-specificity-scope-2026-06-07.md` (section 4, AX2)  
**Hand-off target:** `sna-frontend-workbench` (AX3)

## 1. Goal

Replace the shared repo-hygiene disabled-reason block with per-button disabled reasons, using the same adjacency pattern as the worktree acceptance card.

This is a UX/copy-only spec. It must not change button enablement logic, event handlers, or any runtime behavior.

## 2. Layout / placement rule

Keep the existing button stack exactly as-is.

For each button that can be disabled:

- render its disabled-reason `<p>` immediately after that button
- keep the reason in the same DOM container as the button
- use `className="worktree-accept-action-disabled-reason"` for every disabled reason line
- do not move the reasons into a shared block below the full button group
- do not add new wrapper elements just for the reasons

This matches the worktree acceptance card pattern: reason text sits directly next to the control it explains, not in a shared summary area.

### Placement sketch

```text
[ Export status markdown ]
  <p class="worktree-accept-action-disabled-reason">…</p>

[ Copy selected summary ]
  <p class="worktree-accept-action-disabled-reason">…</p>

[ Cleanup preview ]
  <p class="worktree-accept-action-disabled-reason">…</p>
  <p class="hygiene-action-disabled-green">Archive complete…</p>   (only when done)

[ Archive stale artifacts ]
  <p class="worktree-accept-action-disabled-reason">…</p>
  <p class="hygiene-action-disabled-green">Archive complete…</p>   (only when done)
```

## 3. Button-by-button copy matrix

Use the first matching condition only. Conditions are evaluated in the order listed for each button.

### 3.1 Export status markdown

| Condition | Disabled reason copy |
|---|---|
| `!hygieneScanResult` | `Scan first to generate a status report.` |

Notes:
- This button has one disabled reason only.
- When enabled, show no reason line.

### 3.2 Copy selected summary

| Condition | Disabled reason copy |
|---|---|
| `!hygieneScanResult` | `Scan first before copying item summaries.` |

Notes:
- This button has one disabled reason only.
- The copy must be specific to the action; do not reuse the export string.

### 3.3 Cleanup preview

| Condition order | Disabled reason copy |
|---|---|
| `!hygieneScanResult` | `Scan first to preview cleanup.` |
| `cleanupArchiveDone` | `Cleanup already applied for this batch.` |

Notes:
- If both conditions somehow evaluate true, show only the first matching message.
- The success-state green confirmation remains separate and unchanged.

### 3.4 Archive stale artifacts

| Condition order | Disabled reason copy |
|---|---|
| `!cleanupPreviewResult` | `Generate preview first before archiving.` |
| `!cleanupPreviewOpen` | `Open the cleanup preview to enable archiving.` |
| `cleanupArchiveInProgress` | `Archiving stale artifacts…` |
| `cleanupArchiveDone` | `Archive already complete.` |

Notes:
- Use the first matching message only.
- Preserve the current green completion message after successful archive.
- Do not hide or alter the button label states (`Archiving...` / `Archived`) with this spec.

## 4. State matrix

| State | Export status markdown | Copy selected summary | Cleanup preview | Archive stale artifacts |
|---|---|---|---|---|
| No hygiene scan yet | disabled, show `Scan first to generate a status report.` | disabled, show `Scan first before copying item summaries.` | disabled, show `Scan first to preview cleanup.` | disabled, show `Generate preview first before archiving.` |
| Scan exists, no preview yet | enabled, no reason | enabled, no reason | enabled, no reason | disabled, show `Generate preview first before archiving.` |
| Preview exists, preview closed | enabled, no reason | enabled, no reason | enabled, no reason | disabled, show `Open the cleanup preview to enable archiving.` |
| Archive in progress | enabled, no reason | enabled, no reason | enabled, no reason | disabled, show `Archiving stale artifacts…` |
| Archive done | enabled, no reason | enabled, no reason | disabled, show `Cleanup already applied for this batch.` | disabled, show `Archive already complete.` |

Notes:
- The matrix above is intentionally copy-focused; it does not redefine any existing state logic.
- “Enabled, no reason” means no disabled-reason paragraph should render for that button.

## 5. Empty / loading / error states

### Empty state

When there is no hygiene scan result:

- Export status markdown: show `Scan first to generate a status report.`
- Copy selected summary: show `Scan first before copying item summaries.`
- Cleanup preview: show `Scan first to preview cleanup.`
- Archive stale artifacts: show `Generate preview first before archiving.`

### Loading / in-progress state

When archive is actively running:

- Archive stale artifacts: show `Archiving stale artifacts…`
- Do not introduce any extra loading panel
- Do not replace the button with a spinner-only affordance

### Error state

This spec does not introduce new error text.

If a future error state is added, it should follow the same rule: one button, one adjacent reason, one first-match message, no shared global block.

## 6. Button enable/disable logic

No changes.

Keep the current disabled expressions exactly as they are:

1. Export status markdown — `!hygieneScanResult`
2. Copy selected summary — `!hygieneScanResult`
3. Cleanup preview — `!hygieneScanResult || cleanupArchiveDone`
4. Archive stale artifacts — `!cleanupPreviewResult || !cleanupPreviewOpen || cleanupArchiveInProgress || cleanupArchiveDone`

The only change is how the reason text is displayed.

## 7. Confirmation / success copy

Preserve the existing green confirmation state after archive completes.

Required behavior:

- keep the green success message visible when `cleanupArchiveDone` is true
- keep its green styling class (`hygiene-action-disabled-green`)
- do not replace the green confirmation with the disabled-reason class
- do not remove the post-archive success copy

Suggested success copy to preserve:

- `Archive complete. The selected item moved to the local archive area.`

## 8. Accessibility notes

- Keep the disabled-reason text immediately adjacent to the button it describes so screen-reader and visual scanning order match.
- Use a semantic paragraph element for the reason line, not an alert banner.
- Keep the message short and action-specific.
- Avoid generic reuse that forces the user to infer which button the message belongs to.
- Maintain sufficient spacing so the reason reads as a subordinate hint, not a new card.
- Do not use all-caps or high-contrast warning styling for these reasons.

## 9. Copy rules

- Each button gets its own copy string.
- Never show the same generic reason for multiple different actions when the action intent differs.
- Keep punctuation consistent.
- Use sentence case.
- Use ellipsis only for the in-progress archive message.
- Keep copy concise and task-oriented.

## 10. What was generated

- GPT Images 2 / image_generate: attempted a warm-light three-column concept mockup with per-button disabled-reason placement.
- Result: generation failed in this run, so no image artifact was produced.

## 11. Implementation handoff for `sna-frontend-workbench`

Implement the UX spec by replacing the shared disabled-reason block in `apps/desktop/src/App.tsx` with four button-local reason blocks.

### Required implementation shape

- Keep all button `disabled` expressions unchanged.
- Move the reason paragraphs to sit directly after each affected button.
- Use `className="worktree-accept-action-disabled-reason"` for each disabled reason paragraph.
- Preserve `hygiene-action-disabled-green` for the archive success message.
- Do not add new state variables, handlers, or CSS classes.
- Do not change button order or labels.

### Minimal acceptance checklist

- [ ] Export reason matches the AX2 copy exactly
- [ ] Copy-selected reason matches the AX2 copy exactly
- [ ] Cleanup preview reason has its own first-match logic
- [ ] Archive reason has its own first-match logic
- [ ] Green archive confirmation still appears
- [ ] No behavior changes to disabled/enabled logic
- [ ] No new runtime state introduced

## 12. Non-goals

- No ServiceNow behavior changes
- No new state or IPC
- No layout redesign
- No extra cards or panels
- No shared disabled-reason summary block
- No new demo content
- No real data, URLs, ticket IDs, or secrets
