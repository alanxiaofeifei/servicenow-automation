# GPT-5.5 Pro checkpoint: K9 browser-runtime-error after Windows manual retest

Checkpoint marker: `SDA_K9_BROWSER_RUNTIME_ERROR_CHECKPOINT_2026_05_26`

## External-AI safety rules

Do not upload raw repository diffs, raw workflow recordings, raw transcripts, screenshots, HAR files, traces, storage-state, cookies, sessions, credentials, real ServiceNow pages, real ticket text, real URLs, or any unreviewed enterprise content to external AI.

Do not paste `git diff`, `git show`, patch output, or large code excerpts verbatim into external AI, even if they appear sanitized. Use the GitHub branch/PR if accessible, plus this sanitized summary. If you need excerpts, ask for small sanitized file excerpts only.

If you see or infer real ticket identifiers, URLs, requester names, assignment groups, local browser endpoints, page fingerprints, cookies, sessions, or field values, treat them as sensitive and do not repeat them. Use placeholders such as `[REDACTED]`.

## Review request

Please review the ServiceNow Automation K9 Windows desktop runtime flow and identify why the real Windows manual retest still displays the generic blocked result:

`已阻止: browser-runtime-error`

Expected behavior: Step 2, “检查当前工单页面”, should display a more specific sanitized reason:

- `cdp-endpoint-denied` / plain-language browser-connection message when the dedicated test browser connection is stale or unreachable.
- `cdp-page-selection-denied` / plain-language current-page selection message when the browser is reachable but the app cannot find exactly one current approved Incident form tab/frame.
- Reserve `browser-runtime-error` only for true page-evaluation/runtime failures after connection and page selection have both passed.

## Product/safety constraints

This is a ServiceNow QA/dev field-trial tool. Keep the review safety-first:

- No Save, Submit, Update, Resolve, Close, upload, email, or ServiceNow API.
- Step 3 remains text-only no-save autofill for the current slice: Short description, Description, Work notes.
- Do not expand scope to Requester/Category/Subcategory/Location/Channel/Assignment group/Assigned to/State in this fix. Full-field autofill is a later reviewed slice.
- UI copy should avoid technical terms like CDP/WebSocket/gate. Use browser connection / current ticket page wording.
- Outputs and logs must not expose raw ServiceNow URLs, ticket numbers, requester/assignment values, local endpoints, page fingerprints, cookies/sessions, HAR/trace, screenshots, or field values.

## Current manual evidence

After applying local fixes and starting a fresh desktop app window, the operator manually retested against a QA Incident form in the dedicated test browser.

Observed result:

- Step 1: test browser is available / QA workspace status visible.
- Step 2: still blocked with the generic UI text `已阻止: browser-runtime-error`.
- Step 3: remains disabled/waiting because Step 2 did not pass.
- The visible ServiceNow page is a new Incident form with required fields, but the prompt intentionally omits raw ticket number, URL, requester, assignment group, and draft field values.

## Latest local implementation attempts

Recent changes in the branch attempted to preserve blocked reasons across layers:

1. Electron main process:
   - `apps/desktop/electron/main.ts`
   - `sda:verify-current-incident` and `sda:autofill-current-incident-defaults` are wrapped in try/catch.
   - Known `QaCdpRuntimeBlockedError` is supposed to map back to its original blocked reason.
   - Empty/missing endpoint now throws `cdp-endpoint-denied` instead of a generic error.
   - WSL-hosted Electron detection now also checks `/mnt/c/Windows/System32/cmd.exe`, because GUI-launched Electron can lack `WSL_INTEROP` / `WSL_DISTRO_NAME`.
   - WSL-hosted runtime should use the Windows-local PowerShell bridge instead of Node directly fetching a Windows-only localhost endpoint.

2. Adapter/runtime:
   - `packages/adapters/src/qa-autofill-runtime.ts`
   - Read-only Incident inspection catches `QaCdpRuntimeBlockedError` and returns its `blockedReason`.
   - Runtime autofill inspection/fill catches known blocked errors before falling back.
   - Local Node CDP target-list fetch failure is mapped to `cdp-endpoint-denied`.
   - Windows-local CDP helper result parser maps structured helper JSON `{ status: "blocked", blockedReason }` to `QaCdpRuntimeBlockedError`.

