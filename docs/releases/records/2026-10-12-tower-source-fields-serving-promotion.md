# 2026-10-12-tower-source-fields-serving-promotion — Show declared source fields in Tower

## Release ID

`2026-10-12-tower-source-fields-serving-promotion`

## Status

`candidate`

## Plain-English Summary

This release prepares Tower to show the owner, status, phase, business area, and expected kind of benefit that the registered intake already declares. The new assessment is loaded and checked but is not yet the one Tower displays. A delegated serving decision for this exact version has been recorded by the manager authorized by the account owner; it is not an independent review by that owner or a client. The decision must be represented truthfully in the governed manifest before the selection changes. The switch will not create a budget, confirm a financial return, or infer a missing owner or tool.

## Layer Impact

Release lane: `client-data-lane`.

The approval-proof preservation is shared Tower operator behavior; it applies to later candidate promotions, while this serving decision remains bound to one exact synthetic tenant and assessment.

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

- Bind the delegated serving decision `delegated-tower-source-fields-serving-20261012-001` to assessment `tower-registry-candidate-a70df3b56bffc9be` and source-set hash `11d0f3f92b0c1da9cd4ca2bf369d0a90587b2deac15f4108262b1d154f829c40`. The manager's private decision is approved with execution conditions. This record alone does not satisfy the manifest approval gate or change Tower serving.
- Carry the resolved manifest approval record into the Tower preflight and promotion proofs. A missing or mismatched record blocks the preflight, and a changed record invalidates the reviewed proof before promotion.
- The Tower approval verifier fetches exact authority and decision bytes from the private proof lane, checks their hashes through the shared trusted-decision resolver, and compares the decision scope with candidate and receipt bytes, the private bundle readback, and the tenant-scoped prior selector observed in the database.
- Reuse the guarded Tower promotion operator. It checks the exact stage receipt and private proof bundle, current source and physical rows, nine page counts and fingerprints, linked measures, the prior active assessment, and financial claim limits before switching the lifecycle pointer.
- Keep the previous assessment and its view fingerprints available for a guarded rollback.

## QA / Validation

- Source-field candidate and stage tests passed before the approved load. PR #9449 merged after its checks; the repo-owned ACA deploy run `38238176478` succeeded on the approved digest-pinned image.
- The private stage and separate re-attestation succeeded. An independent read-only database check matched 17 source-file rows, 327 selected source records, 237 objects, 308 measures, 352 projection entries, all nine page populations and fingerprints, and an unchanged active selector.
- A private-network Blob readback matched the re-attested ZIP checksum `c5d694f7d975d4148fe40e0eb88a295eb6b4d7070e070819e654e0ef594cff7a` and candidate checksum `bc04b5bbd56115272c41973bafea26bf5e76834467f76f934fc48272d9889c14`. Its materialized validation and quality gate passed.
- A check-only live preflight verified the physical assessment and private bundle. The only remaining gap was `serving_approval:manifest carries no serving_approval`. No promotion has run, and no signed-in version 5 page proof exists yet.
- The delegated manager checked the native database, Blob, and preflight outputs against their log markers. The original decision file was bound by SHA-256 `8ffc3814eb4cc03b90652fd7f0b33b0b6a16d2a1a70b547fd82273f384b0e9b8` and expressly excluded independent client or Finance attestation. The shared manifest contract and validation have since been released.
- The delegated manager certified a normalized Tower-only decision with SHA-256 `ebb0891e9fd0f118425c8c9e401c0124aee19d4d0cdffb0f3834ca666a7b9f16`, bound to the original decision and its conditions. The private ACA proof job `job-abarva-private-operator-eus-q8cou2q` uploaded the exact authority and decision bytes and read them back with matching SHA-256 and URI. It succeeded, restored the idle job template, and removed its temporary secrets. Direct host download is blocked by the private storage network policy; the in-network native readback is the proof.
- The exact delegated manifest entry passes structural validation in the candidate branch. The combined shared-contract and Tower code passes TypeScript, 21 delegated approval tests, 11 Tower promotion tests, changed-file lint, and all 11 release gates. Fresh ready preflight, selector change, and signed-in proof remain pending.

## Rollout Plan

The exact delegated decision is included in this candidate PR and has passed structural validation. The shared verifier and private proof upload are complete. Merge the Tower verifier and manifest through the protected PR path. Let the repo-owned ACA main deploy workflow build and deploy that commit. Verify the web template, healthy 100% traffic revision, and required worker jobs at the same approved digest. Run a fresh private ACA preflight; it must say `ready` with no gaps and save its exact proof and checksum. Run the guarded private ACA promotion against that proof and approval reference. Verify the active selector, all nine served views, and the signed-in Tower tabs and detail drawers before calling the fields visible.

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

The human-supplied load approval, PR #9449 and ACA deploy run `38238176478`, private stage and re-attestation receipts, independent database and Blob readbacks, blocked check-only preflight, exact private delegated decision, structurally valid candidate manifest entry, and successful private approval-proof upload with native SHA-256 readback are the current evidence. Ready preflight proof, promotion proof, active-view readback, and signed-in checks remain future evidence. The private stage proof is under `operator-proof/tower-registered-partial/<assessment>/<stage-run-id>/`.

## Known Gaps

The delegated decision is present in a structurally valid candidate manifest and its private approval proof has been read back, but the Tower selector remains on the earlier version. The source set does not declare a primary funding domain or approved fiscal-year funding for these programs, and the AI cases lack a declared crosswalk to the separate benefit and usage feeds. The new fields provide source context; they do not validate a financial result or fill those missing source relationships.
