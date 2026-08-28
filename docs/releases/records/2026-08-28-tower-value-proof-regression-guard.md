# 2026-08-28-tower-value-proof-regression-guard — Tower value proof guards

## Release ID

`2026-08-28-tower-value-proof-regression-guard`

## Status

`candidate`

## Plain-English Summary

The Tower Value Proof trajectory summary already labels the gap between planned value and recorded
actual value as `Not yet proven`. This release adds a regression test so that wording does not drift
back into a plan-performance label. It also renames the Layer 3 loader-only semantic counter field
so it cannot be mistaken for a physical database column; the persisted semantic type remains in
`attributes_json`.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 (canonical model):** no schema or persisted row-shape change. The loader cleanup keeps
  the internal semantic count gate while making the loader-only field explicit; semantic type
  remains stored and validated inside `attributes_json`.
- **Layer 4 (products):** no runtime presentation change. A focused test now guards the accepted
  Tower Value Proof wording.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/__tests__/plan-variance-label.test.ts` guards the
  `Not yet proven` label and zero-floored unproven remainder.
- `scripts/tower/load-healthcare-demo-layer3-canonical.mjs` renames the internal semantic count
  helper field so it is visibly loader-only and not confused with the persisted JSON key.

## QA / Validation

- PASS: `npm test -- src/components/tower/command-center/__tests__/plan-variance-label.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
  returned 18 passing tests.
- PASS: `npm run tower:healthcare-demo-layer3-canonical:load -- --out-dir /tmp/tower-layer3-semantic-cleanup-local-2`
  generated a dry-run Layer 3 summary with 987 objects, including semantic counts for budget,
  program, AI use case, AI tool, value observation, Finance approval event, and evidence item.
- PASS: `npm run tower:healthcare-demo-layer3-canonical:validate -- --summary /tmp/tower-layer3-semantic-cleanup-local-2/tower_layer3_ecl_context_load_summary.json --readback /tmp/tower-layer3-semantic-gate-aca-proof-5215b796-rerun/proof/meridian-tower-layer3-canonical/03-readback.json`
  passed all semantic-count and readback gates.
- PASS: `git diff --check`.
- PASS: `npx eslint src/components/tower/command-center/__tests__/plan-variance-label.test.ts scripts/tower/load-healthcare-demo-layer3-canonical.mjs`.
- PASS: `npx tsc -p tsconfig.json --noEmit --pretty false`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- Pending after merge: ACA deploy verification.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and deploys the web image.
No migration, data build, feature flag, or environment update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: must be verified after deploy.
- Worker image invariant: unaffected.
- Feature/env flag update path: not used.
- Live signed-in proof required: no for behavior change; optional browser proof can confirm the
  guarded Tower wording remains visible.

## Rollback Plan

Revert the squash commit and let the repo-owned ACA deploy workflow publish the previous web image.
This rollback removes the regression test and restores the prior loader-only field name.

## Audit Evidence

- PR diff and review.
- Focused test output.
- Release check output.
- Post-deploy ACA runtime invariant if merged.

## Known Gaps

This release does not promote `canonical_semantic_type` to a real database column or add it to a
uniqueness key. That remains a separate schema decision before cube build-out.
