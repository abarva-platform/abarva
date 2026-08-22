# 2026-08-22-move-source-register-family-hygiene — Moves Source Register Family Hygiene

## Release ID

`2026-08-22-move-source-register-family-hygiene`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables already keep opaque source ids out of the main narrative, but the Source Register appendix could still show internal source-family codes such as generated-artifact families. This release humanizes source-family labels before they render in generated artifacts and adds a guard so those internal family codes are treated as leaks if they appear in client-facing text.

## Layer Impact

- Layer 4 Products: Moves generated artifact rendering and validation are tightened. No canonical data, tenant intake, registry, or data-plane state changes are included.

## Client Applicability

- All clients: Yes, for generated Moves deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/source-register.ts`
- `src/lib/deliverables/orchestrator/section-generation.ts`
- Focused regression coverage in orchestrator source-register, section-generation, quality-validator, and renderer tests.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/source-register.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — 4 suites / 66 tests.

## Rollout Plan

Merge by PR to `main`; the repo-owned ACA deploy workflow will rebuild the application image. No migration, feature flag, data-plane load, registry activation, or tenant data mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Yes, on merge to `main`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming the refreshed generated artifact output is live-proven.

## Rollback Plan

Revert the PR to restore the previous Source Register family rendering and leak-scan behavior. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6651
- Focused test output listed above.
- Post-merge ACA deploy/runtime invariant: pending.
- Signed-in regenerated artifact proof: pending.

## Known Gaps

This release does not accept, approve, sign, or otherwise promote any generated Move deliverable. It only tightens client-facing artifact hygiene before the next generation/proof run.
