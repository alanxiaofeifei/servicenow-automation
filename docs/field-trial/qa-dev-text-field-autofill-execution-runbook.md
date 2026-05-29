# Real QA/dev Text-Field Autofill-Only Execution Runbook

## Purpose

This runbook defines the reviewed, human-supervised sequence for the first real QA/dev single-ticket text-field autofill-only execution.

It exists because GPT-5.5 Pro returned **READY WITH CONDITIONS** for checkpoint `SDA_PRE_REAL_QA_AUTOFILL_EXECUTION_CHECKPOINT_2026_05_23` in issue #90. The verdict is conditional: it permits preparation for a tightly controlled QA/dev autofill-only execution, not immediate unrestricted browser automation.

## Non-authorization statement

This runbook does **not** authorize:

- unattended execution,
- agent-controlled login or ServiceNow navigation,
- Save, Submit, Update, Resolve, Close,
- button click automation,
- attachment upload,
- outbound email or notification-triggering action,
- ServiceNow REST/API write,
- bulk fill or batch mode,
- production,
- production-shadow,
- external AI over real QA/ServiceNow content,
- browser artifact capture.

Autofill approval authorizes only DOM text-field fill for the three allowed fields listed below, and only after every condition in this runbook passes.

## WSL CLI cannot perform live CDP execution

The WSL 2 NAT barrier means `127.0.0.1` in WSL is NOT the same as `127.0.0.1` on Windows. The WSL CLI (`sda qa autofill-runtime --cdp-endpoint ...` and `sda qa default-plan --cdp-endpoint ...`) is blocked from creating live CDP drivers.

The WSL CLI supports only:
- planning (`sda qa default-plan --field-source fixture`),
- fixture (`sda qa autofill-fixture`),
- dry-run (`sda qa autofill` and `sda qa manual-fill --dry-run`).

Live CDP autofill/inspection requires the **Windows-side Electron operator** (double-click `sda-desktop.cmd`). The Electron main process owns the CDP endpoint in-memory (loopback-only, never exposed to the renderer). It launches the dedicated Chromium runtime on Windows, where `127.0.0.1` correctly points to the Windows CDP debugging port.

Do not attempt to bridge WSL and Windows CDP via `0.0.0.0` binding, gateway IPs, or port forwarding. GPT-5.5 Pro verdict: do not fix the WSL bridge.

## Allowed fields

Only these fields may be filled:

1. Short description
2. Description
3. Work notes

Forbidden fields include requester/caller, assignment group, configuration item, category, subcategory, location, impact, urgency, priority, state, status, routing/reference/select fields, and customer-visible comments.

## Phase 0 — Local gates

Run immediately before any real QA/dev browser autofill attempt:

```bash
git status --short
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
```

Stop if:

- there are staged/tracked sensitive artifacts,
- any gate fails,
- the branch is not the reviewed execution-slice branch or synced `main`,
- `.local/`, browser profiles, storage-state, screenshots, traces, HAR, videos, or cookies appear in tracked changes.

## Phase 1 — Local fixture smoke

Happy path fixture:

```bash
pnpm --filter @servicenow-automation/cli --silent sda qa autofill-fixture \
  --mode qa \
  --template vpn_issue \
  --user "Demo requester A" \
  --summary "Fake Chat intake — VPN connection issue after password or MFA change" \
  --qa-isolation-confirmation "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team." \
  --dedicated-profile-confirmation "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile." \
  --approval-phrase "PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED" \
  --selector-fixture all-found \
  --json
```

Then run fail-closed fixture cases:

- `missing-work-notes`
- `wrong-description-type`
- `ambiguous-description`
- `non-writable-work-notes`
- `unexpected-required-field`

Expected results:

- `all-found` reaches `ready-for-autofill` and local fixture `execution.status=completed`.
- Every negative case blocks before fill.
- No output echoes the approval phrase, raw field values, QA/dev URL, ticket identifier, sys_id, page HTML, cookies, sessions, screenshots, HAR, traces, or runnable browser snippets.
- `browserProcessLaunched=false`, `realServiceNowPageTouched=false`, and `writeActionsAttempted=false` for every fixture result.

## Phase 2 — Human-supervised browser preparation

Alan manually performs these steps. The agent/tool must not perform them:

1. Open the dedicated/tool-owned Chromium profile.
2. Manually log in.
3. Manually navigate to the authorized QA/dev Incident form.
4. Manually confirm the environment is QA or dev.
5. Manually review the page before any tool selector verification.
6. Manually decide whether to continue or stop.

Stop if:

- the environment identity is unclear,
- production or production-shadow is possible,
- the browser is not the tool-owned dedicated profile,
- QA isolation cannot be confirmed,
- the page already contains real customer/requester/ticket content that would need to be copied into logs, prompts, screenshots, or external tools.

Required spoken/recorded confirmations before continuing:

```text
Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.
```

```text
QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.
```

## Phase 3 — Runtime selector verification only

Before any field fill, the tool may verify only the three allowlisted controls. It must not click buttons, save, submit, update, close, upload, send, call APIs, capture artifacts, or read/export auth/session state.

Each allowed field must satisfy all of these checks:

- exactly one matching control,
- writable,
- expected element type,
- expected field identity,
- no duplicate,
- no ambiguous selector,
- no unexpected required field,
- reviewed page has not reloaded or changed since approval.

Expected element types for the first slice:

- Short description: text input
- Description: textarea
- Work notes: textarea

Stop if any check fails. Do not guess selector intent or fall back to fuzzy matching.

## Phase 4 — Approval phrase freshness

The approval phrase is valid only for the currently reviewed field screen.

If the page reloads, navigation occurs, form content changes, tab changes, ticket changes, or selector verification sees a different page fingerprint after approval, the approval is stale and must be requested again.

QA phrase:

```text
PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED
```

Dev phrase:

```text
PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED
```

A Save/Submit/Update/Resolve/Close phrase does not approve autofill. An autofill phrase does not approve Save/Submit/Update/Resolve/Close.

## Phase 5 — Text-field autofill only

If all previous phases pass, the tool may fill only:

- Short description
- Description
- Work notes

Immediately after filling the three text fields, the tool must stop and show:

```text
Autofill completed. Review manually. Tool will not Save, Submit, Update, Resolve, or Close.
```

No Save/Submit/Update/Resolve/Close action may be represented as an operation, selector, fallback, UI affordance, hidden flag, or command path in this execution slice.

## Phase 6 — Human review and sanitized outcome

Alan manually reviews the page. The tool records only a sanitized outcome.

Allowed outcome values:

- `completed`
- `blocked`
- `stopped`
- generic field classes worked or failed
- stopped before Save/Submit/Update/Resolve/Close
- generic stop reason
- no artifacts captured

Forbidden outcome content:

- raw QA/dev URL,
- ticket identifier,
- sys_id,
- requester/customer/internal text,
- exact real field values,
- page title,
- page HTML,
- screenshots,
- HAR,
- traces,
- recordings,
- storage-state,
- cookies,
- sessions,
- credentials,
- external AI prompt content derived from real QA/ServiceNow data.

## Required independent review before first real execution

Before Alan runs the first real QA/dev text-field autofill-only trial, the execution-slice PR/diff must receive an independent review that checks:

- no Save/Submit/Update/Resolve/Close selectors/actions exist,
- only the three text fields are allowlisted,
- reference/select/status/routing/customer-visible fields are denied,
- selector mismatch fails closed,
- page reload/change invalidates approval,
- production/prod-shadow is denied,
- CLI/UI/log output remains sanitized,
- browser artifact capture remains disabled,
- no external AI receives real QA/ServiceNow content.

## Stop summary

If uncertain, stop. The safe result is a blocked/stopped sanitized note, not a best-effort fill.
