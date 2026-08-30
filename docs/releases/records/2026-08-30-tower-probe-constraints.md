# Tower — capture what a migration actually needs

## Release ID

`2026-08-30-tower-probe-constraints`

## Status

`candidate`

## Plain-English Summary

Extends the read-only serving probe so its output is sufficient to author the missing migrations,
and fixes a sampling bug in it that produced a frightening and wrong answer.

The first run established the column shape of the four `ecl_projection` tables Tower reads — 128
columns across `tower_ai_portfolio`, `tower_command_center`, `tower_value_chain` and
`tower_evidence_queue`. That is not enough to write a migration. `information_schema.columns`
carries no primary keys, foreign keys, unique constraints, check constraints, indexes or row-level
security. A `create table` authored from columns alone would look correct and be wrong, which is
worse in a repository than no migration at all.

The probe now also reports constraints (with `pg_get_constraintdef`), indexes, and whether RLS is
enabled with how many policies.

**Sampling fix.** Step 3 read one rollout's display payload with `limit 1` and no ordering. It
returned a row from a retired assessment whose payload holds only `page_key` — which reads as
catastrophic data loss and is nothing of the sort: the active-assessment view already filters those
rows, and the live surface renders their replacements correctly. It now orders by
`projection_version desc, created_at desc`, and a new step counts rows per projection version and
how many fall outside the active view, so the retired-row population is reported rather than
stumbled into.

## Layer Impact

Lane: `internal-admin`. This lane covers AbarVa-only operations capability; no product lane is
touched. No layer changes, no product surface reads it.

## Client Applicability

**Internal only.** No client-visible behaviour. The probe reports shape and structure — column
names, types, constraint definitions, index definitions, counts — and never a payload value, so its
output carries no tenant data.

## Changes Included

- `scripts/ops/probe-tower-serving-shape.mjs` — ordered sampling; retired-row census; constraints;
  indexes; RLS.
- This record.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS — syntax clean |
| Mutating-statement scan | PASS — zero occurrences of insert/update/delete/drop/alter/truncate |
| Execution against the data plane | NOT RUN for the new steps — that is the next step, as an ACA Job |

Every statement remains a `SELECT`, now also against `pg_constraint`, `pg_class`, `pg_namespace`,
`pg_indexes` and `pg_policies`.

## Rollout Plan

Merge so the next `main` image carries it, then re-run through `npm run ops:aca-job`,
digest-pinned, with `--secret-env DATABASE_URL=azure-postgres-control-database-url`. Read the saved
`04-logs.txt`.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The probe runs through the governed ACA
Job wrapper and is read-only.

## Rollback Plan

Revert the commit. Nothing depends on the probe.

## Known Gaps

- **Authoring the migrations is deliberately not in this change.** Adopting an existing,
  unversioned production schema into version control is a decision, not a mechanical step: a
  baseline `create table if not exists` that silently disagrees with the deployed table is worse
  than the present gap. That call needs the probe's full output and a human view on how to adopt.
- The probe reads the lab data plane only. A production schema could differ, which is precisely the
  risk an unversioned schema creates.
- Retired projection rows are reported, not cleaned. Whether they should be purged is a separate
  question from whether they are correctly filtered — they are.

## Audit Evidence

The first probe run reported `rollout_display_keys ["page_key"]` for a rollout, while the live
surface simultaneously rendered that rollout's adoption target, supported-case count and control
blocker — all keys from the same payload. The contradiction was the unordered `limit 1` sampling a
retired assessment. The active-view step in the same run
(`serving.tower_adoption_lens`, 13 rows) was correct and is what the fix preserves.
