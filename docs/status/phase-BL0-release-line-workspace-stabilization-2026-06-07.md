# Phase BL0 — release-line workspace stabilization

Date: 2026-06-07 23:48 +08:00
Task: `t_4a1c6139`
Status: COMMITTED BASELINE — operator hold cleared, workspace classified, intended baseline committed, and all required local gates passed.

## Safety boundary

Local-only stabilization work only.

- No real ServiceNow login, browser operation, or API write.
- No Save / Submit / Update / Resolve / Close automation.
- No attachment upload, Microsoft Graph/Excel Web write, Teams/Outlook/phone ingestion.
- No GitHub push / PR / merge / tag / release.
- No raw customer/ticket/browser/session data was intentionally inspected or recorded.

## Orientation

- Workspace: `/home/alanxwsl/projects/servicenow-automation`.
- Branch: `next/post-release-operator-cockpit-ab-20260606`.
- Retry start HEAD: `481bf3017ebeb13d184682bc93cd361c558df5b3` (`docs: add BL6D final readiness gate`).
- Upstream relation at retry start: branch ahead of `origin/main` by 37 commits.
- Parent BK7 (`t_63b643e1`): `done`.
- Exact-path hold chain status at retry start: `t_f9f3bc8c`, `t_588e5465`, `t_78a08c9a`, and `t_ee44b50e` were all `done`.
- Running tasks at retry start: only BL0 (`t_4a1c6139`).
- Board status counts at retry start: `archived=69`, `done=433`, `running=1`, `todo=9`.

## Classification of dirty workspace before BL0 stabilization commit

Observed dirty release-line workspace at retry start: 218 paths total (`13` modified tracked paths and `205` untracked paths). All 218 paths were staged as the intended local-only baseline.

### Intended product code / runtime work

- `.gitignore` — local artifact boundary comment.
- `apps/desktop/electron/main.ts` — local-only worktree IPC registration.
- `apps/desktop/electron/preload.ts` — local-only worktree API exposure.
- `apps/desktop/electron/worktree-ipc.ts` — package metadata, current package, hygiene scan, and cleanup IPC logic.
- `apps/desktop/src/App.tsx` — renderer integration for local package/worktree state.
- `apps/desktop/src/styles.css` — operator workbench three-column / release-readiness layout polish.
- `packages/adapters/src/browser.ts` — exports WSL distro helper.
- `packages/adapters/src/wsl-utils.ts` — WSL distro-name helper.

### Intended tests

- `apps/desktop/electron/worktree-ipc.test.ts` — Electron worktree/package IPC tests.
- `apps/desktop/src/App.test.ts` — renderer release-readiness/workbench behavior tests.

### Intended docs/status/audit evidence

- `docs/design/operator-workbench-three-column-spec.md` — design spec updates.
- `docs/test/windows-clean-machine-validation-2026-06-07.md` — Windows validation doc updates.
- `docs/status/phase-AG1-local-repo-hygiene-and-artifact-boundary-scope-2026-06-07.md` — updated prior scope/status doc.
- 203 new `docs/status/*` phase/audit/release-summary documents covering the overnight AG→BL local-only phase chain, including this BL0 stabilization report.

### Packaging / hygiene scripts

- `scripts/packaging/build-windows-rc.sh` — Windows local package sidecar/checksum copy updates.
- `scripts/hygiene/cleanup-stale-artifacts.sh` — local stale-artifact cleanup helper.

### Generated artifacts / accidental junk

- No currently visible untracked generated root artifacts remained at retry start.
- Prior BL0 attempt had already removed four clearly accidental generated/scratch files: `index-CPmuPnHT.js`, `main.js`, `.todo-ag1-check-gitignore.sh`, and `.hermes/tmp/am4-qa-report.md`.
- `dist/`, `out/`, `coverage/`, `.local*/`, `browser-profiles/`, `.worktrees/`, and similar runtime/generated paths remain outside the committed baseline.

## Stabilization decision

Commit the curated local-only baseline rather than hiding or deleting the accumulated safety evidence. The large `docs/status/` set is retained because it is the audit trail for the overnight phase chain; it does not contain live ServiceNow/customer/browser/session material by design and was included in the staged privacy scan.

`git diff --cached --check` was run as an informational hygiene check and reported markdown trailing-space line breaks / blank EOF lines in inherited status docs. Those were not treated as blockers because the required gates below passed and mass-normalizing audit docs would alter evidence formatting beyond the stabilization scope.

## Gates run on the staged baseline

- `pnpm build` — PASS.
- `pnpm typecheck` — PASS.
- `pnpm test` — PASS: 475 total tests passed (83 core, 34 ai, 17 profiles, 6 kb, 95 adapters, 55 cli, 185 desktop).
- `pnpm privacy:scan` — PASS: `TRACKED_PRIVACY_SCAN_PASS files=507`.
- `hermes profile show codex-gpt55-control` — PASS: profile resolves at `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; gateway running.
- `hermes tools list` — PASS: built-in tool list returned.
- `hermes gateway status` — PASS: gateway running in WSL manual mode; SNA profiles reported running.

## Commit/status

- BL0 stabilization baseline commit: `883d6c6725ed96c477d075a45a865d106518c48f` (`chore: stabilize BL0 release-line baseline`).
- Baseline commit contents: 218 paths total (`205` added, `13` modified), retaining the curated local-only product/test/docs/scripts baseline and audit evidence.
- Worktree status immediately after the baseline commit: clean; branch `next/post-release-operator-cockpit-ab-20260606` ahead of `origin/main` by 38 commits.
- This final status update is docs-only and records the exact baseline commit for downstream BL UI fix work.
