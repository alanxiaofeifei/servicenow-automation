# Phase BL1 — Current Package Loading / CURRENT=N/A Regression Root Cause

Date: 2026-06-07
Task: t_9adc6c16
Profile: codex-gpt55-control
Branch inspected: next/post-release-operator-cockpit-ab-20260606
Privacy level: sanitized local-only evidence. No live ServiceNow, browser login, API write, Save / Submit / Update / Resolve / Close, Microsoft Graph / Excel Web write, push, PR, merge, tag, release, real ticket data, screenshots, HAR, traces, cookies, storage state, raw ServiceNow URLs, sys_ids, requester names, or assignment groups were used.

## Verdict

Root cause confirmed: the packaged desktop app is using the Electron packaged `resources` directory as the `projectRoot` for local worktree/release metadata IPC. That path is correct for bundled runtime resources, but it is not the source repo and it does not contain `dist/release/CURRENT.txt` or the release ZIPs. The package metadata IPC then fails, and the renderer drops the failed response instead of surfacing an unavailable/error state. The visible result matches the screenshot: `CURRENT=N/A`, package path still loading, metadata still loading, and repo hygiene saying `dist/release/ directory does not exist` even though the real repo has `dist/release/CURRENT.txt` and the current package.

This is not a missing BK6 artifact. It is a runtime path/source-of-truth contract bug between packaged runtime path discovery, worktree/release metadata IPC, and renderer fallback handling.

## Evidence inspected

- Real repo state has the current marker and package:
  - `dist/release/CURRENT.txt` contains `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip`.
  - `dist/release/` contains the BK6 ZIP, SHA-256 sidecar, and START-HERE sidecar.
- BK7 readiness doc agrees the local marker/package exists and passed local gates:
  - `docs/status/phase-BK7-final-local-readiness-gate-2026-06-07.md`
- Packaged archive listing shows bundled app resources and docs/scripts, but no `dist/release/` and no `CURRENT.txt`:
  - `resources/scripts/windows/...` exists in the ZIP.
  - `resources/docs/...` exists in the ZIP.
  - `dist/release` has 0 entries in the ZIP.
  - `CURRENT.txt` has 0 entries in the ZIP.
  - The outer START-HERE text is present at the archive root.
- `apps/desktop/electron/runtime-paths.ts` returns `projectRoot = process.resourcesPath` when `app.isPackaged` is true.
- `apps/desktop/electron/main.ts` passes `findProjectRoot()` into all worktree/release IPC handlers, including `sda:worktree-package-metadata`, `sda:hygiene-scan`, and `sda:worktree-open-dist-release`.
- `apps/desktop/electron/worktree-ipc.ts` expects release metadata under `join(projectRoot, "dist", "release")`.
- `apps/desktop/src/App.tsx` only calls `setPackageMetadata(meta)` when `meta.ok` is true. If IPC returns `{ ok: false, error: ... }`, renderer state remains `null`, so the UI keeps showing loading/N/A instead of the real error.

## Exact failure chain

1. The app starts from a packaged Windows extraction.
2. `findProjectRoot()` calls `resolveDesktopRuntimePaths(...)`.
3. In packaged mode, `resolveDesktopRuntimePaths(...)` sets both:
   - `resourceRoot = process.resourcesPath`
   - `projectRoot = process.resourcesPath`
4. Worktree IPC reuses that `projectRoot` for release metadata.
5. `handleWorktreePackageMetadata(projectRoot)` checks `resources/dist/release/` and tries to list ZIP files there.
6. The packaged archive does not contain `resources/dist/release/` or `CURRENT.txt`, so the handler returns `ok: false`.
7. The renderer ignores the failed metadata response because it only stores metadata on `meta.ok`.
8. Handoff copy renders from `packageMetadata === null`:
   - Source of truth line: `CURRENT=N/A`
   - Current package path: `Current package path is still loading.`
   - Current package summary: `Current package metadata is still loading.`
   - Copy buttons stay disabled with loading tooltips.
9. Hygiene scan separately checks `resources/dist/release/`; because that directory is absent, it reports `dist/release/ directory does not exist.`

## Secondary bug: CURRENT.txt is named as source of truth but not read

`handleWorktreePackageMetadata(...)` currently scans `dist/release/` for newest `*.zip` by mtime. It does not read `dist/release/CURRENT.txt` first. The renderer then labels the displayed filename as coming from `CURRENT.txt`:

`dist/release/CURRENT.txt -> CURRENT={packageMetadata?.filename ?? 'N/A'}`

That makes the UI claim a source-of-truth contract that the IPC does not actually enforce. Even after the packaged path bug is fixed, this can produce future mismatches whenever `CURRENT.txt` and newest mtime diverge.

