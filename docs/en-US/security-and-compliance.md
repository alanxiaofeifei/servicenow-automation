# Security and Compliance Statement

## Design principle

Automate drafting, not accountability.

The tool may help generate draft fields and rehearse form filling, but the human service desk agent remains responsible for final review and any real ITSM action.

## Allowed in P0

- Manual paste of sanitized issue context.
- Demo KB articles with fake or generic content.
- Deterministic MockAIProvider.
- Mock ServiceNow form.
- Human review confirmation before fill.

## Not allowed in P0

- Auto-submit.
- Auto-close.
- Auto-update of production tickets.
- Credential storage in source code.
- Browser cookies or sessions in Git.
- Real screenshots or real ticket content in the repository.
- External AI calls with unredacted customer content.

## QA/dev test mode

QA/dev testing may be added only after the mock workflow is stable. It must use authorized access, manual login, ignored local runtime storage, and explicit approval before any real test submission.

## Production shadow-mode

Production validation must remain shadow-mode unless a separate safety review approves otherwise. The user may compare the generated draft with manual handling, but the tool must not perform automatic production writes.

## Public showcase rule

Before any public showcase, remove customer names, real URLs, real assignment groups, ticket numbers, screenshots, meeting notes, recordings, and environment-specific configuration.
