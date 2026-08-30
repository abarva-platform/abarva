# Tower — declare the active assessment instead of inferring it

## Release ID

`2026-08-30-tower-assessment-lifecycle`

## Status

`candidate`

## Plain-English Summary

`serving.tower_active_assessment_keys()` decides which generation of data a client sees. It did
that by ranking on four inferred signals: a priority derived from payload shape, then
`projection_version`, then `created_at`, then `assessment_id`. Every one of those is a guess about
intent.

A tenant once saw **$492.5M instead of $677.8M** because that ranking picked a retired generation.
The recency term was added afterwards, which made the symptom go away and left the mechanism in
place. The retired rows are still there: `tower_ai_portfolio` holds **720 rows at projection
version 1 against 55 at version 2** — thirteen times more retired data than live.

`AGENTS.md` is explicit that identity is declared, never inferred. This adds the declaration.

`ecl_projection.tower_assessment_lifecycle` records, per tenant, which generation is `active` and
which are `retired`, with the date each was retired. A **partial unique index enforces at most one
active generation per tenant** — previously nothing prevented two, and the ranking silently chose.
`retired` means unreadable, not ranked lower: a retired generation must not be one ranking bug away
from a client's screen.

**Nothing moves on the day this lands.** Until a loader writes a lifecycle row, the function falls
back to the prior ranking, kept verbatim. Every tenant reaching that branch is one whose active
generation is still a guess, which is the point of keeping the branch visible rather than deleting
it.

## Layer Impact

Lane: `global-control-lane` — this is shared control-plane behaviour for all clients, not
feature-gated. Layer 4 physical substrate and the Layer 3/4 serving boundary.

One new table in `ecl_projection`, one partial unique index, one supporting index, one RLS policy,
and a replacement body for `serving.tower_active_assessment_keys()`. No product surface changes and
no reader changes.

The new table carries a real tenant policy following the pattern already established in
`intelligence_v7`. The four sibling projection tables have RLS enabled with **zero** policies, which
denies reads to any role that does not bypass RLS and leaves tenant isolation resting on the
reader's `where tenant_key = $1`. The Tower reader sets `app.tenant_key` via `set_config` before
every query, so the predicate on this table resolves correctly.

## Client Applicability

**All clients**, and deliberately inert for all of them today. Every tenant continues to resolve
through the unchanged fallback ranking until a lifecycle row is written for it. No tenant's numbers
move on this migration alone.

## Changes Included

- `supabase/migrations/20260830050000_tower_assessment_lifecycle.sql` — table, constraints, partial
  unique index, RLS policy, and the function replacement.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — five guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 43/43, five new guards |
| Tower suites | PASS against baseline — 531 pass / 21 fail across 6 suites; failing set identical to `origin/main` |
| Guard mutation test | PASS — removing the `not exists` gate, which would let a retired generation return alongside the active one, fails a guard; restored, 43/43 |
| Fallback fidelity | PASS — a guard asserts all four original ranking terms survive verbatim, so this cannot become a behaviour change disguised as a structural one |
| Applied against a database | NOT RUN — see Known Gaps |

## Rollout Plan

Merge; the migration applies through the normal migration path. It is inert on application: it
creates a table nothing writes to yet and replaces a function with one that behaves identically
while that table is empty.

The two changes that give it effect are deliberately separate: the loader writing a lifecycle row
at the end of a successful build, and a retention sweep that removes retired rows after a window.
Neither is in this change.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. No ad-hoc `az` command, no shared
runtime mutation, and no data build from this branch.

## Rollback Plan

Revert restores the prior function body. The table can be left in place — nothing reads it while
the function is reverted, and dropping it is a separate decision.

## Known Gaps

- **Not applied against a database.** The migration is written and guarded but has not been run.
  It should be applied to the lab plane and `serving.tower_active_assessment_keys()` re-checked to
  return exactly what it returned before, for every tenant, before anything writes a lifecycle row.
- **No loader writes the declaration yet**, so the inferred fallback still governs every tenant.
  That is intended for this slice and is the next one.
- **Retired rows are still not removed.** Declaring a generation retired makes it unreadable
  through the serving views; it does not delete it. A retention sweep has to order its deletes
  around the foreign-key web, which is the same constraint that blocked a Layer 3 reload earlier.
- **The four sibling tables still have RLS enabled with no policies.** This change does not touch
  them. The policy here is a template for that fix, not the fix.

## Audit Evidence

The prior function body ranked on `priority desc, projection_version desc, created_at desc,
assessment_id desc` — visible in
`supabase/migrations/20260829113000_tower_active_layer4_serving_views.sql`. The retired-row counts
come from `ops:probe-tower-serving-shape` run as ACA Job `job-abarva-private-operator-eus` on
2026-08-30: `[{"projection_version":2,"rows":55,"not_in_active_view":0},
{"projection_version":1,"rows":720,"not_in_active_view":360}]`.
