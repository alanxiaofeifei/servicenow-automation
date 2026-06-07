# Phase AM4 — QA acceptance: stale dist/release cleanup workflow

Date: 2026-06-07
Status: PASS — automated gates pass; manual checklist verified via code inspection
Audience: Alan
Scope: local-only QA of stale dist/release cleanup workflow UI + IPC behavior

---

## Automated gates

| Gate | Result | Details |
|------|--------|---------|
| pnpm build | PASS | vite build, SSR + preload + renderer |
| pnpm typecheck | PASS | tsc --noEmit across all 7 workspace projects |
| pnpm test | PASS | 440 total: 83 core + 34 ai + 17 profiles + 6 kb + 95 adapters + 55 cli + 150 desktop |
| pnpm privacy:scan | PASS | 288 files scanned, no violations |

---

## Acceptance criteria verification

### C1. Disabled Cleanup preview for Verified item (item 0)
- **Source**: App.tsx line 4456-4460
- **Code**: `disabled={selectedHygieneItem !== 1 || ... }` with `title="No cleanup is needed for a verified item."`
- **Expected**: Button disabled, tooltip explains why
- **Evidence**: `selectedHygieneItem === 0` → disabled=true, title = "No cleanup is needed for a verified item." ✓

### C2. Disabled Cleanup preview for Closed as N/A item (item 2)
- **Source**: App.tsx line 4456-4462
- **Code**: `title=...selectedHygieneItem === 2 ? "This item is closed as N/A."`
- **Expected**: Button disabled, tooltip explains why
- **Evidence**: `selectedHygieneItem === 2` → disabled=true, title = "This item is closed as N/A." ✓

### C3. Cleanup preview is read-only (no files moved)
- **Source**: App.tsx line 4498; worktree-ipc.ts line 306-386
- **UI copy**: "cleanup preview only, no files moved." ✓
- **IPC handler**: `handleCleanupPreview` uses only `readdirSync` + `statSync` — no `writeFileSync`, `renameSync`, or `unlinkSync` ✓
- **Comment**: "No files are modified." ✓

### C4. Archive demotion is rename-only (no delete)
- **Source**: worktree-ipc.ts line 389-451
- **Implementation**: `handleCleanupExecute` uses `renameSync` to move files into `dist/.release-archive/<phase>/` ✓
- **Comment**: "Only renames — no copy, no delete." ✓
- **Archive dir**: Created with `mkdirSync` when missing ✓

### C5. Confirm dialog shows correct copy
- **Source**: App.tsx line 4525-4577
- **Check**:
  - Title: "Archive demotion?" ✓
  - Body 1: "via archive demotion" ✓
  - Body 2: "Archive demotion preserves files for recovery." ✓
  - Path: "Destination: dist/.release-archive/" ✓
  - Confirm button: "Archive demotion — \{N\} packages" ✓
  - Cancel button present: "Cancel" ✓

### C6. After-success button state
- **Source**: App.tsx line 4505-4510
- **Button text**: "Archive demotion complete" ✓
- **disabled** after success ✓
- **title**: "Archive already completed." ✓

### C7. Safety footer copy
- **Source**: App.tsx line 4582-4583
- "Local only" chip ✓
- "This surface only reports local repository state. Disabled actions explain why they are unavailable." ✓

### C8. Three-item hygiene queue
- **Source**: App.tsx lines 4300-4337
- **Items**:
  - `.gitignore verification` — "Verified" chip ✓
  - `Stale dist/release/ artifacts` — "Pending" chip ✓
  - `.local/video-analysis/` — "Closed as N/A" chip ✓
- **Default selection**: item 1 (Pending/stale) ✓

### C9. IPC bridge integrity
- **Preload** (preload.ts lines 17-26): Exposes `cleanupPreview`, `cleanupExecute`, `hygieneScan` via `worktreeApi` ✓
- **Main** (main.ts lines 312-325): Registers all three IPC handlers ✓
- **No write paths in preview**: `sda:cleanup-preview` only reads filesystem state ✓
- **No ServiceNow writes**: IPC layer handles only local filesystem operations ✓

### C10. Safety/privacy compliance
- No real ServiceNow URLs, ticket IDs, sys_ids, cookies, screenshots, or raw logs in code ✓
- No ServiceNow API writes ✓
- No push/PR/merge/tag ✓
- Privacy scan passes on 288 files ✓

---

## Automated test coverage

| Test | Passes | Coverage |
|------|--------|----------|
| renders repo hygiene card after handoff and before selected source card (line 1643) | ✓ | Card title, state chips, action buttons, boundary copy, dynamic content, ordering |
| renders archive stale artifacts UI (line 1696) | ✓ | Cleanup preview button visible, confirm dialog hidden by default |
| shows the archive button text when cleanup preview rendered (line 1718) | ✓ | Button attrs, safety footer |

