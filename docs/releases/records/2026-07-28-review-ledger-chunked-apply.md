# 2026-07-28-review-ledger-chunked-apply — Review Ledger Chunked Apply

## Release ID

`2026-07-28-review-ledger-chunked-apply`

## Status

`candidate`

## Plain-English Summary

This release candidate changes the governed Knowledge review-ledger apply path so large approved review packages are written in bounded SQL chunks inside one transaction. It preserves the same package-hash, candidate-hash, policy, reviewer and batch-approval guards, while avoiding a single oversized SQL string.

## Layer Impact

- `client-data-lane`: Review-ledger decisions can be applied for large approved candidate sets without changing the review policy or publication rules.
- `internal-admin`: Operator execution becomes safer for high-volume review packages by keeping the mutation transaction bounded and idempotent.
- Products: No direct Home, Source, Moves, Tower, Intelligence, Cube, API or runtime content change.

## Client Applicability

- All clients: Applies as a reusable Knowledge review-ledger execution control.
- Specific clients: First use is the governed tenant execution lane currently under review.
- Internal only: Operator execution script behavior.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/knowledge/build-review-decision-ledger.mjs`

## QA / Validation

- PASS: `node --check scripts/knowledge/build-review-decision-ledger.mjs`
- PASS: `npm run test:knowledge-process-executors`

## Rollout Plan

Merge to main through PR review, then ship through the normal Azure Container Apps main deploy. The apply command remains dormant unless a governed ACA job runs it with the required approval hashes and `ABARVA_REVIEW_LEDGER_APPLY_ACK=APPLY_REVIEW_LEDGER`.

## Deployment Authority

- Repo-owned deploy workflow: Required for the script to reach the shared runtime image.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before using the updated operator path.
- Worker image invariant: Required for the tenant review job image before apply.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this script-only guard; later product consumption proof is required after baseline and projections.

## Rollback Plan

Revert the PR or redeploy the previous digest. If a governed apply job has already run, rollback is handled by the review-ledger and baseline-publication rollback process; this PR itself does not activate a baseline.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local checks listed in QA / Validation.
- Later governed job proof must include decision counts, approved classes, package hash, candidate manifest hash, execution id and reconciliation output.

## Known Gaps

- This release does not apply review decisions by itself.
- This release does not publish immutable domains, assemble or activate a baseline, build projections, refresh product pages, select an HTTP provider, or prove aVa/Cube/Home consumption.
