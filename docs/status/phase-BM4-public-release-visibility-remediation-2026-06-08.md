# Phase BM4 — Public-release visibility remediation and anonymous-access verification

Date: 2026-06-08 02:16 CST (+0800)
Task: BM4 — public-release visibility remediation and anonymous-access verification
Workspace: `/home/alanxwsl/projects/servicenow-automation`
Predecessor: BM3 (`t_b1b6fd30`)

## Scope

BM3 found that the GitHub Release existed but the repository was still PRIVATE, causing anonymous release-page and asset access to return HTTP 404. BM4 was limited to resolving that GitHub visibility mismatch and verifying anonymous access after the change.

No ServiceNow login, browser operation, ServiceNow API write, Microsoft Graph/Excel Web write, attachment upload, Teams/Outlook/phone ingestion, or Save / Submit / Update / Resolve / Close automation was performed.

No real customer/ticket/browser/session data was added to this document.

## Remediation performed

Repository visibility was changed from PRIVATE to PUBLIC for `alanxiaofeifei/servicenow-automation` using the authenticated GitHub administrative account assigned to this workspace.

Read-back verification after the change:

| Check | Result |
|---|---|
| Repository visibility | PUBLIC |
| `isPrivate` | false |
| Default branch | main |
| Release tag | `v0.1.0` |
| Release state | non-draft, non-prerelease |

Rollback note: if Alan decides the repository should not remain public, the administrative rollback is to change repository visibility back to PRIVATE. That would make the release page and assets authenticated-only again.

## Anonymous-access verification

Anonymous verification was performed with `curl` from an empty temporary HOME and with curl config disabled, not with `gh` or browser/session credentials.

| Anonymous check | Result |
|---|---|
| Release page for `v0.1.0` | HTTP 200 |
| ZIP release asset | HTTP 200 |
| SHA256 sidecar release asset | HTTP 200 |
| ZIP size | 118,610,088 bytes |
| SHA256 sidecar size | 123 bytes |
| `sha256sum -c` against anonymous downloads | PASS |

Release asset names verified:

- `servicenow-automation-windows-v0.1.0-public-20260607.zip`
- `servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256`

Expected ZIP SHA256:

`e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692`

## BM3 finding status

BM3's critical finding is now remediated: the release is no longer a private-repo-only release, and anonymous users can reach the release page and download both release assets.

The remaining BM3 note still stands: clean-machine Windows validation is not covered by BM4 and still requires Alan's manual download / checksum / extract / double-click validation on a clean Windows machine.

## Final BM4 verdict

BM4 PASS for release publicness:

1. Repository visibility is PUBLIC.
2. Release `v0.1.0` is reachable anonymously.
3. Both release assets are reachable anonymously.
4. The anonymous ZIP download matches the published SHA256 sidecar.

BM4 did not perform or validate any ServiceNow live workflow.
