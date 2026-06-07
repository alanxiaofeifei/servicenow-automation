# Phase BE2 — Next Visible Local Product Scope — UX / Copy Spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_4d4fb344`  
**Audience:** Alan first, then `sna-frontend-workbench` after approval  
**Privacy level:** sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, customer data, or field values.

---

## 0. Preflight

**Goal**
Turn the BE1-selected next visible scope into a calm, warm-light local-only re-acceptance checklist experience that Alan can use to re-validate the BD6/BE6 cumulative package without any ambiguity about safety or scope.

**Known facts**
- The next visible scope from BE1 is the P0 re-acceptance loop: checklist + runbook refresh + BC7 closure framing.
- The deliverable is a docs/status UX/copy spec, not frontend implementation.
- The local-only safety boundary is strict: no live ServiceNow login, no writes, no attachment upload, no Graph/Excel writes, no real ticket data.
- The current checklist artifact already exists in the repo as a simple markdown checklist; this spec defines the exact UX/copy shape BE3 should preserve or refine safely.
- OpenDesign is already bound in this repo with a warm editorial baseline (`claude` + `web-prototype-taste-editorial`).

**Assumptions**
- Alan wants a checklist surface that feels like a real acceptance handoff, not a release dashboard or a dense log dump.
- The safest smallest change is to keep the artifact local-only and document-centric, with clear headings, a compact safety statement, and readable pass/fail rows.
- Public-reference research is allowed only as layout inspiration, not branding or copy reuse.
- GPT Images 2 mockups are optional and should use fake/sanitized data only.

**Ambiguities**
- Whether BE3 will render this as a markdown page, a card inside the workbench, or both.
- Whether the checklist should expose a small package summary line in addition to the 8 criteria table.
- Whether Alan prefers the safety statement above the checklist table or inside the header block.

**Chosen smallest approach**
- Keep the scope local-only and doc-first.
- Define one clear checklist page structure with exact copy, a table for the 8 P0 criteria, a runbook-diff block, and a BC7 closure block.
- Preserve the calm operator tone already used across the project.
- Avoid any broader redesign of the main workbench shell.

**Files likely affected**
- `docs/status/phase-BE2-next-visible-local-product-scope-ux-spec-2026-06-07.md` (new)
- Later implementation would likely touch only the existing markdown checklist or a minimal renderer surface, not the whole desktop shell.

**Verification plan**
- Confirm the spec states the exact UX goals, copy, and local-only safety statement.
- Confirm the spec does not mention live ServiceNow writes, raw URLs, ticket IDs, or other sensitive data.
- Confirm the spec is narrow enough for BE3 to implement without introducing new product surface area.

---

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Claude Code-style work surfaces: calm command-center layout, visible status near the action, and compact parallel task framing.
- Claude product page desktop patterns: clean top-level hierarchy, obvious primary action, and a strong sense of “local machine work” rather than remote dashboard clutter.
- Existing warm-light OpenDesign baseline in this repo: editorial neutrals, readable hierarchy, progressive disclosure.
- Existing operator workbench spec at `docs/design/operator-workbench-three-column-spec.md`: settings remain first-class; runtime controls stay obvious; safety stays compact.

Design takeaways for this task:
- Put the re-acceptance checklist title and the local-only safety note at the top.
- Make the 8 P0 criteria easy to scan in one pass.
- Keep the runbook-diff and BC7 closure statements visually separated so they do not read like checklist rows.
- Use warm/light surfaces, readable spacing, and short disabled/restricted-state copy.
- Avoid anything that sounds like a live write operation.

---

## 2. Scope framing

This task does not change the core workbench behavior. It only defines the UX/copy of the next visible local acceptance surface so Alan can answer:

1. What exact package am I re-validating?
2. Which 8 P0 checks must pass?
3. What changed in the runbook since the AE-era flow?
4. What is the honest BC7 closure statement?
5. What is the safety boundary before I touch anything?

The artifact should feel like a calm local acceptance checklist, not a release-management page, a demo panel, or a log archive.

### Intended user story

Alan opens the local re-acceptance artifact and immediately sees:
- the target package baseline,
- the 8 pass/fail checks,
- the exact read-only safety rule,
- the runbook refresh context,
- and the BC7 closure explanation.

