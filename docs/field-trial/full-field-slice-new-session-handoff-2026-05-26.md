# Full-field slice new-session handoff

Date: 2026-05-26
Repo: `<repo>`
Branch observed before handoff: `review/k9-browser-runtime-error-20260526`
Active task: `full-field-slice`

This file is a compact prompt/handoff for starting a fresh Hermes session after heavy context compression. Treat it as the starting context, then verify the live worktree before acting.

## Project goal

ServiceNow-Automation is being turned into a real Windows desktop operator tool, not a demo:

1. Start a dedicated/tool-owned QA Chromium profile.
2. Let Alan manually log in and open a QA/dev ServiceNow Incident form.
3. Verify the current Incident page with sanitized evidence only.
4. Autofill approved fields only after fingerprint-bound approval.
5. Stop before Save / Submit / Update / Resolve / Close.
6. Never export cookies, sessions, storage state, HAR, screenshots, traces, real URLs, ticket numbers, requester text, assignment text, or field values.

Current completed manual milestone: K9 text-only no-save field-trial passed. The app successfully filled only Short description, Description, and Work notes, and Alan confirmed no Save/Submit/Update/Resolve/Close occurred.

## 2026-05-27 status refresh after adapter/review pass

This section supersedes older "tests not rerun" / "adapter TDD next" notes later in the historical handoff.

- Local core planner support for a reviewed full-field runtime plan exists and was included in the later full local gates reported by reviewers.
- Local adapter runtime/sink support for reviewed full-field controls exists in tests, including reference display controls, select option matching, existing text/textarea controls, fingerprint freshness, host/current-page checks, and exact-one visible writable control checks.
- The scoped adapter blocker is resolved for local tests: reference-field filling now targets the visible display-control form and blocks the visible raw reference input case with sanitized missing-control output.
- Adapter technical review result: PASS for the scoped reference-field sink review; focused reference tests, the full adapter runtime test file, typecheck, build, full test suite, and tracked privacy scan passed in that review.
- Safety/privacy review result: APPROVE WITH CONDITIONS; no blocking leak or unsafe write automation was found in the reviewed diff, but the conditions below remain release blockers.
- Desktop and CLI live paths remain text-only unless a separate reviewed UI/CLI safety slice explicitly switches them. The reviewed desktop regression test expects the live desktop path to keep using the text-field runtime plan and not import the full-field planner.
- Full-field live ServiceNow execution was not attempted and is not manually accepted. No real ServiceNow connection, OAuth/manual login, browser control, API call, live Autofill, or Save/Submit/Update/Resolve/Close action was performed by the adapter or safety reviewers.
- Current release posture remains: local full-field core/adapter capability only; live operator path is still text-only no-save until separately approved.
- Packaged Windows delivery is not proven by these reviews. Local gates do not prove Windows double-click launch, visible Chromium launch, CDP readiness UI, Verify enablement, three-column acceptance, or packaged `.exe` dependency bundling.

Current active milestone: docs/release handoff and review honesty. The next implementation milestone, if approved separately, is a narrow UI/CLI safety slice to expose full-field planner behavior in preview or live controls while preserving text-only live execution until that slice passes review.

## Safety boundaries for the new session

Mandatory:

- Load `service-desk-automation-safety` before coding.
- Use TDD: RED test first, then minimal implementation, then GREEN.
- Do not connect to real ServiceNow unless Alan explicitly gives a new live-test approval boundary.
- Do not run live Autofill during this coding slice.
- Do not click or automate Save / Submit / Update / Resolve / Close.
- Do not call ServiceNow APIs.
- Do not print or commit real QA defaults, real user names, real groups, real locations, real hosts, ticket numbers, record IDs, cookies, sessions, tokens, or raw URLs.
- For committed tests/docs, use neutral `alanQaIncidentTestDefaults` / example hosts only.
- Alan's private live-test defaults exist in persistent memory / skill references; do not copy the literal private values into repo docs or tests.
- Channel must not be guessed. If there is no reviewed Channel value, keep it excluded / operator-confirmation-required.
- For route-out, State must be set to New before assignment group routing, and Assigned to must be intentionally blank.

## CodeGraph orientation

Use CodeGraph before broad source search:

```bash
cd <repo>
codegraph init -i
codegraph query "QA incident default full-field runtime plan and autofill sink" --limit 8
codegraph query "ServiceNow Incident default fields adapter runtime fill script select reference controls" --limit 8
```

