# Phase AM3 — stale dist/release cleanup workflow: implementation

Date: 2026-06-07
Status: implement — copy aligned with AM2 spec
Audience: Alan
Scope: local-only copy alignment for the cleanup workflow

## 1. Preflight

**Goal**
Align the existing stale dist/release cleanup workflow UI copy with the exact labels specified in the AM2 UX spec (`docs/status/phase-AM2-stale-dist-release-cleanup-workflow-ux-spec-2026-06-07.md`).

**Known facts**
- IPC layer (preload → main → worktree-ipc) was already wired by previous attempt (t_fada1ee9).
- UI card with hygiene queue, cleanup preview, confirm dialog, and action rail already existed.
- AM2 spec specifies exact copy: `Archive demotion`, `Cleanup preview`, `Local Repo Hygiene + Archive Demotion`.

**Assumptions**
- The IPC behavior (preview-only, archive demotion by rename, no deletion) is already correct per AM1/AM2 scope.
- Only copy strings need alignment — no behavioral, layout, or structural changes.

**Ambiguities** — none. The spec is explicit about labels.

**Chosen smallest approach**
- Replace 10 copy strings across App.tsx and App.test.ts.
- No behavioral changes, no new features, no new dependencies.

**Files affected**
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/App.test.ts`
- `docs/status/phase-AM3-stale-dist-release-cleanup-workflow-implementation-2026-06-07.md` (this handoff)

**Verification plan**
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS (150 desktop tests, 55 CLI tests)
- `pnpm privacy:scan` — PASS (288 files)

## 2. Copy changes made

| Location | Before | After | Spec requirement |
|---|---|---|---|
| Card title | `Local Repo Hygiene + Artifact Boundary` | `Local Repo Hygiene + Archive Demotion` | §6.1 — title should include `Archive Demotion` |
| Preview summary | `{N} MB would be archived.` | `{N} MB — cleanup preview only, no files moved.` | §6.4 — preview-only, clipboard-only |
| Preview detail | `After archiving:… Archive destination: …` | `After archive demotion:… Destination: …` | §9 — use `Archive demotion` consistently |
| Primary action button | `Archive stale artifacts` | `Archive demotion` | §9 — exact label `Archive demotion` |
| After-success button | `Archive complete` | `Archive demotion complete` | §9 — consistent with demotion language |
| Confirm title | `Archive stale artifacts?` | `Archive demotion?` | §9 — exact label |
| Confirm body | `…so they remain available for recovery.` | `…via archive demotion.` | §5 — use `Archive demotion` as state label |
| Confirm 2nd paragraph | `The release folder will keep only the current package and the canonical release.` | `…Archive demotion preserves files for recovery.` | §9 — explicit non-destructive language |
| Confirm path | `Archive destination: …` | `Destination: …` | §9 — simplify, no repetition of "Archive" |
| Confirm button | `Archive {N} packages` | `Archive demotion — {N} packages` | §9 — exact label |
| Test assertion | `Local Repo Hygiene + Artifact Boundary` | `Local Repo Hygiene + Archive Demotion` | Sync with App.tsx |
| Test assertion | `Archive stale artifacts?` | `Archive demotion?` | Sync with App.tsx |

## 3. Current workflow state

The cleanup workflow already supports (from prior implementation):

- **Hygiene scan**: reads `.gitignore` coverage, stale `dist/release/` artifacts, `.local/video-analysis/` status via `sda:hygiene-scan`
- **Three-item queue**: `Verified` (.gitignore), `Pending` (stale dist/release), `Closed as N/A` (local-only video-analysis)
- **Action rail**: Refresh local scan, Open workspace root, Export status markdown, Copy selected summary, Cleanup preview, Archive demotion
- **Cleanup preview**: dry-run listing via `sda:cleanup-preview` — preview-only, no files moved
- **Archive demotion**: confirm dialog → `sda:cleanup-execute` renames files to `dist/.release-archive/` — no deletion, no copy
- **Safety footer**: `Local only` chip + explanation text

## 4. Gate results

```
pnpm build        — PASS
pnpm typecheck    — PASS
pnpm test         — PASS (150 desktop, 55 CLI)
pnpm privacy:scan — PASS (288 files)
```

## 5. Files changed

| File | Line count changed | Reason |
|---|---|---|
| `apps/desktop/src/App.tsx` | 10 strings replaced | Copy alignment per AM2 spec |
| `apps/desktop/src/App.test.ts` | 2 strings replaced | Test assertions must match UI copy |
| `docs/status/phase-AM3-stale-dist-release-cleanup-workflow-implementation-2026-06-07.md` | New | Required deliverable |

## 6. Why each file is necessary

- **App.tsx**: Only file with cleanup workflow UI markup. Copy changes cannot go anywhere else.
- **App.test.ts**: Test assertions match runtime strings. If App.tsx copy changed, tests must be updated to match.
- **This doc**: Required by task definition as deliverable.

## 7. Safety / privacy status

- No real ServiceNow data, URLs, ticket IDs, sys_ids, cookies, storage state, screenshots, or raw logs were used.
- No ServiceNow API writes, no Save/Submit/Update/Resolve/Close automation.
- No secrets, credentials, or session data exposed.
- No push, PR, merge, tag, or GitHub Release operation performed.
- Privacy scan passes on 288 files.
- All copy changes are local-only.

## 8. Remaining risks

- **No risk added**: copy-only changes with 0 behavioral modifications.
- **Layout unchanged**: actions remain in a horizontal flex row; if Alan wants a vertical right rail per the AM2 layout wireframe, that is a separate UI shell task.

## 9. Manual verification steps for Alan

1. Open the app — the **Local Repo Hygiene + Archive Demotion** card should appear with the correct title.
2. Select the **Pending** (stale dist/release/) item — all action buttons should be visible.
3. Click **Cleanup preview** — the preview card shows `cleanup preview only, no files moved.` and the detail says `After archive demotion:…`
4. Click the **Archive demotion** button — the confirm dialog should say `Archive demotion?` and the confirm button should say `Archive demotion — {N} packages`.
5. Click **Cancel** — dialog closes.
6. Select the **Verified** item — **Cleanup preview** and **Archive demotion** should be disabled with the reason `No cleanup is needed for a verified item.`
7. Select the **Closed as N/A** item — both should be disabled with `This item is closed as N/A.`

All labels must use the exact copy per spec:
- `Verified`, `Pending`, `Closed as N/A`
- `Archive demotion`, `Archive demotion complete`, `Archive demotion — {N} packages`
- `Cleanup preview`
- `Local only`

## 10. Suggested next tasks

- Vertical right action rail layout per AM2 wireframe (currently actions are in a horizontal row).
- Add `Export status markdown` as a file-save action (currently clipboard-only).
- Add archive history view for `dist/.release-archive/` contents.
