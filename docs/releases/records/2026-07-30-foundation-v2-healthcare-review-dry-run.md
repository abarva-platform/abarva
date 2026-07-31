# 2026-07-30-foundation-v2-healthcare-review-dry-run - Healthcare J5 Review Dry Run

## Release ID

`2026-07-30-foundation-v2-healthcare-review-dry-run`

## Status

`candidate`

## Plain-English Summary

Adds the governed database job for the Healthcare Foundation V2 J5 review dry run after verified normalization, identity, relationship, and candidate generation. The job reads the pending candidate set, creates a review batch, writes one deterministic dry-run review decision per candidate, records the J5 gate, and produces independent readback proof. It does not update candidate state and does not create canonical records, publications, baselines, projections, Cube objects, provider bindings, product evidence, or model-generated narrative.

## Layer Impact

Release lane: `client-data-lane`.

Client Intake: No change. The source-volume release remains frozen.

Source Adapters: No change. The job reads already committed source-volume and candidate rows.

Canonical Model: Adds J5 review batch and dry-run review decisions only. No canonical object promotion is performed.

Products: No product surface changes.

## Client Applicability

- All clients: No.
- Specific clients: Healthcare Foundation V2 isolated golden-slice lane only.
- Internal only: Yes, governed data-plane execution tooling.
- Public/demo only: No.
- Feature flag: No product flag.

## Changes Included

- `scripts/foundation-v2/review-healthcare-candidates-db.mjs`
- `scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`
- `package.json`

## QA / Validation

Planned validation before release:

- Pass: `node --check scripts/foundation-v2/review-healthcare-candidates-db.mjs`
- Pass: `node --check scripts/foundation-v2/run-golden-slice-db-aad.mjs`
- Pass: `FOUNDATION_V2_DOMAIN=healthcare node scripts/foundation-v2/review-healthcare-candidates-db.mjs --mode self-test`
- Pass: `npm run release:check`

Not run yet: managed-identity preflight, apply, and independent reader verify must run after merge and repo-owned ACA deployment.

## Rollout Plan

Merge through PR, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved image, then run the Healthcare managed-identity J5 review-dry-run preflight, apply, and independent reader verification jobs. The apply job is idempotent and refuses partial review state unless the existing dry-run review batch, decisions, and gate already match the expected candidate counts exactly.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web image update before ACA job execution.
- Shared runtime mutators: None in this release.
- Approved image digest: Captured after main deploy.
- ACA runtime invariant: Required before claiming the deployed image is current.
- Worker image invariant: Job must run on the approved deployed image digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this review dry-run wave.

## Rollback Plan

Do not delete or overwrite the frozen source-volume release or the verified J3/J4 candidate wave. If the J5 job fails before commit, rollback is the database transaction rollback. If a fully committed J5 dry-run decision set later needs supersession, perform it through an explicit follow-on controlled release instead of in-place mutation.

## Audit Evidence

- PR URL and commit SHA for this release candidate.
- Self-test proof for the review dry-run script.
- J3/J4 verification proof showing 140,773 normalized objects, 140,773 pending-review candidates, four normalization gates, and exact field-disposition reconciliation.
- ACA job proof directories for review-dry-run preflight, apply, and independent reader verify.
- J5 gate result plus source-family and candidate-type decision reconciliation CSVs.

## Known Gaps

This release does not prove canonical promotion, publication, immutable baseline creation, projection, Cube parity, product binding, signed-in Knowledge, or model grounding/refusal.
