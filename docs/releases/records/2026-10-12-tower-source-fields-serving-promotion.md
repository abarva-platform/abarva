# 2026-10-12-tower-source-fields-serving-promotion — Show declared source fields in Tower

## Release ID

`2026-10-12-tower-source-fields-serving-promotion`

## Status

`candidate`

## Plain-English Summary

This release prepares Tower to show the owner, status, phase, business area, and expected kind of benefit that the registered intake already declares. The new assessment is loaded and checked but is not yet the one Tower displays. A separate named serving approval is required before the selection changes. The switch will not create a budget, confirm a financial return, or infer a missing owner or tool.

## Layer Impact

Release lane: `client-data-lane`.

- Layers 1–2: no source-file or adapter change in this promotion.
- Layer 3: no new write to canonical objects or measures. The staged assessment and its source links must match the approved load receipt.
- Layer 4: the exact tenant's Tower selector may move from projection version 4 to version 5 after governed approval and preflight. Other tenant selectors and product surfaces stay unchanged.

## Client Applicability

- All clients: no automatic change.
- Specific clients: one registry-selected synthetic tenant, exact assessment, and exact source-set hash.
- Internal only: approval, preflight, promotion, readback, and rollback operations.
- Public/demo only: the selected synthetic Tower view after verification.
- Feature flag: none.

## Changes Included

- Record the proposed serving decision for assessment `tower-registry-candidate-a70df3b56bffc9be` and source-set hash `11d0f3f92b0c1da9cd4ca2bf369d0a90587b2deac15f4108262b1d154f829c40`. This record does not grant that decision; the approving person must supply the `serving_approval` in the dataset manifest.
- Reuse the guarded Tower promotion operator. It checks the exact stage receipt and private proof bundle, current source and physical rows, nine page counts and fingerprints, linked measures, the prior active assessment, and financial claim limits before switching the lifecycle pointer.
- Keep the previous assessment and its view fingerprints available for a guarded rollback.

## QA / Validation

- Source-field candidate and stage tests passed before the approved load. PR #9449 merged after its checks; the repo-owned ACA deploy run `38238176478` succeeded on the approved digest-pinned image.
- The private stage and separate re-attestation succeeded. An independent read-only database check matched 17 source-file rows, 327 selected source records, 237 objects, 308 measures, 352 projection entries, all nine page populations and fingerprints, and an unchanged active selector.
- A private-network Blob readback matched the re-attested ZIP checksum `c5d694f7d975d4148fe40e0eb88a295eb6b4d7070e070819e654e0ef594cff7a` and candidate checksum `bc04b5bbd56115272c41973bafea26bf5e76834467f76f934fc48272d9889c14`. Its materialized validation and quality gate passed.
- A check-only live preflight verified the physical assessment and private bundle. The only remaining gap was `serving_approval:manifest carries no serving_approval`. No promotion has run, and no signed-in version 5 page proof exists yet.

## Rollout Plan

After the approving person supplies the exact `serving_approval` entry, add it to the manifest in a protected PR and validate it. Let the repo-owned ACA main deploy workflow build and deploy that commit. Verify the web template, healthy 100% traffic revision, and required worker jobs at the same approved digest. Run a fresh private ACA preflight; it must say `ready` with no gaps and save its exact proof and checksum. Run the guarded private ACA promotion against that proof and approval reference. Verify the active selector, all nine served views, and the signed-in Tower tabs and detail drawers before calling the fields visible.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone may shift shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture the digest after the serving-approval PR deploy and bind it to the private operator request.
- ACA runtime invariant: template image, healthy 100% traffic revision, and required worker images match that digest.
- Worker image invariant: the required worker jobs match the approved web digest.
- Feature/env flag update path: none.
- Live signed-in proof required: affected Tower tabs and program and AI-case detail drawers after the selector changes.

## Rollback Plan

Keep the version 4 assessment and proof during the rollback window. The guarded rollback checks the promotion proof and prior view fingerprints, restores the earlier lifecycle selector in one transaction, and requires a fresh database and signed-in page readback. Do not delete staged version 5 rows to roll back a serving decision.

## Audit Evidence

The human-supplied load approval, PR #9449 and ACA deploy run `38238176478`, private stage and re-attestation receipts, independent database and Blob readbacks, and blocked check-only preflight are the current evidence. The serving approval, ready preflight proof, promotion proof, active-view readback, and signed-in checks remain future evidence. The private stage proof is under `operator-proof/tower-registered-partial/<assessment>/<stage-run-id>/`.

## Known Gaps

The serving approval has not been supplied. The source set does not declare a primary funding domain or approved fiscal-year funding for these programs, and the AI cases lack a declared crosswalk to the separate benefit and usage feeds. The new fields provide source context; they do not validate a financial result or fill those missing source relationships.
