# Curated Readiness Selector Refusal

## Release ID

`2026-09-18-curated-readiness-selector-refusal`

## Status

`candidate`

## Plain-English Summary

The readiness source now declares curated evidence unavailable when the active input packet lacks the expected identifiers. It no longer turns broad keyword matches into a curated readiness claim.

## Layer Impact

`global-control-lane`, Layer 4 product projection only. The selector and answer context change; canonical records, intake files, and data-plane state do not change.

## Client Applicability

Specific clients: only the explicitly matched demonstration tenant route. Other tenant keys are excluded by exact alias matching. No feature flag changes.

## Changes Included

The focused selector, ask-source adapter, and their behavior tests are the complete candidate. Curated IDs must match the expected category and tenant key across the required domains.

## QA / Validation

Focused behavior tests passed. The old row-count tests used a retired curated fixture as their baseline; they now assert that the current active packet is unavailable and use an isolated synthetic fixture to cover the valid curated path. A temporary keyword-fallback mutation failed the active-packet regression test, then was removed. Scoped lint and TypeScript passed. The release gate result is recorded in task validation before promotion.

## Rollout Plan

No rollout is authorized by this record. A future reviewed pull request and the repository-owned main deployment workflow would be required to make this candidate active.

## Deployment Authority

Only the repository-owned main deployment workflow may update the shared runtime. There is no runtime mutator, image digest, worker update, or traffic change in this candidate. Live signed-in proof remains required after any authorized deployment.

## Rollback Plan

Revert the selector and ask-source change through a reviewed pull request. No schema or tenant-data rollback is required.

## Audit Evidence

The local focused test, mutation check, lint, TypeScript result, release gate, and workspace diff are the candidate evidence. No deployment or browser proof is claimed.

## Known Gaps

The active input packet still lacks the curated identifiers, so this source remains unavailable. The wider answer path may include other independently retrieved sources; a signed-in answer check is still required before claiming end-to-end refusal behavior.
