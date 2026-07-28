# 2026-07-28-review-package-db-shape-fix — Review Package Database Shape Fix

## Release ID

`2026-07-28-review-package-db-shape-fix`

## Status

`candidate`

## Plain-English Summary

This release candidate hardens the Knowledge review dry-run package reader so it can inspect deployed candidate rows even when optional review-helper columns have not yet been added to the private tenant database. It preserves the same dry-run boundary: no approvals are created, no review decisions are applied, and no Knowledge baseline is published.

## Layer Impact

- Lane: `client-data-lane`.
- Operations: Fixes an operator dry-run script used to prepare review evidence packages.
- Governance: Keeps dry-run output separate from human approval and ledger mutation.
- Canonical model: Reads candidate rows and optional evidence/hash metadata without promoting them.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, Cube, or runtime product behavior changes.

## Client Applicability

- All clients: Applies to future Knowledge execution lanes that use the shared dry-run package path.
- Specific clients: Prepared for one synthetic tenant execution lane.
- Internal only: Operator script behavior and governance evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-review-decision-ledger.mjs`
- Release record for this candidate.

## QA / Validation

- PASS: `node --check scripts/knowledge/build-review-decision-ledger.mjs`
- PASS: `npm run test:knowledge-process-executors`
- PASS: `npm run release:check`
- Pending after deploy: governed ACA dry-run job against the private tenant data plane.

## Rollout Plan

Merge to main after validation. The normal ACA main deploy ships the script into the runtime image. A later governed ACA job may rerun the dry-run package against private data-plane candidate rows. This release does not authorize review approval, decision-ledger apply, baseline publication, source landing, product refresh, or runtime cutover.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy may ship the script after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the normal deploy lane if deployed.
- ACA runtime invariant: Required before using the deployed image for governed jobs.
- Worker image invariant: Required before using the deployed image for governed jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof required because no product behavior changes.

## Rollback Plan

Revert this PR and rerun the governed dry-run job with the previous approved image if needed. Since the script remains dry-run only and writes no review decisions, rollback does not require data-plane cleanup.

## Audit Evidence

- PR for this release candidate.
- Focused executor test output.
- Release check output.
- Later governed ACA job logs and proof bundle, if executed after deployment.

## Known Gaps

- This release does not add optional columns to the private tenant database.
- This release does not apply review decisions, publish a Knowledge baseline, build projections, refresh Home, or expose tenant content in product surfaces.
