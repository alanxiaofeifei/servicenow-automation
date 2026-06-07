# Phase AU1 — Release Readiness Handoff Current-Package Path and Summary Clarity — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_6a926c9f`

---

## 1. Current state — ground truth from AT7

The latest completed gate is **AT7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY**.

### Current local Windows package baseline

| Property | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` |
| Windows UNC path | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` |
| Size | 118,604,635 bytes (~113 MB) |
| SHA256 | `4f459b7a8c603a04a430e089d89a304d8bd844f27ffe5a460cad04a056ade328` |
| mtime | 2026-06-07 13:45:32 CST |
| Phase prefix | `at6` |
| Newest by mtime | PASS — newer than AS6, AR3, and AQ6 |

### Current `dist/release/` inventory

| File | Role (observed by AT7) |
|---|---|
| `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` | Newest/current manual validation target |
| `servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip` | Older than AT6; archival-only |
| `servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip` | Older than AT6; archival-only |
| `servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip` | Older than AT6; archival-only |

### Package metadata type

`PackageMetadataResult` already carries these fields from local discovery:
- `ok`, `path`, `sha256`, `mtime`, `filename`, `size`, `phase`, `archivalAliases`, `error`

The AT3 implementation made `path`, `sha256`, `mtime`, `filename`, `size`, `phase`, and `archivalAliases` dynamically derived from `dist/release/` zip metadata rather than hard-coded.

---

## 2. The gap — hardcoded summary/descriptive copy in the Release Readiness Handoff card

The Release Readiness Handoff card (App.tsx lines 4228-4312) was implemented during the AE phase for the AD7 package. The AT3 dynamic archival alias work updated the path/checksum/mtime/alias rendering but left **three hardcoded text surfaces** still carrying stale copy from the AE/earlier phase:

### Gap 1: "What changed" metadata line

Line 4250 in App.tsx:
```tsx
<dd>Stale-archive list, runtime readiness copy, quickstart checklist, current{currentPhase ? ` ${currentPhase}` : ""} metadata</dd>
```

This copy was written for the AE round (stale-archive/repo-hygiene feature). It does not mention the AT-series work (dynamic archival alias discovery, removal of hard-coded alias list, deduplication from zip metadata). The `{currentPhase}` interpolation shows the phase code but the descriptive text before it is stale.

### Gap 2: "Copy summary" clipboard button

Line 4309 in App.tsx:
```tsx
navigator.clipboard.writeText("Stale-archive list, runtime readiness copy, quickstart checklist, updated metadata")
```

This is a fully hardcoded string. It carries the same stale phase description and does not reflect the current package's actual changes. When Alan copies the summary from the UI, he gets text from a previous phase.

### Gap 3: "Why retest matters" bullets

Lines 4260-4263 in App.tsx:
```tsx
<li>Validates the stale-archive list and warning copy</li>
<li>Confirms runtime readiness and quickstart strip display</li>
<li>Confirms older packages are visibly archival only</li>
<li>Verifies metadata still matches the artifact</li>
```

These bullets were written for the AQ/AR repo-hygiene and worktree-acceptance rounds. They do not reference the AT6-specific changes (dynamic archival alias discovery) or the current package's testing focus.

### Gap 4: Quickstart checklist copy drift

Lines 4289-4295 use generic checklist language that does not reference the current package name or phase. While this is intentionally kept generic to avoid per-phase copying, the checklist should still feel fresh and tied to the current validation round, not stale boilerplate.

---

## 3. What AU fixes — scope

AU narrows the Release Readiness Handoff card so its summary/descriptive copy reflects the current package metadata and phase, while keeping path/checksum/mtime/aliases already dynamic.

### Deliverable A — this scope document (AU1)

Defines the next visible local product scope and the downstream task chain.

### Deliverable B — AU2–AU7 task chain

| Task | Title | Assignee | Depends on | Description |
|---|---|---|---|---|
| **AU2** | UX/copy spec for Release Readiness Handoff current-package path and summary clarity | `sna-ui-designer` | AU1 | Define exact labels, "What changed" template, "Copy summary" format, "Why retest matters" bullet derivation, quickstart checklist refresh pattern, and disabled-reason text for stale/unavailable metadata. |
| **AU3** | Implement Release Readiness Handoff current-package path and summary clarity | `sna-frontend-workbench` | AU2 | Replace hardcoded "What changed", "Copy summary", "Why retest matters", and quickstart checklist text with data-driven or per-phase-derivable values. Keep path/checksum/mtime/archival-aliases already dynamic. |
| **AU4** | QA acceptance for Release Readiness Handoff current-package path and summary clarity | `sna-qa-acceptance` | AU3 | Verify the updated copy, clipboard summary, and checklist reflect the current package metadata and do not look stale. |
| **AU5** | Privacy/security audit for Release Readiness Handoff current-package path and summary clarity | `sna-privacy-security` | AU3 | Confirm no hardcoded phase identifiers, no stale ServiceNow references, and no unintended data exposure in the updated copy. |
| **AU6** | Windows local package refresh after Release Readiness Handoff clarity update | `sna-windows-runtime` | AU4 + AU5 | Build a fresh dated local Windows package (`au6` phase prefix) after QA and privacy/security approve. |
| **AU7** | Final local readiness gate for Release Readiness Handoff clarity update | `codex-gpt55-control` | AU6 | Produce the final local readiness gate with the exact AU6 Windows UNC path and a sanitized verdict. |

### Dependency shape

```text
AU1 ──→ AU2 ──→ AU3 ──→ AU4 ──┐
                         │     ├──→ AU6 ──→ AU7
                         └──→ AU5 ──┘
```