Known useful files:

- `packages/core/src/qa-incident-defaults.ts`
- `packages/core/src/qa-incident-defaults.test.ts`
- `packages/adapters/src/qa-autofill-runtime.ts`
- `packages/adapters/src/qa-autofill-runtime.test.ts`
- `apps/desktop/electron/main.ts`
- `apps/cli/src/cli.ts`
- `apps/desktop/src/App.tsx`
- `docs/field-trial/k10-text-only-no-save-release-handoff-2026-05-26.md`
- `docs/field-trial/k9-text-field-autofill-manual-acceptance-2026-05-26.md`

## Current worktree state at handoff

Observed modified files:

- `apps/cli/src/cli.test.ts`
- `apps/cli/src/cli.ts`
- `apps/desktop/electron/main.ts`
- `apps/desktop/src/App.test.ts`
- `apps/desktop/src/App.tsx`
- `docs/design/operator-workbench-three-column-spec.md`
- `docs/design/operator-workbench-v2-no-demo-spec.md`
- `docs/field-trial/cloakbrowser-runtime-assessment.md`
- `docs/field-trial/qa-post-login-read-only-exploration.md`
- `docs/field-trial/windows-dedicated-chromium-about-blank-smoke.md`
- `docs/field-trial/windows-dedicated-chromium-runtime.md`
- `docs/field-trial/windows-operator-quickstart.md`
- `docs/plans/2026-05-23-qa-autofill-product-pivot.md`
- `docs/plans/pr97-p0-acceptance-criteria.md`
- `packages/adapters/src/browser-session.test.ts`
- `packages/adapters/src/browser-session.ts`
- `packages/adapters/src/qa-autofill-runtime.test.ts`
- `packages/adapters/src/qa-autofill-runtime.ts`
- `packages/core/src/qa-incident-defaults.test.ts`
- `packages/core/src/qa-incident-defaults.ts`
- `scripts/windows/evaluate-local-cdp-expression.ps1`
- `scripts/windows/start-dedicated-chromium-cdp.ps1`

Observed untracked docs:

- `docs/field-trial/k10-text-only-no-save-release-handoff-2026-05-26.md`
- `docs/field-trial/k9-text-field-autofill-manual-acceptance-2026-05-26.md`
- `docs/field-trial/full-field-slice-new-session-handoff-2026-05-26.md` (this handoff file)

Before continuing, run:

```bash
cd <repo>
git status --short
git branch --show-current
```

## Completed work before this handoff

### 1. Persistent QA browser profile completed

The Start QA Chromium flow was changed from old disposable/manual-login-only semantics to a dedicated persistent tool-owned profile:

- Login remains user-controlled.
- Saved sign-in can be reused.
- No cookies/sessions are exported or printed.
- User's daily Chrome/Edge profile is not reused.
- Profile root semantics are tool-owned under `%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles`.

Affected layers were updated:

- adapter browser-session runtime and tests
- CLI tests/copy
- desktop UI copy/tests
- Windows PowerShell helpers parser-checked
- current docs under `docs/design` and `docs/field-trial`

Gates that passed after that work:

```bash
pnpm --filter @servicenow-automation/adapters exec vitest run src/browser-session.test.ts src/qa-autofill-runtime.test.ts
pnpm --filter @servicenow-automation/cli exec vitest run src/cli.test.ts
pnpm --filter @servicenow-automation/desktop exec vitest run src/App.test.ts
git diff --check
pnpm typecheck
pnpm build
pnpm test
pnpm privacy:scan
```

### 2. K10 release-handoff completed

Added honest field-trial release handoff:

- `docs/field-trial/k10-text-only-no-save-release-handoff-2026-05-26.md`

It states the current release is text-only no-save field-trial, not full-field Incident automation and not a Save/Submit/Update/Resolve/Close release.

After adding it, gates/scans passed again:

```bash
git diff --check
pnpm typecheck
pnpm build
pnpm test
pnpm privacy:scan
```

### 3. Full-field local core/adapter support reviewed

The full-field slice is no longer at the initial partial-code checkpoint described below. Later local work and reviews established this narrower status:

- Core full-field runtime planning exists for local review and keeps unreviewed/operator-confirmation fields excluded.
- Adapter runtime tests now cover reviewed reference/select/text/textarea handling in fake/local browser globals.
- The reference-control blocker from the adapter review is resolved for local tests by preferring visible display controls and blocking visible raw reference controls.
- Full-field planner execution is still not wired into the desktop or CLI live operator path.
- Full-field live ServiceNow execution remains not attempted and not approved.

