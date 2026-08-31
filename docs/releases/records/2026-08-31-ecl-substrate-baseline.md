# ECL substrate baseline migration

## Release ID

`2026-08-31-ecl-substrate-baseline`

## Status

`candidate`

## Plain-English Summary

Adds a governed SQL baseline for the ECL substrate. The migration records the schemas,
tables, constraints, indexes, functions, serving views, row-level security state and policies that
the ECL product projections rely on.

The SQL was emitted by the read-only `lab` operator path added in the prior release. The committed
file omits the generated top-level transaction wrapper because the repository migration runner owns
transaction boundaries for every migration.

## Layer Impact

Lane: `global-control-lane`.

Layer 3 and Layer 4 physical substrate. This records existing database structure in version
control. It does not change tenant intake files, canonical data generation, projection loading,
product rendering logic, prompts, or answer generation.

## Client Applicability

- All clients: schema-history governance only.
- Specific clients: none.
- Internal only: operators and auditors.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260831031000_ecl_substrate_baseline.sql`
- `docs/architecture/TOWER_PROJECTION_SCHEMA_REFERENCE.md`
- `scripts/ops/emit-ecl-substrate-baseline.mjs`
- `scripts/ops/__tests__/run-ecl-substrate-baseline-emitter-tests.mjs`
- `scripts/ops/__tests__/run-ecl-substrate-baseline-migration-tests.mjs`
- `package.json`
- `docs/releases/records/2026-08-31-ecl-substrate-baseline.md`

## QA / Validation

Status: PASS.

- PASS — read-only operator emission succeeded against `lab` and extracted a proof bundle.
- PASS — proof summary reported 43 tables, 723 columns, 264 non-FK constraints, 137 foreign keys,
  64 indexes, 13 functions, 44 views, 41 RLS-enabled tables and 5 policies.
- PASS — operator idle verification reported `idleVerified: true`.
- PASS — `node scripts/ops/emit-ecl-substrate-baseline.mjs --self-test`
- PASS — `npm run test:ecl-substrate-baseline-emitter`
- PASS — `npm run test:ecl-substrate-baseline-migration`
- PASS — `node scripts/ops/submit-aca-operator-job.mjs --self-test`
- PASS — `npx eslint scripts/ops/emit-ecl-substrate-baseline.mjs scripts/ops/submit-aca-operator-job.mjs scripts/ops/__tests__/run-ecl-substrate-baseline-emitter-tests.mjs scripts/ops/__tests__/run-ecl-substrate-baseline-migration-tests.mjs`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- PASS — `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow publishes the migration
and scripts in the next digest-pinned image. Then run, through the governed ACA operator wrapper:

1. `ecl:migrate:substrate-baseline:dry`
2. `ecl:migrate:substrate-baseline:apply`

Both jobs must use the lab database secret and the digest-pinned image containing this commit. The
expected outcome is a clean idempotent apply with no product data reload.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: established by the repo-owned deploy workflow after merge
- ACA runtime invariant: required before operator jobs run
- Worker image invariant: not changed directly by this PR
- Feature/env flag update path: none
- Live signed-in proof required: not for this schema-history migration alone

## Rollback Plan

Do not drop substrate objects as rollback. If the baseline produces an unexpected migration-runner
failure before apply, revert the PR. If apply succeeds, rollback is a new additive corrective
migration or restoring traffic to the prior web image for application-only changes.

## Audit Evidence

- Operator emission output directory: `/tmp/ecl-substrate-baseline-emitter-20260831T0300Z`
- Proof SQL SHA-256: `2a7a186d9c35027c6f5fddd06a73f23d469f47b9c334f7dc9e277f4726426980`
- Operator execution: `job-abarva-private-operator-eus-p1o2cnc`
- Runtime image used for emission:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:a17512cc285506709eb796d015914c66aaed6bfdc44d959ebb813cba6e2de56f`

## Known Gaps

The migration apply has not run yet. It must run only after this PR is merged and the digest-pinned
image containing the migration has passed the ACA runtime invariant.
