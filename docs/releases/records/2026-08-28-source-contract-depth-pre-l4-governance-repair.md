# 2026-08-28-source-contract-depth-pre-l4-governance-repair — Source Depth Pre-L4 Governance Repair

## Release ID

`2026-08-28-source-contract-depth-pre-l4-governance-repair`

## Status

`candidate`

## Plain-English Summary

Repairs two pre-product-projection issues in the Source contract-depth package before any Layer 4 cube activation. The dataset manifest now records the actual active-task operator approval basis instead of a personal-name placeholder, and unassessed market-alternative posture remains blank/null instead of being inferred from contract archetype.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 / governance manifest: updates the package approval field and notes to reflect the bounded active-task authorization and synthetic/demo-only limits.

Layer 3 / canonical model: keeps unassessed `alternatives_available` values out of contract payloads and adds a readback guard so the package verification fails if any contract in this package carries an assessed alternative posture without evidence.

Layer 4 / products: blocks a misleading visible projection before Source dashboards, Contract 360, Optimize, or aVa can consume it.

## Client Applicability

- All clients: no.
- Specific clients: canonical synthetic healthcare demo tenant only.
- Internal only: yes, operator data-build governance and proof lane.
- Public/demo only: yes, synthetic demo package.
- Feature flag: none.

## Changes Included

- `docs/governance/dataset-manifests/meridian-contract-depth-v1-20260828.json`
- `src/lib/source/contract-depth-package/projection.ts`
- `src/lib/source/contract-depth-package/__tests__/projection.test.ts`
- `scripts/source/load-contract-depth-package.ts`
- `scripts/source/__tests__/load-contract-depth-package.test.ts`

## QA / Validation

Completed:

- `pass`: focused Jest tests for the package projection and loader.
- `pass`: ESLint for touched TypeScript files.
- `pass`: `npm run release:check`.

Pending:

- `pending`: ACA Layer 3 repair job readback showing `contracts_with_assessed_alternatives = 0`.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the approved image, then rerun the existing Source contract-depth package Layer 3 apply/verify job with the same tenant, dataset version, load run id, and idempotency key. Layer 4 activation remains blocked until the repaired Layer 3 readback passes.

## Deployment Authority

- Repo-owned deploy workflow: required for the updated operator image.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: must be proven after deployment.
- Worker image invariant: must be checked after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after Layer 4 projection is activated.

## Rollback Plan

Revert the PR and rerun the previous operator image only if the current repair is found to block loading. Do not proceed to Layer 4 projection from a reverted image unless the alternative-evidence issue is separately resolved.

## Audit Evidence

- PR URL and merge SHA.
- ACA main deploy workflow run for that SHA.
- Layer 3 ACA repair proof bundle with readback counts.
- Subsequent Layer 4 proof bundle after product projection.

## Known Gaps

Layer 4 cube activation is intentionally still pending. This release only repairs the governance and canonical-payload defects before product projection.