---

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Phase BE2 — P0 Re-Acceptance Checklist                                        │
│ Use this checklist to re-validate all 8 P0 criteria from PR #97.             │
│ Local-only: Verify only. No live ServiceNow writes.                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Target package                                                                 │
│ - BE6 cumulative package (AE through BD)                                      │
│ - Current local Windows build summary / path                                  │
│                                                                                │
│ Safety                                                                         │
│ - Do not test live ServiceNow                                                 │
│ - Do not fill fields                                                           │
│ - Do not click Save / Submit / Update / Resolve / Close                      │
│ - Use Verify only                                                              │
│                                                                                │
│ P0 checklist                                                                  │
│ | # | Criterion | Expected behavior | Verification step | Pass condition |  │
│ |---|-----------|-------------------|-------------------|----------------|  │
│ | 1 | Double-click opens app | ... | ... | ... | ☐ |                       │
│ | 2 | Startup diagnostics | ... | ... | ... | ☐ |                           │
│ | 3 | Start QA Chromium | ... | ... | ... | ☐ |                              │
│ | 4 | CDP readiness visible | ... | ... | ... | ☐ |                          │
│ | 5 | Verify gating | ... | ... | ... | ☐ |                                  │
│ | 6 | Verify read-only | ... | ... | ... | ☐ |                               │
│ | 7 | Three-column workbench | ... | ... | ... | ☐ |                         │
│ | 8 | Package path correct | ... | ... | ... | ☐ |                            │
│                                                                                │
│ Runbook refresh diff                                                           │
│ - AE-era flow vs BE6/BE7 flow                                                  │
│                                                                                │
│ BC7 closure                                                                    │
│ - What was blocked                                                             │
│ - What was resolved later                                                      │
│ - Why BE7 supersedes BC7                                                       │
│                                                                                │
│ Reminders                                                                      │
│ - Local-only                                                                   │
│ - Sanitized results only                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

Behavioral notes:
- The top header stays fixed and concise.
- The target package and safety block appear before the checklist table.
- The 8 criteria are visible as a single scanable table.
- The runbook-diff and BC7 closure are separate narrative blocks, not checklist rows.
- Nothing in the layout should imply write permission.

---

## 4. Column / section responsibilities

Because this scope is document-centric, think in sections rather than app columns.

### Header section
Owns orientation.

It should answer:
- What is this artifact?
- Why am I reading it now?
- Is this local-only?

Include:
- `Phase BE2 — P0 Re-Acceptance Checklist`
- `Use this checklist to re-validate all 8 P0 criteria from PR #97.`
- `Local-only: Verify only. No live ServiceNow writes.`

### Target package section
Owns baseline clarity.

It should answer:
- What package am I testing?
- Which cumulative scope does it represent?
- Where is the local package summary/path if needed?

Include:
- `Target package`
- `BE6 cumulative package (AE through BD)`
- a local package summary/path line if BE3 continues to show it

### Safety section
Owns safety boundary.

It should answer:
- What am I forbidden to do?
- What read-only action is allowed?
- What should I never infer from the page?

Include:
- `Do not test live ServiceNow`
- `Do not fill fields`
- `Do not click Save / Submit / Update / Resolve / Close`
- `Use Verify only`

### P0 checklist section
Owns the actual re-validation flow.

It should answer:
- What are the 8 P0 criteria?
- What is the expected behavior for each?
- How does Alan verify each one?
- What is the pass condition?

Include:
- a single table with 8 rows
- one pass/fail checkbox per row
- one concrete verification step per row
- one observable pass condition per row

### Runbook refresh diff section
Owns context.

It should answer:
- What changed between the AE-era runbook and the current local package runbook?
- Why does this checklist exist now?

Include:
- package naming difference
- startup diagnostics coverage
- Chromium provisioning coverage
- CDP readiness coverage
- verify-gating coverage
- read-only safety coverage
- dynamic UNC path coverage if present

### BC7 closure section
Owns honesty.

It should answer:
- What blocked BC7?
- What later fixed it?
- Why is it superseded now?

Include:
- the two stale-test failures from the earlier gate
- the fact that the BC6 ZIP was never built because the gate halted
- the statement that BD/BE absorbed the implementation and BE7 supersedes BC7

---

## 5. Exact labels and copy

