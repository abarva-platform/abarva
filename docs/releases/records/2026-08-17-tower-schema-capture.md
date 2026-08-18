# 2026-08-17-tower-schema-capture — Make the repository describe the schema that exists

## Release ID

`2026-08-17-tower-schema-capture`

## Status

`candidate`

## Plain-English Summary

Six separate columns and constraints in `tower.*` were discovered by failing against them, one deploy
cycle at a time:

| Discovered | How |
| --- | --- |
| `metric_observation.provenance_id` | NOT NULL violation |
| `value_claim.outcome_metric_ref` | NOT NULL violation |
| `value_claim.claim_input_hash` | NOT NULL violation |
| `tracked_subject_subject_kind_check` | CHECK violation |
| `metric_observation_metric_ref_fkey` | foreign key violation |
| `tracked_subject.title`, `metric_observation.value_num` | column names differing from what the migrations imply |

**None of them appears in any migration in this repository.**

That is not a projector problem, and six workarounds did not address it. It means anyone reading
`supabase/migrations/` to understand `tower.*` is reading an incomplete description, and every future
writer rediscovers the same list the same expensive way.

This adds a read-only tool that dumps the deployed schema as SQL, so the repository can carry an
accurate description of what is actually there.

## Layer Impact

**Release lane: `internal-admin`.** Read-only catalogue queries. No writes, no schema change.

## Client Applicability

- All clients: no
- Internal only: yes
- Feature flag: none

## Changes Included

- `scripts/audit/dump-tower-live-schema.ts`
- `package.json` — `audit:tower-schema`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, run as a read-only ACA Job, and commit the captured schema alongside the migrations.

## Deployment Authority

Repo-owned ACA main deploy workflow. The dump runs as a read-only ACA Job.

## Rollback Plan

Revert. The tool writes nothing to the database.

## Audit Evidence

- Six failed executions, each naming a requirement absent from the repository.
- The captured `tower-live-schema.sql`.

## Known Gaps

- **The captured file is a description, not a migration to run.** The objects already exist in the
  deployed database. Committing it stops the repository disagreeing with reality; it does not make
  the two converge, and deciding whether to backfill proper migrations or adopt the capture as the
  reference is a call for whoever owns this schema.
- **Only `tower.*` is captured.** Whether the same drift exists in `consumption.*`, `intelligence_v6.*`
  or `public.*` is unknown and worth checking, because nothing about the cause was specific to Tower.
