# 2026-09-23-moves-ava-domain-evidence-grounding — Moves aVa Domain Evidence Grounding

## Release ID

`2026-09-23-moves-ava-domain-evidence-grounding`

## Status

`candidate`

## Plain-English Summary

Moves aVa evidence-readiness guidance now keeps the active Move's domain and workflow signals authoritative when stale or generic classification text is also present. This prevents a Move from receiving evidence requirements from an unrelated industry archetype in execution-readiness guidance.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Moves answer-grounding and evidence-readiness selection for phase guidance. No Layer 1, Layer 2, Layer 3, tenant-data, schema, or data-plane writes are included.

## Client Applicability

- All clients: Moves users receive safer archetype grounding when asking aVa phase-readiness questions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves aVa hardening behavior remains governed by the current feature configuration.

## Changes Included

- Updates discovery blueprint resolution for mixed active-domain and stale unrelated-archetype text.
- Adds regression coverage for mixed active-domain and stale unrelated-domain input resolving to the active-domain blueprint.
- Adds regression coverage that deterministic P5 aVa evidence needs remain in the active-domain lane and exclude unrelated lending/control-system terms.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/discovery/__tests__/evidence-readiness.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts --runInBand` — passed.
- `npm run typecheck` — passed.
- `npx eslint src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts` — passed.
- Additional validation will be recorded before merge.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned ACA main deploy workflow may rebuild and redeploy the application image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned main deploy workflow.
- Approved image digest: Captured by the repo-owned workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Moves aVa P5 domain-grounding smoke proof.

## Rollback Plan

Revert the pull request. This returns discovery blueprint precedence to the prior behavior and removes the regression tests.

## Audit Evidence

Pull request, CI results, deploy run, runtime invariant, and signed-in Moves aVa smoke proof will be linked when available.

## Known Gaps

This release fixes the wrong-domain evidence-readiness guidance path only. It does not address remaining Moves smoke findings around upload automation, completed-P5 evidence count reconciliation, or deliverable-quality scoring.