## Secondary bug: renderer error state is masked as loading

The renderer should preserve failed metadata responses. Today it does not:

- `api.worktreePackageMetadata().then((meta) => { if (meta.ok) setPackageMetadata(meta); })`

That means a definitive local failure is rendered as indefinite loading. The screenshot's “still loading” labels are therefore misleading; the app likely already received an `ok:false` response.

## Affected files

Implementation should be limited to these areas unless tests prove another dependency:

1. `apps/desktop/electron/runtime-paths.ts`
   - Do not use one packaged `projectRoot` for both bundled resources and external/local release metadata.
   - Add an explicit release/worktree metadata root resolver or return separate roots.
2. `apps/desktop/electron/runtime-paths.test.ts`
   - Add packaged-mode coverage for release metadata root candidates.
3. `apps/desktop/electron/main.ts`
   - Pass the correct release metadata root into worktree/release IPC handlers.
   - Keep bundled resource lookups on `resourceRoot`.
4. `apps/desktop/electron/worktree-ipc.ts`
   - Read `dist/release/CURRENT.txt` before falling back to newest ZIP.
   - Return a typed unavailable state with the checked path/source instead of a bare swallowed error.
   - Consider a packaged fallback that parses the extracted START-HERE sidecar for filename/UNC path when the repo release root is unavailable.
5. `apps/desktop/electron/worktree-ipc.test.ts`
   - Add regression coverage for CURRENT.txt precedence, missing packaged `resources/dist/release`, and START-HERE/metadata fallback if implemented.
6. `apps/desktop/src/App.tsx`
   - Store `ok:false` metadata responses and render unavailable/error copy instead of loading forever.
   - Do not derive a WSL UNC path in the renderer from arbitrary non-WSL paths; prefer an IPC-provided `displayPath` / `uncPath` field.
7. `apps/desktop/src/App.test.ts`
   - Add renderer tests for ok:false metadata and for visible current package metadata loaded from the IPC contract.
8. `apps/desktop/package.json`
   - If the chosen implementation adds a packaged metadata sidecar, include it via `extraResources` or place it at the extracted app root intentionally.
9. `scripts/packaging/build-windows-rc.sh`
   - If the chosen implementation uses a sidecar, generate it in a deterministic local-only format and document the checksum limitation below.
10. `docs/test/windows-clean-machine-validation-2026-06-07.md`
   - Update manual validation wording only after the runtime behavior is fixed.

## Required implementation path

### 1. Split bundled-resource roots from release-metadata roots

Keep `resourceRoot` for packaged docs/scripts/runtime helpers. Add an explicit release metadata resolver, for example:

- Dev/source checkout: nearest `pnpm-workspace.yaml` root, then `dist/release`.
- Packaged extraction: first try an explicit local-only override such as `SDA_RELEASE_ROOT` if set by a test harness or launcher.
- Packaged extraction: then try the extracted app root near `process.resourcesPath` for a bundled sidecar / START-HERE fallback.
- Packaged extraction: do not assume `process.resourcesPath/dist/release` is the source repo.

Do not regress the existing packaged runtime resource behavior for scripts/docs.

### 2. Make CURRENT.txt the real source of truth

In `handleWorktreePackageMetadata(...)`:

1. Look for `dist/release/CURRENT.txt` in the resolved release metadata root.
2. Parse exactly `CURRENT=<filename>`.
3. Validate that `<filename>` is a basename ending in `.zip`; reject path traversal or separators.
4. If the referenced ZIP exists, compute size, mtime, SHA-256, phase, and archival aliases.
5. If CURRENT is missing, fall back to newest ZIP only as a clearly labeled fallback source.
6. Return a `source` field such as `current-txt`, `newest-zip-fallback`, `start-here-fallback`, or `unavailable`.

### 3. Add a packaged fallback that can actually exist at runtime

The packaged app cannot rely on the source repo being present. The current BK6 archive contains START-HERE at the archive root, not `dist/release/CURRENT.txt`. Therefore one of these must be implemented:

Preferred minimal path:
- Add a small local-only metadata sidecar at the extracted app root or under `resources/release/`, containing at least filename, current marker string, display path/UNC path, phase, generated-at timestamp, and checksum source.
- Have worktree IPC read that sidecar in packaged mode when `dist/release/CURRENT.txt` is unavailable.

Acceptable fallback path:
- Parse the extracted START-HERE sidecar at the app root for `Package:` and `Windows UNC path:`.
- Return `ok:true` for filename/path/phase with `sha256` omitted or with `checksumSource: sidecar-required` when the `.sha256` sidecar is not reachable.

