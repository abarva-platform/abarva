# 2026-07-15-intelligence-knowledge-runtime-pr8 — Intelligence Progressive Context Runtime

## Release ID

`2026-07-15-intelligence-knowledge-runtime-pr8`

## Status

`released`

## Plain-English Summary

This release adds a default-off Intelligence runtime helper that assembles governed Enterprise Knowledge context before a future Claude synthesis path. It proves Intelligence can build fast context, deep context, a progressive Claude-ready payload, timing evidence, and guardrails without changing the current Intelligence ask behavior or default Claude prompt.

## Layer Impact

- `global-control-lane`: Adds shared Enterprise Knowledge runtime contract code and audit proof for Intelligence.
- `public-demo`: Produces static proof artifacts showing the context story for Meridian and HarborTrust examples.
- `experimental`: The new runtime helper is gated by `ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_RUNTIME=false`.

## Client Applicability

- All clients: No default runtime behavior change.
- Specific clients: Meridian Health and HarborTrust Bank appear only in proof fixtures.
- Internal only: Audit proof and architecture documentation.
- Public/demo only: None.
- Feature flag: `ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_RUNTIME=false`.

## Changes Included

- Adds `src/lib/enterprise-knowledge/intelligence/intelligence-knowledge-runtime.ts`.
- Exports reusable Intelligence fast/deep/progressive context builders.
- Adds `scripts/audit/build-intelligence-knowledge-runtime-proof.ts`.
- Adds `npm run audit:intelligence-knowledge-runtime`.
- Adds proof outputs under `reports/enterprise-knowledge-layer/intelligence-runtime-proof/`.
- Adds `docs/architecture/intelligence-knowledge-runtime.md`.

## QA / Validation

- `npm run audit:intelligence-knowledge-runtime`: Pass.
- `npm run audit:home-knowledge-preview`: Pass.
- `npm run audit:moves-knowledge-runtime`: Pass.
- `npm run audit:knowledge-module-preview`: Pass.
- `npm run audit:enterprise-knowledge-cache`: Pass.
- `npm run audit:enterprise-knowledge-assembler`: Pass.
- `npm run audit:enterprise-knowledge-layer`: Pass.
- `npm run audit:enterprise-naming`: Pass.
- `npm run release:check`: Pass.
- Isolated TypeScript compile for Enterprise Knowledge Intelligence/cache/contracts/audit files: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge to main after validation. No Azure Container Apps deployment is required for this release because the helper is default-off, not wired into a route, and does not change runtime navigation, route behavior, or environment flags.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this default-off proof helper.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not required unless a later PR wires the helper into a live route or changes runtime flags.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Future ACA release only; this PR does not set or change production flags.
- Live signed-in proof required: Not required for this proof-only PR; a later signed-in proof PR will exercise Home, Moves, and Intelligence after runtime wiring.

## Rollback Plan

Revert the PR. Because the helper is default-off and not route-wired, rollback does not require data migration, tenant data repair, candidate demotion, or ACA traffic changes.

## Audit Evidence

- `reports/enterprise-knowledge-layer/intelligence-runtime-proof/summary.md`
- `reports/enterprise-knowledge-layer/intelligence-runtime-proof/summary.json`
- `reports/enterprise-knowledge-layer/intelligence-runtime-proof/intelligence-runtime-proof.html`
- `reports/enterprise-knowledge-layer/intelligence-runtime-proof/timing.json`

## Known Gaps

- This PR does not call Claude.
- This PR does not change the default Intelligence ask path.
- This PR does not perform signed-in browser proof.
- This PR does not promote candidate data or update Active Tenant Access.