Only after a separate UI/CLI safety slice and review should any desktop IPC or CLI command switch from the text-only runtime plan to a full-field runtime plan.

## Historical implementation notes from the earlier partial handoff

The details in this section are retained to explain how the local full-field slice began. They are not the latest release status; use the 2026-05-27 status refresh above and the adapter/safety review reports as the current source of truth.

### Core tests modified

File: `packages/core/src/qa-incident-defaults.test.ts`

A new import was added:

```ts
buildQaIncidentDefaultRuntimeFullFieldPlan
```

Two new tests were added:

1. `builds a reviewed full-field runtime plan while excluding manual-confirm and out-of-scope defaults`

Expected `plannedFields` for initial-create:

```ts
[
  "requester",
  "category",
  "subcategory",
  "location",
  "assignmentGroup",
  "assignedTo",
  "shortDescription",
  "description",
  "workNotes"
]
```

Expected `excludedFieldKeys`:

```ts
["channel", "impact", "urgency"]
```

2. `builds a reviewed route-out runtime plan with State first and Assigned to intentionally blank`

Expected `plannedFields`:

```ts
["state", "assignmentGroup", "assignedTo", "workNotes"]
```

Expected values:

```ts
state === "New"
assignmentGroup === routeOutAssignmentGroup()
assignedTo === ""
excludedFieldKeys === []
```

The RED test was already confirmed before implementation:

```bash
pnpm --filter @servicenow-automation/core exec vitest run src/qa-incident-defaults.test.ts -t "reviewed full-field runtime plan|reviewed route-out runtime plan"
```

It failed because `buildQaIncidentDefaultRuntimeFullFieldPlan` did not exist.

### Core implementation partially added

File: `packages/core/src/qa-incident-defaults.ts`

Added type:

```ts
export type QaIncidentDefaultRuntimeFullFieldPlan = QaIncidentDefaultValuePlan & {
  excludedFieldKeys: QaIncidentDefaultFieldKey[];
};
```

Added constants:

```ts
const runtimeFullFieldInitialCreateOrder: QaIncidentDefaultFieldKey[] = [
  "requester",
  "category",
  "subcategory",
  "location",
  "channel",
  "assignmentGroup",
  "assignedTo",
  "shortDescription",
  "description",
  "workNotes"
];

const runtimeFullFieldStopRule =
  "Runtime autofill may fill only reviewed Requester, Category, Subcategory, Location, Channel, Assignment group, Assigned to, State, Short description, Description, and Work notes fields after fingerprint approval. Channel remains excluded until a reviewed value is present; Impact and Urgency remain out of scope.";
```

Added function:

```ts
export function buildQaIncidentDefaultRuntimeFullFieldPlan(
  plan: QaIncidentDefaultValuePlan
): QaIncidentDefaultRuntimeFullFieldPlan {
  if (plan.status !== "ready-for-local-review") {
    return {
      ...plan,
      plannedFields: [],
      excludedFieldKeys: []
    };
  }

  const runtimeOrder = plan.scenario === "route-out" ? routeOutOrder : runtimeFullFieldInitialCreateOrder;
  const plannedByKey = new Map(plan.plannedFields.map((field) => [field.key, field]));
  const plannedFields = runtimeOrder.flatMap((key) => {
    const field = plannedByKey.get(key);
    if (!field) return [];
    if (field.manualConfirmationRequired || field.source === "operator-confirmation-required") return [];
    return [field];
  });
  const includedKeys = new Set(plannedFields.map((field) => field.key));
  const excludedFieldKeys = plan.plannedFields
    .map((field) => field.key)
    .filter((key) => !includedKeys.has(key));

  return {
    ...plan,
    plannedFields,
    excludedFieldKeys,
    stopRules: [runtimeFullFieldStopRule, ...plan.stopRules.filter((rule) => rule !== runtimeFullFieldStopRule)]
  };
}
```

Superseded by the 2026-05-27 reviews: targeted/full local gates were rerun after the implementation work. Do not treat this old note as current evidence that tests are still pending.

## First commands for a new session

For release/docs integration, start by verifying the worktree and reading the review reports; do not connect to ServiceNow or launch/control a live browser:

```bash
cd <repo>
git status --short
git branch --show-current
```

Current review evidence lives in ignored local reports:

- `.local/overnight/full-field-recovery-adapter-review-2026-05-27.md`
- `.local/overnight/full-field-recovery-safety-review-2026-05-27.md`

If a future code worker changes implementation again, rerun the relevant targeted package tests first, then the standard gates before claiming anything new.

## Historical adapter implementation plan, now completed locally

The checklist below describes the adapter work that was planned when this handoff was first written. Later workers completed/reviewed the local core/adapter slice and found no scoped adapter blocker after the reference display-control fix. Keep the checklist only as background for what the local tests should continue to protect.

### Adapter test coverage expectations

File: `packages/adapters/src/qa-autofill-runtime.test.ts`

The original adapter runtime had text-only assumptions. The reviewed local tests now cover full-field runtime behavior in fake browser globals while preserving the safety checks listed below:

- reference text input fields:
  - requester
  - location
  - assignmentGroup
  - assignedTo
- select fields:
  - category
  - subcategory
  - state
- existing text/textarea fields:
  - shortDescription
  - description
  - workNotes

Keep tests for failure cases:

- Channel without reviewed value is not in runtime plannedFields.
- Impact/Urgency are excluded from this slice.
- duplicate visible writable controls block.
- missing controls block.
- non-writable controls block.
- wrong element type blocks.
- select option not found blocks with `field-option-not-found`.
- stale/missing approval fingerprint blocks.
- target host mismatch blocks before inspection/fill.
- no Save/Submit/Update/Resolve/Close selectors or clicks are used.

### Adapter GREEN status

Adapter local tests are GREEN in the 2026-05-27 technical review. The resolved reference-field issue is specifically that visible raw reference controls must not be filled; a visible `sys_display` display-control form must be present for reviewed reference fields.

File: `packages/adapters/src/qa-autofill-runtime.ts`

Implementation areas that should remain protected by tests:

- `isRuntimeTextOnlyDefaultField`
- `runtimeTextControlMatches`
- `preferredElementTypeMatches`
- `fillControl`
- `blockedIncidentDefaultField`
- `defaultFieldRuntimeBlockedFields`
- browser-side `incidentDefaultFieldFillScript`

Expected safe behavior:

- reference fields are text inputs only; fill value via native setter + input/change + blur.
- select fields are HTMLSelectElement only; set by matching option value or visible text; dispatch input/change; if no option matches, block `field-option-not-found`.
- text and textarea use current native setter/event behavior.
- never click lookup icons or suggestion rows.
- never press Enter.
- never trigger Save/Submit/Update/Resolve/Close.
- re-inspect current page and compare fingerprint immediately before fill.
- exactly one visible writable expected control must exist for every planned field.

### Desktop/CLI integration remains separately blocked despite adapter GREEN

File: `apps/desktop/electron/main.ts`

Desktop still uses the text-only runtime plan in the reviewed worktree:

```ts
buildQaIncidentDefaultRuntimeTextFieldPlan(defaultPlan)
```

Do not switch this to full-field merely because adapter tests are GREEN. A separate reviewed UI/CLI safety slice must update copy/tests/runbooks and preserve the no-save boundary before any live path changes.

When switching, add tests/copy that clearly say:

- full-field reviewed autofill is still Autofill-only.
- no Save/Submit/Update/Resolve/Close.
- Channel remains excluded until reviewed value exists.
- route-out requires State=New and Assigned to blank.

## Suggested Kanban / profile split for new session

Use Kanban with role-specific workers/profiles rather than one huge context:

Status note as of 2026-05-27: the core/adapter local implementation and the adapter/safety reviews are complete enough for docs handoff. The desktop/CLI full-field integration, Windows manual acceptance, packaging proof, and any live full-field trial remain separate future tasks.

1. `full-field-core-plan` — Code worker (historical/completed local slice)
   - Goal: maintain core runtime full-field plan tests and implementation if later code changes reopen this area.
   - Tools: terminal/file only.
   - Model/profile: Codex GPT-5.5 high/xhigh code.

2. `full-field-adapter-runtime` — Code worker (historical/completed local slice)
   - Goal: maintain adapter runtime support for reviewed reference/select/text/textarea fake-browser coverage if later code changes reopen this area.
   - Tools: terminal/file only.
   - Model/profile: Codex GPT-5.5 high/xhigh code.

