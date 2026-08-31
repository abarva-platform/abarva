# 2026-08-31-tower-adoption-lens-row-scope — Tower Adoption Lens Row Scope

## Release ID

`2026-08-31-tower-adoption-lens-row-scope`

## Status

`candidate`

## Plain-English Summary

The Tower Command Center adoption lens now limits its rollout table to rows sourced from the tool-rollout intake. Business cases that reference tool usage still appear in the full AI portfolio, but they no longer inflate the rollout count or render as tool rows with missing rollout fields.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Tower-only rendering selector change. No data model, loader, serving view, tenant data, or retrieval behavior changes.

## Client Applicability

- All clients: Yes, for the Tower Command Center adoption lens.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/views/ContractTabs.tsx`
- `src/components/tower/command-center/__tests__/mechanical-panels.test.tsx`

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower/command-center/__tests__/mechanical-panels.test.tsx --runInBand` passed.
- `npx eslint src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/__tests__/mechanical-panels.test.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit --pretty false` passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower src/lib/tower --runInBand --silent` matched the known Tower baseline: 6 failed suites / 21 failed tests, with one additional passing regression test.

## Rollout Plan

Merge through the protected PR path. The standard repo-owned Azure Container Apps main deploy workflow will build and deploy the next main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Must be verified by the deploy workflow and any live-proof run.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Required before claiming the changed Tower surface is live-proven.

## Rollback Plan

Revert the PR and allow the standard main deploy workflow to publish the prior component selector. No migration rollback is required.

## Audit Evidence

- Focused mechanical panel regression test.
- Focused ESLint run.
- Full TypeScript check.
- Release control check.
- Tower-scope Jest baseline comparison.
- Live signed-in observation before the change showed portfolio and rollout rows mixed in the adoption lens; post-deploy proof is required after merge.

## Known Gaps

No data-plane reload is included in this candidate. This release only narrows the product render selector for the adoption lens.