AU3 is the only code-change task. AU4 and AU5 may proceed in parallel after AU3. AU6 requires both AU4 and AU5.

---

## 4. Acceptance criteria for AU3

AU3 should satisfy all of the following:

1. The "What changed" metadata line in the handoff card is derived from the current package metadata and phase, not a hardcoded string from a prior phase.
2. The "Copy summary" button copies text that reflects the current package's actual changes and phase, not stale AE-round text.
3. The "Why retest matters" bullets are updated to reference the current phase's feature set and validation focus.
4. The quickstart checklist feels current and references the package metadata state, not generic boilerplate.
5. Path, SHA256, mtime, filename, size, and archival-alias rendering remain dynamic and unchanged (already working).
6. The handoff card remains read-only, local-only, with no new external write paths.
7. Tests cover the new copy behavior, verify no stale phase identifiers leak, and verify clipboard output reflects current metadata.
8. Build, typecheck, test, and privacy:scan gates all pass.
9. No broad layout changes — only the descriptive text and summary surfaces are touched.

---

## 5. Non-goals

AU explicitly does **not** include:

- ServiceNow login, browsing, or API writes
- Save / Submit / Update / Resolve / Close
- Attachment upload
- Microsoft Graph / Excel Web writes
- Real Teams / Outlook / phone ingestion
- Screenshots, HAR, traces, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, or real field values
- Push, PR, merge, tag, GitHub Release, publish, or cron changes
- Broad layout redesigns of the handoff card or workbench
- New IPC surfaces beyond the smallest necessary local-only change
- Changing the dynamic path/checksum/mtime/alias rendering (already working)
- Per-phase manual editing of copy text by a human — the intent is for AU3 to make the copy phase-aware without requiring a manual update every round

---

## 6. What success looks like

When AU completes, Alan should be able to:

1. Open the Release Readiness Handoff card in the workbench
2. See the exact current package path (already working — unchanged)
3. See the SHA256, mtime, and filename from local metadata (already working — unchanged)
4. See archival aliases dynamically derived from `dist/release/` (already working — unchanged)
5. See a "What changed" line that describes the current phase's actual changes, not stale text
6. Click "Copy summary" and get clipboard text that accurately describes the current package's feature set
7. Read "Why retest matters" bullets that reference the current validation round's focus
8. Validate the AU6 package at the exact Windows UNC path in the AU7 final gate
9. Be confident the handoff card does not look like yesterday's file

---

## 7. Safety / change budget

This phase stays in the Green-zone:

- Local-only repo and filesystem work
- No external writes
- No service-side changes
- No destructive cleanup beyond the smallest necessary copy update
- If tests or privacy scan fail, stop and block with sanitized evidence — do not guess or bypass

If the AU2 UX spec discovers a better approach for copy derivation (e.g., embedding a phase-description map in the renderer vs. adding an IPC field), it should recommend the smallest implementation. The preferred approach is to make the descriptive text data-driven from the existing `PackageMetadataResult` (e.g., adding a `description` or `changeSummary` field to the IPC response) rather than adding a new IPC channel.

---

## 8. Pre-existing task chain

The downstream pipeline (AU2–AU7) was already registered as kanban child tasks before this scope document was written:

| Task id | Title | Assignee | Status |
|---|---|---|---|
| `t_4213fa6c` | AU2 — UX/copy spec for Release Readiness Handoff current-package path and summary clarity | `sna-ui-designer` | todo |
| `t_3dd6aaca` | AU3 — Implement Release Readiness Handoff current-package path and summary clarity | `sna-frontend-workbench` | todo (blocked on AU2) |
| `t_44fbce34` | AU4 — QA acceptance for Release Readiness Handoff current-package path and summary clarity | `sna-qa-acceptance` | todo (blocked on AU3) |
| `t_5d91fcb2` | AU5 — Privacy/security audit for Release Readiness Handoff current-package path and summary clarity | `sna-privacy-security` | todo (blocked on AU3, parallel with AU4) |
| `t_d9bac01b` | AU6 — Windows local package refresh after Release Readiness Handoff clarity update | `sna-windows-runtime` | todo (blocked on AU4 + AU5) |
| `t_169a1c6a` | AU7 — Final local readiness gate for Release Readiness Handoff clarity update | `codex-gpt55-control` | todo (blocked on AU6) |

All dependency edges are already linked. No additional task registration is needed.

---

## 9. Status

```text
Phase AU1 — RELEASE READINESS HANDOFF CURRENT-PACKAGE PATH AND SUMMARY CLARITY — SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream phases defined: 6 (AU2–AU7)
  - AU2: UX/copy spec                                        → sna-ui-designer
  - AU3: implementation                                       → sna-frontend-workbench
  - AU4: QA acceptance                                        → sna-qa-acceptance
  - AU5: privacy/security audit                               → sna-privacy-security
  - AU6: Windows local package refresh                        → sna-windows-runtime
  - AU7: final local readiness gate                           → codex-gpt55-control

Pipeline: AU2 → AU3 → (AU4∥AU5) → AU6 → AU7
Red-zone items excluded: 9
Non-goals: 10

Current latest artifact (AT7/AT6):
  servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip
  SHA256: 4f459b7a8c603a04a430e089d89a304d8bd844f27ffe5a460cad04a056ade328
  Gate: READY-FOR-MANUAL-VALIDATION-ONLY

Identified hardcoded copy gaps in the Release Readiness Handoff card:
  1. "What changed" line (App.tsx:4250) — stale AE-round text
  2. "Copy summary" button (App.tsx:4309) — fully hardcoded string
  3. "Why retest matters" bullets (App.tsx:4260-4263) — stale AQ/AR round text
  4. Quickstart checklist — generic boilerplate, not phase-aware
```

This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.
