# Source Build · Wave Roadmap

| Wave | Title | Status | Branch | PR | Merged |
|---|---|---|---|---|---|
| S0 | Audit & Plan | ✅ shipped | `source/wave-S0/audit-plan` | #531 | 2026-04-27 |
| S1 | Shell convergence + token refresh | ✅ shipped | `source/wave-S1/shell-convergence` | #545 | 2026-04-28 |
| S2 | Index pages refresh | ✅ shipped | `source/wave-S2/index-pages-refresh` | #555 | 2026-04-27 |
| S3 | Event canvas refresh | ✅ shipped | `source/wave-S3/event-canvas-refresh` | #563 | 2026-04-27 |
| S4 | Sub-routes refresh | ✅ shipped | `source/wave-S4/sub-routes-refresh` | #565 | 2026-04-27 |
| S5 | Commercial-intel convergence | ✅ shipped | `source/wave-S5/commercial-intel-convergence` | #567 | 2026-04-27 |
| S6a | Cross-surface storyline + states | ✅ shipped | `source/wave-S6a/cross-surface-states` | #568 | 2026-04-27 |
| S6b | Intake flow wizard | 🟡 in-progress | `source/wave-S6b/intake-flow` | — | — |

## Catalog entries shipped per wave

| Wave | Catalog entries |
|---|---|
| S0 | Docs only |
| S1 | Chrome only — all routes wrapped in AppShell |
| S2 | SRC-IDX-DEFAULT · SRC-IDX-EVENTS · SRC-IDX-VALUE · AbarVaLogo stub · nav-shell test alignment |
| S3 | SRC-DTL-CANVAS |
| S4 | SRC-DTL-SCORECARD · SRC-DTL-ARTIFACT |
| S5 | Internal — 12 Commercial* → 4 consolidated |
| S6a | SRC-STA-LINKED-PROG · SRC-EMP-NO-EVENTS · SRC-ERR-EVENT-NOT-FOUND · SRC-MOD-EVIDENCE · SRC-MOD-CONTRADICTION |
| S6b | SRC-FLW-INTAKE |

## Wave dependency rule

Wave N+1 may not begin until Wave N is merged, CI green, and S-SMOKE-AMS passes.

_Last updated: 2026-04-27 · Wave S6b in-progress_
