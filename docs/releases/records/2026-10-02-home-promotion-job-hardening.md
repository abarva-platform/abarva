# 2026-10-02-home-promotion-job-hardening — Hardened Home projection, admission and retirement jobs

## Release ID

`2026-10-02-home-promotion-job-hardening`

## Status

`candidate`

## Plain-English Summary

The private operator jobs that project a synthetic enterprise to Home, promote it so Home serves it, and retire it again are made safe to run and safe to re-run. The admission gate now proves what Home actually serves, through the Home page's own builder, before it switches anything; a reverted upstream change that leaves the built business spine empty now makes the preflight fail instead of pass. The admission query that could hang on a freshly loaded database without statistics is rewritten so its plan no longer depends on statistics, and every job transaction runs under a statement and lock timeout. Each job writes its evidence before it commits the switch and its proof after, and a re-run that finds the work already done re-emits the proof without redoing the work. Retirement now withdraws a declaration by the declaration's own identity. The row mapper stops inventing values the source does not hold. No job is run by this change.

## Layer Impact

- Release lane: `client-data-lane` — the change is to the client-scoped synthetic data-plane projection/admission/retirement jobs and their tests; it adds no shared control-plane behaviour and gates nothing behind a flag.
- Canonical model (layer 3): unchanged. Source-set hashes and the projection's `projection_hash` for the current pack do not move; the mapper change alters six display payload fields only (see QA).
- Products (layer 4): Home alone is affected, and only through the governed declaration the admission job writes; the Home reader code is not changed by this part. Tower, Intelligence, Source and Moves are untouched.
- Data plane: no migration is added here; the jobs read and write the existing `ecl_projection` / `ecl_context` / `ecl_source` tables and the Blob proof store.

## Client Applicability

- All clients: none at runtime — no product surface changes and no job runs as part of this change.
- Specific clients: only a tenant the tenant input registry declares can be admitted; the current synthetic lab tenant is the only one with an approved projection.
- Internal only: the digest-pinned operator jobs, their proofs, and the admission/retirement gates.
- Public/demo only: none.
- Feature flag: none; the governed declaration row remains the only switch.

## Changes Included

- `scripts/ecl/synthetic_enterprise_home_job.ts` (new): shared governed run bindings, job-contract proof fields, a lazy-loaded Blob proof store with a parsed-address pin check and a per-call deadline, transaction statement/lock timeouts, a commit helper that distinguishes a rolled-back commit from an unconfirmed one, and the tenant-input-registry check.
- `scripts/ecl/project_synthetic_enterprise_home.ts`: plan/own-projection detection for `already_projected` re-runs, commit-before-proof with a committed/missing recovery report, post-commit `ANALYZE` of the tables the projection wrote, timeouts, and the `projected_rows_hash` and job-contract proof fields.
- `scripts/ecl/promote_synthetic_enterprise_home.ts`: default mode `check`; the admission gate built through the Home reader's own `buildHomeReviewBundleFromEclProjectionRows`; plan-independent single-table reads joined in memory; manifest quality recorded and a `blocked` manifest refused; readback bound by parsed address and by counted content; all-gates → pending proof → commit → final proof sequencing; `already_active` idempotency.
- `scripts/ecl/retire_synthetic_enterprise_home.ts`: retire by the declaration's own identity (tenant, assessment, projection hash), commit-before-proof, `already_retired` idempotency.
- `scripts/ecl/synthetic_enterprise_home_rows.ts`: "missing stays missing" for `workload_count` and `role_count`, a segment-less function carries `null` not a label, and a new `projectedRowsHash` over the served output.
- Tests: `scripts/ecl/__tests__/test_synthetic_enterprise_home_admission.ts` (new), `test_home_active_assessment_migration.ts` (new), and reworked `test_synthetic_enterprise_home_projection.ts`, `test_synthetic_enterprise_home_gates.ts`, `test_synthetic_enterprise_home_promotion.ts`, `synthetic-enterprise-home-rows.test.ts`, and shared `synthetic_enterprise_gate_fixtures.ts`.
- `.github/workflows/ecl-physical-admission.yml`: three new steps (mapper test, declarations-migration property test, admission/retirement lifecycle test) and a widened, self-checked trigger path list.

