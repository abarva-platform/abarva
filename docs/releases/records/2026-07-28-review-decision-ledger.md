# 2026-07-28-review-decision-ledger — Review Decision Ledger

## Release ID

`2026-07-28-review-decision-ledger`

## Status

`candidate`

## Plain-English Summary

This release candidate adds a governed review-decision ledger for the controlled Knowledge execution path. Candidate entities, facts, and relationships now carry a content hash, review batches are versioned by policy, and accepted decisions are blocked unless the candidate hash, evidence, validation run, source version, policy, reviewer, and batch approval all match. The change is a safety gate only; it does not publish a Knowledge baseline or expose new product content.

## Layer Impact

- Lane: `client-data-lane`.
- Canonical model: Adds review policy, review batch, review batch approval, and candidate hash fields needed before candidates can become accepted Knowledge objects.
- Governance: Requires explicit, auditable review decisions before candidate promotion.
- Operations: Adds a deterministic ledger package builder with dry-run output and a double-confirmed apply path for governed operator use.
- Products: No direct UI, API, Home, Source, Moves, Tower, Intelligence, Learn, Pricing, or Cube runtime behavior changes.

## Client Applicability

- All clients: Applies to future Knowledge execution lanes that use the shared 3C-2E schema and executor.
- Specific clients: Prepared for a single synthetic tenant execution lane in this PR.
- Internal only: Operator scripts and governance schema controls.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Shared 3C-2E SQL contract adds candidate content hashes and review policy/batch/approval controls.
- Entity candidates now persist evidence references so entity approvals can be revalidated from the database, not only from a generated package.
- Knowledge executor now writes candidate hashes and validates accepted review decisions before promotion.
- Review-decision ledger builder creates deterministic batch and decision packages.
- Job runner accepts validation-run and review-policy identifiers for enforcement.
- Tenant PostgreSQL readiness plans now include RLS coverage for review batch and review batch approval tables.
- Focused executor tests cover stale hash, unauthorized reviewer, deterministic batching, commercial/model-derived review routing, and accepted-decision promotion.

## QA / Validation

- `node --check scripts/knowledge/build-review-decision-ledger.mjs`
- `node --check scripts/knowledge/processing/review-decision-policy.mjs`
- `node --check scripts/knowledge/processing/executor-framework.mjs`
- `node --check scripts/knowledge/hcdn-job-runner.mjs`
- `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` passed.
- Dry-run ledger package generated from a fixture: deterministic entity classified as auto-accept eligible, commercial/BAFO fact classified for individual review, and both remained deferred until explicit approval.
- Apply guard negative test passed: `--mode apply` is blocked unless `ABARVA_REVIEW_LEDGER_APPLY_ACK=APPLY_REVIEW_LEDGER` is present.
- Independent failure-mode review found and fixed a batch-scope gap: an accepted decision must now be present in the approved batch hash manifest, not merely reuse an approved batch reference.
- Independent failure-mode review also tightened entity evidence handling: entity candidate evidence refs are now stored and checked during review apply.
- Regenerated tenant PostgreSQL readiness plans show RLS table coverage increasing from 51 to 53 for the new review batch controls.

## Rollout Plan

Merge to main only after review. The merge updates repository code and schema artifacts. Any database migration, ledger apply, source landing, parser wave, candidate promotion, publication, projection build, or product refresh must happen through a separate governed execution PR and operator job.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy may ship code artifacts after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the normal deploy lane if deployed.
- ACA runtime invariant: Required only if this code is deployed to the shared runtime.
- Worker image invariant: Required only before running governed operator jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof required because no product behavior changes.

## Rollback Plan

Revert the PR before any governed execution job consumes the new ledger package. If a later execution PR applies the schema, rollback must be handled by that execution record because data-bearing review rows may exist.

## Audit Evidence

- PR for this release candidate.
- Focused executor test output.
- Dry-run ledger package proof.
- Apply guard negative proof.

## Known Gaps

- Existing candidate rows created before this change may not have content hashes; they must be regenerated or processed by a separate governed hash-backfill job before approval can succeed.
- This PR does not authorize any publication, domain publish, baseline publish, projection build, Home refresh, evaluator reconciliation, or source corpus load.
- The required `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md` file named by repository instructions is absent in this isolated worktree; this PR follows the shared 3C-2E governance package and release-control boundaries visible in the repository.
