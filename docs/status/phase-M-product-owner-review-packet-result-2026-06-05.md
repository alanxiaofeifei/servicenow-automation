# Phase M — Product-Owner Before/After Review Packet

**Date:** 2026-06-05  
**Branch:** `next/product-clarity-demo-polish-20260605`  
**HEAD:** `2e72e85` — Phase J gate and artifact hygiene  
**Audience:** Alan (product owner, nontechnical review)  
**Gate owner:** sna-release-docs  

---

## The question this packet answers

> "What did you actually change, and why does the repeated test matter?"

Alan ran a manual validation on 2026-06-05. The test passed. But it felt similar to a prior test. The value of the repeated test was not obvious, and the work done in between was invisible.

This packet explains the **before vs after** in plain language, so Alan can decide what to do next without guessing.

---

## Section 1 — Before: What Alan saw

After the Windows app launch + autofill success (2026-06-05), Alan reported:

- The app launches and fills a ServiceNow form correctly.
- The safety-first flow feels the same as last time.
- **No visible change or readiness signal** — the app didn't tell Alan what had improved or what had been added.
- The manual validation felt repetitive because the changes were invisible during a launch-and-fill test.

The product had:
- No history record of what validation runs occurred.
- No export capability to share results.
- Safety copy that was present but not prominent.
- Two `.gitignore` gaps (`.codegraph/` and `.worktrees/`) that risked accidental commit of local artifacts.
- No draft PR description or release notes prepared.
- No audit of whether sensitive data had been committed.

---

## Section 2 — After: What this round changed (visible + invisible)

### Visible to Alan (code changes that show up in the app)

| Phase | What changed | Why it matters for Alan |
|-------|-------------|------------------------|
| **A** — Run History panel | Table of the last 20 validation runs with sanitized evidence, blocked-reason text mapping, and a History navigation page. | Alan can now see what happened: which tests ran, what they decided, whether they were blocked. Before: no record at all. |
| **B** — Safety UX polish | Clearer labels in the browser operation rail: "Manual login required", "Inspect before fill", "Text fields only", "Manual review required". Success message now reads: "No Save/Submit/Update/Resolve/Close were performed." | The safety boundaries are now visible at a glance. Before: safety was built-in but easy to miss. |
| **C** — Local report export | Two new buttons on the History page: "Export as Markdown" and "Export as CSV". Pure browser download — no cloud, no API. | Alan can now save and share validation evidence. Before: no way to export anything. |

### Invisible to Alan (infrastructure, tests, docs)

| Phase | What changed | Why it matters |
|-------|-------------|----------------|
| **D** — Safety regression tests | Expanded from ~306 → **374 tests**, covering sanitized evidence mode and no-automation-implying UI wording. | Every future change runs against a larger safety net. |
| **E** — Release/PR readiness | Draft PR description, release checklist, status files produced. | Ready to merge — no last-minute scrambling for docs. |
| **F** — Privacy audit | 196 committed files manually scanned for ServiceNow URLs, sys_ids, emails, credentials, screenshots. **Clean — zero leaks.** Two `.gitignore` gaps found. | Assurance that no sensitive data has been committed. |
| **G** — E2E local demo regression | All 4 automated gates re-verified (build, typecheck, 374 tests, privacy). All workbench pages render correctly. | The code changes in A/B/C didn't break anything. |
| **H** — RC artifact refresh | Existing RC.1 zip verified valid (SHA256 unchanged, forbidden content audit PASS). No rebuild needed. | The Windows build artifact is still good — no need to rebuild and redistribute. |
| **J** — Gitignore remediation | `.codegraph/` and `.worktrees/` added to `.gitignore`. | Lowers risk of accidentally committing 1.2GB of worktree files or local CodeGraph databases. |

---

## Section 3 — Why the repeated test matters (honest answer)

The "repeated" test was **Phase G** — a regression pass after phases A–D landed code changes. Here is why it was not actually redundant:

1. **Phases A, B, C made real code changes** to `apps/desktop/src/App.tsx`, `styles.css`, and added new export functions. Any of these could have broken an existing test or rendering path.
2. **The regression verified nothing was broken** by running all 374 tests (not just the new ones) and manually inspecting all workbench pages.
3. **Without it**, Alan would be reviewing code that had never been re-verified end-to-end after changes.

