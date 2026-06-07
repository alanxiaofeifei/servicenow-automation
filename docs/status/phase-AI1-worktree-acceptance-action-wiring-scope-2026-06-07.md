# Phase AI1 — Worktree Acceptance Action Wiring Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AH4 base:** AH1–AH4 changes present (scope → UX spec → implementation → QA acceptance)
**Profile:** `sna-orchestrator`
**Task:** `t_432bda0e`

---

## 1. Why this phase

The AH series is complete — we have a fully rendered worktree acceptance checkpoint card in the desktop app's center workspace. However, the AH4 QA verdict explicitly calls out **four remaining risks**:

| # | Risk (from AH4 §7) | Current state |
|---|-------------------|---------------|
| 1 | **Review diff** — no-op onClick handler (`{/* review diff — local only */}`) | Stub, does nothing |
| 2 | **Open dist/release** — no-op onClick handler (`{/* open dist/release — local only */}`) | Stub, does nothing |
| 3 | **Mark reviewed** — always disabled (no acceptance toggle logic) | Always disabled |
| 4 | **Package path, checksum, mtime** — hardcoded strings, not dynamic reads | Static text from spec |

The card looks right. It reads right. But the action buttons don't **do** anything yet.

**This phase wires those no-op placeholders to real local actions.**

---

## 2. Scope choice — why this is the next visible local product step

**Choice:** Wire the 3 no-op/stub action buttons to real local Electron IPC calls, and enable the Mark reviewed button based on worktree cleanliness.

**Why this is the next visible local product step:**

1. **The card is already in the app** — Alan sees buttons that don't work. This is a visible P0 UX gap.
2. **No new UI surface required** — the three-column layout, queue, state chips, and boundary copy are already accepted. This is pure action wiring.
3. **IPC infrastructure already exists** — the preload exposes `sdaOperator` (for QA browser operations); the pattern is established. We add 3 local-only IPC handlers alongside the existing QA ones.
4. **Prerequisite for AH5+ phases** — once buttons work, dynamic metadata (real path/checksum/mtime reads) and acceptance logic become natural follow-ups.

### Non-goals for AI1

- No new UI cards, panels, or layout changes
- No ServiceNow login, browser automation, or API writes
- No push/PR/merge/tag/GitHub Release
- No Windows packaging changes
- No Chromium/provisioning work
- No privacy/security audit (the existing AH5 gate covers the card; wiring is local-only shell operations)

---

## 3. Current state — exact no-op placeholders

### 3.1 Review diff button (`electron/main.ts:4248–4250`)

```typescript
<button type="button" className="local-draft-button" onClick={() => {/* review diff — local only */}}>
  Review diff
</button>
```

**Needs to become:** IPC call that runs `git diff --stat HEAD` in the project root and shows the output in a visible surface (toast, panel, or expanded detail).

### 3.2 Open dist/release button (`electron/main.ts:4255–4256`)

```typescript
<button type="button" className="local-draft-button" onClick={() => {/* open dist/release — local only */}}>
  Open dist/release
</button>
```

**Needs to become:** IPC call that calls `shell.openPath(path.join(projectRoot, 'dist/release'))` in the main process.

### 3.3 Mark reviewed button (`electron/main.ts:4258–4260`)

```typescript
<button type="button" className="local-draft-button" disabled>
  Mark reviewed
</button>
```

**Needs to become:** Enabled when worktree is clean (no dirty tracked changes), disabled with explicit reason when dirty. Toggle acceptance state in renderer memory.

### 3.4 Copy actions (already working)

- **Copy package path** — `navigator.clipboard.writeText(...)` with hardcoded UNC path ✓
- **Copy summary** — `navigator.clipboard.writeText(...)` with hardcoded summary ✓

These are functional, though they reference hardcoded values (AI5 scope).

---

## 4. Deliverables and dependencies — AI2–AI7 task chain

### AI2 — Add IPC bridge for local-only worktree operations

**Goal:** Add 3 new IPC handlers in `electron/main.ts` (or a dedicated `electron/worktree-ipc.ts`) and expose them in `electron/preload.ts`:

1. `sda:git-diff-worktree` — runs `git diff --stat HEAD` in project root, returns string
2. `sda:open-dist-release` — calls `shell.openPath(join(projectRoot, 'dist/release'))`
3. `sda:worktree-state` — runs `git status --porcelain` and returns dirty/clean boolean

