# ECL — size the substrate before writing a baseline

## Release ID

`2026-08-31-ecl-substrate-inventory`

## Status

`candidate`

## Plain-English Summary

Three separate fixes on 2026-08-30 had to read the deployed database to learn what the code
actually was, because the `ecl_projection` tables Tower reads, the `serving` views over them, and
the functions those views call have no migration in this repository. Twice the deployed object and
the repo's version had already diverged. Patching a deployed function body is not a sustainable
source of truth, and it is the last structural concern left from that sweep.

The obstacle to fixing it has been scope. A baseline covering the four Tower projection tables
fails on a fresh database, because their foreign keys point at eight tables across four other
schemas which are equally unversioned. The real unit of work is the substrate, and nobody knows how
big it is — those eight are what Tower happens to touch, not an inventory.

This measures it. Per schema: every table with its column count, whether it has a primary key, how
many foreign keys leave it, its RLS state and policy count. Then the part that decides the order a
baseline must be written in — which schemas' foreign keys point at which. Then the totals a
baseline would have to reproduce.

No baseline is written here. Writing one before knowing whether the answer is forty tables or four
hundred would be guessing at the shape of the work.

## Layer Impact

Lane: `internal-admin` — AbarVa-only operations capability; no product lane is touched. Read-only;
no schema, code or product change, and nothing calls it.

## Client Applicability

**Internal only.** The report contains schema and table names, column and constraint counts, and
dependency directions. No client data and no row values.

## Changes Included

- `scripts/ops/probe-ecl-substrate-inventory.mjs`
- `package.json` — `ops:probe-ecl-substrate-inventory`

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS |
| Mutating-statement scan | PASS — zero occurrences; every statement is a `SELECT` against `pg_catalog` |
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
- **Lab only.** A production substrate could differ, which is exactly the risk an unversioned
  schema creates, and a baseline generated from lab and applied to production would encode that
  risk rather than remove it.
- The inventory covers `ecl_projection`, `ecl_context`, `ecl_review`, `ecl_source` and `serving`.
  If the substrate reaches further, the next run should widen the list rather than assume.

## Audit Evidence

`grep -rl "create table if not exists ecl_projection.<name>" supabase/migrations/` returns zero for
`tower_ai_portfolio`, `tower_command_center`, `tower_value_chain` and `tower_evidence_queue`, and
for the eight tables their foreign keys reference. On 2026-08-30 the deployed `tower_ai_rows` was
found to lack an active-generation join that migration `20260829113000` defines and that had been
applied.