3. `full-field-desktop-integration` — Code worker, only after adapter GREEN
   - Goal: switch desktop IPC from text-only runtime plan to full-field plan if approved by tests.
   - Tools: terminal/file/browser smoke if needed.
   - Model/profile: Codex GPT-5.5 high/xhigh code.

4. `full-field-safety-review` — Strategy/review worker (completed for current diff; repeat after any safety-relevant change)
   - Goal: review no-save/no-leak boundaries, failure modes, and UI copy.
   - Tools: file/terminal; no browser live execution.
   - Model/profile: GPT-5.5 Pro strategy/review.

5. `full-field-validation` — Independent validation worker
   - Goal: run gates, privacy scan, old-term scan, check docs do not overclaim.
   - Tools: terminal/file.
   - Model/profile: agy-wsl-run/Gemini 3.5 Flash Thinking if configured for fast validation; do not use Gemini CLI.

6. `full-field-docs-handoff` — Docs/release worker
   - Goal: update field-trial docs after code is fully GREEN. Keep K10 text-only release doc historically honest.
   - Tools: file/terminal.

Do not start live QA execution tasks until Alan explicitly gives a new approval boundary.

## Final gates before reporting implementation completion

Run all of these before marking a future full-field implementation slice complete:

```bash
git diff --check
pnpm --filter @servicenow-automation/core exec vitest run src/qa-incident-defaults.test.ts
pnpm --filter @servicenow-automation/adapters exec vitest run src/qa-autofill-runtime.test.ts src/browser-session.test.ts
pnpm --filter @servicenow-automation/cli exec vitest run src/cli.test.ts
pnpm --filter @servicenow-automation/desktop exec vitest run src/App.test.ts
pnpm typecheck
pnpm build
pnpm test
pnpm privacy:scan
```

Also run source scans over changed/tracked files for:

- stale wording: `manual login only`, `disposable profile`, `disposable: true`, raw `manual-login-only` in user-visible copy.
- sensitive shapes: credential-bearing URLs, query/hash markers, record identifiers, cookie/session/token examples, raw ServiceNow URLs, ticket numbers, real default values.

Print only counts/file paths, not raw sensitive values.

## Copy-paste prompt for `/new`

Paste this into the fresh session:

```text
请继续 ServiceNow-Automation 的 full-field release/docs handoff，先读取这个文件：

<repo>/docs/field-trial/full-field-slice-new-session-handoff-2026-05-26.md

工作目录：<repo>
当前已观察分支：review/k9-browser-runtime-error-20260526

必须先加载 `service-desk-automation-safety`。

当前最新状态：
- K9 text-only no-save live field trial was manually accepted earlier for only Short description / Description / Work notes.
- Local full-field core/adapter support exists and passed local review/gates after the adapter reference display-control fix.
- Adapter technical review PASS: reference fields now require the visible display-control form and block visible raw reference controls in local tests.
- Safety review APPROVE WITH CONDITIONS: no blockers found, but full-field live exposure remains blocked.
- Desktop/CLI live paths remain text-only unless a separate reviewed UI/CLI safety slice explicitly changes them.
- Full-field live ServiceNow execution was not attempted, not manually accepted, and not release-ready.
- No Save/Submit/Update/Resolve/Close is approved.
- Packaged Windows double-click/.exe behavior is not proven by these local reviews.

关键边界：
- 不连接真实 ServiceNow。
- 不执行 live Autofill。
- 不点击或自动化 Save/Submit/Update/Resolve/Close。
- 不调用 ServiceNow API。
- 不导出/打印 cookie、session、storage、HAR、screenshot、trace、真实 URL、ticket、requester、assignment group、field value。
- Channel 不要猜；没有 reviewed value 就继续 excluded/operator-confirmation-required。
- route-out 必须保持 State=New、Assignment group 之后路由、Assigned to 留空的安全意图，但不要把真实值写进 repo docs/tests。

第一步只做本地/文档验证：

cd <repo>
git status --short
git branch --show-current

参考本地忽略报告：
- .local/overnight/full-field-recovery-adapter-review-2026-05-27.md
- .local/overnight/full-field-recovery-safety-review-2026-05-27.md

如果继续实现，请拆成新的 reviewed UI/CLI safety slice、Windows manual acceptance slice、packaging guardrail slice。不要把 live full-field ServiceNow execution 混进 docs or local adapter review work。
```
