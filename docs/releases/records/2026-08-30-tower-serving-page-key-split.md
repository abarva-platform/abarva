# Tower — a lens returns its own rows

## Release ID

`2026-08-30-tower-serving-page-key-split`

## Status

`candidate`

## Plain-English Summary

`serving.tower_ai_portfolio` and `serving.tower_adoption_lens` both call `serving.tower_ai_rows`,
passing `'ai_portfolio'` and `'adoption_lens'` respectively. The deployed function ignores that
argument, so **both views return the same rows** — 55 for Meridian, being 42 business cases plus 13
tool rollouts. A lens that returns everything is not a lens.

The loader writes the page key explicitly on both row kinds, `ai_portfolio` on a case and
`adoption_lens` on a rollout, so the predicate splits them exactly: 42 and 13.

This is the last piece of the Layer 4 readback mismatch. That check expects 42 for this view and
has been reporting 55 — after the active-generation join brought it down from 415.

## Layer Impact

Lane: `global-control-lane`. Layer 3/4 serving boundary. One `where` clause on one function.

Patched from the body **deployed after the active-generation join**, not from the repo's
definition. Those two diverged once already — the deployed functions had no join while the
migration defining them did — so re-creating from source would revert whatever else changed. The
diff against the deployed text is `added=2 removed=1`: one line gains a `where` clause and the
statement terminator moves.

## Client Applicability

**All clients.** No rendered figure changes: the application unions both views and dedupes, so it
already receives each row exactly once. The change matters for any consumer reading a single lens
and expecting that lens to mean something.

## Changes Included

- `supabase/migrations/20260830230000_tower_serving_page_key_split.sql`
- `package.json` — `tower:migrate:page-key:dry` / `:apply`
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — three guards

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 80/80, three new guards |
| Tower suites | PASS against baseline — 568 pass / 21 fail; failing set re-derived from `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| Patch minimality | PASS — `added=2 removed=1` against the deployed body, computed by diff rather than asserted |
| Applied to a database | NOT RUN — the rollout plan is the proof |

One guard asserts the migration still contains the active-generation join it is patched on top of.
Losing that here would silently reintroduce retired generations while appearing to fix the lens —
the two changes touch the same statement.

## Rollout Plan

Through `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`:

1. `ops:probe-tower-serving-views` — before.
2. `tower:migrate:page-key:dry`.
3. `tower:migrate:page-key:apply`.
4. `ops:probe-tower-serving-views` — after.

Expected: `tower_ai_portfolio` for `meridian-health` moves **55 → 42**, and `skyharbor-air` splits
correspondingly rather than changing in total. Any movement in a tenant's combined count across the
two lenses means rows are being dropped rather than routed, and the change should be reverted.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge. The migration runs through the governed ACA Job
wrapper.

## Rollback Plan

Re-apply the previous function body, which is recorded verbatim in this change's own patch source
and in the probe output that produced it.

## Known Gaps

- **`tower_command_rows` already had its page filter** and is untouched here.
- The Layer 4 readback should pass after this. It has not been re-run; that is a separate job and
  belongs with the next build rather than this change.
- The serving views still have no migration defining them. This patches a deployed function whose
  definition is not in version control, which is the same gap recorded against the projection
  tables.

## Audit Evidence

Deployed body captured by `ops:probe-tower-serving-views` on 2026-08-30, ending
`and active.projection_version = p.projection_version;` with no `where` clause. Loader writes
`page_key: "ai_portfolio"` at line 762 and `page_key: "adoption_lens"` at line 909. Layer 4 rebuild
on the same day reported `serving_tower_ai_portfolio_expected_42_got_415`; the join reduced that to
55 and this reduces it to 42.
