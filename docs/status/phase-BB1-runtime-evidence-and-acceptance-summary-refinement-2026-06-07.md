# Phase BB1 — Runtime Evidence and Acceptance Summary Refinement — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_d71f852e`

---

## 1. Latest final gate / backlog state

### BA7 final gate — COMPLETE through BA6 (READY-FOR-MANUAL-VALIDATION-ONLY)

The latest completed gate is **BA7**, which is **READY-FOR-MANUAL-VALIDATION-ONLY** for the refreshed BA6 Windows package.

Current local Windows package baseline:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip
```

Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip
```

### What BA7 already confirmed locally

- BA4 QA acceptance — PASS
- BA5 privacy/security — APPROVE
- BA6 package refresh — PASS
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS
- No real ServiceNow login, browser/API write, attachment upload, Microsoft Graph / Excel Web write, Teams/Outlook/phone ingestion, or push/PR/release actions were performed

### Current visible state

The workbench now has a visible runtime evidence panel and a clarified worktree acceptance checkpoint, but the operator still has to mentally correlate the two. The remaining gap is the **acceptance summary itself**:

- The current package anchor should be explicit
- The latest validation history should be summarized in a scannable way
- The accepted/reviewed state should be visible without reading the full evidence list
- The summary must stay sanitized and local-only

This is a visible UX gap, not a backend gap.

---

## 2. Why this scope now

### What Alan sees today

The right rail already surfaces runtime evidence, but the acceptance path still feels split across multiple places:

- the runtime evidence list shows recent action history
- the worktree acceptance checkpoint shows package/path context
- the operator still needs to reconcile those signals mentally

### What is missing

A concise, dynamic acceptance summary should answer these questions at a glance:

1. What is the current package anchor?
2. What was the latest validation run?
3. Has the worktree been reviewed/accepted locally?
4. Is the current state clean, dirty, or awaiting review?

### Why this is the right next scope

- **Visible** — it improves the operator's ability to judge the current local package immediately
- **Local-only** — it uses existing renderer state and local metadata only
- **Small** — it should be a focused UI/copy/state refinement, not a redesign
- **Safe** — no new ServiceNow behavior, no external writes, no new IPC surface if it can be avoided
- **Useful for Alan** — it keeps the release path explicit and avoids another yesterday-looking package experience

---

## 3. Scope — what BB includes

### Deliverable A — This scope document (BB1)

Documents:
- The latest gate state (BA7)
- The runtime evidence + acceptance-summary gap
- Why this is the next visible local product scope
- BB2–BB7 task chain
- Safety boundaries and change budget

### Deliverable B — BB2–BB7 downstream task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **BB2** | UX/copy spec — runtime evidence and acceptance summary | `sna-ui-designer` | BB1 | Define exact wording for the acceptance summary block, current package anchor, last validation run summary, empty/loading states, and disabled-reason copy. |
| **BB3** | Implementation — runtime evidence and acceptance summary | `sna-frontend-workbench` | BB2 | Connect the acceptance summary to existing local state and package metadata; keep runtime evidence and acceptance summary consistent; update tests. |
| **BB4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | BB3 | Verify the summary states, current package anchor, runtime evidence consistency, and manual checklist clarity. |
| **BB5** | Privacy/security audit | `sna-privacy-security` | BB3 | Verify no sensitive data leaks into the summary, clipboard text, or local package anchor display. |
| **BB6** | Windows local package refresh | `sna-windows-runtime` | BB4 + BB5 | Rebuild a fresh BB-dated local Windows package after QA and privacy/security approve the refinement. |
| **BB7** | Final local readiness gate | `codex-gpt55-control` | BB6 | Produce the final local readiness gate with an explicit UNC path and a sanitized verdict. |

### Dependency shape

```text
BB1 ──→ BB2 ──→ BB3 ──→ BB4 ──┐
                         │     ├──→ BB6 ──→ BB7
                         └──→ BB5 ──┘
```

BB3 is the only code-change task. BB4 and BB5 can run in parallel after BB3 completes. BB6 requires both QA and privacy/security sign-off.

---

## 4. What the summary must solve

The acceptance summary should be a short, scannable bridge between:

- the current package path
- the latest validation run history
- the reviewed/accepted local state
- the runtime evidence list in the right rail

### Target user experience

Alan should be able to open the workbench and see, without hunting:

- which package is current
- whether the worktree is clean, dirty, reviewed, or accepted
- what the latest validation result was
- where to look for deeper evidence if needed

### Non-goals

This is **not** a redesign and **not** a new action surface.

- no new ServiceNow login, browsing, or API writes
- no Save / Submit / Update / Resolve / Close
- no attachment upload
- no Microsoft Graph / Excel Web writes
- no real Teams / Outlook / phone ingestion
- no screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- no push, PR, merge, tag, GitHub Release, publish, or cron changes
- no new external dependencies or network calls
- no expansion beyond the local renderer / local metadata / existing runtime evidence state

---

## 5. Safety boundaries

### Safe

- Read existing local state already in the renderer
- Reuse the current package metadata already available locally
- Reuse `validationRunHistory` / acceptance state if needed
- Keep the UI copy sanitized and concise
- Keep the worktree acceptance story local-only

### Red-zone prohibitions

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- Local-only only; no external writes or deliveries
- No new IPC handlers unless the task explicitly says they already exist and must not change
- No new UI cards, panels, or layout changes unless the task explicitly says they already exist and must not change

---

## 6. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BB2 | `docs/status/phase-BB2-runtime-evidence-and-acceptance-summary-ux-spec-2026-06-07.md` | < 60 lines |
| BB3 | `apps/desktop/src/App.tsx`, `apps/desktop/src/App.test.ts`, `apps/desktop/src/styles.css` | < 120 lines total |
| BB4 | QA checklist doc | < 60 lines |
| BB5 | Security audit doc | < 60 lines |
| BB6 | Build/packaging scripts | < 20 lines |
| BB7 | Gate document | < 40 lines |

**Total estimated change budget:** small, local-only, and bounded.

---

## 7. Required gates for downstream tasks

Each downstream task must satisfy the chain gates independently:

- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm privacy:scan`
- Windows local package refresh before QA handoff
- Final local readiness gate before Alan manual validation

---

## 8. Status

```
Phase BB1 — Runtime Evidence and Acceptance Summary Refinement

State: COMPLETE (definition only, no implementation)
Deliverable: this document
Current gate base: BA7 (READY-FOR-MANUAL-VALIDATION-ONLY)
Current branch: next/post-release-operator-cockpit-ab-20260606
Scope: make the acceptance story scannable by tying the current package anchor,
        latest validation history, and local reviewed/accepted state into one
        concise summary next to the runtime evidence panel.
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
