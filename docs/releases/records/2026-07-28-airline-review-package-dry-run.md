# 2026-07-28-airline-review-package-dry-run — Knowledge Review Package Dry Run

## Release ID

`2026-07-28-airline-review-package-dry-run`

## Status

`candidate`

## Plain-English Summary

This release candidate adds a database-backed dry-run package for the governed Knowledge review path. Operators can summarize candidate entities, facts, and relationships into review batches, exception queues, sample rows, hashes, CSVs, JSON, and an HTML report before any human approval or ledger mutation occurs.

## Layer Impact

- Lane: `client-data-lane`.
- Operations: Adds a repeatable dry-run package path for candidate review preparation.
- Governance: Makes the review package explicitly stop at human approval; the package proposes zero accepted decisions.
- Canonical model: Reads candidate rows and evidence references but does not promote, publish, or mutate them.
- Products: No Home, Source, Moves, Tower, Intelligence, Learn, Pricing, or Cube runtime behavior changes.

## Client Applicability

- All clients: Applies to future Knowledge execution lanes that use the shared review-decision controls.
- Specific clients: Prepared for one synthetic tenant execution lane.
- Internal only: Operator scripts, review package artifacts, and governance evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-review-decision-ledger.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- `package.json`
- Release record for this candidate.

## QA / Validation

- PASS: `node --check scripts/knowledge/build-review-decision-ledger.mjs`
- PASS: `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- PASS: `npm run test:knowledge-process-executors`
- PASS: `npm run release:check`

## Rollout Plan

Merge to main only after validation. The normal ACA main deploy can ship the script into the runtime image. A later governed ACA job may run the dry-run package against private data-plane candidate rows and return the proof bundle. No review decisions, approvals, publication, projections, source landing, or product refresh are included in this PR.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy may ship the script after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the normal deploy lane if deployed.
- ACA runtime invariant: Required before using the deployed image for governed jobs.
- Worker image invariant: Required before using the deployed image for governed jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof required because no product behavior changes.

## Rollback Plan

Revert the PR before any governed dry-run job consumes the new package path. Since the package is dry-run only and writes no review decisions, rollback does not require data-plane cleanup.

## Audit Evidence

- PR for this release candidate.
- Focused executor test output.
- Dry-run package fixture test proving no accepted decisions are proposed without human approval.
- Later governed ACA job proof bundle, if executed after deployment.

## Known Gaps

- This PR does not apply schema, generate human approvals, write review decisions, publish a Knowledge baseline, build consumption projections, refresh Home, or expose any tenant content in product surfaces.
- Database-backed execution requires the approved private data-plane ACA job with valid PostgreSQL credentials.