**Safety:** All operations are read-only local filesystem/git commands. No network, no ServiceNow, no writes. The handlers must validate that paths stay under project root.

**Assignee:** `sna-windows-runtime` (owns Electron IPC/main-process work)

### AI3 — Wire Review diff button to IPC

**Goal:** Connect the no-op onClick handler in `App.tsx` to the new `sda:git-diff-worktree` IPC channel. Display the diff output in a collapsible section below the action buttons (no modal, no new card — just an inline `pre` block that expands on click).

**Assignee:** `sna-frontend-workbench` (owns renderer JSX/CSS)

**Depends on:** AI2 (IPC bridge must exist first)

### AI4 — Wire Open dist/release button to IPC

**Goal:** Connect the no-op onClick handler in `App.tsx` to the new `sda:open-dist-release` IPC channel.

**Assignee:** `sna-frontend-workbench`

**Depends on:** AI2 (IPC bridge must exist first)

### AI5 — Dynamic package metadata from dist/release/

**Goal:** Replace hardcoded package path, checksum, and mtime in the card with real reads from `dist/release/`. Add an IPC handler that scans `dist/release/`, finds the newest `*.zip` file, hashes it, and returns `{ path, sha256, mtime, filename, size }`.

**Assignee:** `sna-windows-runtime` (IPC handler in main process)

**Depends on:** AI2 (same file, add another handler)

### AI6 — Mark reviewed enable/disable with worktree-based logic

**Goal:** Enable "Mark reviewed" button when `sda:worktree-state` returns "clean" (no dirty tracked changes). Disable with visible reason when dirty. Track acceptance state in renderer state (not localStorage, not file write — just in-memory React state for the session).

**Assignee:** `sna-frontend-workbench`

**Depends on:** AI2 (IPC bridge), AI3 (diff review infrastructure exists), AI5 (dynamic state)

### AI7 — Final QA acceptance after all wiring

**Goal:** Run full build/typecheck/test/privacy:scan gates. Verify each of the 3 buttons performs its real local action. Verify Mark reviewed is correctly enabled/disabled. Verify no regression in existing 414 tests.

**Assignee:** `sna-qa-acceptance`

**Depends on:** AI3, AI4, AI5, AI6 (all wiring must be complete)

---

## 5. Dependency graph

```
AI1 (scope — this doc)
 │
 ├──→ AI2 (IPC bridge) ──────────────→ AI3 (wire Review diff) ─┐
 │                                   ├──→ AI4 (wire Open dist) ─┤
 │                                   ├──→ AI5 (dynamic pkg metadata) ─┤
 │                                   └──→ AI6 (Mark reviewed logic) ─┤
 │                                                                   │
 └──────────────────────────────────────────────────────────────────→ AI7 (QA acceptance)
```

All four wiring tasks (AI3–AI6) can run in parallel after AI2, but AI3 and AI6 share workbench code — coordinate via human review.

---

## 6. What is safe vs. unsafe

### Safe (local-only, read-only, no network)

| Action | Safety boundary |
|--------|----------------|
| `git diff --stat HEAD` | Read-only git query in project root. No network, no write. |
| `git status --porcelain` | Read-only git query. No network, no write. |
| `shell.openPath('dist/release')` | Opens Windows Explorer on local filesystem. No data leaves the machine. |
| `shell.showItemInFolder(packageZip)` | Opens Windows Explorer on the zip file. No data leaves the machine. |
| `crypto.createHash('sha256')` on local file | Local computation only. |
| clipboard write of package path | User-initiated clipboard write. No data leaves the machine. |
| Inline `pre` block for diff output | Read-only display of git output. No data leaves the machine. |

### Red-zone (NOT in scope — explicit prohibitions)

| Action | Reason |
|--------|--------|
| Real ServiceNow login, browsing, API write | Red-zone — requires explicit Alan approval |
| Save / Submit / Update / Resolve / Close | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Teams / Outlook / phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, video capture | Red-zone — never automated |
| Cookie, session, storage-state capture | Red-zone — never automated |
| Git push, PR, merge, tag, GitHub Release | Requires explicit Alan approval |
| npm/pnpm publish | Not in scope |
| Cron job changes | Not in scope |
| AI model configuration changes | Not in scope |
| New UI cards, panels, or layout changes | Out of scope — AH series already defined the card layout |

---

## 7. Dependency safety chains

Each IPC handler in AI2 must:

