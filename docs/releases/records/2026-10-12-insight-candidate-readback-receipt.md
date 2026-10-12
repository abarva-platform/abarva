# 2026-10-12-insight-candidate-readback-receipt

## Release ID
`2026-10-12-insight-candidate-readback-receipt`

## Status
`candidate`

## Plain-English Summary
Record actual-versus-expected candidate content and lineage hashes in the private verification proof. Add an independent readback-only job so verification never requires repeating a data load.

## Layer Impact
`client-data-lane`: Layer 3/4 operator verification only. Existing write validation is preserved; readback performs a bounded read-only transaction and writes only immutable private audit artifacts.

## Client Applicability
Internal only: explicitly scoped operators using an existing exact approved dataset version. No product selection, source review, indexing, citation readiness, confidence or serving activation changes.

## Changes Included
Structured content/lineage comparison receipt, captured post-commit verifier output, readback-only mode and npm entry point, plus actual PostgreSQL behavior tests.

## QA / Validation
PASS: 54 behavior cases and 67 actual PostgreSQL cases, including a SELECT-only readback role, unchanged stored rows, exact version/approval rejection, actual payload/governance/lineage comparisons, and rejection of altered content and references. PASS: full typecheck, focused lint with zero errors, CI coverage census without drift, and release checks 11/11. NOT RUN: deployed private readback under the new receipt contract. Existing native data loads are not repeated to produce this new proof.

## Rollout Plan
Protected-main PR and the repo-owned deploy workflow `.github/workflows/aca-main-deploy.yml`. After the approved release digest and exclusive operator window are verified, run `ecl:integrated-insights:readback-job` with the exact tenant, assessment, dataset and expected version hash. Canonical drift, missing or changed stored data, lineage drift or nonzero ready counts fail closed.

## Deployment Authority
Only the repo-owned deploy workflow may change shared web traffic. Preserve Premium ACR, the ACR build policy requiring Buildx GitHub Actions cache, digest-pinned images and the ACA runtime invariant across web template, 100% traffic revision and required worker images. No ad-hoc builds, mutable images, flag changes or traffic shifts. Private jobs require exclusive scope, terminal proof, cleanup and independently verified idle restoration. A private receipt does not replace signed-in product acceptance.

## Rollback Plan
Revert code through a protected-main PR and approved ACA release. The readback mode modifies no tenant database rows. Retain existing immutable audit records; do not delete or manufacture verification evidence.

## Audit Evidence
Review PR tests, SQL comparison guards, private content/governance/lineage hashes, actual candidate and ready counts, original load run identity, runtime digest and native job/idle proof. Public artifacts contain no client narrative or private evidence payloads.

## Known Gaps
Verification is bound to an unchanged exact canonical version. It does not approve data, promote readiness, materialize a new product projection, generate narrative, activate a product, or attest independent human or Finance review.
