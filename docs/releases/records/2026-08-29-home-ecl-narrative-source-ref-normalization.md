# 2026-08-29-home-ecl-narrative-source-ref-normalization — Home ECL Narrative Source Ref Normalization

## Release ID

`2026-08-29-home-ecl-narrative-source-ref-normalization`

## Status

`candidate`

## Plain-English Summary

This change fixes the Home ECL narrative operator so structured projection source references are treated as lineage citations instead of being misread as absent. The empty-packet refusal remains in place; the job can proceed only when governed rows carry usable evidence references, basis, quality, admission, value state, and source hash.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Home narrative generation now normalizes structured ECL source-reference payloads before applying the governed packet readiness gate.

Layer 3 Canonical Model: No canonical schema or data changes.

Layer 2 Source Adapters: No adapter changes.

Layer 1 Client Intake: No intake workbook or source-room changes.

## Client Applicability

- All clients: Applies to Home ECL narrative generation once the operator job uses an image containing this change.
- Specific clients: None.
- Internal only: Operator proof metadata is written for audit and troubleshooting.
- Public/demo only: None.
- Feature flag: Existing Home provider routing is unchanged by this script-only candidate.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — pass, focused Home narrative contract checks.
- `npm run test:ecl-projection-schema-reconciliation` — pass, ECL projection/schema contract reconciliation.
- `git diff --check` — pass, whitespace validation.
- `npm run release:check` — pass required before merge.

## Rollout Plan

Merge through a pull request and deploy through the repository-owned ACA main deploy workflow. Then rerun the Home ECL narrative apply job through the governed ACA operator with the digest-pinned web image and Key Vault-backed `DATABASE_URL` and `ANTHROPIC_API_KEY`. Run the independent readback job afterward.

## Deployment Authority

- Repo-owned deploy workflow: Required before this behavior is available in the shared ACA image.
- Shared runtime mutators: None in this change.
- Approved image digest: To be supplied by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Required before claiming any live runtime effect.
- Worker image invariant: Required before running the operator job from the new image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a narrative rebuild and product-route verification.

## Rollback Plan

Revert the merge commit and redeploy through the same ACA workflow, or run the Home narrative job from the previous approved image. No database rollback is performed by this code merge. If bad narrative rows exist, rerun the last accepted Home projection load or a corrected narrative apply after rollback.

## Audit Evidence

- Focused local tests listed above.
- Operator apply/readback proof remains required after deployment.

## Known Gaps

No corrected live narrative rebuild or signed-in browser proof is claimed by this candidate. Those require the deployed image, an operator apply run, independent readback, and Home browser verification.
