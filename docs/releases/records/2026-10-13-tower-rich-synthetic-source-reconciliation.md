# 2026-10-13 Tower synthetic source reconciliation

## Release ID

`2026-10-13-tower-rich-synthetic-source-reconciliation`

## Status

`candidate`

## Release Lane

`public-demo` synthetic data package and projection load controls. The candidate applies to one demo tenant only; it does not change a client data plane or shared web traffic.

## Plain-English Summary

This candidate repairs a retained synthetic Tower source package so its Finance budget breakdown agrees with its project portfolio and tool adoption counts make sense. It also marks projected AI benefit and ROI as sponsor scenarios. The candidate is offline and has not changed the served Tower data.

## Layer Impact

- Release lane: `public-demo`.
- Layer 1 client intake: The generated FY26 Finance and PMO extracts now reconcile by domain; project budget periods and the source-plan basis are explicit.
- Layer 2 source adapters: Generated lineage records were rebuilt from the corrected Layer 1 extracts.
- Layer 3 canonical: Budget, project, case and tool objects were regenerated; project period and plan basis survive into canonical rows.
- Layer 4 products: Tower read models and cube files were regenerated. The projection loader carries the source-plan basis into display payloads so product copy can identify estimates honestly.

## Client Applicability

- All clients: No.
- Specific clients: One canonical synthetic demo tenant only.
- Internal only: Offline candidate review and dry validation.
- Public/demo only: Potential later demo after separate load and serving approval.
- Feature flag: None.

## Changes Included

- Deterministic source generator, domain and period quality gates, regenerated source through read-model files, and a draft dataset declaration.
- A new versioned package directory preserves the retained source package and its historical fingerprints.
- Layer 2, 3 and 4 write paths check the exact physical source hash, every generated file hash, assessment, release record and named load approval. Layer 4 stages inactive and does not change the Tower serving selector.
- Successful private Layer 4 stage writes a scoped, immutable private Blob proof bundle. Its URI and SHA-256 are emitted in the job summary only after byte-for-byte Blob readback.
- The tar contains the stage facts and a preliminary local summary; the final ACA job summary/stdout supplies the Blob URI and SHA after upload, avoiding a self-referential tar hash.
- Both projected ROI bounds use the high build-cost estimate as their denominator. The values are plans, separate from Finance-validated actuals.

## QA / Validation

- `node scripts/tower/generate-meridian-layer1-source.mjs` regenerated all package layers from the source generator.
- `node scripts/tower/validate-meridian-layer1-source.mjs` passed 44 offline gates, including physical source/output hashes, exact FY26 domain reconciliation, both budget split identities, conservative ROI formula, source-plan label survival, and active users not exceeding enabled users.
- Seven focused tests passed for exact approval binding, immutable Blob proof readback, PMO period/lineage display fields, and inactive Layer 4 stage SQL. Layer 2, 3 and 4 SQL builds were dry-run only.
- Source set identity and the exact assessment ID are recorded in `package_manifest.json`; the candidate remains `no_runtime_load=true`.

## Rollout Plan

No runtime rollout in this release. A future private ACA job must use the exact package identity and a new assessment ID, after a named declaration and exact-version load approval. The stage proof requires a digest-pinned job image, matching before/after active selectors, nine page row-key/source-hash fingerprints, a passing quality result, and immutable private Blob URI/SHA. Product serving requires a separate exact-version approval and selector promotion review.

## Deployment Authority

- Repo-owned deploy workflow: Required for any later web code deployment.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable yet.
- ACA runtime invariant: Required before any later live claim.
- Worker image invariant: Required before any later data job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before client-facing readiness.

## Rollback Plan

The current served assessment stays untouched during private stage. If this candidate is later served, use the Tower assessment selector rollback operator with exact stage and promotion proof, then verify the prior active assessment and all serving counts. Revert this new package and projection-loader change through a PR if needed; the retained package remains available.

## Audit Evidence

- Generated `package_manifest.json` and `proof_manifest.json` with per-file SHA-256 values.
- `validation_report.json` and `validation/validation_results.json` showing all 44 offline gates.
- Dry Layer 4 SQL with no lifecycle selector mutation, focused approval/Blob tests, and any later private ACA proof bundle, once available.

## Known Gaps

- The draft declaration has no human signoff or exact-version load/serving approval.
- The package has not been privately staged, loaded, served or verified in the signed-in product.
- The offline validator currently requires `no_runtime_load=true`; the future approval-bound load-ready transition must validate its separate exact named approval when setting that flag to false. The current package remains offline.
- The synthetic scenario does not establish current-client AI spend, Finance-approved benefit, or realized ROI.
