# Phase AR1 — Worktree Acceptance Action Wiring Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AQ7 base:** AQ1–AQ7 changes present (six hygiene wiring gaps resolved: mount-time scan, action buttons, cleanup preview, archive execute, stale ae entries removed, Copy path dynamic)
**Profile:** `sna-orchestrator`
**Task:** `t_88f124aa`

---

## 1. Why this phase — the remaining worktree-acceptance action gap

### Current implementation state

The IPC infrastructure for worktree operations is **complete** — all handlers exist in `worktree-ipc.ts`, the preload bridge exposes them via `worktreeApi`, and `main.ts` registers them. But the **renderer action buttons are still no-op placeholders**.

| Layer | Status | What exists |
|-------|--------|-------------|
| **IPC handlers** (`worktree-ipc.ts`) | DONE | `handleWorktreeGitDiff`, `handleWorktreeOpenDistRelease`, `handleWorktreeOpenWorkspaceRoot`, `handleWorktreeStatus`, `handleWorktreePackageMetadata` |
| **IPC routing** (`main.ts`) | DONE | `sda:worktree-git-diff`, `sda:worktree-open-dist-release`, `sda:worktree-open-workspace-root`, `sda:worktree-status`, `sda:worktree-package-metadata` |
| **Preload bridge** (`preload.ts`) | DONE | `worktreeApi.getGitDiff`, `worktreeApi.openDistRelease`, `worktreeApi.getWorktreeStatus`, `worktreeApi.worktreePackageMetadata`, `worktreeApi.hygieneScan` |
| **WorktreeApi interface** (`App.tsx:184`) | DONE | Complete type definitions for all IPC methods |
| **`getWorktreeApi()` helper** (`App.tsx:7049`) | DONE | Used by hygiene card "Open workspace root" button (line 4345) |
| **Mount-time hygiene scan + pkg metadata** | DONE | `useEffect` at line 3149 calls `api.hygieneScan()` and `api.worktreePackageMetadata()` |
| **Mount-time worktree status fetch** | **NOT DONE** | No useEffect calls `api.getWorktreeStatus()` — `worktreeHasDirtyChanges` defaults to `false` |
| **Review diff button onClick** | **NOT DONE** | Button at line 4457 has no onClick handler |
| **Copy package path button onClick** | **NOT DONE** | Button at line 4458 has no onClick handler |
| **Open dist/release button onClick** | **NOT DONE** | Button at line 4459 has no onClick handler |
| **Mark reviewed button onClick** | **NOT DONE** | Button at line 4460 has disabled logic (enabled when `worktreeHasDirtyChanges && !worktreeDiffReviewed`) but no onClick to toggle review/accept state |
| **Copy summary button onClick** | **NOT DONE** | Button at line 4463 has no onClick handler |
| **Diff output display panel** | **NOT DONE** | No collapsible `pre` block to show git diff output after clicking Review diff |
| **Dynamic package metadata display** | **NOT DONE** | Card shows static "Newest dated local package" text — no dynamic path/SHA256/size from IPC |

### The seven gaps

| # | Gap | Location | Severity | Root cause |
|---|-----|----------|----------|------------|
| 1 | **No mount-time worktree status fetch** | `App.tsx` — no `useEffect` calling `api.getWorktreeStatus()` | **BLOCKING** — `worktreeHasDirtyChanges` permanently `false`, card always shows "Fresh" even when dirty | Mount-time IPC call omitted; only hygiene scan and package metadata are fetched |
| 2 | **Review diff button does nothing** | `App.tsx:4457` | **HIGH** — click produces no result | No onClick handler wired |
| 3 | **Copy package path button does nothing** | `App.tsx:4458` | **HIGH** — click produces no result | No onClick handler wired |
| 4 | **Open dist/release button does nothing** | `App.tsx:4459` | **HIGH** — click produces no result | No onClick handler wired |
| 5 | **Mark reviewed button has no toggle logic** | `App.tsx:4460-4462` | **HIGH** — disabled logic exists but no onClick to set `worktreeReviewed`/`worktreeAccepted` | onClick handler never implemented |
| 6 | **Copy summary button does nothing** | `App.tsx:4463` | **HIGH** — click produces no result | No onClick handler wired |
| 7 | **No dynamic package metadata display** | `App.tsx:4429-4439` | **MEDIUM** — static text only, real path/SHA256/size not shown | `packageMetadata` is fetched on mount (line 3162) but never used in the worktree acceptance card |

### Why these gaps are the next priority

1. **User-visible defect** — A user opening the desktop app sees 5 action buttons that do nothing. This is a P0 UX gap.
2. **IPC infrastructure is already done** — All handlers, routing, and preload bridge exist. Only 7 renderer-side changes are needed.
3. **Prerequisite for worktree acceptance flow** — The entire checkpoint card exists for the purpose of: review changes → accept → document. Without action wiring, the flow is decorative.
4. **No new IPC handlers needed** — This is pure renderer wiring. Low risk, high impact.

