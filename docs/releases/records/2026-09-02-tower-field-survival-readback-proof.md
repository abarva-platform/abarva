# 2026-09-02-tower-field-survival-readback-proof — Tower Field Survival Readback Proof

## Release ID

`2026-09-02-tower-field-survival-readback-proof`

## Status

`candidate`

## Plain-English Summary

Tower already had generated-package contracts for AI business cases and AI tool rollouts. This release makes the database readback prove the same contract after the canonical layer, product read models, and cube slices are loaded. A future pilot can no longer pass local package validation while silently losing detail before the product or aVa consumption path.

## Layer Impact

global-control-lane: adds reusable field-survival readback enforcement and job entrypoints that apply to every future Tower package carrying these contracts.

client-data-lane: Layer 3 canonical readback now verifies that AI case and AI tool object attributes survive into canonical objects, and that AI tool usage/adoption metrics survive as canonical measures.

client-data-lane: Layer 4 products and cubes readback now verifies that AI case and AI tool detail survives into product payloads and cube slice dimensions/measures.

internal-admin: adds readback-only ACA job scripts with proof-bundle emission, so live verification can use the governed operator wrapper instead of ad-hoc command overrides.

## Client Applicability

- All clients: applies to any generated Tower package that carries the AI business-case or AI tool rollout contract files.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- `scripts/tower/load-healthcare-demo-layer4-products.mjs`
- `scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs`
- `scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`
- `package.json`

## QA / Validation

- PASS: `node scripts/tower/load-healthcare-demo-layer3-canonical.mjs --out-dir /tmp/tower-layer3-readback-proof-dryrun-20260902b`
- PASS: `node scripts/tower/load-healthcare-demo-layer4-products.mjs --out-dir /tmp/tower-layer4-readback-proof-dryrun-20260902b`
- PASS: `node scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs`
- PASS: `node scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`
- PASS: `npx eslint scripts/tower/load-healthcare-demo-layer3-canonical.mjs scripts/tower/load-healthcare-demo-layer4-products.mjs scripts/tower/__tests__/run-ai-business-case-field-survival-tests.mjs scripts/tower/__tests__/run-tool-rollout-field-survival-tests.mjs`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD`
- NOT RUN YET: live ACA readback-only proof jobs.

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. After deployment, run the Layer 3 and Layer 4 readback-only operator jobs against the approved image to prove the loaded rows still satisfy the field-survival contract.

## Deployment Authority

- Repo-owned deploy workflow: required for web/runtime image changes.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow.
- ACA runtime invariant: required before live proof.
- Worker image invariant: required before live proof.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this readback-only contract change; browser proof remains required for UI claims.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main workflow. The change adds stricter proof and richer payload fields; it does not require a destructive data rollback. If the stricter readback exposes existing data gaps, stop promotion and keep the prior loaded data until the package is repaired.

## Audit Evidence

- PR URL and CI run.
- Main deploy workflow run and digest.
- ACA operator readback-only proof bundles for Layer 3 and Layer 4.
- Dry-run SQL emitted under `/tmp/tower-layer3-readback-proof-dryrun-20260902b` and `/tmp/tower-layer4-readback-proof-dryrun-20260902b` during local validation.

## Known Gaps

Signed-in browser proof is still separate. This release proves field survival in the data plane; it does not by itself prove drawer layout, aVa answer quality, or visual fidelity.
