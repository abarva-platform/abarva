# Tower — carry the operational story across the canonical boundary

## Release ID

`2026-08-30-tower-canonical-outcome-fields`

## Status

`candidate`

## Plain-English Summary

Layer 1 records what a project has spent, what it now expects to spend, who owns it technically,
when it goes live, and what its operating metric reads against a baseline and a target. The
canonical layer carried none of it.

The value story survived the adapter boundary and the operational one did not. A drill-down could
say a case claimed $65.6M and validated nothing; it could not say the case was $364K under budget,
or that the metric it is measured on had moved from 41 to 31 against a target of 27.

This carries nine fields across that boundary, and renders three sections from them:

| Source | Fields |
| --- | --- |
| `21_it_project_portfolio` | `technology_owner_role`, `actual_spend_ytd_usd`, `forecast_spend_usd`, `start_date`, `target_go_live_date`, `realization_start_month` |
| `22_ai_business_cases` | `baseline_value`, `target_value`, `metric_unit`, `benefit_realization_lag_months` |
| `24_monthly_value_tracking` | `baseline_value`, `target_value`, `actual_value`, `metric_unit`, `reviewer_role` |

**Money** — approved, spent to date, forecast. **Operating metric** — the metric, its baseline and
target, and the latest month that actually recorded a reading. **Timing** — technology owner,
target go-live, and when realization starts.

## One defect found and fixed while building this

The first pass wrote `num(row.baseline_value) || null`, which turned a **recorded baseline of 0
into a gap**. Forty-two of forty-two cases record a baseline; many record `0`. The same expression
would have turned a project that has genuinely spent nothing into a project whose spend was never
recorded. `numOrNull` already existed in the loader and does exactly the right thing; the fix was
to use it. Caught by reading the generated SQL, not by any test.

## Layer Impact

Lane: `global-control-lane` — shared behaviour for all clients, not feature-gated.

This is the first change in this sequence that touches the **canonical layer**: the Layer 1 source
generator now maps nine more columns into `canonical_projects`, `canonical_ai_use_cases` and
`canonical_monthly_value_observations`. The two previous slices needed no canonical change because
the data was already there.

## Client Applicability

**All clients**, per tenant at that tenant's next Layer 3 and Layer 4 build. A tenant built before
this sees the three new sections report "Not recorded", which is accurate for its stored payload.

## Changes Included

- `scripts/tower/generate-meridian-layer1-source.mjs` — nine fields into three canonical mappings.
- Regenerated canonical CSVs and package manifests.
- `scripts/tower/load-healthcare-demo-layer4-products.mjs` — carry them onto the case payload;
  `numOrNull` for every value where 0 is a stated fact.
- `readTowerCommandCenter.ts`, `current-layer-view-model.ts`, `command-center/types.ts`,
  `command-center/view-model.ts` — plumbing.
- `drawers/AiInitiativeDrawer.tsx` — Money, Operating metric, Timing.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 69/69, four new guards |
| Tower suites | PASS against baseline — 553 pass / 21 fail across 6 suites; failing set identical to `origin/main` |
| `tsc --noEmit` · `eslint` | PASS — clean |
| `validate-meridian-layer1-source` | PASS — all checks, including `evidence_coverage` at 196 rows |
| `validate-healthcare-demo-layer3-canonical` | PASS — no lineage gaps, no tenant drift, no Layer 4 projection written |
| Field coverage measured on the regenerated canonical | PASS — 140/140 projects carry owner, spend and go-live; 42/42 cases carry baseline, target and unit; 504/504 observations carry an actual |
| Live proof | NOT RUN — needs a Layer 3 and Layer 4 reload. |

`realization_start_month` is populated on 28 of 140 projects and `reviewer_role` on 10 of 504
observations. Both are genuinely sparse and render as absent rather than being filled in.

## Rollout Plan

Merge. Reaches a tenant at its next Layer 3 then Layer 4 build, through the existing governed job
path and its approval gates. The lifecycle declaration shipped earlier makes that reload
observable and reversible.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. Builds run through the governed ACA Job
wrapper with their existing gates. No shared runtime is mutated from this branch.

## Rollback Plan

Revert. The canonical CSVs regenerate without the fields at the next build, the payload keys become
unread, and the three sections disappear. No stored value is recalculated.

## Known Gaps

- **Not live until a Layer 3 and Layer 4 reload.** Both slices before this and this one all land
  together at that reload.
- The drawer shows the latest month that recorded a reading, not the full series. "10 of 14 points
  captured", which the design states, needs a count of months with readings against months
  expected; the data supports it and the drawer does not yet show it.
- `canonical_budgets.csv` remains domain-level and unused by the drill-down.

## Audit Evidence

Column coverage was measured on the regenerated canonical files before any consuming code was
written. The generated Layer 4 SQL was inspected twice: once revealing `metric_baseline_value:
null` for a case whose canonical baseline is `0`, and again after the `numOrNull` fix showing
`['0','0','0','0','0']` for the same field.
