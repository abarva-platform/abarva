# 2026-08-21 Operator Refresh Proof Metadata And Tower Dimension Seed

## Release ID

`2026-08-21-operator-refresh-proof-metadata-and-tower-dimension-seed`

## Status

Candidate

## Plain-English Summary

This release fixes operator-refresh defects found during the lab refresh run. Proof summaries now embed the ACA operator commit/digest metadata even when the container image does not include `.git`, and the Tower evidence projector now supplies live-schema mandatory metric-definition fields when it seeds metric dimension rows, including check-constrained enum values and tenant-scoped metric provenance. Periodless metric values remain evidence gaps instead of receiving fabricated dates.

## Release Lane

`client-data-lane`

## Layer Impact

Release lane: `client-data-lane`.

- SOURCE ADAPTERS: no change.
- CANONICAL MODEL: no canonical record or source-of-truth change.
- PRODUCTS: Home, Tower, Source, and runtime refresh proof metadata changes; Tower receives a narrow dimension-seeding fix required for its evidence projection.
- DATA PLANE: no migration; governed operator jobs only.

## Client Applicability

- All clients: no.
- Specific clients: none by default.
- Internal only: governed lab/operator refresh lane.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Runtime-layer, runtime-readback, Source L4, Home landscape, and Tower evidence summaries prefer `ABARVA_OPERATOR_BRANCH_COMMIT` when `.git` is absent.
- Home and Tower summaries include `ABARVA_OPERATOR_IMAGE_DIGEST` when the ACA job wrapper supplies it.
- Tower evidence refresh supplies all live-schema mandatory generated metric-definition fields with deterministic type-aware values, including the metric key, tenant key, domain, label/name/title, description, unit, direction, status/category-style fields, booleans, numerics, dates, timestamps, JSON and arrays.
- Tower evidence refresh reads live check constraints from the referenced metric-definition table and picks permitted enum values, including `aggregation_rule`, instead of falling back to unconstrained placeholder strings.
- Tower evidence refresh now seeds tenant-scoped `tower.metric_provenance` rows before writing observations, so `metric_observation.provenance_id` foreign keys resolve to the build that produced them.
- Tower evidence refresh skips observation rows when the canonical value has no measurement period, preserving the missing-period condition as a claim evidence gap.

## QA / Validation

- pass: `npx eslint scripts/data-build/refresh-runtime-layers.ts scripts/data-build/verify-runtime-layer-refresh-readback.ts scripts/data-build/refresh-source-l4-cube.ts scripts/data-build/refresh-home-landscape.ts scripts/data-build/refresh-tower-value-evidence.ts`
- pass: `ABARVA_OPERATOR_BRANCH_COMMIT=test-sha ABARVA_OPERATOR_IMAGE_DIGEST=sha256:test TOWER_EVIDENCE_BUILD_VERSION=tower-period-gate-patch-dry npx tsx scripts/data-build/refresh-tower-value-evidence.ts --out-dir /tmp/nexus-tower-evidence-period-gate-patch-dry`
- pass: `HOME_LANDSCAPE_BUILD_VERSION=home-patch-dry HOME_LANDSCAPE_INPUT_SOURCE_VERSION=test-input npx tsx scripts/data-build/refresh-home-landscape.ts --out-dir /tmp/nexus-home-landscape-patch-dry`
- pending: post-merge ACA deploy and governed Tower evidence operator rerun.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow builds the digest-pinned runtime image. After deploy, rerun the governed Tower evidence refresh job through the private ACA operator runner.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may update the shared lab web runtime. The Tower evidence refresh must run through the private ACA operator job with a digest-pinned image and database secret reference.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main workflow. If Tower evidence refresh has already run, rerun the prior approved Tower refresh or restore the prior Tower evidence rows through the governed operator lane.

## Audit Evidence

- Prior operator attempts failed before commit on live metric-dimension mandatory-column, check-constraint, metric-provenance foreign-key, and metric-observation period requirements; the ACA runner restored to idle.
- Local dry-run summaries confirm the metadata fields populate from operator environment variables.
- Follow-up proof is expected from the post-deploy Tower evidence operator rerun.

## Known Gaps

- Home and Tower projectors still log proof JSON rather than emitting tar proof markers for automatic wrapper extraction.
- This release does not add new migrations, product route browser proof, retrieval indexing proof, or migration/cutover authorization.
