# 2026-09-19-opportunity-overlap-unpopulated-by-design — an empty table that reads as a finding

## Release ID

`2026-09-19-opportunity-overlap-unpopulated-by-design`

## Status

`candidate`

## Plain-English Summary

`source.opportunity_overlap` has existed since the optimization spine migration
and **nothing has ever written it.** It holds pairs — `opportunity_id`,
`overlaps_opportunity_id`, `overlap_type`, `treatment` — and the sole owner of
the spine, `scripts/source/load-skyharbor-contract-optimization.ts`, never
references it.

The question was whether overlap is derivable from existing rows, or needs an
input nobody supplies. **Neither, as it turns out: overlap is already recorded,
somewhere else.**

Every row of `source.optimization_opportunity` carries an
`overlap_treatment TEXT NOT NULL` column, and that column is what the product
actually shows — `buildViewModel.ts:2812` reads it and `ContractCanvas.tsx:1804`
renders it to a user. The pair table is read by nothing but the schema applier
and the cutover/guard scripts.

**So populating it would put one fact in two places.** That is the split this
codebase keeps paying for: two annual values for one contract, and a contract
register whose ids do not join its evidence. Adding a second, relational
statement of overlap beside the prose one already on screen would create the
third instance.

**Decision: unpopulated by design.** The pair table stays empty until a
consumer genuinely needs pairwise overlap — a portfolio roll-up that must not
double-count is the obvious candidate — and that consumer populates it as part
of its own work.

### What this release actually changes

The decision alone changes nothing, and an empty table still **reads as "no
overlaps"** to anything that queries it. That is the hazard, and it is the part
worth holding in place:

- No product path may read the table while it is empty by design. A surface
  that wants pairwise overlap must populate it **first**, and then delete this
  suite deliberately — rather than discovering later that it rendered emptiness
  as a finding.
- The owning loader must not start writing it silently, because that would make
  the decision stale without anyone noticing.
- And the fact this defers to must keep existing: if `overlap_treatment`
  disappeared from the spine, deferring to it would be deferring to nothing, and
  the pair table would become the only home for the fact.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI** — one new behaviour suite, in the existing behaviours job.
- **No schema change, no migration, no data write.** The table is untouched; the
  decision is that it stays untouched, and the suite is what keeps that true.
- No product code changes.

## Client Applicability

No client receives this change.

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `src/__tests__/behaviors/opportunity-overlap-unpopulated-by-design.test.ts` | new — 3 cases |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `opportunity-overlap-unpopulated-by-design.test.ts` | **pass** — 3/3 |
| `npx jest src/__tests__/behaviors` | **pass** — 40 suites / 409 tests |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the new file | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| a product read path starts consuming the empty table | caught | 1 of 3 red |
| the owning loader starts writing it | caught | 2 of 3 red |
| `overlap_treatment` removed from the spine | caught | 1 of 3 red |

The third is the control. Without it the suite would defend an emptiness whose
justification had quietly vanished.

## Rollout Plan

Squash merge to `main`. The suite runs in the existing behaviours job. No image
build, no deploy, no migration.

## Deployment Authority

Not applicable — no Azure Container Apps, workflow, image, flag, worker, traffic
or DNS is affected.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the commit. The table remains empty either way; only the guard goes.

## Audit Evidence

- The table: `supabase/migrations/20260809143000_source_contract_optimization_opportunity_spine.sql:228`
- The column it defers to: `optimization_opportunity.overlap_treatment`, same migration
- What renders that column: `src/app/(maestro)/source/preview/workspace/buildViewModel.ts:2812`,
  `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx:1804`
- The guard: `src/__tests__/behaviors/opportunity-overlap-unpopulated-by-design.test.ts`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **`overlap_treatment` is free prose with no vocabulary.** Observed values run
  from `"none"` and `"included"` to whole sentences like
  `"Distinct from off-contract billing."`, and it is rendered to a user through
  `clientFacingOpportunityText`. Neither the column nor the pair table's
  `overlap_type` / `treatment` carries a CHECK constraint. That is a real
  quality problem, it is not this decision, and it is recorded separately.
- **The guard is textual.** It greps for the table name rather than parsing
  queries, so a read assembled from a computed string would slip past. It
  catches the way this would realistically arrive — someone writing the table
  name into a query.
- **No claim is made that there are no overlaps in the data.** The decision is
  that the pair table is not where that question gets answered today.
