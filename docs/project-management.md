# Project Management Rules

## Roles

- **Alan**: owner/boss, validates business fit and demo acceptance.
- **GPT-5.5 Pro**: strategy brain and architecture reviewer.
- **Hermes Agent**: project manager, task splitter, repository operator, verification owner.
- **Codex CLI**: primary coding implementation agent.
- **Gemini CLI**: optional second reviewer or long-context/UX alternative when needed.

## Operating principles

1. Work from Git repository only.
2. Commit small verified changes.
3. P0 first; no feature creep before the demo loop works.
4. Every AI coding task must include exact files, acceptance criteria, and verification commands.
5. No real customer data in demo flows.
6. Mock provider before real AI provider to protect the demo from API/network failure.
7. Mock ServiceNow form before real ServiceNow web-fill.
8. Do not use Codex App as the main development base; use WSL + Git + Codex CLI.

## Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-05-18 | Rebuild as `ServiceNow Automation` | Legacy repo is requirements source, not complete source code |
| 2026-05-18 | Archive legacy repos | Prevent accidental old-code refactor path and accidental public exposure |
| 2026-05-18 | P0 = manual paste + KB + TicketDraft + mock ServiceNow | Fastest safe demo path before 2026-06-05 |
| 2026-05-18 | JSON profiles first | Faster and easier to debug than SQLite for MVP |
| 2026-05-18 | MockAIProvider first | Stable demo without API/network dependency |

## GitHub repositories

- New private main repo: `alanxiaofeifei/servicenow-automation`
- Archived legacy repo: `alanxiaofeifei/service-desk-automation`
- Archived temporary analysis mirror: `alanxiaofeifei/service-desk-automation-public-analysis`

## Cadence

- Daily: implement one or more small P0 tasks, run verification, commit.
- Every 2–3 days: ask GPT-5.5 Pro for high-level architecture/product review.
- After P0 loop works: only then add P1 browser/session work.

## Stop conditions

Stop adding features if any of these happen:

- the three demo scenarios do not run end-to-end
- the app cannot be launched reliably
- privacy boundary is unclear
- a proposed feature requires real production credentials or real customer screenshots
