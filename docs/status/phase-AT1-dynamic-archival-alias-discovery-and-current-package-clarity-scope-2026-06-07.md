# Phase AT1 — Dynamic Archival Alias Discovery and Current-Package Clarity Scope

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**HEAD:** `019c502e9b4ada63e2a0884f3783aae1a8a9ee04` (dirty worktree; local-only phase artifacts remain open)  
**Profile:** `sna-orchestrator`  
**Task:** `t_3bfa9d72`

---

## 1. Latest final gate / backlog state

### Current local baseline

The latest completed gate is **AS7**, which is **READY-FOR-MANUAL-VALIDATION-ONLY**.

Current local Windows package baseline:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip
```

Windows UNC path Alan should test today:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip
```

The current `dist/release/` inventory is still the AS6 current package plus older archival artifacts:

| File | Role observed locally |
|---|---|
| `servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip` | Current manual-validation target |
| `servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip` | Archival-only |
| `servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip` | Archival-only |

### Why this phase now

The Worktree Acceptance UI already shows the current package path dynamically, but the archival-alias line is still hard-coded in the renderer copy:

- `rc.1, AQ6, AF, AG, AH, AI, and AJ`

That is a maintenance hazard and a source of false-positive stale-looking copy. The next local-visible product step should make archival aliases discoverable from local artifact metadata while preserving one explicit current package path for Alan.

This phase is therefore about:

1. keeping the **current package path** explicit and testable,
2. making **older aliases archival-only** without hard-coding the list in the renderer,
3. preserving the **local-only / no write** safety model, and
4. producing a fresh dated local package only after QA + privacy/security approve the implementation.

---

## 2. Scope — what AT includes

### Deliverable A — this scope document (AT1)

This document defines the next visible local product scope and the downstream task chain.

### Deliverable B — AT2–AT7 task chain

| Task | Title | Assignee | Depends on | Description |
|---|---|---|---|---|
| **AT2** | UX/copy spec for dynamic archival alias discovery | `sna-ui-designer` | AT1 | Define the exact copy, layout text, checklist wording, and disabled-reason language for a dynamic archival-alias list while keeping the current package path explicit. |
| **AT3** | Implement dynamic archival alias discovery and current-package clarity | `sna-frontend-workbench` | AT2 | Wire the renderer / IPC / tests so the archival alias list is discovered locally rather than hard-coded, while preserving the current package path and archival-only semantics. |
| **AT4** | QA acceptance for dynamic archival alias discovery | `sna-qa-acceptance` | AT3 | Verify the updated copy, dynamic alias presentation, and current-package path behavior from the operator perspective. |
| **AT5** | Privacy/security audit for dynamic archival alias discovery | `sna-privacy-security` | AT3 | Confirm the implementation remains local-only, least-privilege, and free of secrets or external write paths. |
| **AT6** | Windows local package refresh after archival alias update | `sna-windows-runtime` | AT4 + AT5 | Build a fresh dated local Windows package after QA and privacy/security approve the change. |
| **AT7** | Final local readiness gate for dynamic archival alias discovery | `codex-gpt55-control` | AT6 | Produce the final local readiness gate with an explicit UNC path and a sanitized verdict. |

### Dependency shape

```text
AT1 ──→ AT2 ──→ AT3 ──→ AT4 ──┐
                         │     ├──→ AT6 ──→ AT7
                         └──→ AT5 ──┘
```

AT3 is the only code-change task. AT4 and AT5 may proceed in parallel after AT3. AT6 requires both AT4 and AT5.

---

## 3. Visible defect / reason for the scope

The current worktree acceptance card already has dynamic current-package path copy, but the archival alias list is still hard-coded. That creates three problems:

1. **Maintenance drift** — a new local package refresh can make the alias list stale.
2. **False-positive staleness** — the UI can look like yesterday’s package if the archival labels are not derived from the current archive state.
3. **Manual validation clarity** — Alan needs one explicit current package path, not a changing alias list that has to be edited by hand every time.

The right next step is not a broader redesign. It is a narrow local-only improvement that makes archival alias discovery data-driven while preserving the explicit current package anchor.

---

## 4. Acceptance target for AT3

AT3 should satisfy all of the following:

1. The Worktree Acceptance card still shows exactly one explicit current package path line.
2. The archival alias display is derived from local artifact metadata or an equivalent local-only source.
3. Older aliases are still labeled archival-only and are not presented as the current package anchor.
4. Existing local-only action wiring, copy behavior, and manual checklist flow continue to work.
5. Tests cover the new alias discovery path and the current-package path copy.
6. The implementation stays within the desktop app, local filesystem, and existing IPC surfaces unless the smallest necessary new local IPC is needed.

---

## 5. Non-goals

AT explicitly does **not** include:

- ServiceNow login, browsing, or API writes
- Save / Submit / Update / Resolve / Close
- attachment upload
- Microsoft Graph / Excel Web writes
- real Teams / Outlook / phone ingestion
- screenshots, HAR, traces, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, or real field values
- push, PR, merge, tag, GitHub Release, publish, or cron changes
- broad layout redesigns
- unrelated refactors outside the acceptance / archive-alias path

---

## 6. Safety / change budget

This phase stays in the Green-zone:

- local-only repo and filesystem work
- no external writes
- no service-side changes
- no destructive cleanup beyond the smallest necessary local artifact update
- block rather than guess when the alias source or package path is unclear

If a fixture or doc false-positive appears during QA or audit, patch only the narrow local artifact that caused it.

---

## 7. What success looks like

When AT completes, Alan should be able to:

1. open the updated worktree acceptance surface,
2. see one explicit current package path,
3. see archival aliases derived from the current local artifact state,
4. confirm older aliases are archival-only,
5. validate the refreshed package using the exact Windows UNC path in the final gate, and
6. avoid any ambiguity about which package is current.
