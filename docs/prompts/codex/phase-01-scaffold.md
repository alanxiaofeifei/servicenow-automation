# Codex CLI Prompt — Phase 01 Scaffold

Use this prompt from the repository root:

```bash
codex exec --full-auto '<paste prompt below>'
```

## Prompt

You are helping build **ServiceNow Automation**, a private portfolio-grade ServiceNow Automation Workbench for service desk agents.

Current goal: create only the initial runnable technical scaffold and keep the scope small.

Context:
- This is a new rebuild, not a refactor of the archived legacy SD tool.
- P0 demo target date: 2026-06-05.
- P0 flow: Manual Paste input → structured TicketDraft → local KB match → editable review UI → mock ServiceNow form fill → manual submit only.
- Safety rule: AI drafts and fills; humans review and submit.

Tech stack requirements:
- Use pnpm workspace.
- Create Electron + React + TypeScript + Vite desktop app under `apps/desktop`.
- Prepare package folders under `packages/core`, `packages/ai`, `packages/kb`, `packages/profiles`, and `packages/adapters`.
- Add TypeScript project references or workspace scripts if practical, but do not over-engineer.
- Add `pnpm typecheck`, `pnpm test`, and `pnpm dev` scripts.
- Add a minimal visible app shell with the title `ServiceNow Automation` and a safety banner: `AI drafts only. Human review and manual submit required.`
- Do not implement real ServiceNow, Teams, Outlook, Graph, or OpenAI integration yet.
- Do not add any real customer data.

Expected files:
- `package.json`
- `pnpm-workspace.yaml`
- `apps/desktop/...`
- `packages/core/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/kb/src/index.ts`
- `packages/profiles/src/index.ts`
- `packages/adapters/src/index.ts`
- minimal tests if the chosen test runner can be added quickly

Verification commands to run:
- `pnpm install`
- `pnpm typecheck`
- `pnpm test` if tests exist

After implementation, report:
1. file tree summary
2. commands run and results
3. any deviations from requirements
4. next recommended task

Do not commit unless explicitly asked by Hermes/Alan after verification.
```
