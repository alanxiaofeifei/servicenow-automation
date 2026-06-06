# Overnight Current State — 2026-06-04

## Snapshot
| Property | Value |
|---|---|
| **Branch** | main (target: `nightly/release-candidate-20260604`) |
| **Version** | 0.1.0 |
| **Branch created** | Not yet — branch will be created when phase workers start |
| **Working directory** | `/home/alanxwsl/projects/servicenow-automation` |
| **Package manager** | pnpm@9.15.4 |

## Release artifacts
| Artifact | Exists |
|---|---|
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` | Yes |
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` | Yes |
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` | Yes |
| Draft release notes (`docs/releases/windows-v0.1-rc-draft-release-notes.md`) | Yes |
| RC plan (`docs/releases/windows-v0.1-rc-plan.md`) | Yes |
| Manual test checklist (`docs/releases/windows-v0.1-rc-manual-test.md`) | Yes |

## Build/test status (known)
| Check | Status |
|---|---|
| `pnpm build` | Last passed in prior sessions |
| `pnpm typecheck` | Last passed in prior sessions |
| `pnpm test` | Last passed in prior sessions |
| `pnpm privacy:scan` | Last passed in prior sessions |
| Actual current status | Unknown — needs re-run from `nightly/release-candidate-20260604` |

## Code structure
| Area | Status |
|---|---|
| **Core models** (`packages/core/src/models/`) | Existing — `SourceType`, `CapturedContext`, `TicketDraft`, `KnowledgeArticle` defined |
| **Core schemas** (`packages/core/src/schemas/`) | Existing — Zod validation |
| **Source adapters** (`packages/core/src/source-adapters.ts`) | Does not exist — needs creation (Phase 3) |
| **KB package** (`packages/kb/`) | Existing — demo articles, local directory, search |
| **Desktop app** (`apps/desktop/`) | Existing — Electron app with React frontend |
| **CLI** (`apps/cli/`) | Existing |
| **Adapters** (`packages/adapters/`) | Existing — browser session, manual paste, qa-autofill-runtime |
| **AI package** (`packages/ai/`) | Existing — mock provider, redaction gate, deepseek provider |
| **Profiles** (`packages/profiles/`) | Existing — profile service, SN environments |

## Architecture docs
| Doc | Exists |
|---|---|
| `docs/architecture.md` | Yes — recommended structure, core services, adapter boundaries |
| `docs/architecture/intake-adapters.md` | No — needs creation (Phase 3) |
| `docs/architecture/kb-plugin.md` | No — needs creation (Phase 4) |
| `docs/architecture/reporting.md` | No — needs creation (Phase 5) |

## Reviews
| Review | Exists |
|---|---|
| `docs/reviews/2026-05-19-qa-dev-field-trial-readiness-review.md` | Yes — Ready with conditions |
| Post-M5 regression audit (Phase 1) | No — assigned to Phase 1 |
| `docs/reviews/post-m5-regression-audit-2026-06-04.md` | No |

## Demo/interview material
| Item | Exists |
|---|---|
| `docs/demo/field-trial-demo-flow-script.md` | Yes — 3–5 min script |
| `docs/zh-CN/demo-script.md` | Yes — Chinese version |
| `docs/zh-CN/user-guide.md` | Yes — Chinese user guide |
| `docs/zh-CN/feature-introduction.md` | Yes — Chinese feature intro |
| `docs/en-US/demo-script.md` | Yes — English demo script |
| `docs/en-US/user-guide.md` | Yes — English user guide |
| Interview pitch (`docs/interview/`) | No — needs creation (Phase 6) |

## Windows scripts
| Script | Exists |
|---|---|
| `scripts/windows/Start-ServiceNow-Automation.cmd` | Yes — double-click launcher |
| `scripts/windows/prepare-chrome-for-testing.ps1` | Yes |
| `scripts/windows/start-dedicated-chromium-cdp.ps1` | Yes |
| `scripts/windows/evaluate-local-cdp-expression.ps1` | Yes |
| `scripts/windows/install-cloakbrowser-runtime.ps1` | Yes |
| `scripts/wsl/start-desktop.sh` | Yes |
| `scripts/wsl/repair-env.sh` | Yes |
| `scripts/wsl/operator-env.sh` | Yes |
| `scripts/wsl/packaging-preflight.sh` | Yes |

## Privacy/safety gate
| Item | Exists |
|---|---|
| `scripts/privacy_scan_tracked.py` | Yes |
| `docs/security-and-compliance.md` | Yes |
| External AI redaction gate (`docs/field-trial/external-ai-redaction-gate.md`) | Yes |

## Key files for Phase 1 audit
| File | Path |
|---|---|
| Desktop main | `apps/desktop/electron/main.ts` |
| Preload | `apps/desktop/electron/preload.ts` |
| Desktop App | `apps/desktop/src/App.tsx` |
| Desktop tests | `apps/desktop/src/App.test.ts` |
| CLI | `apps/cli/src/cli.ts` |
| CLI tests | `apps/cli/src/cli.test.ts` |
| QA autofill runtime | `packages/adapters/src/qa-autofill-runtime.ts` |
| QA autofill runtime tests | `packages/adapters/src/qa-autofill-runtime.test.ts` |
| QA browser autofill | `packages/core/src/qa-browser-autofill.ts` |
| QA browser autofill tests | `packages/core/src/qa-browser-autofill.test.ts` |
| Field trial runbook | `docs/field-trial/qa-dev-text-field-autofill-execution-runbook.md` |

## Phase plan
```
Phase  | Description                    | Owner                  | Depends on
-------|--------------------------------|------------------------|-----------
0      | State capture (this doc)       | sna-orchestrator       | —
1      | Post-M5 regression audit       | sna-qa-acceptance      | —
2      | Windows RC packaging/release   | sna-windows-runtime    | — (independent)
3      | Intake connector foundation    | sna-frontend-workbench | —
4      | KB plugin & support group rec  | sna-servicenow-form    | —
5      | Local reporting polish         | sna-frontend-workbench | Phase 3, Phase 4
6      | Demo & interview package       | sna-release-docs       | Phase 1–5
7      | Final RC review                | codex-gpt55-control    | Phase 1–6
```

## Blockers
- **No overnight red-zone actions permitted** — real ServiceNow login, API write, browser DOM autofill on live pages, Save/Submit/Update/Resolve/Close are blocked overnight
- **Branch not yet `nightly/release-candidate-20260604`** — workers will create/switch when they start
- **Current build/typecheck/test/privacy scan status unknown** — will be verified during Phase 2 and Phase 7
- **Existing RC artifacts from prior build** — will be re-verified in Phase 2

## Safety notes
- Green zone: code edits, tests, docs, packaging dry-run — fully autonomous
- Amber zone: requires profile-level approval for merge/tag/PR/artifact
- Red zone: hard stop — no overnight real ServiceNow activity
- All child tasks will enforce these boundaries via their task body