1. **Validate that the project root path is an absolute local path** (not a URL, not a UNC path to remote, not `../../..` escaping)
2. **Reject any request that includes non-path arguments** (no arbitrary command execution)
3. **Return sanitized output** — strip any raw path that includes user home directory from diff output
4. **Never execute `git` with user-supplied arguments** — the command is hardcoded: `git diff --stat HEAD` and `git status --porcelain` only

These are enforced by the handler contract, not by runtime validation of renderer input (renderer is trusted for local-only operations).

---

## 8. File change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| AI2 | `electron/preload.ts`, `electron/main.ts`, `electron/worktree-ipc.ts` (new) | < 100 lines total |
| AI3 | `src/App.tsx`, `src/styles.css`, `src/App.test.ts` | < 60 lines total |
| AI4 | `src/App.tsx` | < 5 lines (single onClick change) |
| AI5 | `electron/worktree-ipc.ts`, `electron/main.ts`, `electron/preload.ts`, `src/App.tsx`, `src/App.test.ts` | < 100 lines total |
| AI6 | `src/App.tsx`, `src/App.test.ts` | < 30 lines total |
| AI7 | QA checklist only | < 50 lines total |

**Total estimated change budget:** < 350 lines across 6–8 files.

---

## 9. Verification plan

### AI2 (IPC bridge)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- Unit test for each new IPC handler: verify handler returns expected output shape, verify path validation rejects non-local paths, verify no side effects on filesystem
- `pnpm privacy:scan` — PASS

### AI3 (Review diff)
- `pnpm test` — existing tests pass + new test verifies diff section renders
- `pnpm build` — PASS
- Manual: click Review diff → see inline diff output in card

### AI4 (Open dist/release)
- `pnpm test` — existing tests pass
- Manual: click Open dist/release → Windows Explorer opens dist/release/

### AI5 (Dynamic metadata)
- `pnpm test` — existing + new test verifies dynamic path/checksum/mtime
- Manual: card shows real package filename, size, SHA256, mtime

### AI6 (Mark reviewed)
- `pnpm test` — test verifies button disabled when dirty, enabled when clean
- Manual: clean worktree → button enabled; dirty worktree → disabled with reason

### AI7 (QA acceptance)
- All 4 gates: `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm privacy:scan`
- All 414+ existing tests pass (should be ~420 after wiring tests)
- No new privacy violations
- No regression in existing card rendering or layout
- Alan real usage path validated

---

## 10. Status

```
Phase AI1 — WORKTREE ACCEPTANCE ACTION WIRING SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Backlog items addressed: 1
  - Remove no-op placeholders from the 3 action buttons in the worktree acceptance card

Downstream tasks defined: 6
  - AI2: IPC bridge for local-only worktree operations  → sna-windows-runtime  [first]
  - AI3: Wire Review diff button                       → sna-frontend-workbench [after AI2]
  - AI4: Wire Open dist/release button                 → sna-frontend-workbench [after AI2]
  - AI5: Dynamic package metadata from dist/release/   → sna-windows-runtime  [after AI2]
  - AI6: Mark reviewed enable/disable                  → sna-frontend-workbench [after AI2, AI3, AI5]
  - AI7: Final QA acceptance after all wiring          → sna-qa-acceptance  [after AI3–AI6]

Red-zone items excluded: 14
Non-goals: 7
```

---

## Appendix A — IPC handler contract for LocalOnlyWorktreeOperations

All new IPC handlers follow the same contract:

```typescript
// Channel name prefix: sda:worktree-
// All handlers take no arguments (path is resolved from project root)
// All handlers return { ok: boolean, result?: string, error?: string }

// CHANNEL: sda:worktree-git-diff
// Runs: git diff --stat HEAD
// Returns: { ok: true, result: "apps/desktop/src/App.tsx | 47 ++++++++++++\n..." }

// CHANNEL: sda:worktree-open-dist-release
// Runs: shell.openPath(join(projectRoot, 'dist/release'))
// Returns: { ok: true, result: "opened" } or { ok: false, error: "..." }

// CHANNEL: sda:worktree-status
// Runs: git status --porcelain
// Returns: { ok: true, dirty: boolean, result: "...status output..." }

// CHANNEL: sda:worktree-package-metadata
// Scans dist/release/ for newest *.zip
// Returns: { ok: true, path: string, sha256: string, mtime: number, filename: string, size: number }
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
