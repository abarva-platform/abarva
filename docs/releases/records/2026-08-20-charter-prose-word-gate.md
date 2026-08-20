# 2026-08-20-charter-prose-word-gate — Charter Prose Word Gate

## Release ID

`2026-08-20-charter-prose-word-gate`

## Status

`candidate`

## Plain-English Summary

The Move Charter quality gate now measures the charter word band against prose, not required table text. The hard size gate still blocks overlong narrative, but required decision, scope, and discovery-preparation tables no longer make an otherwise concise charter fail only because table cells were counted as body prose.

## Layer Impact

Layer 4 / Products (`global-control-lane`): affects Strategic Moves deliverable generation quality validation for the Charter artifact only. It does not change canonical data, tenant data, retrieval, or runtime configuration.

## Client Applicability

- All clients: Strategic Moves Charter generations use the updated prose-counting gate.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` sets Charter word-band counting to prose-only.
- Targeted tests assert the Charter quality bar uses prose-only counting while preserving the hard ceiling.

## QA / Validation

- PASS — `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/shared/__tests__/charter-contract-reconciliation.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts`
- PASS — `npx eslint src/lib/deliverables/orchestrator/quality-bar-registry.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/shared/__tests__/charter-contract-reconciliation.test.ts`
- PASS — `npx tsc --noEmit`
- PASS — `npm run release:check`
- PENDING — live Move re-run of the P1 Charter generation after merge/deploy.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. After deployment, re-run the signed-in P1 Charter generation for the live Move proof.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, P1 Charter generation/readback.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, CI/check output, ACA deploy run, and signed-in P1 Charter generation proof.

## Known Gaps

This only fixes the Charter length-counting false block. It does not add agent-ready evidence to the Move or approve any phase gate.