## QA / Validation

- Projection DB test (`test_synthetic_enterprise_home_projection.ts`), merged-with-main tree, disposable Postgres: pass.
- Admission/retirement lifecycle DB test (`test_synthetic_enterprise_home_admission.ts`): pass (19 steps).
- Declarations migration property test (`test_home_active_assessment_migration.ts`): pass (24 checks).
- Gate unit tests (`test_synthetic_enterprise_home_gates.ts`): pass (15 tests).
- Mapper unit test (`synthetic-enterprise-home-rows.test.ts`): pass (5 tests).
- Generated-spine promotion test (`test_synthetic_enterprise_home_promotion.ts`): pass.
- Full `ecl-physical-admission.yml` run on a throwaway Postgres, start to finish as the file states it: pass (19 run steps).
- M1 reproduction: with the four `isFactualHomeRow` lines from the upstream change reverted, the preflight now fails ("Home business spine cannot be built from the served projection"); with them present it passes. pass.
- Invariants: v1 and v2 source-set hashes unchanged; current pack `projection_hash` unchanged (`b564fe26…83be`); projected rows identical before/after the mapper change except six `business_unit_profile` rows' `display_payload_json.business_segment` (segment-less functions: "Enterprise shared function" → null). pass.
- Mutation check: 108 single-edit mutations over the new guards; 105 killed, 3 kept guards proven redundant (documented). pass.
- Typecheck (`tsc --noEmit`), ESLint on touched files, `audit:test-ci-coverage:check`, `audit:ci-gate-registry`, `release:check`: pass.
- Live lab run, and signed-in browser proof on `app.abarva.ai`: not run.

## Rollout Plan

No job is run by this change: it ships the job code, the tests and the workflow only. When a projection or promotion is wanted, it still runs as a digest-pinned private ACA operator job, and a promoting run still needs a recorded serving approval in the dataset registry (none is recorded today, so a promotion is refused until one is added). Retirement from the new image works against the current live declaration, by the declaration's own identity, and needs no change to the source definition. Merge by squash through a PR; deploy the exact main SHA through the repo-owned ACA main workflow before any job is built from it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow; the jobs here are private operator jobs, not shared web runtime.
- Approved image digest: recorded by the successful main deploy that builds the operator image.
- ACA runtime invariant: required before any live claim.
- Worker image invariant: required before any live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes, for the admitted synthetic tenant, before `live-proven`.

## Rollback Plan

The change adds no migration, so there is no schema rollback. A promotion is withdrawn by running the guarded, digest-pinned `ecl:synthetic-enterprise-v2:retire-home-job` with the rollback approval and the declaration's tenant, assessment and projection hash; this returns Home to the assessment it reads when no declaration is active (the hard-coded default assessment, not a prior declaration) and leaves the retired row, which still references its manifest, in place. A code rollback is a new PR through the repo-owned main deploy workflow.

## Audit Evidence

PR, CI run of `ecl-physical-admission.yml`, the exact-SHA ACA deploy and runtime-invariant output, and — once a job is run — the private job logs and the Blob proof bundles (projection, pending admission, admission, retirement), plus signed-in Home screenshots, are the evidence to inspect before marking released.

## Known Gaps

Not proven against the lab: no projection, admission or retirement job has been run on the shared lab database or storage from the operator image; the plan-independence rewrite, the post-commit `ANALYZE` behaviour under the real operator role, and the proof-store deadline are proven only against a local throwaway Postgres and a filesystem proof-store stand-in. No serving approval is recorded for the synthetic tenant, so a real promoting run is refused until one is added. The live signed-in browser proof on `app.abarva.ai` is not done. The admission gate loads the Home reader at run time under `--conditions=react-server`; this is exercised in CI and locally but not from the built operator image.