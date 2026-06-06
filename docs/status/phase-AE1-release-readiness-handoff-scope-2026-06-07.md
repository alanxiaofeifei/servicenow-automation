# Phase AE1 — Release-Readiness Handoff Panel and Local Validation Flow — Scope Definition

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AD7 base:** HEAD `633be9f` (AD7 status commit) / artifact HEAD `b958eb6` (AD4 QA acceptance)
**Profile:** `sna-orchestrator`

---

## 1. Why this matters — the visible handoff surface

After AD7, Alan has a working Windows local test package at a known UNC path with a verified SHA256, but **finding the latest path is a manual hunt through status docs**. The current handoff pattern repeats the same metadata in every phase doc (AC0 → AC1 → AD6 → AD7), but there is no single, always-up-to-date reference surface that Alan can open at the start of every validation session to answer these questions instantly:

| Question | Current answer | Gap |
|----------|---------------|-----|
| What's the exact latest Windows UNC path? | Last phase doc title line | Must know which doc is most recent |
| Is that package still the latest build? | SHA256 check or rebuild | No "last refreshed" timestamp visible at a glance |
| What changed since the last round? | Scatter-read across multiple phase docs | No one-line change summary linked to the artifact |
| Why should I retest? | Buried in phase context | Not surfaced next to the download path |
| What's NOT safe to do with this build? | In every phase doc's boundaries section | Not collocated with the artifact reference |

**The AE goal is a local-only release-readiness handoff surface** — a visible panel/doc/doc-location that Alan can open first, every time, and immediately see:

1. The exact Windows UNC path of the latest local package
2. Its SHA256 checksum and mtime
3. One-line change summary (what changed since Alan last tested)
4. Why this round matters / what to focus on
5. What remains human-only (red-zone boundaries)

This reduces Alan's friction from "find the latest phase doc → scroll to the package table → copy path → hunt for what changed" to "open the handoff surface → copy the first line → done."

---

## 2. Current state — what Alan should see or test first today

**Latest local package (from AD7 final gate):**

| Property | Value |
|---|---|
| Artifact | `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` |
| Size | 118,588,779 bytes (~113 MB) |
| SHA256 | `7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006` |
| Built from | HEAD `b958eb6` (AD4: QA acceptance) |
| What changed vs AC/AB round | AD3 CDP readiness chip + center empty/loading/error states (3 runtime files modified) |
| Gate status (AD7-verified) | build PASS, typecheck PASS, test 389/389 PASS, privacy:scan PASS |
| Conclusion | READY FOR ALAN MANUAL VALIDATION ONLY |

**All other artifacts in `dist/release/`:**

| Artifact | mtime | Status | Relationship |
|---|---|---|---|
| `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` | 2026-06-07 01:32 CST | LATEST | AD-polish fresh build |
| `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip` | 2026-06-07 01:04 CST | Stale (previous round) | AB-polish dated copy |
| `servicenow-automation-windows-v0.1.0-rc.1.zip` | 2026-06-06 15:34 CST | Published canonical | v0.1.0-rc.1 GitHub prerelease |

**What Alan should validate first on Windows (manual checklist):**

1. Copy the AD7 package zip from the UNC path above to a Windows desktop folder.
2. Extract and open `START-HERE-WINDOWS.txt` first — confirm the red-zone boundaries wording.
3. Double-click `ServiceNow Automation.exe`.
4. Confirm the three-column operator layout opens visibly.
5. Check the AD polish UI elements:
   - CDP readiness chip visible in the runtime rail (4 states: disconnected / connecting / connected / error)
   - Center panel empty/loading/error placeholders render generically
   - Center order preserved: Selected source detail → Cleaned summary → Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue
6. Do NOT perform any real ServiceNow login, browser automation, or field interaction.

---

## 3. Non-goals and red-zone boundaries

**Non-goals for Phase AE (this scope):**

| Item | Reason |
|---|---|
| Creating a runtime in-app panel (this is a docs/status-surface spec) | AE2 specifies the layout; AE3 may implement in-app if safe |
| Changing the build pipeline, packaging, or artifact layout | Stays as-is; handoff surface reads the existing artifact |
| Adding new CI/CD, GitHub Release, merge, tag, or push | Explicitly excluded — local-only |
| Live ServiceNow API operations, browser automation, or field writes | Red-zone — never automated |
| Windows installer, auto-update, or signed executable | Feature — not scope |
| Cross-platform support | Out of scope for v0.x |
| Changing the center-column order or runtime gating | Preserved as-is |
| New translations, new features, new runtime actions | Scope creep |

**Red-zone items (never in scope, must be flagged in handoff surface wording):**

- ❌ Real ServiceNow login, browser automation, API writes
- ❌ Save / Submit / Update / Resolve / Close automation
- ❌ Microsoft Graph / Excel Web writes
- ❌ Real Teams / Outlook / phone data ingestion
- ❌ Screenshots, HAR recordings, trace captures from live ServiceNow pages
- ❌ Cookie, session, or storage-state export
- ❌ Pasting raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups
- ❌ Git push, merge, tag, GitHub Release (requires explicit Alan approval card)

---

## 4. Downstream deliverables and dependencies — AE2 through AE7

The AE pipeline is already decomposed into 6 sequential phases (AE2–AE7) as child tasks, linked by dependency edges.

