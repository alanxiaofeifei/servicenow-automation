# GPT-5.5 Pro Review Prompt — Browser Profile Isolation Before Second QA Launch

## Role

You are GPT-5.5 Pro acting as an independent safety and architecture reviewer for Alan's ServiceNow Automation Workbench.

Alan is building a safety-first ServiceNow automation portfolio/work tool. Hermes acts as project manager/gatekeeper, Codex CLI is the primary coding worker, GPT-5.5 Pro provides checkpoint review, and Alan is the final owner/acceptance reviewer.

## Review verdict requested

Return one of:

```text
READY FOR SECOND QA NO-WRITE LAUNCH
READY WITH CONDITIONS
NO-GO
```

This checkpoint is **not** asking for approval of any write action. It is only asking whether a second QA/dev no-write controlled browser launch is safe after the browser profile-isolation blocker has been fixed.

## Background

Issue #24 implemented `sda browser launch` for QA/dev no-write controlled browser launch.

Issue #25 reviewed the first QA/dev no-write controlled browser session and returned **Ready with conditions**.

Issue #26 tracked the first QA no-write field trial. Alan confirmed QA landing/home page reachability, but a serious safety finding occurred:

- Launching Windows Chrome from WSL opened Alan's existing/default Windows Chrome profile.
- Chrome reused Alan's current demo customer login state.
- Alan did not type credentials.
- This means the intended isolated browser profile was **not proven** for the Windows Chrome launch path.
- Alan must **not** run `sda browser reset --mode qa` for that session because it might affect his normal work browser/profile.

Issue #27 is the blocker: verify/fix isolated browser profile behavior for WSL-launched Windows Chrome or choose a safer strategy.

## Safety boundaries that remain in force

The second QA/dev browser launch may only do:

```text
Open controlled browser
→ manual login if needed
→ observe landing/home page only
→ no DOM automation
→ no field fill
→ no Save / Submit / Update / Close
→ close browser
→ reset only the proven project-owned isolated profile if appropriate
```

Still forbidden:

- DOM automation
- form field fill
- page content capture
- page title/current URL metadata capture unless separately reviewed
- screenshots / HAR / trace / ServiceNow page recording
- real Incident form navigation
- Save / Submit / Update / Close
- Create Change / Upload / Send Email
- production-shadow
- external AI using real ServiceNow content

## Files and artifacts to inspect

Please inspect the final implementation for #27, especially:

1. `packages/adapters/src/browser-session.ts`
2. `packages/adapters/src/browser-session.test.ts`
3. `apps/cli/src/cli.ts`
4. `apps/cli/src/cli.test.ts`
5. `packages/profiles/src/target-url.ts`
6. `packages/profiles/src/service-now-environments.ts`
7. `.gitignore`
8. `docs/field-trial/qa-dev-no-write-browser-launch.md`
9. Any new runbook or docs created for profile isolation
10. GitHub issues #26 and #27 comments

## Required evidence before approving second launch

Confirm that all of these are true:

1. The browser profile used for QA/dev launch is project-owned and isolated.
2. The launch path cannot silently reuse Alan's default Windows Chrome profile.
3. The profile path passed to Windows Chrome from WSL is valid for Windows Chrome, not an ignored/unsupported WSL-only path.
4. If Windows Chrome profile isolation cannot be guaranteed, the CLI fails closed and explains the safe alternative.
5. `browser reset --mode qa` cannot delete or corrupt Alan's default Chrome/Edge profile.
6. The reset target is constrained to a project-owned ignored directory such as `.local/servicenow-browser-profiles/<mode>` or another explicitly verified safe path.
7. Dry-run remains the default.
8. Real launch still requires both `--execute` and `--confirm-no-write-launch`.
9. Production shadow remains blocked.
10. No Save/Submit/Update/Close/write action is implemented or enabled by the profile-isolation fix.
11. No ServiceNow page screenshot, HAR, trace, storage state, cookies, or customer/ticket data is committed.
12. `pnpm build`, `pnpm typecheck`, and `pnpm test` pass.
13. Independent pre-commit review passed.

## Questions to answer

1. Is the root cause of the first field-trial profile leakage adequately understood?
2. Is the chosen fix safe for Alan's Windows/WSL environment?
3. Is there any remaining risk that Windows Chrome will attach to or modify Alan's default browser profile?
4. Is `browser reset` safe after the fix?
5. Should the second QA launch use Windows Chrome, Windows Edge, Linux Chromium inside WSL, or a dedicated portable browser strategy?
6. Are the CLI warnings/help text clear enough for Alan to avoid accidental default-profile usage?
7. Are there tests for the WSL/Windows path conversion or fail-closed behavior?
8. Are there any blockers before the second QA no-write launch?

## Expected output format

Please respond with:

```markdown
# Verdict: READY FOR SECOND QA NO-WRITE LAUNCH / READY WITH CONDITIONS / NO-GO

## Summary

## Blocking issues

## Conditions before second launch

## Profile isolation assessment

## Reset safety assessment

## No-write boundary assessment

## Recommended second field-trial script

## Final recommendation
```

Remember: this checkpoint cannot approve any ServiceNow write action. It can only approve or reject the second QA/dev no-write controlled browser launch after profile isolation has been fixed.
