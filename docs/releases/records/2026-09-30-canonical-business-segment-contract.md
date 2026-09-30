# 2026-09-30 Canonical Business Segment Contract

## Release ID

`2026-09-30-canonical-business-segment-contract`

## Status

`candidate`

## Plain-English Summary

The inactive canonical data build and CSV adapter can now represent a declared business segment as its own identified object. Functions can reference the segment by its declared key, while readers retain the segment's human-readable name. This prepares a governed business-context reader; it does not publish new Home content.

## Layer Impact

Release lane: `client-data-lane`. This is a shared intake/canonical contract, but no client data is loaded by this release.

- Layer 2, source adapters: adds an explicit business-segment mapping profile. Existing universal-template profiles remain unchanged.
- Layer 3, canonical model: recognizes segment rows as identified enterprise objects and resolves declared function membership. The file-based build version advances to v2 because its output changes.
- Layer 4, products: no runtime read, projection, or UI change in this release.

## Client Applicability

- All clients: the mapping contract is available when a future governed packet selects it.
- Specific clients: none are loaded or promoted by this change.
- Internal only: the inactive file-based canonical report can include declared segment objects.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Adds a typed `business_segments` source class and mapping profile.
- Adds stable canonical segment identity using `segment_key`, with `segment_name` retained for display.
- Resolves business-function membership using declared `business_segment_key` values.
- Adds adapter and canonical-build tests.

## QA / Validation

- Source-adapter suite: 57 passed.
- CI-covered behavior suite, including the canonical segment test and coverage census: 168 suites and 1,765 tests passed.
- TypeScript typecheck with an 8 GB Node heap: passed.
- ESLint on changed TypeScript files: passed.
- `git diff --check`: passed.
- Full canonical-build audit: still fails on seven unmapped guide/extract inputs outside this segment contract; no whole-pipeline pass is claimed.
- No runtime or data-plane validation is claimed.

## Rollout Plan

Merge by PR. The repo-owned ACA main workflow may deploy the shared image; this change does not activate a data load or Home reader. A dataset manifest, digest-pinned ACA data-build job, proof bundle, quality gate, and human review are required before any new segment dataset is promoted or wired to a product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- ACA runtime invariant: verify after deployment before claiming runtime status.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: only to confirm the existing Home record state is unchanged; no new segment UI is claimed.

## Rollback Plan

Revert the PR through the protected main workflow. No schema migration or tenant data write needs reversal.

## Audit Evidence

The PR, local test output, GitHub checks, ACA main deployment, and signed-in Home state are the release evidence. No data-build proof bundle exists for this contract-only release.

## Known Gaps

- The serving Home business-profile view has no producer for these segment objects in this release.
- A governed dataset manifest and data-build review remain prerequisites for live use.
- Existing reviewed Home narrative is not regenerated or attested by this change.
- Seven unrelated active-intake files remain unmapped in the canonical-build audit.
