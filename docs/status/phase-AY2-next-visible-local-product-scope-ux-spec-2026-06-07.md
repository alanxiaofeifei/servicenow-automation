# Phase AY2 — Cumulative Phase Artifact Cleanup — UX / Copy Spec

Date: 2026-06-07 • Status: design/spec only • Privacy: sanitized local-only

## Preflight
Goal: make the cleanup surface calm and exact; preserve AY1 scope; do not change behavior. Known facts: current ax6 package = `servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip`, SHA256 `8cd0c9b74b0ad4d2fa67efb073f2c016ae9baaedfa10314de53c3e0101036647`, size `118,603,008`, mtime `2026-06-07 15:26:23 +0800`, aliases `AW5 AV6 AU6 AT6 AS6 AR3 AQ6`.

## 1) Exact copy Alan should see first
`Current package: AX6 local Windows package` • `Path: /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` • `SHA256: 8cd0c9...06647` • `Phase: AX6` • `Older aliases are archival only.`

## 2) START-HERE-WINDOWS.txt refresh copy
Use a local-only opener: “Read this first. Use the AX6 ZIP only. Do not open a real ServiceNow instance. Do not Save / Submit / Update / Resolve / Close. Three-card flow: Handoff → Hygiene → Worktree Acceptance. If startup fails, copy only visible sanitized error text.” Preserve the existing safety warnings verbatim in spirit, but replace generic/package-stale wording with AX6/current-package wording.

## 3) Clean-machine validation guide structure (`docs/test/windows-clean-machine-validation-2026-06-07.md`)
Sections: purpose, prerequisites, package location, validation steps, failure modes, record/avoid. P0 criteria + expected results: 1) app double-clicks open a visible window; 2) startup failures show a sanitized overlay; 3) Start QA Chromium visibly launches; 4) CDP readiness becomes visible; 5) Verify current Incident enables only after CDP readiness; 6) Verify-only stays read-only; 7) three-column workbench is visible and simplified; 8) package-path / checksum / mtime match the current AX6 artifact.

## 4) State matrix + disabled reasons
Loading → show “Package metadata is still loading.”; Fresh → current package available, actions enabled; Dirty → diff review needed, “Review the current diff first.”; Reviewed → “Already reviewed locally.”; Accepted → reviewed state locked. Buttons should always explain why they’re disabled.

## 5) Stale display strings to fix in UI cards
Release Readiness Handoff: replace `Loading current AR3 package SHA256...` and `current AR3 metadata`; Worktree Acceptance: replace `Local only · AR3 is current · Older aliases are archival only`, `Current AR3 package path:`, `Loading current AR3 package path...`, `Current: AR3 local Windows package`, `The current acceptance surface always points at AR3.`, and AR3 checklist copy. Repo Hygiene: no old-package literal found in the reviewed snippet; keep it generic/local-only.

## 6) Allowed touch surface for later implementation/QA
`apps/desktop/src/App.test.ts` (rename `currentAr3PackageMetadata` → `currentPackageMetadata`), `apps/desktop/src/App.tsx` and `styles.css` only for the above copy strings, `docs/test/windows-clean-machine-validation-2026-06-07.md`, and the packaged START-HERE copy. No layout refactor, no ServiceNow write behavior, no new IPC.

## 7) Manual checklist for Alan
Confirm the package path is the first thing visible, the three-card flow is explicit, the validation guide names all 8 P0 checks, archived aliases are visibly archival only, and no text suggests real ServiceNow writes or external uploads.

## 8) Mockups
No GPT Images 2 artifact attached this turn; image generation was attempted twice with sanitized prompts but the service returned a failure, so the spec is text-only.