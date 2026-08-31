# ECL — size the substrate before writing a baseline

## Release ID

`2026-08-31-ecl-substrate-inventory`

## Status

`candidate`

## Plain-English Summary

Recent Tower serving fixes had to compare deployed database objects directly against repository
expectations, because the `ecl_projection` tables Tower reads, the `serving` views over them, and
the functions those views call are not fully represented by migrations in this repository. Patching
a deployed function body is not a sustainable source of truth.

The obstacle to fixing it has been scope. A baseline covering the four Tower projection tables
fails on a fresh database, because their foreign keys point at eight tables across four other
schemas which are equally unversioned. The real unit of work is the substrate, and nobody knows how
big it is — those eight are what Tower happens to touch, not an inventory.

This measures it. Per schema: every table with its column count, whether it has a primary key, how
many foreign keys leave it, its RLS state and policy count. It also lists views, materialized views
and functions with definition hashes, RLS policies with expression hashes, foreign-key edges, which
objects appear in migrations, and the dependency order a baseline would have to follow.

No baseline is written here. Writing one before knowing whether the answer is forty tables or four
hundred would be guessing at the shape of the work.

## Layer Impact

Lane: `internal-admin` — AbarVa-only operations capability; no product lane is touched. Read-only;
no schema, code or product change, and nothing calls it.

## Client Applicability

**Internal only.** The report contains schema object names, counts, dependency directions and
definition hashes. No client data and no row values.

## Changes Included

- `scripts/ops/probe-ecl-substrate-inventory.mjs`
- `package.json` — `ops:probe-ecl-substrate-inventory`

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS |
| Mutating-statement scan | PASS — zero occurrences; database statements are `SELECT` queries against catalog views |
| `package.json` parse | PASS |
| Run against the data plane | PENDING — immediately after merge |

## Rollout Plan

Merge, then run through `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`. Its output decides three things:
whether a baseline is tractable at all, what order the schemas must be created in, and whether the
work is one change or a sequence.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge. The probe runs through the governed ACA Job
wrapper and is read-only.

## Rollback Plan

Delete the script and the npm entry. Nothing depends on it.

## Known Gaps

- **This measures; it does not fix.** A baseline of an existing unversioned schema is a decision
  about how to adopt it, not a mechanical transcription, and the decision needs the numbers first.
- **Lab only unless run elsewhere.** A production substrate could differ, which is exactly the risk
  an unversioned schema creates, and a baseline generated from one environment and applied to
  another would encode that risk rather than remove it.
- The inventory covers `ecl_projection`, `ecl_context`, `ecl_review`, `ecl_source` and `serving`.
  If the substrate reaches further, the next run should widen the list rather than assume.

## Audit Evidence

Repository searches for `ecl_projection.tower_ai_portfolio`,
`ecl_projection.tower_command_center`, `ecl_projection.tower_value_chain`, and
`ecl_projection.tower_evidence_queue` do not find baseline table definitions in
`supabase/migrations/`. This probe turns that ad hoc check into a repeatable inventory and reports
object-level migration coverage markers for follow-up baseline work.
