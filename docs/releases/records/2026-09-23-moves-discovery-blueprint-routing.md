# 2026-09-23-moves-discovery-blueprint-routing — Moves Discovery Blueprint Routing

## Release ID

`2026-09-23-moves-discovery-blueprint-routing`

## Status

`candidate`

## Plain-English Summary

This change tightens how Moves selects a domain-specific discovery evidence blueprint. A use case now needs both domain language and service-workflow or assistant language before it receives the specialized service-assist discovery package. A straightforward reporting or dashboard use case stays on the general discovery package instead of receiving unrelated regulated-data, model-risk, or service-center requirements.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Moves discovery guidance and deliverable prompts select a more precise evidence blueprint before artifact generation. No canonical data, client intake files, adapters, registry state, or data-plane state change.

## Client Applicability

- All clients: Applies to Moves discovery guidance and generated discovery-plan prompts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts`
- `src/lib/deliverables/orchestrator/__tests__/discovery-plan.test.ts`
- `scripts/audit/moves-agent-assist-blueprint.mjs`

## QA / Validation

- `npm run audit:moves-agent-assist-blueprint` — passed.
- `npx jest src/lib/deliverables/orchestrator/__tests__/discovery-plan.test.ts src/lib/programs/discovery/__tests__/evidence-readiness.test.ts --runInBand` — passed, 16/16 tests.
- `npm run test:moves-context-extract` — passed, 18/18 tests.

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps deploy workflow may rebuild and deploy the web image after merge. No manual migration, data load, registry activation, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Moves discovery/gate workflow proof after deploy.

## Rollback Plan

Revert the pull request and allow the repo-owned deploy workflow to redeploy the previous behavior. No data rollback is required.

## Audit Evidence

- Smoke report: `reports/moves-e2e-operating-smoke/20260923T222629Z/`
- Focused test outputs under `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/`

## Known Gaps

This change only fixes discovery blueprint routing. The broader Moves P0-P5 operating smoke test remains in progress.