### Header labels
- `Phase BE2 — P0 Re-Acceptance Checklist`
- `Use this checklist to re-validate all 8 P0 criteria from PR #97.`
- `Local-only: Verify only. No live ServiceNow writes.`

### Target package labels
- `Target package`
- `BE6 cumulative package (AE through BD)`
- `Current local package summary` when a summary line is shown
- `Current local package path` when a path line is shown

### Safety labels
- `Safety`
- `Do not test live ServiceNow`
- `Do not fill fields`
- `Do not click Save / Submit / Update / Resolve / Close`
- `Use Verify only`

### Checklist table labels
- `#`
- `Criterion`
- `Expected behavior`
- `Verification step`
- `Pass condition`
- `Pass/Fail`

### Runbook / closure labels
- `Runbook refresh diff`
- `BC7 closure statement`
- `Reminders`

### Button / action labels if rendered as interactive markdown UI later
- `Copy package path`
- `Copy package summary`
- `Open runbook`
- `Copy checklist summary`

### Copy to avoid in the primary artifact
- MockAIProvider
- language simulation wording
- high-severity simulator wording
- Excel dry-run wording that sounds like a write action
- release-dashboard language that implies production deployment
- any copy that suggests Save/Submit/Update/Resolve/Close is available

---

## 6. State matrix

| State | Header / target package | Checklist table | Safety block | Secondary notes |
|---|---|---|---|---|
| Empty | Show a simple title and a “ready when the local package is present” hint | Empty checklist shell with placeholder rows or a loading skeleton | Show the safety block immediately | No runbook diff yet |
| Loading | Show `Loading local package metadata...` | Muted placeholder rows | Safety stays visible | Secondary notes stay muted |
| Ready | Show target package and local summary/path | All 8 criteria visible with checkboxes | Safety is prominent but compact | Runbook diff and BC7 closure visible |
| Partially complete | Same as Ready | Some rows checked, others unchecked | Safety unchanged | Progress should be visible without reflowing the whole page |
| Blocked / error | Show what is missing or unavailable without inventing a path | Keep previous safe checklist state visible | Explain the blocked condition in plain language | Do not hide the reason in a tooltip |
| Review complete | Show checked state and final local-ready summary | All rows checked | Safety still present | The closure block should remain readable for handoff |

Notes:
- A fallback state must never look like a confirmed package path when it is not.
- Error states should be calm and explicit, not alarming.
- If the package is missing, the spec should keep the last safe state visible rather than clearing the page.

---

## 7. Main components

Keep the component set small.

### Document shell
- `ReAcceptanceChecklistPage`
- `ChecklistHeader`
- `TargetPackageBlock`
- `LocalSafetyBlock`
- `ChecklistTable`
- `RunbookDiffBlock`
- `Bc7ClosureBlock`
- `ReminderBlock`

### If rendered as a workbench panel later
- `CopyChecklistSummaryButton`
- `CopyPackagePathButton`
- `OpenRunbookButton`
- `ChecklistRow`
- `ChecklistPassFailCell`
- `LoadingPlaceholderRow`

Rules:
- Do not introduce a new broad design system.
- Do not add a new navigation mode.
- Do not add any write-action controls.
- Keep the layout readable with a small number of visible sections.

---

## 8. Empty, loading, and error copy

### Empty
- `No local package selected yet.`
- `Open the BE6 cumulative package to begin re-validation.`

### Loading
- `Loading local package metadata...`
- `Preparing the checklist and runbook context...`

### Error / unavailable
- `Current local package unavailable.`
- `The checklist is still safe to read, but the package path cannot be confirmed yet.`
- `Runbook context unavailable.`

### Review complete
- `Checklist complete.`
- `All 8 P0 criteria are recorded for local re-acceptance.`

Rules:
- Keep each state to one short sentence or two max.
- Do not mimic a verbose logs page.
- Do not imply a live ServiceNow write when the surface is read-only.

---

## 9. Local safety and enable/disable logic

If BE3 renders any interactive controls around this spec, the safe default is conservative.

### Copy package path
Enabled when:
- the local package path is confirmed,
- the path is sanitized,
- the page is in a ready state.

Disabled copy:
- `Local package path is unavailable.`
- `Package metadata is still loading.`

### Copy package summary
Enabled when:
- a local summary exists,
- the summary includes only sanitized metadata.

