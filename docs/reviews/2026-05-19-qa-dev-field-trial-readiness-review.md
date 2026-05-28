# QA/Dev Field-Trial Readiness Review

- Review date: 2026-05-19 08:39 +08:00
- Reviewed commit: `1a38028`
- Related checkpoint: GitHub issue `#20`
- Prerequisites completed: `#18` QA/dev environment mode, `#14` BrowserSessionService skeleton, `#21` minimal CLI/headless workflow

## Verdict

**Ready with conditions.**

The project is ready for a **no-write QA/dev rehearsal** and continued mock/demo work:

```text
Mock/manual paste → TicketDraft → KB matches → risk gate → mock form preview
QA/dev browser session plan → manual login only → capture/context planning only
```

The project is **not ready for any real QA submit/update/resolve/close workflow** yet.

Current implementation is safe because no real ServiceNow API call, Playwright browser launch, form submission, close, or update path exists. The next real-write milestone must wait until the submit authorization gate in `#22` exists and is tested.

## Evidence reviewed

- `packages/profiles/src/service-now-environments.ts`
- `packages/adapters/src/browser-session.ts`
- `packages/adapters/src/browser-session.test.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/App.test.ts`
- `apps/cli/src/cli.ts`
- `.gitignore`
- `docs/field-trial/shadow-mode-runbook.md`
- `docs/prompts/gpt-5.5-pro/qa-dev-field-trial-review.md`

Verification evidence from the previous implementation pass:

```text
pnpm build
pnpm typecheck
pnpm test
sda browser plan --mode qa --json
Git ignore checks for .local, private field tests, HAR/log/screenshot paths
```

All passed before this documentation review was written.

## Top 5 risks

### 1. QA/dev config allows future real submit but no central real-action gate exists yet

`qa` and `dev` environment configs intentionally record `allowsRealSubmit: true` with explicit approval required. That is acceptable as a future target, but risky if future code treats the config boolean itself as authorization.

**Mitigation:** created `#22 Submit authorization gate before real QA/dev workflow` as a field-trial blocker. No real submit/update/resolve/close workflow should be implemented before #22.

### 2. QA URL is visible in private source and UI

The QA URL is tracked in the private repo and shown in the environment card. This is acceptable for private development, but it should not appear in public screenshots, portfolio videos, README exports, or interview material.

**Mitigation:** public/demo artifacts should redact the instance URL or switch to mock mode screenshots.

### 3. BrowserSessionService is intentionally a skeleton

It creates launch plans and resets ignored profile directories, but it does not open a real browser yet. This is safer, but it means QA/dev browser-assisted testing is still a planning stage, not a functional end-to-end browser workflow.

**Mitigation:** next browser work should add controlled launch only, not submit. Prefer Playwright persistent context with manual login and a dedicated `.local/servicenow-browser-profiles/<mode>` profile.

### 4. External AI path is not ready

DeepSeek/external AI is not implemented, which is good for now. But any future provider must be behind a redaction gate and explicit opt-in. Unredacted real ticket text must not leave the local workflow.

**Mitigation:** keep `#17` blocked until a redaction preview, test coverage, and opt-in gate exist.

### 5. Production shadow mode needs an operational checklist before use

Production shadow mode is correctly read-only in config and BrowserSessionService safety flags. However, production shadow testing still needs a concrete checklist for what can be captured, how to sanitize notes, and when to stop.

**Mitigation:** keep `#19` open until production shadow-mode checklist is complete.

## Must-fix before any real QA/dev submit workflow

1. Complete `#22` central submit/write authorization gate.
2. Ensure every future real ServiceNow write action calls the gate.
3. Add tests proving:
   - QA/dev submit is denied without explicit approval.
   - Production shadow mode always denies write actions.
   - `allowsRealSubmit: true` alone is never sufficient.
4. Add URL allowlist or explicit target validation before any browser launch that can interact with ServiceNow.
5. Keep all session/cookie/profile data under ignored runtime paths only.