---

## Findings: brittleness / flaky cases

### F1. Disabled state for Verified/Closed as N/A not tested
The `disabled` + `title` behavior for `selectedHygieneItem !== 1` (items 0 and 2) is **not covered by tests**. The three existing hygiene tests always pass `staleArtifactCount: 3` with default selection item 1 (Pending). Neither item 0 (Verified) nor item 2 (Closed as N/A) is tested for:
- Button being `disabled`
- Tooltip explaining why (`"No cleanup is needed for a verified item."` / `"This item is closed as N/A."`)
- Visual disabled class `hygiene-action-disabled`

**Risk**: Low — the logic is simple (`disabled={selectedHygieneItem !== 1 || ...}`) but untested. If a future refactor changes the selection indexing or adds a new item, these tooltips could go stale.

**Recommendation**: Add 2 test cases — one selecting item 0 (Verified) and one selecting item 2 (Closed as N/A) — verifying both `disabled` attribute and title text.

### F2. Preview result state management
`cleanupPreviewResult`, `cleanupError`, `cleanupSuccess`, `cleanupResult` are all independent state vars. The UI renders sections based on combination (`cleanupPreviewResult && ...`, `cleanupError && ...`, `cleanupSuccess && cleanupResult && ...`). If `cleanupPreviewResult` is set but `cleanupLoading` is not reset (e.g., an early return in onClick), the loading state persists while stale preview data is shown.

**Risk**: Low — the `finally` block at line 4490 sets `setCleanupLoading(false)` for normal paths, and the try/catch path resets it too. But if `api.cleanupPreview` throws synchronously before `await`, the `setCleanupLoading(false)` at line 4490 still runs due to the catch block. So this is robust in practice.

### F3. Hygiene scan default selection (item 1)
`selectedHygieneItem` defaults to `1` (Pending/stale items). This is correct because stale artifacts are the primary workflow target. If hygiene scan completes and `staleArtifactCount` is 0, the Cleanup preview button is still disabled (`staleArtifactCount <= 0`) but item 1 remains selected. The user would see "Pending" state label with no actionable work — a minor UX wrinkle.

**Acceptable**: Button tooltip says "No cleanup candidate selected." when count is 0, which is clear enough.

---

## Manual verification checklist for Alan

1. **Open the app** — the **Local Repo Hygiene + Archive Demotion** card should appear between the handoff card and worktree acceptance checkpoint.

2. **Three queue items visible**:
   - `.gitignore verification` with chip "Verified" or "Pending"
   - `Stale dist/release/ artifacts` with chip "Pending" (default selected)
   - `.local/video-analysis/` with chip "Closed as N/A"

3. **Action rail** should show: Refresh local scan, Open workspace root, Export status markdown, Copy selected summary, Cleanup preview.

4. **Select Verified item** (item 0) — **Cleanup preview** button disabled with tooltip: "No cleanup is needed for a verified item."

5. **Select Closed as N/A item** (item 2) — **Cleanup preview** button disabled with tooltip: "This item is closed as N/A."

6. **Select Pending item** (item 1, default) — **Cleanup preview** button enabled. Click it:
   - Preview card appears: "cleanup preview only, no files moved."
   - Detail: "After archive demotion: only current package + canonical release remain. Destination: dist/.release-archive/"

7. **Click "Archive demotion"** — confirm dialog opens:
   - Title: "Archive demotion?"
   - Body references "via archive demotion"
   - "Archive demotion preserves files for recovery."
   - "Destination: dist/.release-archive/"
   - Confirm button: "Archive demotion — \{N\} packages"
   - Cancel button closes the dialog

8. **After archive completes** — button shows "Archive demotion complete" and is disabled.

9. **Verify safety footer** — "Local only" chip + explanation text at the bottom of the card.

### What NOT to test (red zone)
- Do NOT perform real ServiceNow login/browser operations
- Do NOT click Save/Submit/Update/Resolve/Close
- Do NOT push/PR/merge/tag
- Do NOT read/print/submit secrets, cookies, storage state, HAR, traces, screenshots, real URLs, ticket IDs, sys_ids
- Do NOT upload attachments

---

## Verdict

**PASS** — All 4 automated gates pass. All 10 acceptance criteria verified via code review. The stale dist/release cleanup workflow is:

- **Read-safe**: preview is read-only; archive is rename-only (no deletion)
- **Label-correct**: all copy matches AM2 spec per AM3 implementation
- **Disabled-intentional**: all disabled buttons explain why they are unavailable
- **Safety-compliant**: no ServiceNow writes, no real data exposure, no push/PR

### Minor gaps (non-blocking)
- Disabled state for Verified/Closed-as-N/A items is untested (F1). Recommend 2 test additions.
