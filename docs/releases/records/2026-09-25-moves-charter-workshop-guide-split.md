# 2026-09-25-moves-charter-workshop-guide-split — Split Moves Charter from Workshop Guide

## Release ID

`2026-09-25-moves-charter-workshop-guide-split`

## Status

`candidate`

## Plain-English Summary

Moves phase generation now treats the Program Charter and the next-phase workshop guide as two separate documents. The Charter remains the concise executive authorization record: known facts, sponsor commitment, scope, success measures, governance, constraints, and authorization conditions. Detailed workshop/session instructions, evidence request lists, interview prompts, and next-phase readiness steps are generated as a separate Discovery Workshop Guide working document.

The phase batch enqueue path also carries saved phase-capture values directly into the queued run payload as authoritative phase context, so generated artifacts cannot drift into generic tenant narrative when the Move already has captured sponsor/scope/evidence text.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates Moves artifact contracts, phase deliverable registry, generation prompts, quality profiles, and the phase enqueue route.
- Layers 1-3: No intake, adapter, canonical model, data-plane, migration, or tenant-data mutation changes.

## Client Applicability

- All clients: Receive the updated Moves artifact boundaries when generating P1 phase artifacts.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Program Charter shared contract replaces the former detailed Discovery Preparation section with concise Authorization Conditions & Open Inputs.
- P1 phase registry now includes a separate non-gate Discovery Workshop Guide working document.
- Discovery Workshop Guide receives its own profile, orchestrator mapping, and quality bar.
- Generate-phase route includes saved phase capture values in each queued run's decision context.
- Tests cover the charter/workshop split, P1 phase registry, quality profiles, prompt wording, preflight mapping, and phase-capture queue payload.

## QA / Validation

- `npx jest src/lib/deliverables/shared/__tests__/artifact-contracts.test.ts src/lib/deliverables/orchestrator/__tests__/generation-plan.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts --runInBand` — pass, 61/61.
- `npx jest src/lib/programs/__tests__/charter-preflight.test.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/programs/__tests__/phase-deliverables.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts --runInBand` — pass, 53/53.

## Rollout Plan

Merge to main through PR. The repo-owned ACA main deploy workflow will rebuild and deploy the app image. No manual data build, migration, feature flag, or tenant-data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Yes, `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No ad-hoc mutators in this release.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment before claiming runtime-live.
- Worker image invariant: Required after deployment because the deliverable worker consumes queued run payloads.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, regenerate a P1 phase package and verify the Charter and Discovery Workshop Guide are distinct artifacts.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to restore the prior artifact contract and phase registry. No data rollback is required.

## Audit Evidence

- Pull request URL and merge SHA after PR creation.
- Focused Jest output listed above.
- Post-merge ACA deploy run and runtime invariant proof.
- Signed-in P1 regeneration proof showing a separate Program Charter and Discovery Workshop Guide.

## Known Gaps

This release creates the P1 Discovery Workshop Guide separation. Equivalent phase-specific workshop/session guides for later phases remain future work unless already represented by existing phase deliverables.
