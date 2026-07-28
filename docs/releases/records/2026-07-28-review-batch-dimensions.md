# 2026-07-28-review-batch-dimensions — Review policy: evidence inheritance + batch dimensions

## Release ID

`2026-07-28-review-batch-dimensions`

## Status

`candidate`

## Plain-English Summary

Layers the remaining review-policy requirements on top of the classification
tuning already on main (#5697), without changing its classifier: entity evidence
inheritance, batch splitting across the governed review dimensions, representative
samples per batch, and reason/dimension distributions in the summary. Dry-run
only; writes no decisions.

## Layer Impact

Release lanes: **`experimental`** (governed review tooling, dry-run only) and
**`internal-admin`** (airline-demo-new pilot operations). Not `global-control-lane`,
not `client-data-lane`, not `public-demo`. No product-runtime or schema change.

## Client Applicability

- Internal only (airline-demo-new pilot). No tenant activation.

## Changes Included

- `scripts/knowledge/processing/review-decision-policy.mjs`:
  - evidence inheritance — an evidence-less entity referenced by a source-backed
    fact inherits lineage → batch review (never auto-accepted);
  - `buildReviewBatches` splits by class/type/domain/source-family/evidence-
    completeness/confidence-band/current-target/commercial-sensitivity/relationship-
    impact, with `representativeSamples` per batch;
  - `createReviewSummary` adds by-domain / by-source-family / by-evidence /
    by-confidence-band / by-reason distributions.
- `scripts/knowledge/__tests__/run-review-batch-dimensions-tests.mjs` (+ package
  script `test:review-batch-dimensions`).

## QA / Validation

- 5 new gap-fill tests + full knowledge-process-executor suite green; ESLint 0
  errors. Classification behavior from #5697 is preserved (not modified).

## Rollout Plan

Merge to `main`. Regenerating the Airline review dry-run package with these
batches is a governed passwordless run (see the Entra bridge PR). Applying review
decisions stays human-gated.

## Deployment Authority

- Repo-owned deploy workflow: unchanged. No shared runtime mutation.

## Rollback Plan

Revert the PR; classification is unchanged, so only batching/summary shape reverts.

## Audit Evidence

- This record + the two test suites.

## Known Gaps

- The revised package (counts/samples/hashes) is produced by the governed
  passwordless regeneration run, pending the Entra-admin decision + bridge apply.