3. Windows helper:
   - `scripts/windows/evaluate-local-cdp-expression.ps1`
   - Accepts JSON on stdin containing a local endpoint, target URL, and base64 expression.
   - Validates local HTTP endpoint.
   - Calls `/json/list` on Windows localhost.
   - Selects one configured-host Incident target.
   - Connects to the selected page WebSocket and evaluates the expression.
   - Intended blocked reasons:
     - unreachable target list / failed WebSocket connect -> `cdp-endpoint-denied`
     - no unique configured Incident target -> `cdp-page-selection-denied`
     - expression exception / unknown helper exception -> `browser-runtime-error`

4. Renderer:
   - `apps/desktop/src/App.tsx`
   - Action-card feedback calls `operatorRuntimeBlockedReasonDetails(...)` for verify/autofill failures.
   - It has explicit detail strings for `cdp-endpoint-denied` and `cdp-page-selection-denied`.
   - If the backend still sends `browser-runtime-error`, the UI naturally displays the generic blocked result.

## Verification already run locally before the manual retest

These results are reported by the local agent and should be re-run before merging any final fix:

- `pnpm --filter @servicenow-automation/adapters test -- qa-autofill-runtime.test.ts` PASS
- `pnpm --filter @servicenow-automation/desktop test -- App.test.ts` PASS
- `pnpm typecheck` PASS
- `pnpm privacy:scan` PASS
- `pnpm build` PASS

## Suspected failure area

The live retest proves the generic result still crosses the IPC boundary. Please inspect whether one of these is happening:

1. The fresh Electron window is not actually running the rebuilt code, or the app skips rebuilding because stale `out/main/main.js` is present.
2. The WSL-hosted runtime detection still does not select `createWindowsLocalCdpQaIncidentDefaultFieldAutofillRuntimePageDriver(...)` in the real app process.
3. The PowerShell helper returns `browser-runtime-error` from its broad outer catch before it can classify endpoint/page-selection failures.
4. The helper emits non-JSON stdout/stderr or times out; Node then throws a plain `Error`, which the adapter maps to `browser-runtime-error`.
5. The helper connects to `/json/list` successfully and selects a target, but `Runtime.evaluate` throws due to page/iframe/runtime-script issues. If so, `browser-runtime-error` may be technically accurate, but UI should still expose sanitized diagnostic categories that help separate expression failure from endpoint/page target failure.
6. `operatorCdpRuntimeBlockedReasonFromError(error)` uses `instanceof QaCdpRuntimeBlockedError`; bundling/workspace module duplication could make `instanceof` fail across package copies, causing known blocked errors to degrade to generic. Consider a structural guard if appropriate.
7. The renderer displays only the action-card short text; maybe a richer `operatorStatusFromResponse` detail exists but is not visible in the right-side panel.

## Local pre-push review observations

A local independent review found no raw ServiceNow URLs, ticket IDs, credentials, cookies/sessions, fingerprints, real endpoints, or field values in the staged checkpoint/prompt, and no obvious worsening of the no-write boundary.

It specifically suggested reviewing these remaining classification gaps:

1. Blocked-reason preservation still uses `instanceof QaCdpRuntimeBlockedError` in adapter/Electron layers. If bundling or workspace module duplication occurs, known blocked errors may degrade to generic `browser-runtime-error`. Consider a structural guard that checks a safe blocked-reason enum.
2. Windows helper spawn failures, helper timeouts, unreadable helper path, and invalid/non-JSON stdout currently reject as plain `Error`; the outer runtime can map these to generic `browser-runtime-error`.
3. Malformed or non-local CDP endpoints rejected before the helper path may still surface generically.
4. The PowerShell WebSocket receive path currently reads one message and does not require the response id to match the sent `Runtime.evaluate` id; unsolicited CDP events could be misparsed.

## Questions for GPT-5.5 Pro

Please answer with:

1. Most likely root cause(s), ranked.
2. Specific code-level changes to make the failure classify as endpoint/page-selection/runtime-evaluation with sanitized diagnostics.
3. Tests that should fail before the fix and pass after the fix.
4. A minimal manual validation plan for the operator that does not require exposing raw ServiceNow URLs, ticket numbers, requester names, endpoints, fingerprints, or field values.
5. Any safety concerns with the current approach.

Keep the answer focused on fixing Step 2 blocked-reason classification and UI feedback. Do not propose full-field autofill or real ServiceNow write actions in this checkpoint.
