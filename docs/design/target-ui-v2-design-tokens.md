# Target UI v2 token extraction

Source reference: `docs/design/operator-workbench-v2-target-image-spec.md`

This file records the implementation tokens used for the K6I4 target UI alignment. Values are also stored in `docs/design/target-ui-v2-design-tokens.json` and mapped into CSS variables with the `--sna-` prefix.

## Extraction method

- Tokenized the sanitized text design specification so screenshot artifacts are not required or tracked.
- Verified prominent flat UI regions with local browser visual inspection.
- Used the measured palette for the warm/default target theme and preserved contrast and layout behavior.
- No ServiceNow URLs, credentials, record identifiers, tokens, cookies, sys_id values, or other secrets were extracted or stored.

## Core color tokens

| Token | CSS variable | Value | Usage |
| --- | --- | --- | --- |
| Background | `--sna-bg` | `#f8f7f3` | App background |
| Surface | `--sna-surface` | `#fefefd` | Panels and cards |
| Soft surface | `--sna-surface-soft` | `#fbf8f1` | Nested rows and controls |
| Border | `--sna-border` | `#e8e2d8` | Card/control borders |
| Divider | `--sna-divider` | `#e3ddd2` | Stronger separators |
| Primary text | `--sna-text` | `#1c1c1c` | Main text |
| Secondary text | `--sna-text-secondary` | `#55534e` | Labels/helper copy |
| Muted text | `--sna-text-muted` | `#8c877e` | Disabled/low emphasis |
| Brand green | `--sna-brand` | `#3e8f4f` | Selection/accent |
| Success green | `--sna-success` | `#2e703b` | Safe primary actions |
| Success soft | `--sna-success-soft` | `#e7f3e9` | Success/selected chips |
| Amber | `--sna-amber` | `#da871c` | Environment/status accent |
| Amber soft | `--sna-amber-soft` | `#f7e8ce` | Environment/status chip background |

## Radius and shadow tokens

| Token | CSS variable | Value |
| --- | --- | --- |
| Card radius | `--sna-radius-card` | `14px` |
| Panel radius | `--sna-radius-panel` | `18px` |
| Chip radius | `--sna-radius-chip` | `999px` |
| Soft shadow | `--sna-shadow-soft` | `0 12px 28px rgba(41, 33, 22, 0.08)` |
| Floating shadow | `--sna-shadow-float` | `0 22px 54px rgba(41, 33, 22, 0.14)` |

## Layout tokens

| Token | CSS variable | Value |
| --- | --- | --- |
| Icon rail | `--sna-icon-rail-width` | `72px desktop / 52px collapsed compact` |
| Left sidebar | `--sna-sidebar-width` | `292px desktop / 246px compact / 0px collapsed` |
| Runtime rail | `--sna-runtime-rail-width` | `328px expanded / 58px collapsed` |
| Layout gap | `--sna-layout-gap` | `12px` |
| Desktop breakpoint | n/a | `1281px` |
| Collapse breakpoint | n/a | `980px` |

## Safety notes

The token changes only affect presentation. Runtime gates remain unchanged:

- Start QA Chromium remains the first runtime action.
- Verify current Incident still requires sanitized CDP readiness.
- Autofill current Incident still requires verification and approved text-field gating.
- Production remains read-only in this workbench.
