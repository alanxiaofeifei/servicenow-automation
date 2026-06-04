# KB Plugin Architecture

**Package:** `@servicenow-automation/kb` (packages/kb/)
**Updated:** 2026-06-04
**Branch:** `nightly/release-candidate-20260604`

## Overview

The KB plugin provides a pluggable local knowledge base for ServiceNow automation.
It enables keyword-based article search, support group recommendation, and handling-steps
display — all from local demo data. No real enterprise KB import or external AI required.

## Architecture

```
packages/kb/src/
├── index.ts                    # Node entry (re-exports everything)
├── browser.ts                  # Browser entry (re-exports everything except Node-only)
├── demo-articles.ts            # 3 demo KB articles (VPN, Windows, Account login)
├── demo-articles.test.ts       # Demo article structural validation
├── local-directory.ts          # Markdown file loader for external KB articles
├── search/
│   ├── index.ts                # Weighted keyword matching (title×4, category×3, tags×4, …)
│   └── index.test.ts           # Search relevance tests
├── support-group.ts            # Support group recommendation engine
└── support-group.test.ts       # Recommendation tests
```

## Data Flow

```
User input text
       ↓
searchKnowledgeArticles(query, articles, options)
       ↓
KnowledgeMatch[]  (articleId, title, score, matchedKeywords, excerpt)
       ↓
recommendSupportGroup(matches, articles, assignmentMappings)
       ↓
SupportGroupRecommendation[]  (assignmentGroup, confidence, evidence)
```

## Components

### 1. KnowledgeArticle (packages/core/src/models/index.ts)

Core domain model for an individual KB article:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique article identifier |
| title | string | Article title |
| category | string | Category label (e.g. "Network") |
| tags | string[] | Searchable keywords |
| symptoms | string[] | User-facing issue descriptions |
| checks | string[] | Recommended troubleshooting steps |
| escalationCriteria | string[] | When to escalate to next tier |
| responseTemplate | string | Suggested agent reply |
| updatedAt | string | ISO timestamp |

### 2. searchKnowledgeArticles (packages/kb/src/search/index.ts)

Weighted keyword search. Weights:

- Title: ×4
- Category: ×3
- Tags: ×4
- Symptoms: ×1
- Checks: ×1
- Escalation criteria: ×1
- Response template: ×1

Stop words filtered. Minimum 2-char tokens. Returns matches sorted by score descending.

### 3. recommendSupportGroup (packages/kb/src/support-group.ts)

Takes the top-3 KB matches and scores each profile assignment mapping:

1. Collects signal words from matched articles' title, category, tags, symptoms, and checks
2. For each assignment mapping, counts how many of its keywords match signal words
3. Confidence = matched-keyword-signal / total-keywords-in-mapping (capped at 1.0)
4. Returns groups sorted by confidence descending

### 4. Demo Data (packages/kb/src/demo-articles.ts)

Three demo articles (no real enterprise data):

| ID | Title | Category | Support Group Route |
|----|-------|----------|---------------------|
| demo-vpn-connectivity | VPN connectivity troubleshooting | Network | Service Desk Network |
| demo-windows-troubleshooting | Windows endpoint troubleshooting | Endpoint | Service Desk Endpoint |
| demo-account-login | Account and login troubleshooting | Access Management | Service Desk Access |

### 5. KB Panel (apps/desktop/src/App.tsx)

The knowledge page (`activePage === "knowledge"`) shows:

- **KB Matches**: Top-3 matches with score bar and matched keywords
- **Support Group Recommendation**: Badge with confidence percentage
- **Article Details**: Expandable article with handling steps (checks), escalation criteria, and response template

## Safety

- Demo KB data only — no real enterprise articles
- No AI calls for KB search or recommendation
- No ServiceNow API connections
- All processing is local keyword matching
- No raw URLs, credentials, or ticket identifiers in KB content

## Future Considerations

- Add more demo articles for broader coverage
- Support KB article caching from ServiceNow KB (read-only)
- Add front-end filtering by category
- Surface KB matches in the autofill plan sidebar
