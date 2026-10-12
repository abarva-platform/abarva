# 2026-10-11-tower-registered-intake-serving-promotion — Select a reviewed Tower assessment

## Release ID

`2026-10-11-tower-registered-intake-serving-promotion`

## Status

`candidate`

## Plain-English Summary

This release prepares the governed selection of one already staged Tower assessment for display. The selected assessment must match its approved source version, physical stage receipt, private proof bundle, and direct database readback. The switch changes which assessment Tower reads; it does not edit source files, create new facts, or turn unknown amounts into approved claims.

## Layer Impact

Release lane: `client-data-lane`.

- Layers 1–3: no source or canonical data changes. The promotion checks that stored rows still match the registered source set and canonical measures.
- Layer 4: the exact tenant's Tower lifecycle selector moves from the prior assessment to the approved staged assessment in one transaction. Other tenants and products are unaffected.

## Client Applicability

- All clients: no automatic change.
- Specific clients: only the exact synthetic tenant, assessment, source version, and Tower surface named in the human-authored serving approval and operator proof.
- Internal only: operator preflight, selection, readback, and rollback.
- Public/demo only: the selected synthetic demonstration assessment after verification.
- Feature flag: none.

## Changes Included

- Record the release basis for an exact Tower serving approval. The named approval itself must be supplied by the approving person in the dataset manifest; this record does not grant it.
- Accept the staged evidence gap's declared aggregate coverage references in the promotion validator only when their scope, source file, and source hash match the manifest. Reject other null-row references.
- Use the existing guarded Tower promotion operator, which checks the stage receipt, private proof bytes, source hashes, all nine physical view counts and fingerprints, linked measures, prior active generation, and money-claim limits before switching the lifecycle pointer.
- Add reusable read-only preflight and guarded promotion entry points for the private ACA operator Job. The wrapper binds the requested job name, timeout, and image digest to the run. The runner checks the exact staged ZIP, candidate, receipt, and source hashes before either operation.
- Save the exact preflight proof and SHA-256 to private Blob with readback. After promotion, save the operator proof, a direct active-selector and nine-view serving readback, progress, and job-contract metadata with Blob readback. A failed post-commit proof step records a fresh selector observation for review without automatic rollback.
- Preserve the prior assessment for a guarded rollback.

## QA / Validation

- Local validation passed: the governance manifest validator, release check, ESLint on the changed operator and test, and all ten focused promotion tests. The new ACA runner has nine focused local tests covering exact proof bytes and hashes, guarded approval and Blob-scope binding, wrapper request binding, serving view populations, private proof logging, and post-error selector classification; its changed JavaScript passes ESLint.
- The physical stage and a separate read-only re-attestation succeeded on a digest-pinned private ACA Job. An independent read-only database probe matched the expected staged table counts, nine view counts, source version, and unchanged active selector. The private proof ZIP was read back at its expected checksum.
- The manifest records the human-supplied exact serving approval. The focused validator test checks declared aggregate evidence coverage and rejects the wrong scope, file, source hash, or row key.
- Before promotion, run the new ACA preflight entry point from the exact staged candidate and receipt. It writes `preflight.json` under `operator-proof/tower-registered-promotion/<tenant>/<assessment>/<run-id>/` in private Blob, reads back its bytes, and prints the complete saved proof plus SHA-256 in the private job log. It must report `ready` with no gaps, and its SHA-256 must be pinned in the promotion request.
- After promotion, verify the new active lifecycle and serving selector, all nine served view populations, and the signed-in Tower tabs. Record failures separately; a pointer change alone is not live product proof.

## Rollout Plan

After the approving person supplies the exact `serving_approval` entry, validate the manifest and merge it with this record through a protected PR. Let the repo-owned ACA main workflow deploy the new manifest on a digest-pinned image. Verify web and required worker digest parity. Run `tower:registered-intake:preflight-job` through `ops:aca-job`, review the private proof and checksum, then run `tower:registered-intake:promote-job` with its exact URI/SHA and the same candidate, receipt, source hash, and approval reference. The promotion job writes `promotion.json`, `serving-readback.json`, `progress.json`, and `job-contract.json` under the same private proof lane. Verify database and signed-in product behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` exclusively changes shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: captured after the main deploy and bound to the private operator job.
- ACA runtime invariant: template image, healthy 100% traffic revision, and required worker images match the approved digest.
- Worker image invariant: same approved digest as the web image.
- ACR build policy: shared web images are built only by the repo-owned deploy workflow with the required Premium registry and Buildx cache; this operator job reuses the approved digest and does not build or prune images.
- Feature/env flag update path: none.
- Live signed-in proof required: all affected Tower tabs after the serving selector changes.

## Rollback Plan

Keep the prior assessment rows during the rollback window. Use the saved promotion proof and its exact checksum to run the guarded rollback operation; it verifies the prior view fingerprints and restores the prior lifecycle pointer in one transaction. Recheck the serving selector and signed-in tabs afterward.

## Audit Evidence

The human-authored manifest approval, PR and CI, main ACA deploy record, digest invariant, private stage and re-attestation receipts, independent database and Blob readbacks, preflight proof and checksum, promotion proof, nine serving-view readback, private job-contract metadata, and signed-in tab observations form the release trail. The private proof lane is `operator-proof/tower-registered-promotion/<tenant>/<assessment>/<run-id>/`.

## Known Gaps

The current intake does not establish an approved fiscal-year budget or claimable AI value. A modeled spend amount has a single source, and source populations with different meanings must remain separate. Category rows are source-row identities and must not be added to the aggregate or contract exposures. A serving switch does not cure these source gaps or prove every page's presentation until the signed-in check passes.
