# 2026-08-22-move-target-architecture-structure - Moves Target Architecture Structure

## Release ID

`2026-08-22-move-target-architecture-structure`

## Status

`candidate`

## Plain-English Summary

Moves target architecture generation now uses a fixed, decision-focused architecture structure instead of allowing the artifact to expand into a generic long-form binder. The structure keeps the artifact focused on the architecture approval, requires an options-and-trade-offs section, and adds explicit section-level authoring budgets.

## Layer Impact

Layer 4 Products: Updates the Moves deliverable generation contract for the target architecture artifact. No tenant intake, source adapter, canonical model, data-plane loader, graph, migration, registry, or read-model behavior changes.

## Client Applicability

- All clients: Moves deliverable generation users.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Mark target architecture as a fixed-structure deliverable.
- Add an options-considered and trade-offs section required by the quality bar.
- Add section-level word budgets across the conceptual, logical, physical, orchestration, integration, controls, risk, and recommendation sections.
- Add tests proving the brief resolver uses the fixed target architecture structure and keeps the authored budget below the export ceiling.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts --runInBand` - pass, 73/73.
- `npx eslint src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts` - pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` - pass.
- `npm run release:check` - pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, retry the affected Moves phase generation and confirm the target architecture artifact uses the fixed structure and clears the options/trade-off quality warning.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in deliverable generation retry proof after deployment.

## Known Gaps

This change narrows the target architecture authoring contract. It does not approve generated artifacts or change gate thresholds.
