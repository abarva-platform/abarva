# Tower — the loader declares the generation it just wrote

## Release ID

`2026-08-30-tower-loader-declares-active`

## Status

`candidate`

## Plain-English Summary

The lifecycle table exists and is empty. This is what fills it.

At the end of a successful Layer 4 product load — inside the same transaction as the rows it
describes — the loader now retires whatever generation was active for that tenant and declares the
one it just wrote. A load that fails is never declared, and the prior generation keeps serving.

Order is load-bearing. A partial unique index permits one active generation per tenant, so
activating before retiring would be rejected. The retire is scoped to the tenant being loaded and
deliberately excludes the generation about to be activated, so reloading an existing generation
does not retire and re-activate itself.

The whole block is guarded on the table existing, so a database that has not taken the lifecycle
migration loads exactly as it did before.

## What changes for a reader

This is the step that makes the declaration govern. Until now
`serving.tower_active_assessment_keys()` fell back to its prior ranking for every tenant, because
nothing had been declared. After the next load of a tenant, that tenant resolves through its
declaration instead.

For a tenant whose ranking already picked the right generation — which is both tenants in the lab
today, verified by capture-diff when the migration was applied — the resolved generation is
unchanged. The difference is that it is now a recorded fact rather than the outcome of four
inferred signals.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour, not feature-gated. Layer 4 loader
only. No schema change (the table and index shipped with the migration), no reader change, no
product surface change.

## Client Applicability

**All clients**, taking effect per tenant at that tenant's next Layer 4 load. A tenant that is not
reloaded continues to resolve through the fallback ranking, unchanged. No tenant's numbers move
unless its ranking was already picking a different generation than its load would declare — which
is the defect this exists to remove, and would be visible as a change in the capture diff.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs` — `lifecycleDeclarationSql`, emitted
  between the last insert and the commit.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 56/56, four new guards |
| Tower suites | PASS against baseline — 544 pass / 21 fail across 6 suites; failing set identical to `origin/main` |
| `tsc --noEmit` · `eslint` | PASS — clean |
| Generated SQL inspected | PASS — dry build against the real fixture; retire scoped to `meridian-health` only, excluding the generation being activated, inside the transaction, before `commit` |
| Guard mutation test | PASS — swapping the insert ahead of the update fails the ordering guard |
| Applied to a database | NOT RUN — no load has been run with this change |

The ordering guard matters because the failure it prevents is silent in review and loud at runtime:
the index rejects the insert, the transaction rolls back, and the load fails with a constraint
violation that reads as a data problem rather than a sequencing one.

## Rollout Plan

Merge. The change takes effect the next time a tenant's Layer 4 load runs, through the existing
governed ACA job path. Nothing runs on merge.

Recommended first run: the lab tenant, followed by `ops:probe-tower-active-keys` to confirm the
declaration exists and the resolved generation is unchanged.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The load itself runs through the
governed ACA Job wrapper with its existing approval gates; this change adds no new write path.

## Rollback Plan

Revert the commit and the loader stops declaring. Any declarations already written stay, and keep
governing — which is correct, since they record what was loaded. To return a tenant to the inferred
fallback, delete its lifecycle rows.

## Known Gaps

- **Retired rows are still not deleted.** Declaring a generation retired makes it unreadable
  through the serving views; the rows remain. The retention sweep is the next change, and it must
  key on lifecycle state rather than on projection version — see below.
- **A sweep keyed on version would destroy live data.** The lab baseline shows `meridian-health` on
  projection version 2 and `skyharbor-air` on version 1. Of the 720 rows at version 1 in
  `tower_ai_portfolio`, roughly half are SkyHarbor's live data. "Delete anything below the highest
  version" would have deleted a tenant's entire dataset.
- This loader is the healthcare demo product load. Other Layer 4 loaders do not declare yet.

## Audit Evidence

The generated SQL was inspected from a dry build against the real Meridian fixture before merge.
The capture-diff taken when the migration was applied
(`ops:probe-tower-active-keys`, before and after) showed both tenants resolving unchanged with
`LIFECYCLE_TABLE` moving from `absent` to `present` holding zero rows.
