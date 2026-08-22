# 2026-08-22-move-architecture-agent-binding-normalization - Moves Architecture Agent Binding Normalization

## Release ID

`2026-08-22-move-architecture-agent-binding-normalization`

## Status

`candidate`

## Plain-English Summary

Moves target architecture generation now normalizes generated agent bindings into explicit target architecture agent nodes before structured-model validation. This keeps the architecture visual model internally consistent when the model describes an agentic overlay but omits the corresponding target node declaration.

## Layer Impact

Layer 4 Products: Updates the Moves target architecture structured-model generation path. No tenant intake, source adapter, canonical model, data-plane loader, graph, migration, registry, or read-model behavior changes.

## Client Applicability

- All clients: Moves target architecture generation users.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing structured-exhibits eligibility only.

## Changes Included

- Strengthen the target architecture generation prompt so each agent binding must also declare a target agent node.
- Normalize generated agent bindings by adding missing target `agent` nodes in the `agentic` layer before validation.
- Add a regression test for the live failure mode where an agent binding references an undeclared target node.

## QA / Validation

- `npx jest --runTestsByPath src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/visual-system/__tests__/architecture-html-renderer.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand` - pass, 37/37.
- `npx eslint src/lib/visual-system/architecture-generation.ts src/lib/visual-system/__tests__/architecture-generation.test.ts` - pass.
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
- Live signed-in proof required: Yes, retry the affected Moves phase generation and confirm the target architecture artifact clears structured-model validation.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in deliverable generation retry proof after deployment.

## Known Gaps

This change fixes generated architecture model consistency. It does not approve generated artifacts or weaken quality gates.
