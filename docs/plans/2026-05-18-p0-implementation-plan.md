# P0 MVP Implementation Plan

> **For Hermes:** Use Codex CLI and/or subagent-driven-development to implement this plan task-by-task. Keep P0 scope small.

**Goal:** Build a safe, demoable ServiceNow Automation Workbench MVP before 2026-06-05.

**Architecture:** Electron desktop app with React renderer and TypeScript workspace packages. The app separates capture, AI/mock extraction, KB search, ticket drafting, profile mapping, risk controls, and ServiceNow mock fill.

**Tech Stack:** Electron, React, TypeScript, Vite, pnpm, Zod, Playwright later.

---

## Phase 1: Repo and scaffold

### Task 1: Create runnable desktop scaffold

**Objective:** Create Electron + React + TypeScript + Vite scaffold under `apps/desktop`.

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/electron/main/index.ts`
- Create: `apps/desktop/electron/preload/index.ts`
- Create: `apps/desktop/renderer/src/App.tsx`
- Create: `apps/desktop/renderer/src/main.tsx`

**Verification:**

```bash
pnpm install
pnpm typecheck
pnpm dev
```

**Commit:**

```bash
git add .
git commit -m "feat: scaffold desktop workspace"
```

### Task 2: Add workspace packages

**Objective:** Create empty package boundaries for core, ai, kb, profiles, adapters.

**Files:**
- Create: `packages/core/src/index.ts`
- Create: `packages/ai/src/index.ts`
- Create: `packages/kb/src/index.ts`
- Create: `packages/profiles/src/index.ts`
- Create: `packages/adapters/src/index.ts`

**Verification:**

```bash
pnpm typecheck
```

**Commit:**

```bash
git add packages package.json pnpm-workspace.yaml
git commit -m "chore: add workspace package boundaries"
```

## Phase 2: Core models and validation

### Task 3: Add core TypeScript models

**Objective:** Define `CapturedContext`, `TicketDraft`, `FieldDraft`, `ProjectProfile`, and `KnowledgeArticle`.

**Files:**
- Create: `packages/core/src/models/captured-context.ts`
- Create: `packages/core/src/models/ticket-draft.ts`
- Create: `packages/core/src/models/project-profile.ts`
- Create: `packages/core/src/models/knowledge-article.ts`
- Modify: `packages/core/src/index.ts`

**Verification:**

```bash
pnpm typecheck
```

### Task 4: Add Zod schemas

**Objective:** Validate captured contexts, ticket drafts, and project profiles.

**Files:**
- Create: `packages/core/src/schemas/captured-context.schema.ts`
- Create: `packages/core/src/schemas/ticket-draft.schema.ts`
- Create: `packages/core/src/schemas/project-profile.schema.ts`

**Verification:**

```bash
pnpm test
pnpm typecheck
```

## Phase 3: Demo data and KB

### Task 5: Create sanitized demo profile

**Objective:** Add fake demo profile values for VPN, Windows, account/login scenarios.

**Files:**
- Create: `packages/profiles/demo-service-desk/profile.json`
- Create: `packages/profiles/demo-service-desk/mappings/categories.json`
- Create: `packages/profiles/demo-service-desk/mappings/assignment-groups.json`

**Verification:**

```bash
pnpm test
```

### Task 6: Add demo KB articles

**Objective:** Add three rewritten, fake KB articles.

**Files:**
- Create: `packages/kb/demo-articles/vpn-issue.md`
- Create: `packages/kb/demo-articles/windows-issue.md`
- Create: `packages/kb/demo-articles/account-login-issue.md`

**Verification:**

```bash
grep -R "@" packages/kb/demo-articles || true
```

## Phase 4: P0 user flow

### Task 7: Implement ManualPasteAdapter

**Objective:** Convert pasted issue text into `CapturedContext`.

**Files:**
- Create: `packages/adapters/source-manual-paste/src/index.ts`
- Modify: desktop capture page/component

**Verification:**

```bash
pnpm test
pnpm dev
```

### Task 8: Implement MockAIProvider

**Objective:** Deterministically generate TicketDraft for the three demo scenarios.

**Files:**
- Create: `packages/ai/src/providers/ai-provider.ts`
- Create: `packages/ai/src/providers/mock-ai-provider.ts`

**Verification:**

```bash
pnpm test
```

### Task 9: Implement simple KB search

**Objective:** Match issue text to KB articles via keyword scoring.

**Files:**
- Create: `packages/kb/src/search/simple-keyword-search.ts`

**Verification:**

```bash
pnpm test
```

### Task 10: Build Ticket Draft review UI

**Objective:** Display editable draft fields, KB matches, risk flags, missing info.

**Files:**
- Create/Modify: `apps/desktop/renderer/src/pages/TicketDraftPage.tsx`
- Create/Modify: `apps/desktop/renderer/src/components/`

**Verification:**

```bash
pnpm dev
```

### Task 11: Build Mock ServiceNow form

**Objective:** Fill a fake Incident form and keep submit manual/disabled.

**Files:**
- Create: `apps/desktop/renderer/src/pages/MockServiceNowIncidentPage.tsx`
- Create: `packages/adapters/servicenow-mock/src/index.ts`

**Verification:**

```bash
pnpm dev
```

## Phase 5: Demo hardening and docs

### Task 12: Add three demo scenario fixtures

**Objective:** Make demo repeatable offline.

**Files:**
- Create: `docs/demo/scenario-vpn.md`
- Create: `docs/demo/scenario-windows.md`
- Create: `docs/demo/scenario-account-login.md`
- Create: `tests/fixtures/demo-scenarios.json`

**Verification:**

```bash
pnpm test
```

### Task 13: Add risk banner and confirmation dialogs

**Objective:** Make human-in-the-loop safety visible.

**Files:**
- Create: `apps/desktop/renderer/src/components/RiskBanner.tsx`

**Verification:**

```bash
pnpm dev
```

### Task 14: Add bilingual user guide and demo script

**Objective:** Prepare internal transfer/interview demo material.

**Files:**
- Create: `docs/zh-CN/user-guide.md`
- Create: `docs/en-US/user-guide.md`
- Create: `docs/zh-CN/demo-script.md`
- Create: `docs/en-US/demo-script.md`

**Verification:**

```bash
grep -R "real customer\|password\|cookie" docs || true
```

### Task 15: Run end-to-end rehearsal checklist

**Objective:** Verify all three demo flows without network or private data.

**Files:**
- Create: `docs/demo/e2e-checklist.md`

**Verification:**

```bash
pnpm typecheck
pnpm test
pnpm dev
```
