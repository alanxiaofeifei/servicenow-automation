# Windows Dedicated Chromium Runtime Strategy

## Status

Architecture note for issue #31, updated after the persistent QA browser profile slice.

This document replaces the temporary WSL Linux Chrome field-trial path as the preferred product direction.

## Decision

The product should use a dedicated browser runtime and a tool-owned persistent QA/dev profile. It must never depend on or modify the user's daily Chrome/Edge profile. Login remains human-owned; the dedicated tool profile may retain ServiceNow saved sign-in between launches.

## Why not WSL Linux Chrome as the main path?

Linux Chrome in WSL was useful to prove one thing: a separate browser/profile avoids Alan's daily work Chrome profile.

It is not the final product direction because:

- Alan's WSL terminal is not reliably GUI-capable.
- The target users are Windows desktop users.
- A Windows desktop app should launch a Windows browser runtime.
- Product behavior must not depend on WSLg, X server, DISPLAY, or Linux GUI state.

## Why not normal installed Chrome/Edge?

The app must not use the user's daily installed browser profile because that can:

- reuse existing corporate login state without explicit intent
- mix tool sessions with personal/work browsing sessions
- risk deleting/corrupting daily profile data if reset is implemented incorrectly
- make field-trial results ambiguous because login/profile isolation is not proven

Blocked as product runtime by default:

- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- `C:\Program Files\Microsoft\Edge\Application\msedge.exe`
- `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- WSL-mounted equivalents under `/mnt/<drive>/...`

These paths may exist on the system, but they should not be treated as the dedicated tool browser runtime.

## Target runtime model

Preferred model:

```text
ServiceNow Automation App
  -> dedicated / bundled / portable Chromium runtime
  -> tool-owned persistent profile directory
  -> user-controlled login with saved sign-in reuse
  -> no password storage
  -> cleanup on close and/or explicit safe reset
```

Example runtime roots:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe
%LOCALAPPDATA%\ServiceNowAutomation\Profiles\qa\qa-autofill-cdp\
%LOCALAPPDATA%\ServiceNowAutomation\Profiles\dev\qa-autofill-cdp\
```

The exact path can change, but the invariants must not.

## Invariants

A Windows browser launch is allowed only when all are true:

1. Browser executable is a dedicated/tool-owned Chromium runtime, not daily Chrome/Edge.
2. Browser profile directory is tool-owned.
3. Browser profile directory is outside the user's normal Chrome/Edge profile roots.
4. Browser profile directory is persistent for the mode/purpose but explicitly resettable.
5. Dry-run remains default.
6. Real launch requires explicit confirmation.
7. Login remains user-controlled; saved sign-in can be reused from the dedicated profile.
8. No DOM automation or page capture is enabled by launch.
9. No write actions are enabled by launch.
10. Cleanup/reset can only delete tool-owned profile directories.

## Tool-owned profile validation

Reset/cleanup must fail closed unless the target is under an approved tool-owned root such as:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Profiles\
```

Reset/cleanup must never target:

```text
%LOCALAPPDATA%\Google\Chrome\User Data\
%LOCALAPPDATA%\Microsoft\Edge\User Data\
%APPDATA%\Mozilla\Firefox\Profiles\
```

## Optional CloakBrowser runtime channel

CloakBrowser can be used as an optional dedicated Chromium runtime, but only as a binary downloaded on the operator machine from official CloakHQ/GitHub release URLs. The compiled binary license allows internal use but does not allow redistributing, repackaging, or embedding the binary into third-party artifacts without a separate OEM/SaaS license.

The project therefore supports this non-vendored runtime root in addition to the generic Chromium root:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser\chrome.exe
```

The helper still uses tool-owned profiles and no-write/user-controlled-login boundaries. CloakBrowser's Playwright/Puppeteer wrapper is not part of the current runtime path because the current safety model avoids browser-owned DOM automation. See `docs/field-trial/cloakbrowser-runtime-assessment.md` for the installer command and license notes.

## Session policy options

### Option A — legacy per-launch fresh profile (superseded)

- Create a fresh profile directory per launch.
- User-controlled login every time.
- Delete profile after browser close or explicit cleanup.

Originally best for safety/demo clarity, but superseded for the QA field-trial flow because it forces repeated login.

### Option B — per-mode profile with explicit reset

- Use one profile directory per environment mode.
- Manual login may persist until reset.
- Reset button clears the mode profile.

More convenient, but higher risk because sessions persist.

### Current product behavior

Use **Option B** for QA/dev field trials:

```text
persistent profile per mode/purpose
user-controlled login
saved sign-in can persist until explicit safe reset
```

The no-write boundary is unchanged by profile persistence.

## No-write boundary

Browser launch is not a write action, but it must remain separated from all ServiceNow operations.

Still forbidden at runtime-launch stage:

- automatic login
- credential storage
- DOM automation
- Playwright page inspection
- page text extraction
- page title/current URL metadata capture
- screenshot / HAR / trace / video
- storage-state / cookie / session export
- field fill
- Save / Submit / Update / Resolve / Close
- Create Change / Upload Attachment / Send Email
- external AI with real ServiceNow content
- production-shadow

## Testing strategy

Before any real QA login field trial:

1. Unit-test path classification:
   - block daily Chrome paths
   - block daily Edge paths
   - block WSL `/mnt/<drive>/...` launch paths from Linux code
   - allow only dedicated/tool-owned Chromium runtime paths
2. Unit-test profile root validation:
   - allow tool-owned profile roots
   - block user Chrome/Edge profile roots
   - block parent traversal
   - block ambiguous relative paths
3. Dry-run smoke test:
   - no browser process launched
   - no query/hash in preview
   - no userinfo in URL
   - no write actions enabled
4. Real launch smoke test without ServiceNow:
   - open `about:blank` or a safe local page
   - confirm profile starts blank
   - confirm close/cleanup only removes tool-owned directory
5. GPT-5.5 Pro checkpoint before any Windows Chromium QA login.

## Migration from current WSL CLI behavior

Current Linux behavior should remain strict:

- On Linux/WSL, `.exe` and `/mnt/<drive>/...` executable paths remain blocked.
- This prevents accidentally launching Windows daily Chrome from WSL.

Windows dedicated Chromium support should be implemented as a separate Windows-native strategy, not by weakening the existing WSL fail-closed rule.

## Open questions for implementation

1. Do we bundle Chromium with Electron, download a portable runtime, or require the user to provide a dedicated portable Chromium path?
2. Where should the app store the dedicated runtime on Windows?
3. How should the app detect that a Chromium executable is tool-owned?
4. Should profile cleanup be automatic on close, explicit, or both?
5. How should failed cleanup be reported without leaking local paths unnecessarily?
6. What is the safest first Windows runtime test that does not touch ServiceNow?

## Non-goals

This issue does not implement:

- ServiceNow DOM automation
- ticket reading
- ticket writing
- AI over ServiceNow content
- production-shadow
- credential vault integration
- persistent enterprise deployment policy