The test *felt* repetitive because Alan did a launch-and-fill test — which only exercises the browser-autofill path. The code changes in this round were to **the workbench UI and history/export features**, not the autofill path. A launch-and-fill test was the wrong way to see those changes.

**What should NOT be repeated:**

- A manual validation round with no new visible features to exercise.
- A full E2E regression pass on code that has not changed.
- A launch-and-fill test as the sole validation method for UI-only changes.
- Another Phase-I-style approval matrix unless new code is added.

**What should be done differently next time:**

- If code only changes the UI (history panel, export, labels), validate by **opening the app and looking at the UI** — not by running autofill.
- If code only changes tests or docs, **skip the manual Windows test entirely** (it cannot catch doc errors).
- If the test purpose is regression, make that explicit: "This verifies nothing is broken — the test may look identical to last time."

---

## Section 4 — Gates (all pass — verified this session)

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | **PASS** | All 7 workspace projects build clean |
| `pnpm typecheck` | **PASS** | All TypeScript strict checks pass |
| `pnpm test` | **PASS** | 374 tests across 26 test files, all passing |
| `pnpm privacy:scan` | **PASS** | 202 tracked files, zero violations |

---

## Section 5 — Current branch state

| Property | Value |
|----------|-------|
| Branch | `next/product-clarity-demo-polish-20260605` |
| HEAD | `2e72e85` — "Phase J gate and artifact hygiene" |
| Base | `nightly/release-candidate-20260604` |
| Ahead of base | 5 commits |
| Tracked files | 202 |
| Gitignore gaps | Remediated — `.codegraph/` and `.worktrees/` now gitignored |

---

## Section 6 — What Alan should review next

**Priority order:**

1. [ ] **This packet** — understand what changed and why.
2. [ ] **Phase I approval matrix + draft PR body** at `docs/status/phase-I-approval-matrix-pr-packet-2026-06-05.md` — formal PR decision.
3. [ ] **Merge decision** — is this branch (`next/product-clarity-demo-polish-20260605`) ready to merge into `nightly/release-candidate-20260604`? The draft PR body from Phase I is copy-paste ready.
4. [ ] **Windows RC.1 double-click test** — the Windows RC.1 artifact (`dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip`) has never been tested on a clean Windows machine where WSL is not available. This is the highest-risk gap before production. The Phase H decision confirmed no rebuild is needed, so the existing zip can be used.
5. [ ] **Amber approvals** — the Phase I checklist requires three profile gates before any push/PR/merge: `codex-gpt55-control`, `sna-privacy-security`, `sna-pm-acceptance`. Not yet obtained.

---

## Section 7 — What Alan should NOT do again

| Action | Reason |
|--------|--------|
| Another launch-and-fill manual validation of UI-only changes | The autofill path did not change — launch-and-fill cannot validate UI/history/export work |
| Another full E2E regression pass on unchanged code | Redundant — Phase G already covered it |
| Another Phase-I-style approval matrix generation on the same scope | Would duplicate Phase I output |
| Another RC artifact SHA validation on same artifact | Phase H already confirmed it — SHA256 has not changed |

---

## Section 8 — Remaining risks (honest)

| Risk | Severity | Status |
|------|----------|--------|
| Windows RC.1 zip not double-click tested on clean Windows | **HIGH** | Untested — WSL-only validation so far |
| No PR open for this branch | MEDIUM | Draft body exists; Amber approvals not yet obtained |
| No Amber profile gates have run yet | MEDIUM | Required before any merge action |
| Export is browser-only (no CLI/headless mode) | LOW | Intentional — desktop app focus |
| History is ephemeral (cleared on page refresh) | LOW | Intentional — privacy-first design |

---

## Section 9 — Final verdict

**NOT MERGE-READY.**  

All 4 automated gates pass. The code changes (history panel, safety UX, export) are implemented, tested, and verified. The gitignore gaps are remediated.

However, merging requires:

1. Alan's explicit decision on this packet.
2. Three Amber profile approvals (`codex-gpt55-control`, `sna-privacy-security`, `sna-pm-acceptance`).
3. Alan's decision on the Windows double-click test gap (accept or require before merge).

This packet does **not** declare release-ready. It documents what changed, why the repeated test mattered, and what Alan should decide next.

---

*Prepared by Phase M — Product-owner before/after review packet. 2026-06-05.*
