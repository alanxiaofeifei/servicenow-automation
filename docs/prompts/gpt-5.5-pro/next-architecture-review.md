# GPT-5.5 Pro Architecture / Scope Review Prompt

Use this prompt after GitHub Issues #4–#8 are completed. This is a strategic review checkpoint, not a request for line-by-line code review.

## Paste this to GPT-5.5 Pro

```text
You are my strategic architecture and demo-readiness reviewer for my private project **ServiceNow Automation**.

Please answer in Chinese, but keep important product/architecture terms in English where helpful. When giving interview/demo wording, provide polished English phrases that I can reuse.

## Project background

I am rebuilding a Service Desk automation tool from scratch instead of refactoring the old SD tool. The old repository `service-desk-automation` is now archived and is used only as a legacy requirements / domain-knowledge source.

New private GitHub repository:
- `alanxiaofeifei/servicenow-automation`
- Product name: **ServiceNow Automation**
- Target demo date: **2026-06-05**
- Positioning: a **ServiceNow Automation Workbench for Service Desk Agents**

This project matters because I am entering a Kyndryl bench / internal transfer window. The demo needs to support internal transfer, portfolio storytelling, and future interviews. It should show IT Operations + Service Desk + ServiceNow + AI Automation capability without overclaiming that I am already a senior developer.

## Current product direction

P0 flow:

Manual Paste input
→ `CapturedContext`
→ Mock AI / rule-assisted extraction
→ structured `TicketDraft`
→ local KB match
→ editable human review
→ mock/safe ServiceNow form fill
→ manual final submit only

Safety boundary:
- No auto-submit.
- No auto-close.
- No blind ticket modification.
- No production data in demo material.
- No real customer screenshots in public/demo material.
- Human review and manual final submit are mandatory.

## Current completed state

The project is no longer just an empty scaffold. These GitHub issues are completed:

- #1 Scope docs
- #2 Privacy / `.gitignore` baseline
- #3 Electron + React + TypeScript + pnpm workspace scaffold
- #4 Core models
- #5 Zod validation schemas
- #6 Demo demo customer profile
- #7 Demo KB articles
- #8 Simple KB search

Current milestone:
- `P0 Demo — 2026-06-05`
- Current progress: 8 closed / 6 open

Remaining P0 issues:

- #9 Implement `ManualPasteAdapter`
- #10 Add `AIProvider` interface and `MockAIProvider`
- #11 Add Ticket Draft workspace UI
- #12 Add Mock ServiceNow form
- #13 Add risk control banner
- #15 Add bilingual demo docs

## Important implemented files to inspect if your GitHub Connector can access the repo

Please inspect these files if available:

- `README.md`
- `docs/demo-scope.md`
- `docs/architecture.md`
- `docs/security-and-compliance.md`
- `docs/product-plan.zh-CN.md`
- `docs/product-plan.en-US.md`
- `packages/core/src/models/index.ts`
- `packages/core/src/schemas/index.ts`
- `packages/profiles/demo-service-desk/profile.json`
- `packages/profiles/demo-service-desk/mappings/category-mappings.json`
- `packages/profiles/demo-service-desk/mappings/assignment-mappings.json`
- `packages/profiles/src/profile-service.ts`
- `packages/kb/demo-articles/vpn.md`
- `packages/kb/demo-articles/windows.md`
- `packages/kb/demo-articles/account-login.md`
- `packages/kb/src/demo-articles.ts`
- `packages/kb/src/search/index.ts`
- `packages/kb/src/local-directory.ts`

If you cannot access the private repository, do not pretend you reviewed the code. In that case, review based only on the context above and clearly state that limitation.

## Current architecture snapshot

Core models already exist:
- `CapturedContext`
- `FieldDraft`
- `TicketDraft`
- `KnowledgeArticle`
- `KnowledgeMatch`
- `ProjectProfile`

Schemas already exist:
- `CapturedContextSchema`
- `TicketDraftSchema`
- `ProjectProfileSchema`
- `KnowledgeArticleSchema`
- `KnowledgeMatchSchema`

Demo data already exists:
- A portfolio-safe demo customer demo profile
- VPN / Windows / Account-login demo KB articles
- Simple keyword KB search
- Optional local Markdown KB directory loader

There is an intended local KB test source outside the repository.

However, this is only for local/private testing and should not be pushed wholesale to GitHub or exposed publicly.

## What I need from you

Please do a **strategic architecture, scope-control, and demo-readiness review**. Do not spend the answer on small code style comments unless a design flaw could affect the demo.

Please answer these questions:

1. Does the current P0 scope still look realistic for a 2026-06-05 demo?
2. Given the remaining issues (#9, #10, #11, #12, #13, #15), what should be the exact priority order?
3. If time becomes tight, which items should be cut, simplified, or mocked?
4. Are these boundaries reasonable?
   - `CapturedContext`
   - `TicketDraft`
   - `ProjectProfile`
   - `KnowledgeArticle` / `KnowledgeMatch`
   - `ManualPasteAdapter`
   - `AIProvider` / `MockAIProvider`
   - `KnowledgeSearch`
   - `ServiceNowAdapter` / mock form
   - `RiskControl`
5. Is it correct to keep P0 focused on Manual Paste + MockAIProvider + local KB + Mock ServiceNow form, rather than real ServiceNow API / Teams / Outlook / Graph integration?
6. Does the current story sound valuable to an internal hiring manager, or does it still look like a toy demo?
7. What should the 3–5 minute demo storyline be?
8. What exact English wording should Alan use to explain this project in interviews without overclaiming developer seniority?
9. Which parts should remain private forever, and which parts can later become a sanitized public portfolio showcase?
10. What are the top 5 demo risks I should control in the next 7 days?

## Please answer in this structure

1. Executive recommendation
   - Continue / adjust / stop-and-redesign?

2. P0 scope decision
   - Must-have
   - Should-have
   - Cut if time is tight
   - Explicitly not P0

3. Architecture boundary review
   - What looks right
   - What should be simplified
   - What is missing but dangerous to ignore

4. Remaining issue priority order
   - Give a concrete order for #9, #10, #11, #12, #13, #15
   - Include the reason for each

5. 3–5 minute demo script
   - Opening problem statement
   - Live workflow steps
   - Safety/compliance line
   - Business value line
   - Closing line for internal transfer / interview

6. Interview positioning
   - 3 resume bullets
   - 1 short elevator pitch
   - 1 honest explanation of using AI-assisted development without overclaiming

7. Privacy / public showcase guidance
   - Private forever
   - Safe to sanitize and show publicly later
   - Red flags to remove before public sharing

8. Next 7-day action plan
   - Day-by-day or priority-based plan
   - Include what to verify before asking for another review
```

## Hermes recommendation before sending

At this checkpoint, Hermes recommends asking GPT-5.5 Pro to focus on **scope control, architecture boundaries, and demo narrative**. Do not ask it to redesign the whole product unless it identifies a fatal flaw. The main near-term goal is to keep the June 5 demo achievable.
