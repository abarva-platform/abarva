# Source Build — Complete

**All 7 waves shipped · 2026-04-27 through 2026-04-28**

The AbarVa Source module build loop is closed. Every wave planned in `WAVE_ROADMAP.md` has a merged PR with CI green.

---

## Wave summary

| Wave | Title | PR | Merged |
|---|---|---|---|
| S0 | Audit & Plan | #531 | 2026-04-27 |
| S1 | Shell convergence + token refresh | #545 | 2026-04-28 |
| S2 | Index pages refresh | #555 | 2026-04-27 |
| S3 | Event canvas refresh | #563 | 2026-04-27 |
| S4 | Sub-routes refresh | #565 | 2026-04-27 |
| S5 | Commercial-intel convergence | #567 | 2026-04-27 |
| S6a | Cross-surface storyline + states | #568 | 2026-04-27 |
| S6b | Intake flow wizard | #569 | 2026-04-27 |

---

## Catalog entries shipped

| ID | Name |
|---|---|
| `SRC-IDX-EVENTS` | Source · events list (default) |
| `SRC-DTL-CANVAS` | Source event · canvas (10-stage detail) |
| `SRC-DTL-SCORECARD` | Source · scorecard governance panel |
| `SRC-DTL-ARTIFACT` | Source · artifact drawer |
| `SRC-STA-LINKED-PROG` | Source · linked program storyline chip |
| `SRC-EMP-NO-EVENTS` | Source · empty state (no events) |
| `SRC-MOD-CONTRADICTION` | Source · contradiction resolution card |
| `SRC-FLW-INTAKE` | Originate source event · 3-step intake wizard |

---

## Token migration completed

All Source components now use `@/lib/shell/shell-tokens` exclusively. The following legacy tokens have been retired from this surface:

- `EXPERIENCE_COLORS`, `EXPERIENCE_FONTS`, `EXPERIENCE_TEXT` (from `@/lib/design-system`)
- `foundationStyles` shared import (per-component const pattern adopted)
- Hardcoded hex values replaced with named SHELL tokens throughout

---

## Deferred work (requires human review)

The 9 `SourceCommercial*` structural components (consolidated into 4 in Wave S5) retain their original files. Deletion requires updating 1 route file, 9 test files, and 5 QA lib files. Not suitable for autonomous execution. Tracked as a separate cleanup pass.

---

## Tag

`source-wave-S6-shipped-2026-04-27`

---

*Source build loop closed after PR #545 merged on 2026-04-28; Waves S0-S6b · 8 PRs merged*