---

## 2. Current state — exact no-op buttons

### Gap 1 — Mount-time status fetch

```typescript
// App.tsx lines 3149-3169 — current mount-time useEffect
useEffect(() => {
  const api = getWorktreeApi();
  if (!api) return;
  api.hygieneScan().then((result) => {
    if (result.ok && result.result) { setHygieneScanResult(result.result); }
  }).catch(() => { /* silent */ });

  api.worktreePackageMetadata().then((meta) => {
    if (meta.ok) { setPackageMetadata(meta); }
  }).catch(() => { /* silent */ });
}, []);

// Missing:
// api.getWorktreeStatus().then((result) => {
//   if (result.ok) { setWorktreeHasDirtyChanges(result.dirty); }
// }).catch(() => { /* silent */ });
```

### Gap 2 — Review diff (line 4457)

```typescript
<button type="button" className="local-draft-button">Review diff</button>
```

**Needs to become:** Calls `api.getGitDiff()`, stores result in state, displays output in a collapsible `pre` block below the action buttons.

### Gap 3 — Copy package path (line 4458)

```typescript
<button type="button" className="local-draft-button">Copy package path</button>
```

**Needs to become:** Calls `navigator.clipboard.writeText(packageMetadata.path)` (packageMetadata already fetched on mount).

### Gap 4 — Open dist/release (line 4459)

```typescript
<button type="button" className="local-draft-button">Open dist/release</button>
```

**Needs to become:** Calls `api.openDistRelease()`.

### Gap 5 — Mark reviewed (lines 4460-4462)

```typescript
<button type="button" className="local-draft-button" disabled={worktreeHasDirtyChanges && !worktreeDiffReviewed}>
  Mark reviewed
</button>
```

**Needs to become:** onClick handler that sets `worktreeReviewed = true` and `worktreeAccepted = true`. Should also show a brief confirmation that acceptance has been recorded (in-memory state only — no localStorage or file write).

### Gap 6 — Copy summary (line 4463)

```typescript
<button type="button" className="local-draft-button">Copy summary</button>
```

**Needs to become:** Composes a summary string from current state (`worktreeHasDirtyChanges`, `worktreeReviewed`, `worktreeAccepted`, `packageMetadata`) and calls `navigator.clipboard.writeText()`.

### Gap 7 — Dynamic package metadata

```typescript
// App.tsx line 4437-4438 — currently static
<strong>Current local Windows package</strong>
<p>Newest dated local package</p>
```

**Needs to become:** Shows actual package filename and size from `packageMetadata` state variable (already fetched on mount), e.g.:
```typescript
<p>{packageMetadata ? `${packageMetadata.filename} (${formatBytes(packageMetadata.size)})` : "No package found"}</p>
```

---

## 3. Current package path

Current local Windows package:
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip
```

Older aliases (archival only): AF, AG, AH, AI, AJ. These are obsolete and must be referenced only in the archival context.

---

## 4. Scope — what AR1 defines

### Deliverable A — This scope document

Documents the 7 wiring gaps, the current package path, and the AR2–AR7 task chain.

### Deliverable B — AR2–AR7 task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **AR2** | UX/copy spec — worktree acceptance action wiring | `sna-ui-designer` | AR1 | Define button click behaviors, diff output panel layout, confirmation messages, disabled-reason text, acceptance state transitions, summary format, dynamic metadata display |
| **AR3** | Implementation — wire all 5 action buttons + mount-time status + dynamic metadata | `sna-frontend-workbench` | AR2 | Add mount-time `getWorktreeStatus()` call; wire onClick handlers for Review diff, Copy package path, Open dist/release, Mark reviewed, Copy summary; add collapsible diff panel; display dynamic package metadata; update tests |
| **AR4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AR3 | Verify: mount-time status populates correctly, all 5 buttons perform real actions, diff panel shows git output, Mark reviewed toggles state, Copy summary produces formatted text, dynamic metadata displays, no regression in existing tests |
| **AR5** | Privacy/security audit | `sna-privacy-security` | AR3 | Audit: all action wiring is local-only read operations, clipboard writes are user-initiated, git diff output is sanitized (no home dir leak), no new IPC channels added, no ServiceNow data exposed |
| **AR6** | Windows local package refresh | `sna-windows-runtime` | AR4 + AR5 | Rebuild fresh AR-dated package after action wiring changes |
| **AR7** | Final local readiness gate | `sna-release-docs` | AR4 + AR5 + AR6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED |

### Dependencies

```
AR1 ──→ AR2 ──→ AR3 ──→ AR4 ──┐
                         │     ├──→ AR6 ──→ AR7
                         └──→ AR5 ──┘
