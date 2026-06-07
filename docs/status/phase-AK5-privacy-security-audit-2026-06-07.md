# Phase AK5 — Privacy/Security Audit for Validation-History Polish

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-privacy-security`
**Task:** `t_cb3365d0`
**Parent:** AK3 (`t_253386d6`) — validation-history summary implementation

---

## Verdict: APPROVE — no blocking issues

---

## 1. Scope audited

Audited all files changed in the validation-history polish round (AK3 implementation)
against the AK2 spec (`docs/status/phase-AK2-validation-history-and-acceptance-summary-ux-spec-2026-06-07.md`).

### Files changed (7 files, +1341/-16 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `apps/desktop/src/App.tsx` | +387/-8 | Worktree acceptance state management, validation-history summary copy, dynamic package metadata |
| `apps/desktop/src/App.test.ts` | +130/-4 | Tests for pending/accepted states, runs/no-runs combos, manual validation checklist |
| `apps/desktop/src/styles.css` | +510 | Worktree acceptance card, repo hygiene card, checklist styles |
| `apps/desktop/electron/main.ts` | +30/-1 | IPC handlers for worktree operations |
| `apps/desktop/electron/preload.ts` | +8 | contextBridge exposure for worktreeApi |
| `apps/desktop/electron/worktree-ipc.ts` | +129 (new) | Local-only IPC handlers (git diff, open dist/release, package metadata, worktree status) |
| `.gitignore` | +1 | Comment for .local/video-analysis/ |
| `docs/status/phase-AG1-...md` | +291 (new) | AG1 scope doc — audited for sensitive content |

---

## 2. Gate results

| Gate | Result |
|------|--------|
| `pnpm privacy:scan` | **PASS** — 288 tracked files scanned |
| `pnpm build` | **PASS** |
| `pnpm typecheck` | **PASS** |
| `pnpm test` | **PASS** — 438/438 tests across 7 packages |

---

## 3. Red-zone verification

### 3.1 Secrets, credentials, sessions — NONE FOUND

- No cookies, storage-state, HAR, trace, or screenshots in any file
- No raw ServiceNow URLs — only `qa.service-now.example.invalid` (safe example domain)
- No ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No passwords, tokens, or credential-bearing strings

### 3.2 Hardcoded data removed (improvement)

The diff **removes** two previously hardcoded sensitive items from tests:

```
- expect(output).toContain("\\\\wsl.localhost");                                              (App.test.ts:1622)
- expect(output).toContain("4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde"); (App.test.ts:1623)
```

And from App.tsx, the hardcoded SHA256 and UNC path are replaced with dynamic
`worktreePkgMetadata` references. The old hardcoded values only appear in
**deleted** lines in the diff — the current tree is clean.

### 3.3 UNC path — local-only, spec-required

The WSL UNC path `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...` remains visible
in the UI as the **current local Windows package path**. This is:

- Required by the AK2 spec (§2, §10): "Keep the current package path exact and unmodified"
- A local filesystem identifier, not a ServiceNow URL or secret
- A known project convention carried through many phases (AE, AF, AG, AH, AJ, AK)
- Only exposed through dynamic `worktreePkgMetadata` (computed at runtime), not hardcoded

### 3.4 No ServiceNow write actions — VERIFIED

Searched all changed files for forbidden action patterns. Results:

- **No** Save, Submit, Update, Resolve, Close automation
- **No** ServiceNow API writes
- **No** browser automation (no Playwright, Puppeteer, DOM fill, CDP write)
- **No** attachment upload
- **No** Microsoft Graph / Excel Web writes
- **No** Teams/Outlook/phone ingestion
- **No** push, PR, merge, tag, GitHub Release, publish, or cron changes

### 3.5 New IPC handlers — local-only, read-only

Four new IPC handlers added via `worktree-ipc.ts`. All are:

| Handler | Operation | Safety |
|---------|-----------|--------|
| `sda:worktree-git-diff` | `git diff --stat HEAD` | Read-only, home-dir sanitized |
| `sda:worktree-open-dist-release` | `shell.openPath` to local `dist/release/` | Local filesystem only |
| `sda:worktree-status` | `git status --porcelain` | Read-only |
| `sda:worktree-package-metadata` | Scan `dist/release/*.zip` for newest, compute SHA256 | Read-only, local filesystem only |

No handler accepts user-supplied arguments. All paths are derived from `findProjectRoot()`.
No handler performs any network operation, ServiceNow interaction, or external write.

### 3.6 Safety boundary copy — present and explicit

The worktree acceptance card includes explicit boundary copy:

> "Local only. No live ServiceNow action, upload, PR, merge, tag, or release is implied."
> "Acceptance is a human decision. No automated action implies acceptance, release, upload, or ServiceNow write."
> "Confirm the surface stays local-only and does not imply any ServiceNow write action."

The manual validation checklist also carries explicit safety copy in all four languages.

### 3.7 AG1 scope doc — clean

`docs/status/phase-AG1-local-repo-hygiene-and-artifact-boundary-scope-2026-06-07.md`:
- No real ServiceNow URLs, ticket IDs, sys_ids, or credentials
- References to "Cookie, session, storage-state" are safety boundary descriptions, not actual data
- File list for `dist/release/` contains only local filenames, no sensitive paths

---

## 4. AK2 spec compliance

| Spec requirement | Status |
|------------------|--------|
| Pending state: "No prior acceptance recorded. The checkpoint remains unconfirmed." | ✅ Exact copy used |
| Accepted state: "Accepted locally. The checkpoint is confirmed." | ✅ Exact copy used |
| Last-run detail line when validationRunHistory exists | ✅ Implemented |
| Current package path remains explicit and unmodified | ✅ Dynamic, spec-compliant |
| Archived packages labeled "Archival only" | ✅ Demoted styling applied |
| No "AJ/AI/AG/AH" aliases as current checkpoint | ✅ Current label is "Current local Windows package" |
| No ServiceNow write implication | ✅ Boundary copy present |
| Local-only human-reviewed checkpoint language | ✅ "Acceptance is a human decision" |

---

## 5. Non-blocking observations

1. **UNC path visibility**: The WSL localhost path is visible in the UI. This is spec-required
   and has been a known project pattern. AK6 refresh will update the path. No action needed.

2. **`wslPrefix` constant**: `apps/desktop/src/App.tsx` line ~631 hardcodes
   `const wslPrefix = "\\\\wsl.localhost\\Ubuntu-Compact"`. This is used only to convert
   Linux paths to Windows UNC paths for display. It is local-only and contains no secrets.

3. **Test count**: Full suite runs 438 tests (parent metadata reported 378 for the
   affected-package subset). All pass.

---

## 6. Evidence reviewed

- Full `git diff HEAD~1` across all 7 changed files
- Targeted grep for ServiceNow URLs, ticket IDs, sys_ids, credentials, session tokens
- `pnpm privacy:scan` output — PASS on 288 files
- `pnpm build`, `pnpm typecheck`, `pnpm test` — all PASS
- `worktree-ipc.ts` full source (129 lines)
- AK2 spec document (352 lines)
- IPC handler registration in `main.ts` and `preload.ts`
- Safety boundary copy in App.tsx (4-language coverage)

---

## 7. Required rework

**None.** No blocking issues found.

---

## 8. Remaining risks

- **None identified.** All new operations are local-only and read-only.
  The diff improves privacy posture by removing two hardcoded sensitive test assertions
  (UNC path literal and SHA256 hash).

---

*This audit is complete. The validation-history polish round is safe to proceed.*