## Ready now: minimal safe QA/dev no-write rehearsal

The following is acceptable now:

1. Stay in mock mode for the main demo flow.
2. Run:

```bash
sda browser plan --mode qa --json
```

3. Confirm it reports:
   - `status: ready`
   - `manualLoginRequired: true`
   - `browserAutomationImplemented: false`
   - `realSubmitAllowed: false`
   - ignored `.local/servicenow-browser-profiles/qa` profile path
4. If testing with the QA site manually, only use authorized test records and manual login.
5. Do not submit/update/resolve/close from the automation tool.
6. Record only generic observations in ignored `private/field-tests/` notes.

## Should-fix before production shadow mode

1. Finish `#19` production shadow-mode checklist.
2. Add a public/demo redaction mode that hides full ServiceNow instance URLs in UI and docs.
3. Add a structured field-test note template with sanitized scenario type, result quality, missing info, and safety concerns.
4. Add a browser profile reset button/command confirmation message that explicitly says it only deletes `.local/servicenow-browser-profiles/<mode>`.
5. Add a stop-condition checklist to the UI or CLI output.

## Architecture review

### Separation of concerns

Current separation is clean enough for the next milestone:

```text
ManualPasteAdapter      → offline/manual context capture
MockAIProvider          → deterministic local TicketDraft generation
profiles                → environment configs and safety metadata
BrowserSessionService   → node-only session/profile planning and reset
adapters/browser        → browser-safe manual paste export for desktop renderer
CLI                     → headless dry-run and browser plan/reset inspection
Desktop UI              → human review, risk gate, mock form preview
```

The `adapters/browser` split is important because it prevents Node `fs/path` code from being bundled into the Electron renderer.

### Playwright persistent context vs Electron BrowserWindow

For the next QA/dev browser milestone, prefer **Playwright persistent context** first:

- It maps naturally to `.local/servicenow-browser-profiles/<mode>`.
- It supports manual login in a controlled, repeatable browser profile.
- It is easier to test in isolation from the Electron renderer.
- It keeps real ServiceNow browser handling behind an adapter boundary.

Electron `BrowserWindow` can remain a later UX option, but it should not be the first implementation path for field-trial browser sessions.

## 24-hour implementation plan

1. **Create #22 gate implementation**
   - Central `RealActionGate` / `SubmitAuthorizationPolicy`.
   - Tests for QA/dev allowed only with explicit approval.
   - Tests for production shadow always denied.

2. **Add browser launch planning constraints**
   - URL allowlist/validation.
   - CLI/UI copy: browser launch does not imply submit permission.

3. **Keep #17 blocked**
   - Do not add DeepSeek until redaction gate exists.

4. **Prepare demo assets**
   - Use mock mode screenshots.
   - Avoid showing full QA URL in public material.

5. **Only after #22 passes**
   - Consider a QA no-submit browser launch rehearsal.
   - Still do not implement form submit.

## 3–5 minute demo framing

Suggested story:

1. **Problem** — Service desk agents repeatedly search KBs and rewrite similar ticket notes.
2. **Solution** — This workbench converts support context into editable incident drafts with KB evidence.
3. **Safety** — AI drafts only; human review, risk gate, and manual final submit remain mandatory.
4. **AI-agent-ready design** — CLI/headless commands can generate drafts and dry-run workflows without touching real ServiceNow.
5. **Enterprise awareness** — QA/dev, production shadow, runtime session storage, and external AI redaction are separated before any real deployment.

## Final go/no-go

| Target | Status |
|---|---|
| Mock portfolio demo | **Go** |
| CLI/headless dry-run demo | **Go** |
| QA/dev browser session planning | **Go** |
| QA/dev no-write manual rehearsal | **Go with caution** |
| QA/dev real submit/update/resolve/close workflow | **No-go until #22** |
| Production shadow mode | **No-go until #19** |
| DeepSeek/external AI | **No-go until #17 redaction gate** |