```

AR3 (implementation) is the only code-change task. AR4 and AR5 can run in parallel after AR3 completes. AR6 (package refresh) requires both QA and security sign-off.

---

## 5. File change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| AR2 | `docs/status/phase-AR2-ux-spec-*.md` | < 80 lines spec doc |
| AR3 | `src/App.tsx`, `src/App.test.ts`, `src/styles.css` | < 120 lines total |
| AR4 | QA checklist doc | < 60 lines |
| AR5 | Security audit doc | < 60 lines |
| AR6 | Build/packaging scripts | < 20 lines |
| AR7 | Gate document | < 40 lines |

**Total estimated change budget:** < 380 lines across 8–10 files.
**No new IPC handlers required.** All changes are in the renderer layer.

---

## 6. What is safe vs. unsafe

### Safe (local-only, read-only, no network)

| Action | Safety boundary |
|--------|----------------|
| `git diff --stat HEAD` | Read-only git query. Existing handler already sanitizes home directory from output. |
| `git status --porcelain` | Read-only git query. Returns clean/dirty boolean. |
| `shell.openPath('dist/release')` | Opens Windows Explorer on local filesystem. No data leaves the machine. |
| `navigator.clipboard.writeText(packagePath)` | User-initiated clipboard write. No data leaves the machine. |
| Inline `pre` block for diff output | Read-only display of sanitized git output. No data leaves the machine. |
| In-memory `worktreeReviewed`/`worktreeAccepted` state | Session-only React state. No localStorage, no file write, no network. |

### Red-zone (NOT in scope — explicit prohibitions exactly as AQ1 defined)

These are copied verbatim from the existing project red-zone and apply to all AR-phase work:

- No real ServiceNow login, browsing, or API writes.
- No Save / Submit / Update / Resolve / Close.
- No attachment upload.
- No Microsoft Graph / Excel Web writes.
- No real Teams / Outlook / phone ingestion.
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values.
- No push, PR, merge, tag, GitHub Release, publish, or cron changes.
- Local-only only; no external writes or deliveries.
- No new IPC handlers (all IPC already exists).
- No new UI cards, panels, or layout changes — only wiring existing buttons and adding a single inline diff panel.

---

## 7. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing + new tests pass
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (AR6)
- Final local readiness gate before Alan manual validation (AR7)

---

## 8. Acceptance criteria for AR3 (implementation)

AR3 is the only code-change task. It must satisfy:

1. **Mount-time worktree status fetch** — On mount, `api.getWorktreeStatus()` is called and `worktreeHasDirtyChanges` is set from the response.
2. **Review diff** — Clicking calls `api.getGitDiff()`, output renders in an inline collapsible `pre` block below the action buttons.
3. **Copy package path** — Clicking copies `packageMetadata.path` to clipboard.
4. **Open dist/release** — Clicking calls `api.openDistRelease()`.
5. **Mark reviewed** — Clicking sets `worktreeReviewed = true` and `worktreeAccepted = true`. Shows brief confirmation text. Button disabled logic remains unchanged (dirty + unreviewed diff = disabled).
6. **Copy summary** — Clicking composes a formatted summary string from state and copies to clipboard. Summary format: "Worktree [dirty/fresh], [reviewed/not reviewed], [accepted/not accepted]. Package: {filename} ({size}) — {path}"
7. **Dynamic package metadata** — Card shows actual filename and size from `packageMetadata` state. When no package found, shows "No package found" fallback.
8. **No new IPC channels** — All wiring uses existing `worktreeApi` methods.
9. **No layout changes** — The 3-column card structure, state queue, chips, checklist, and boundary card remain exactly as they are.
10. **Existing tests pass** — All current worktree acceptance tests continue working. New tests added for each of the 7 behaviors.

---

## 9. Status

```
Phase AR1 — WORKTREE ACCEPTANCE ACTION WIRING SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Current local package: servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip
Older aliases (archival only): AF, AG, AH, AI, AJ

Gaps identified: 7
  - Gap 1: No mount-time worktree status fetch (BLOCKING)
  - Gap 2: Review diff button no-op (HIGH)
  - Gap 3: Copy package path button no-op (HIGH)
  - Gap 4: Open dist/release button no-op (HIGH)
  - Gap 5: Mark reviewed has no onClick toggle (HIGH)
  - Gap 6: Copy summary button no-op (HIGH)
  - Gap 7: No dynamic package metadata display (MEDIUM)

Downstream tasks defined: 6
  - AR2: UX/copy spec — worktree acceptance action wiring     → sna-ui-designer [first]
  - AR3: Implementation — wire all action buttons             → sna-frontend-workbench [after AR2]
  - AR4: QA acceptance + Alan manual checklist                → sna-qa-acceptance [after AR3]
  - AR5: Privacy/security audit                               → sna-privacy-security [after AR3]
  - AR6: Windows local package refresh                        → sna-windows-runtime [after AR4 + AR5]
  - AR7: Final local readiness gate                           → sna-release-docs [after AR4 + AR5 + AR6]

Red-zone items excluded: 16
Non-goals: 8 (no new IPC, no new cards, no new layout, no ServiceNow, no Git push, no packaging experiments, no tests refactoring, no CSS refactoring)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