```
AE1 (this doc — scope definition)
 └── AE2 (UX/copy spec for handoff panel)            → sna-ui-designer
      └── AE3 (implement handoff panel)              → sna-frontend-workbench
           ┌── AE4 (QA acceptance + manual checklist) → sna-qa-acceptance
           └── AE5 (privacy/security audit)           → sna-privacy-security
                └── AE6 (Windows package refresh)     → sna-windows-runtime
                     └── AE7 (final readiness gate)   → codex-gpt55-control
```

### AE2 — UX/Copy Spec for Release-Readiness Handoff Panel

| Property | Value |
|---|---|
| Assignee | `sna-ui-designer` |
| Deliverable | `docs/status/phase-AE2-release-readiness-handoff-ux-spec-2026-06-07.md` |
| Gated on | AE1 (this doc) complete |
| Acceptance | Defines panel/doc structure, first-line path pattern, exact metadata to surface (UNC path, SHA256, mtime, one-line change summary), keeps center-order intact, implementable without new runtime authority, includes manual-review checklist |
| Safety | Local-only; no live ServiceNow implication |

### AE3 — Implement Release-Readiness Handoff Panel

| Property | Value |
|---|---|
| Assignee | `sna-frontend-workbench` |
| Deliverable | `docs/status/phase-AE3-release-readiness-handoff-implementation-2026-06-07.md` |
| Gated on | AE2 complete |
| Acceptance | Handoff surface implemented per AE2 spec; surfaces latest UNC path + checksum; local-only; preserves center order; no new external write paths; passes required gates |
| Safety | No broad refactor; narrow, reviewable change |

### AE4 — QA Acceptance and Alan Manual Checklist

| Property | Value |
|---|---|
| Assignee | `sna-qa-acceptance` |
| Deliverable | `docs/status/phase-AE4-qa-acceptance-and-manual-checklist-2026-06-07.md` |
| Gated on | AE3 complete |
| Acceptance | Checklist verifies exact path/checksum/what-changed; confirms no stale package reference; confirms no red-zone wording; runs required gates; states pass/fail + residual notes |
| Safety | QA-only; no live ServiceNow activity |

### AE5 — Privacy/Security Audit

| Property | Value |
|---|---|
| Assignee | `sna-privacy-security` |
| Deliverable | `docs/status/phase-AE5-privacy-security-audit-2026-06-07.md` |
| Gated on | AE3 complete (parallel with AE4) |
| Acceptance | No secrets/sensitive identifiers exposed; handoff surface stays local-only; uses sanitized values only; runs required gates including privacy scan; clear approve/fix/blocked conclusion |
| Safety | Docs/copy audit only; no live system inspection |

### AE6 — Windows Local Package Refresh

| Property | Value |
|---|---|
| Assignee | `sna-windows-runtime` |
| Deliverable | `docs/status/phase-AE6-windows-local-package-refresh-2026-06-07.md` |
| Gated on | AE4 AND AE5 both complete |
| Acceptance | Fresh dated Windows zip distinct from older packages; checksum passes; START-HERE safety wording verified; exact UNC path recorded; no publish/upload/release |
| Safety | Local package build only |

### AE7 — Final Local Readiness Gate

| Property | Value |
|---|---|
| Assignee | `codex-gpt55-control` |
| Deliverable | `docs/status/phase-AE7-final-local-readiness-gate-2026-06-07.md` |
| Gated on | AE6 complete |
| Acceptance | First line is `Alan should test this file:` + exact UNC path; final recommendation is READY/READY FOR NEXT ROUND/BLOCKED; worktree clean; status doc committed; next-step explicit and safe |
| Safety | Final local gate only; no release/push/merge action |

---

## 5. Pipeline flow diagram

```
AE1 ──→ AE2 ──→ AE3 ──┬──→ AE4 ──┐
    (spec)   (impl)    │          ↓
                       └──→ AE5 ──→ AE6 ──→ AE7
                            (parallel)  (build)  (gate)
```

- AE2, AE3, AE4, AE5, AE6, AE7 are already registered as kanban tasks.
- AE4 and AE5 run in parallel after AE3.
- AE6 creates the fresh package only after both QA (AE4) and privacy (AE5) approve.
- AE7 is the final recommendation for Alan.

---

## 6. Gate policy

All implementation tasks (AE3, AE4, AE5, AE6, AE7) must pass:

| Gate | Command |
|---|---|
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Test | `pnpm test` |
| Privacy | `pnpm privacy:scan` |

If any gate fails, the worker must STOP and block with sanitized evidence. No code moves past a red gate.

---

## 7. Status

```text
Phase AE1 — RELEASE-READINESS HANDOFF PANEL AND LOCAL VALIDATION FLOW — SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream phases defined: 6 (AE2–AE7)
  - AE2: UX/copy spec for handoff panel        → sna-ui-designer
  - AE3: implement handoff panel                → sna-frontend-workbench
  - AE4: QA acceptance + manual checklist       → sna-qa-acceptance
  - AE5: privacy/security audit                 → sna-privacy-security
  - AE6: Windows local package refresh          → sna-windows-runtime
  - AE7: final local readiness gate             → codex-gpt55-control

Pipeline: AE2 → AE3 → (AE4∥AE5) → AE6 → AE7
Red-zone items excluded: 9
Non-goals: 8

Current latest artifact (AD7):
  servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip
  SHA256: 7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006
  Gate: READY FOR ALAN MANUAL VALIDATION ONLY
```

This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.
