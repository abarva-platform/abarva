# Tower — an unrecorded number is not zero

## Release ID

`2026-08-29-tower-missing-is-not-zero`

## Status

`candidate`

## Plain-English Summary

The governed-rows table on Tools → AI portfolio lists all 55 initiatives and tool rollouts against
Spend, Benefit, Readiness and Risk. Three of those four columns printed a coerced zero wherever the
source had recorded nothing.

- **Risk read `0%` on all fifty-five rows.** The Layer 4 loader writes no `risk_score` for any row
  at all — the field does not appear in it once. Every row's risk was null, `num(null)` made it 0,
  and the table rendered the single most reassuring value in the column, on every line of it.
- **Readiness read `0%` for the thirteen tool rollouts**, which carry no readiness score.
- **Spend read `$0` for those same thirteen rollouts.** A tool rollout has no cost recorded.
  `$0` is a claim about price; the truth is that nothing was loaded.

Two of the three flags needed to say this honestly already existed on the view
(`readinessScoreLoaded`, `riskScoreLoaded`) and were simply not consulted. The third is new.

## Layer Impact

Lane: `global-control-lane`. Layer 3 (serving reader) and the Tower product surface.

`aiSpendLoaded` is derived in `readTowerCommandCenter` at the point where the null still exists,
and is deliberately additive: `aiTaggedSpendUsd` keeps its coercion to 0 because portfolio totals
sum it, so widening it to nullable would have touched money math in the same change. The flag
records whether anything was recorded; the value is untouched. No number moves.

## Client Applicability

**All clients.** Every tenant reading the Tower AI portfolio table. Not flagged, not tenant-scoped.
Rows whose source does record these values render exactly as before.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts` — derive `aiSpendLoaded` in both AI mappers.
- `src/lib/tower/current-layer-view-model.ts`, `command-center/types.ts`, `command-center/view-model.ts` — carry it.
- `views/ContractTabs.tsx` — Spend, Readiness and Risk render absence instead of zero.
- `__tests__/case-attribute-widening.test.ts` — four guards, including one asserting the loader
  still writes no `risk_score`, so the day it does the guard fails and the column is revisited.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 27/27, four new guards |
| Tower suites | PASS against baseline — failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Guard mutation test | PASS — restoring the bare `formatUsdM(item.aiSpendUsd)` fails a guard; restored, 27/27 |
| Live signed-in proof | NOT RUN — pending deploy. See Known Gaps. |

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. One additive field and three render changes; no value is recalculated, so the
revert restores the prior render exactly.

## Known Gaps

- **Not yet live-proven.** The Risk column will read "Not scored" on all 55 rows once deployed.
  That is the honest state, not a fix for it: **no risk score is produced anywhere in the pipeline
  today**, and the column will stay empty until Layer 4 writes one. Worth a decision — score it, or
  drop the column.
- `aiTaggedSpendUsd` is still coerced to 0 in the value itself. Anything summing it counts an
  unrecorded rollout as costing nothing. That is unchanged today and out of scope here, but it is
  the same defect one layer down.
- The two mappers derive `aiSpendLoaded` separately. They read different page keys and cannot share
  the expression without a wider refactor.

## Audit Evidence

Found by reading the deployed page at revision `ca-abarva-web-lab-eastus--m4a97e6af`: 55 rows with
`0%` risk, and thirteen rollout rows reading `$0` spend and `0%` readiness while carrying real
active-user counts on the same screen. `grep -c risk_score` against the Layer 4 loader returns 0.
