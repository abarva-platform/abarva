# 2026-09-01-home-page-keys-get-a-reader — Give every projected page key something that reads it

## Release ID

`2026-09-01-home-page-keys-get-a-reader`

## Status

`candidate`

## Plain-English Summary

Five intake families are mapped in the Home read path and permitted by the page-key check
constraint. **No serving view selected any of them.**

The application reads a fixed union of `serving.home_*` views. Rows written under those page keys
would land in the projection table, satisfy the constraint, pass every readback with correct counts,
and be **invisible on the page**. A load that reports success and changes nothing.

This adds the missing views, the constraint entries for three planned drilldowns, the reader union
entries, and a contract test that makes the three facts agree.

It writes no rows. It opens the path the rows will travel.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** eight read-only views over an existing function, plus a widened
  check constraint. No table, column, or row is altered.
- **Layer 4 / products:** the Home read path selects from the new views.

## Client Applicability

- All clients on the governed Home serving path.
- Feature flag: none. A view over page keys with no rows returns nothing, so this is inert until a
  load writes them.

## Changes Included

- `supabase/migrations/20260901090000_home_serving_views_intake_families.sql`
  - Check constraint gains `business_unit_profile`, `data_maturity`, `kpi_register`. Without these
    an insert under those keys fails outright.
  - Eight views: the five intake families, and the three drilldowns.
  - `serving.home_surface_rows(surface_key_arg, page_key_arg)` filters on **page_key only** —
    `surface_key_arg` is echoed into the output as a label. Each view is therefore a straight
    projection of one page key, matching the sixteen that already exist.
- `src/lib/home/preview/ecl-projection-bundle.ts`
  - The reader union gains the eight views. A view nothing selects from is a view nothing reads.
  - The provenance stamp named a physical table while the application queried the serving union. It
    now names what is queried. That string sent two independent investigations of a live incident to
    the wrong object inside one day.
- `src/lib/home/preview/__tests__/page-key-has-a-reader.test.ts` (new) — 49 test cases.

### The invariant this establishes

Three facts had no place where they were checked together: the page key the reader maps, the view
the reader selects from, and the constraint that permits the key. Each was individually correct and
the set was broken.

The test derives all three from source — the reader's `intakeFamily(...)` calls, its
`from serving.home_*` clauses, and the newest migration declaring the constraint — and asserts they
agree. It is not a list to maintain; adding a family without a view fails it automatically.

## QA / Validation

- PASS `npx jest src/lib/home src/components/home/v4` — **410 tests, 381 passing**. Against
  `origin/main`: **29 failures before, 29 after**, identical set. 49 tests added, none broken.
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- **Mutation-tested:** removing one view from the reader union fails the contract on exactly that
  key (2 of 49). Restored, 49 of 49 pass.

## Rollout Plan

Merge and deploy the application change through the repo-owned workflow.

The migration runs against the shared data plane as a governed job. It is additive: `create or
replace view` on names that do not exist, and a constraint replaced with a strict superset of the
one in place. No existing row can violate it.

### Go/no-go before any load

After this deploys, prove the path end to end with one row rather than a whole load:

```sql
insert one row with page_key = 'metrics_outcomes' under the live tenant and assessment;
select from the reader union;   -- it must come back
delete the row;
```

If that row does not round-trip, a full load is wasted. One row decides it.

## Deployment Authority

- Repo-owned deploy workflow: standard for the application change
- Shared runtime mutators: none
- Data-plane mutation: the migration only — additive views and a superset constraint
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes, after the round-trip check

## Rollback Plan

`drop view` on the eight names and revert the commit. The constraint may be left widened; it permits
keys that nothing writes, which is inert. No row is created or destroyed by this change.

## Audit Evidence

- Mutation-test result above.
- Before state: the reader union covered sixteen views, and none of the five mapped families.

## Known Gaps

- **The rows still do not exist.** This opens the path; the load is separate and gated on the
  round-trip check.
- The drilldown pages themselves are not built. Their page keys are permitted and readable so that
  the load and the page can be built in either order.
