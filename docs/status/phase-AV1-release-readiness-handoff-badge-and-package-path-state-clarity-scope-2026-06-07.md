# Phase AV1 — Release Readiness Handoff Badge Styling and Package-Path State Clarity — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_14ea81c7`

---

## 1. Current state — ground truth from AU7

The latest completed gate is **AU7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY**.

### Current local Windows package baseline

| Property | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-au6-20260607-local.zip` |
| Windows UNC path | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-au6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-au6-20260607-local.zip` |
| Checksum | Verified OK during AU6 |
| Phase prefix | `au6` |

### Current `dist/release/` inventory (from AU6 scan)

| File | Role |
|---|---|
| `servicenow-automation-windows-v0.1.0-rc.1-au6-20260607-local.zip` | Newest/current manual validation target |
| `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` | Older than AU6; archival-only |
| `servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip` | Older than AU6; archival-only |

---

## 2. The two gaps (QA callouts from AU4)

QA acceptance on the AU phase identified two non-blocking but visible polish gaps:

### Gap 1: `handoff-latest-badge` has no CSS rule

**Location:** `App.tsx` line 4234-4236
```tsx
{packageMetadata?.path ? (
  <span className="handoff-latest-badge">Latest local package</span>
) : null}
```

**Problem:** The class `handoff-latest-badge` has NO matching CSS rule in `styles.css` (confirmed by search — zero results). The badge renders as an unstyled `<span>` — no background, no border-radius, no font-weight, no padding. It's invisible as a visual element.

**Target state:** The badge should be a small, low-emphasis chip — consistent with the existing `.handoff-chip` pattern — that visually communicates "this is the current/latest package indicator" without drawing attention away from the handoff card's primary content.

### Gap 2: `formatPackagePathForDisplay()` uses same text for loading vs unavailable

**Location:** `App.tsx` lines 8433-8438
```ts
function formatPackagePathForDisplay(path?: string): string {
  if (!path) {
    return "Loading current package path...";
  }
  return `\\\\wsl.localhost\\Ubuntu-Compact${path.replace(/\//g, "\\")}`;
}
```

**Call site (line 4239-4241):**
```tsx
<div className="handoff-path-line">
  <code>{formatPackagePathForDisplay(packageMetadata?.path)}</code>
</div>
```

**Problem:** `packageMetadata?.path` is `undefined` in two distinct states:
1. **Still loading:** `packageMetadata` is `null` (initial state) — IPC request in-flight
2. **Unavailable:** `packageMetadata` is `{ok: false, error: "..."}` — fetch completed but failed

The function cannot distinguish these because it only receives `path?: string`.

The summary section (lines 4254-4256) already handles this distinction correctly:
```tsx
packageMetadata?.ok === false
  ? "Current package metadata is unavailable."
  : "Current package metadata is still loading."
```

**Target state:** The path display line should show distinct text:
- **Loading state** (metadata not yet fetched): "Current package path loading..."
- **Unavailable state** (fetch completed, no path): "Current package path is unavailable."
- **Available state** (path present): The converted WSL UNC path (same as today)

---

## 3. Scope

### AV1 — Scope document (this document)

### AV2 — UX/copy spec (sna-ui-designer)

Define the visual treatment for `.handoff-latest-badge` and the exact wording for both loading/unavailable path states. Specific decisions needed:
- Badge: font-size, font-weight, border-radius, background color, padding, border
- Path state text: exact copy for loading vs unavailable
- Confirm no other text surfaces need updating

### AV3 — Implementation (sna-frontend-workbench)

Changes needed:
1. **`styles.css`**: Add `.handoff-latest-badge` CSS rule — small chip style consistent with `.handoff-chip`
2. **`App.tsx` (formatPackagePathForDisplay)**: Add a second parameter `ok?: boolean` to distinguish loading from unavailable; or refactor the calling code at line 4239 to handle the distinction inline
3. **`App.tsx` (calling code)**: Update line 4239-4241 to pass state info correctly
4. **`App.test.ts`**: Update any tests that exercise `formatPackagePathForDisplay` fallback

### AV4 — QA acceptance (sna-qa-acceptance)

Run manual checklist:
- [ ] Badge renders with visible chip styling
- [ ] Badge only appears when `packageMetadata?.path` is set
- [ ] Path text shows distinct loading vs unavailable messages
- [ ] No regressions in clipboard, summary, or other card areas
- [ ] Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm privacy:scan`

### AV5 — Privacy/security audit (sna-privacy-security)

Independently verify that new CSS and copy changes introduce no data exposure.

### AV6 — Windows local package refresh (sna-windows-runtime)

Rebuild the Windows local package (`pnpm package`) and verify checksum.

### AV7 — Final local readiness gate (sna-release-docs)

Apply the standard readiness checklist, produce release summary.

---

## 4. Non-goals

- No new IPC channels
- No package naming or selection changes
- No external writes, uploads, releases, merges, pushes, tags, or cron changes
- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close operations
- No changes to package selection logic or any external behavior
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values

---

## 5. Dependency graph

```
AV1 (scope doc) ─► AV2 (UX spec) ─► AV3 (implementation) ─► AV4 (QA) ─► AV5 (privacy) ─► AV6 (package) ─► AV7 (readiness gate)
                                                                                                                    │
                                                                                                                    └──► Alan manual validation
```

Dependencies:
- AV2 depends on AV1 (scope defines the problem)
- AV3 depends on AV2 (UX spec defines the exact implementation)
- AV4 depends on AV3 (must have code to test)
- AV5 depends on AV3 (must have code to audit)
- AV6 depends on AV3 (must have built code to package)
- AV7 depends on AV4, AV5, AV6 (all gates must pass)

---

## 6. Required gates (each downstream task runs these independently)

- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm privacy:scan` — PASS
- Windows local package refresh before QA handoff
- Final local readiness gate before Alan manual validation

---

## 7. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Badge styling inconsistent with card design | Low | Low | AV2 spec provides exact CSS values; AV3 implements to spec |
| Path state text breaks existing tests | Low | Medium | AV3 runner must run `pnpm test` and fix any failures |
| FormatPackagePathForDisplay refactor touches clipboard copy path too | Medium | Low | Clipboard copy (line 4280) only calls function with defined paths; not affected by fallback path change |