Important checksum note:
- Do not try to put the final SHA-256 of the outer ZIP inside that same ZIP as a required invariant. An archive cannot contain its own final hash without changing the hash. The current script already writes a companion START-HERE with the actual checksum after hashing, but the START-HERE inside the ZIP necessarily says to see the sidecar. The app should surface this honestly instead of loading forever.

### 4. Preserve failed metadata in renderer state

Change the mount effect to store the response even when `ok:false`:

- On success: show filename, path/UNC, checksum if available, mtime, phase, and source.
- On failure: show `Current package metadata is unavailable` plus a sanitized local reason, not `still loading`.
- Keep buttons disabled when required fields are missing, but their titles should say unavailable/error rather than loading.

### 5. Move path display responsibility into IPC

`formatPackagePathForDisplay(...)` currently converts every non-empty path into a WSL UNC. That is only valid for Linux `/home/...` paths from the WSL repo. For packaged Windows paths or START-HERE UNC paths, the renderer should not invent a UNC path.

Add an IPC-returned field such as `displayPath` or `uncPath` and render that directly. Keep Linux path only as a secondary debug/local field if needed.

## Acceptance tests for BL2 implementation

### Unit tests: runtime path resolver

- Dev mode with `pnpm-workspace.yaml` nearby returns workspace root for release metadata and resource root.
- Packaged mode keeps `resourceRoot = process.resourcesPath` for bundled scripts/docs.
- Packaged mode does not set release metadata root to `resources/dist/release` unless that candidate actually has metadata.
- Packaged mode tries app-root sidecar / START-HERE fallback candidates near `dirname(process.resourcesPath)`.

### Unit tests: worktree package metadata IPC

- When `CURRENT.txt` exists and points to a ZIP, metadata uses that ZIP even if another ZIP has newer mtime.
- When `CURRENT.txt` points to a missing ZIP, return `ok:false` with a sanitized error that names the missing marker target but does not expose restricted data.
- When no `CURRENT.txt` exists but ZIPs exist, fall back to newest ZIP and mark source as fallback.
- When `dist/release/` is absent in packaged resources but an app-root START-HERE/metadata sidecar exists, return `ok:true` with filename/path/phase from that fallback.
- When no metadata source exists, return `ok:false` with `source: unavailable`.
- Reject path traversal or separators in `CURRENT=`.

### Unit tests: renderer

- `worktreePackageMetadata()` returning `ok:false` renders unavailable/error text, not “still loading”.
- `ok:false` disables copy buttons with unavailable/error title text.
- `ok:true` with `source: current-txt` renders the current marker, package path, phase chip, and summary.
- `ok:true` with packaged fallback and no checksum renders filename/path and a clear checksum-sidecar note, not N/A/loading.
- Renderer does not turn a Windows path or prebuilt UNC path into `\\wsl.localhost\\WSL...`.

### Packaging/local artifact tests

- Build a local Windows package with a unique phase suffix.
- Inspect the produced ZIP and assert that the chosen packaged metadata fallback is present where the app expects it.
- Assert the archive still excludes forbidden local/private artifacts.
- Assert `dist/release/CURRENT.txt` points to the produced package after packaging or is produced by the local release step that follows packaging.
- Assert the companion `.sha256` sidecar exists and matches the ZIP.

### Required gates after implementation

Run, in this order:

1. `pnpm build`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm privacy:scan`

If recursive tests hit resource limits, retry:

`pnpm -r --workspace-concurrency=1 --if-present test`

## Non-goals and safety constraints for BL2

- No live ServiceNow login or browser operation.
- No real ServiceNow API writes.
- No Save / Submit / Update / Resolve / Close.
- No Microsoft Graph / Excel Web writes.
- No screenshots, HAR, traces, cookies, storage-state, real URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values.
- No push, PR, merge, tag, release, publish, or external upload.
- Do not broaden the cleanup workflow while fixing metadata loading.

## Suggested BL2 sequence

1. Add failing tests for packaged path resolution and renderer ok:false handling.
2. Add CURRENT.txt precedence tests for package metadata.
3. Implement release metadata root/fallback resolver.
4. Update worktree IPC to read CURRENT.txt first and return typed source/error/display fields.
5. Update renderer to store and render ok:false metadata.
6. Add packaged sidecar or START-HERE fallback support.
7. Rebuild and run all required gates.
8. Refresh the package and verify the in-app handoff no longer shows `CURRENT=N/A` or indefinite loading when local metadata is available/unavailable.

## BL1 completion note

This BL1 task made no code changes. The only intended repository change is this root-cause status document.
