# Tower — record the deployed projection schema

## Release ID

`2026-08-30-tower-projection-schema-reference`

## Status

`candidate`

## Plain-English Summary

Records, for the first time in this repository, the actual deployed schema of the four
`ecl_projection` tables Tower reads on every page load: 128 columns, 54 constraints, 15 indexes,
and the row-level-security state of each.

It is deliberately a **reference, not a migration**. Two reasons, and the second is the important
one.

**It would not run.** The four tables carry foreign keys into eight tables across four other
schemas — `ecl_projection.projection_entry` and `projection_manifest`, `ecl_context.measure`,
`metric_definition`, `object` and `snapshot`, `ecl_review.review_event`, and
`ecl_source.source_record`. None of those eight has a migration either. A baseline covering only
the four Tower tables fails on a fresh database, because its foreign keys point at tables nothing
creates. Baselining the substrate is the real unit of work, and its size is still unknown: those
eight are what Tower happens to reference, not an inventory.

**It has only been read in the lab.** A migration asserts what production must look like. This
document asserts only what one environment did look like on one day.

## Row-level security finding

All four tables have **RLS enabled with zero policies**. In Postgres that denies every read to any
role that does not bypass RLS. The application reads them successfully, so its role must be
bypassing — which means tenant isolation on this substrate rests entirely on the
`where tenant_key = $1` in the reader, not on the database.

Two consequences worth weighing before a pilot: a query that omits the tenant predicate is stopped
by nothing; and if the connection role ever changes to one that respects RLS, every read returns
zero rows, which presents as "not seeded" rather than as an error.

This is reported, not fixed. Adding policies to a live substrate changes read behaviour for every
surface at once and is not a change to make in passing.

## Layer Impact

Lane: `internal-admin` — this lane covers AbarVa-only operations capability, and no product lane is touched. Documentation only — no schema, code, or product change. Records Layer 4
physical structure for the Layer 3/4 boundary described in the enterprise information architecture.

## Client Applicability

**Internal only.** No client-visible behaviour. The document contains schema structure — column
names, types, constraint and index definitions — and no tenant data or row values.

## Changes Included

- `docs/architecture/TOWER_PROJECTION_SCHEMA_REFERENCE.md` — generated from probe output.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — a guard that fails if a migration is
  added for any of the four tables while the document still says none exists, so the two cannot
  silently diverge.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| Source of every figure | PASS — generated from `ops:probe-tower-serving-shape` output, not hand-transcribed |
| Column / constraint / index counts | PASS — 128 / 54 / 15, matching the probe |
| Divergence guard | PASS |
| Production verification | NOT RUN — lab only, and the document says so |

## Rollout Plan

Documentation. Merges with the next `main` deploy; nothing to sequence and nothing to enable.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. No data-plane change of any kind.

## Rollback Plan

Delete the document. Nothing depends on it.

## Known Gaps

- **The substrate inventory is not complete.** The eight referenced tables are what Tower touches.
  A full baseline needs an enumeration of every table in `ecl_projection`, `ecl_context`,
  `ecl_review` and `ecl_source`, which the probe does not yet collect.
- **Production is unread.** Everything here is the lab plane.
- **RLS is reported, not fixed.**
- **Retired projection rows are not cleaned.** The same probe run counted, in
  `tower_ai_portfolio`: projection version 2 holding 55 rows with none outside the active view,
  and version 1 holding 720 rows with 360 outside it. Thirteen times more retired rows than live
  ones, in one table. That is the sunset gap, quantified; it is a separate change.

## Audit Evidence

Probe run `ops:probe-tower-serving-shape` via ACA Job `job-abarva-private-operator-eus`,
digest-pinned image `sha256:33199b8f…`, read-only, 2026-08-30. Output retained locally as the
job wrapper's proof bundle. `grep -rl "create table if not exists <name>" supabase/migrations/`
returns zero for all twelve tables named in this record.
