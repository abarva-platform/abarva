# 2026-07-28-review-policy-distribution-tuning — Knowledge Review Policy Distribution Tuning

## Release ID

`2026-07-28-review-policy-distribution-tuning`

## Status

`candidate`

## Plain-English Summary

This release candidate tunes the Knowledge review-package classifier so deterministic, source-derived, evidence-backed candidates can be grouped for auto-eligible or batch review, while judgment-dependent candidates still require individual review. It keeps the dry-run boundary intact: no review approvals are created, no review decisions are applied, and no Knowledge baseline is published.

## Layer Impact

- Lane: `client-data-lane`.
- Operations: Refines the review-package classification policy and report metadata.
- Governance: Preserves human approval and mutation guards; deterministic grouping is an approval accelerator, not an automatic write.
- Canonical model: Reads candidate entities, facts, and relationships for classification only.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, Cube, or runtime product behavior changes.

## Client Applicability

- All clients: Applies to future Knowledge review-package generation that uses the shared classifier.
- Specific clients: Prepared for one synthetic tenant execution lane.
- Internal only: Operator review-policy logic, dry-run reports, and governance evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/review-decision-policy.mjs`
- `scripts/knowledge/build-review-decision-ledger.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Release record for this candidate.

## QA / Validation

- PASS: `node --check scripts/knowledge/processing/review-decision-policy.mjs`
- PASS: `node --check scripts/knowledge/build-review-decision-ledger.mjs`
- PASS: `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- PASS: `npm run test:knowledge-process-executors`
- Pending after deploy: governed ACA dry-run job against the private tenant data plane to verify the real candidate distribution.

## Rollout Plan

Merge to main after validation. The normal ACA main deploy ships the classifier into the runtime image. A later governed ACA job may regenerate the dry-run review package against private data-plane candidate rows. This release does not authorize human approvals, review-decision apply, baseline publication, source landing, product refresh, or runtime cutover.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy may ship the script after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the normal deploy lane if deployed.
- ACA runtime invariant: Required before using the deployed image for governed jobs.
- Worker image invariant: Required before using the deployed image for governed jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof required because no product behavior changes.

## Rollback Plan

Revert this PR and regenerate the dry-run package with the previous approved classifier if needed. Since the release writes no review decisions, rollback does not require data-plane cleanup.

## Audit Evidence

- PR for this release candidate.
- Focused executor test output.
- Release check output.
- Later governed ACA dry-run job logs and proof bundle, if executed after deployment.

## Known Gaps

- This release does not approve batches or apply review decisions.
- This release does not publish a Knowledge baseline, build projections, refresh product pages, or expose tenant content in product surfaces.
- The real candidate distribution must be confirmed by a governed dry-run job after deployment.
