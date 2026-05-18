# GPT-5.5 Pro Next Support Request

Use this when asking GPT-5.5 Pro for the next high-level review after the initial scaffold exists.

## Prompt

You are the strategic architecture reviewer for my private project **Service Now Automation**.

Project context:
- I am rebuilding from scratch, not refactoring the old SD tool.
- The old `service-desk-automation` repo has been archived as a legacy requirements source.
- The new private repo is `alanxiaofeifei/service-now-automation`.
- Target demo date: 2026-06-05.
- Product positioning: ServiceNow Automation Workbench for Service Desk Agents.
- P0 flow: Manual Paste input → structured TicketDraft → KB/rules match → editable human review → mock/safe ServiceNow form fill → manual final submit.
- Safety boundary: no auto-submit, no auto-close, no production data, no real customer screenshots in demo material.

Please review at a high level only. I need strategic support, not line-by-line code review.

Questions:
1. Does the P0 scope still look realistic for the 2026-06-05 demo?
2. What should be cut if the schedule slips?
3. What should be added only if P0 is already stable?
4. Are the adapter boundaries correct: SourceAdapter, AIProvider, KnowledgeSearch, ServiceNowAdapter, ProfileService, RiskControl?
5. What are the biggest demo risks from a hiring-manager perspective?
6. What should the 3–5 minute demo script emphasize for internal transfer/interview value?
7. What wording should Alan use to explain this as IT Operations + AI Automation, without overclaiming developer expertise?
8. What should remain private forever, and what can later become a sanitized public showcase?

Please answer with:
- executive recommendation
- risks
- scope cuts
- demo story
- next 7 days of priority order
```

## Current Hermes recommendation

Hermes believes the most valuable next GPT support is not another repository read. It should be a **demo narrative and scope-control review** after the initial scaffold and first TicketDraft loop exist.