Disabled copy:
- `Package summary is still loading.`
- `Local package summary is unavailable.`

### Open runbook
Enabled when:
- the runbook reference is known,
- the user is on a local workspace path.

Disabled copy:
- `Runbook context is unavailable.`

### General rules
- never hide an important action without explaining why
- disabled reasons must be visible next to the control, not hidden in a tooltip
- never imply Save / Submit / Update / Resolve / Close exists
- keep safety language short and readable
- if a control might touch anything outside the local workspace, do not add it

---

## 10. Copy text

Recommended core copy:
- `Local-only: Verify only. No live ServiceNow writes.`
- `Use this checklist to re-validate all 8 P0 criteria from PR #97.`
- `Target package: BE6 cumulative package (AE through BD)`
- `P0 checklist`
- `Runbook refresh diff`
- `BC7 closure statement`
- `Reminders`
- `Record only pass/fail per criterion and sanitized blockers.`
- `Do not test live ServiceNow.`
- `Do not fill fields.`
- `Do not click Save / Submit / Update / Resolve / Close.`

Preferred operator labels:
- `Re-validate` instead of `re-test` when the package is already known to be local and cumulative
- `Target package` instead of `artifact` or `build` when Alan needs a human-readable re-acceptance cue
- `Runbook refresh diff` instead of a generic `changes` section
- `BC7 closure statement` instead of a vague `notes`

Copy to avoid in the primary UI:
- demo-only language that sounds like a toy
- release-dashboard jargon that implies production rollout
- long warning essays
- any wording that suggests a write action is safe

---

## 11. Accessibility notes

- warm/light theme by default; avoid pure black surfaces
- large touch/click targets if interactive actions are present
- calm contrast and generous spacing for eye comfort
- progressive disclosure instead of always-expanded narrative blocks
- readable line length for astigmatism / eye comfort
- disabled reasons must be explicit and readable
- preserve keyboard navigation and visible focus states
- keep the checklist table visually scannable with clear row separation
- make the safety statement visually distinct from the table, not buried in a footer

---

## 12. GPT Images 2 mockup notes

Attempted sanitized mockup generation with `image_generate` using fake/local-only data.

Result:
- the backend returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

If a later run gets a working image backend, generate:
- one warm-light checklist page concept
- one tighter checklist + safety block concept
- fake package data only
- no real URLs, no ticket IDs, no logs, no screenshots

---

## 13. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted order.

Implementation requirements:
1. Preserve the local-only safety model.
2. Keep the checklist title, target package, and safety statement first-class.
3. Keep the 8 P0 criteria visible in one scanable table.
4. Keep the runbook diff and BC7 closure separate from checklist rows.
5. Keep disabled reasons plain-language and visible.
6. Keep copy sanitized and local-only.
7. Do not reintroduce demo clutter or write-action language.
8. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `docs/status/phase-BE2-p0-re-acceptance-checklist-2026-06-07.md`
- `docs/test/windows-clean-machine-validation-2026-06-07.md` only if the runbook copy needs alignment

Why this is the smallest safe change:
- It does not change the workbench shell.
- It only refines the acceptance document shape and its copy.
- It keeps the review loop local-only and honest.
- It prevents the re-acceptance experience from becoming a generic dashboard.

Remaining risk:
- If later implementation tries to make the checklist feel like a live workflow, it could drift into unsafe or write-oriented language. Keep it read-only and local.

---

## 14. Acceptance criteria

This spec is ready for frontend or doc implementation only when all of the following are true:
- the artifact presents a warm/light local acceptance experience
- the header clearly says this is the BE2 P0 re-acceptance checklist
- the target package is identifiable without ambiguity
- the local-only safety statement is explicit and easy to see
- all 8 P0 criteria are present and scanable
- the runbook refresh diff is separated from the checklist table
- the BC7 closure statement is honest and concise
- disabled controls, if any, explain why they are disabled
- no real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed
- no Save / Submit / Update / Resolve / Close automation is introduced
- no mock/demo clutter reappears in the primary artifact

---

## 15. Local-only safety statement

This phase stays local-only. The checklist is for re-acceptance planning and verification guidance only. It must never imply a live ServiceNow write path, a production submission flow, or any permission to fill or submit fields outside the explicitly read-only Verify action.
