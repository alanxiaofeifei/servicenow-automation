# GPT-5.5 Pro Review Prompt — Legacy AIA SD Tool Product Pattern Extraction

## Context

We are building a new, portable ServiceNow Automation project for Service Desk workflows. The goal is not to copy a previous tool's source code, but to reuse validated product ideas from Alan's older AIA Service Desk automation tool.

The legacy tool was human-developed and field-tested in daily Service Desk work. It used a Windows desktop UI, Outlook monitored folders, Chromium/Playwright browser automation, Mail Review windows, Ticket sidecar windows, high-severity monitoring, and Change workflow support.

The source manuals contained sensitive operational details, so the attached extraction is sanitized. Do not ask for raw credentials, customer URLs, ticket IDs, or internal mailbox details.

## Current safety boundary

Still forbidden:

```text
QA ServiceNow login
ServiceNow URL
post-login exploration
DOM/page inspection
screenshots/HAR/traces/video
browser artifact export
cookie/session/storage export
field fill against real ServiceNow
Save / Submit / Update / Close
ServiceNow API calls
real mailbox access
real email sending
production-shadow testing
```

Allowed for this review:

```text
product-pattern analysis
backlog prioritization
safe mock/demo feature selection
risk classification
recommendation of next issues
```

## Material to review

Please review this sanitized repo note:

```text
docs/research/legacy-aia-sd-tool-product-patterns.md
```

## Questions

1. Does the extraction correctly identify the legacy tool's strongest reusable product patterns?
2. Are we right to reframe the new product as a “Service Desk workflow cockpit” rather than only a ServiceNow form filler?
3. Which 3–5 legacy-inspired features should be prioritized for a June 5 demo, assuming no real ServiceNow or mailbox access?
4. Which old-tool behaviors should remain explicitly forbidden or gated?
5. Are there any missing patterns from the legacy tool that would be especially valuable for Alan's internal transfer / portfolio story?
6. Should any proposed quick-win features be downgraded because they are too risky, too time-consuming, or not demo-relevant?

## Expected answer format

Please answer with:

```text
Verdict: READY / READY WITH CONDITIONS / NO-GO

Top reusable patterns:
- ...

June 5 demo priority:
1. ...
2. ...
3. ...

Safety corrections:
- ...

Recommended next GitHub issues:
- ...
```
