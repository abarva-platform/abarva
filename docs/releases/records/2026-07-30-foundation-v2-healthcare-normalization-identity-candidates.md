# 2026-07-30-foundation-v2-healthcare-normalization-identity-candidates — Healthcare J3/J4 Candidate Wave

## Release ID

`2026-07-30-foundation-v2-healthcare-normalization-identity-candidates`

## Status

`candidate`

## Plain-English Summary

Adds the governed database job for the Healthcare Foundation V2 wave after verified source volume. The job reads the already committed source-volume rows, writes normalized row artifacts, classifies identity and relationship disposition, creates pending-review candidates, and records layer gates. It does not reload source files and does not create canonical records, publications, baselines, projections, Cube objects, provider bindings, or model-generated narrative.

## Layer Impact

Release lane: `client-data-lane`.

Client Intake: No change. The source-volume package and committed counts remain frozen.

Source Adapters: Adds readback and reconciliation for the source-volume database rows as the input contract for normalization.

Canonical Model: Adds pending normalized objects and pending knowledge candidates only. No canonical object promotion is performed.

Products: No product surface changes.

## Client Applicability

- All clients: No.
- Specific clients: Healthcare Foundation V2 isolated golden-slice lane only.
- Internal only: Yes, governed data-plane execution tooling.
- Public/demo only: No.
- Feature flag: No product flag.

## Changes Included

- `scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs`
- `scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- `scripts/foundation-v2/load-healthcare-source-volume-db.mjs`
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`
- `package.json`

Repair addendum: the first live apply attempt stopped before commit at J3A because PostgreSQL could not infer the type of the normalization-version value inside the normalized payload JSON builder. The repair adds an explicit SQL text cast and a self-test guard for that cast.

Proof-manifest repair addendum: the second live apply rerun reached final proof assembly after the heavy J3/J4 work, then stopped before commit because a local variable shadowed the business-key reconciliation function. The repair renames the proof-manifest row variables and adds a self-test guard against that shadowing pattern.

Reader-proof repair addendum: the successful writer apply and independent reader verify matched the row and field counts, but the reader manifest omitted the per-layer J3A/J3B/J3C/J4 readback blocks. The repair makes reader verify independently recompute those layer readbacks and fail the verification status if any layer block does not pass.

## QA / Validation

Planned validation before release:

- Pass: `node --check scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs`
- Pass: `node --check scripts/foundation-v2/load-healthcare-source-volume-db.mjs`
- Pass: `node --check scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs --mode self-test`
- Pass: `npm run release:check`

Repair validation:

- Pass: `node --check scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs`
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs --mode self-test --out-dir /tmp/healthcare-normalize-self-test --execution-id unit-test-execution`

Proof-manifest repair validation:

- Pass: `node --check scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs`
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs --mode self-test --out-dir /tmp/healthcare-normalize-self-test --execution-id unit-test-execution`

Reader-proof repair validation:

- Pass: `node --check scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs`
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/normalize-healthcare-source-volume-db.mjs --mode self-test --out-dir /tmp/healthcare-normalize-self-test --execution-id unit-test-execution`

Not run yet: data-plane validation requires managed-identity execution of preflight, apply, and independent reader verify after deployment.

## Rollout Plan

Merge through PR, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved image, then run the Healthcare managed-identity preflight, apply, and reader verification jobs. The apply job is append-only and refuses mixed downstream state unless the existing J3/J4 output already matches the expected source-volume counts exactly.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web image update before ACA job execution.
- Shared runtime mutators: None in this release.
- Approved image digest: Captured after main deploy.
- ACA runtime invariant: Required before claiming the deployed image is current.
- Worker image invariant: Job must run on the approved deployed image digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this candidate-generation wave.

## Rollback Plan

Do not delete or overwrite the frozen source-volume release. If the J3/J4 job fails, stop at the earliest failed transition, patch the job, redeploy through the approved workflow, and rerun from the affected layer. If the job has not committed, rollback is the database transaction rollback. If a fully committed J3/J4 candidate wave later needs supersession, perform it through an explicit follow-on controlled release instead of in-place mutation.

## Audit Evidence

- PR URL and commit SHA for this release candidate.
- Self-test proof for the normalization script.
- Source-volume verification proof showing 40 source files, 140,773 source records, 1,437,376 source field values, one parser execution, two source-volume gates, and zero unexplained source-level variance.
- ACA job proof directories for normalize-candidates preflight, apply, and independent reader verify.
- J3A/J3B/J3C/J4 gate results and family/business-key reconciliation CSVs.

## Known Gaps

This release does not prove review decisions, canonical promotion, publication, immutable baseline creation, projection, Cube parity, product binding, signed-in Knowledge, or model grounding/refusal.
