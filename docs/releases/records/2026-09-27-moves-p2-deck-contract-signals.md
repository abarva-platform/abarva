# 2026-09-27-moves-p2-deck-contract-signals — Moves P2 Deck Contract Signals

## Release ID

`2026-09-27-moves-p2-deck-contract-signals`

## Status

`candidate`

## Plain-English Summary

Moves P2 generation now feeds native deck-slide and workflow-checklist signals into the deliverable quality contract. This prevents a generated PPTX deck or workflow guide from being quarantined merely because its governed signal was stored as a deck slide or checklist rather than as a legacy exhibit row, while still blocking outputs when required signals are absent.

## Layer Impact

Release lane: `global-control-lane`.

Products: Moves deliverable generation and review readiness.

Canonical model: no schema change.

Source adapters / intake: no change.

## Client Applicability

- All clients: applies where Moves governed deliverable generation is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves deliverable generation controls still apply.

## Changes Included

- `src/lib/deliverables/quality/deliverable-key-map.ts`
- `src/lib/deliverables/orchestrator/persistence.ts`
- `src/lib/deliverables/orchestrator/__tests__/persistence-deck.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/persistence-deck.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand`
- Pass: `./node_modules/.bin/jest src/lib/deliverables/orchestrator/__tests__ src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts --runInBand`

## Rollout Plan

Merge to `main`, then deploy through the repo-owned ACA main deploy workflow. The change is application code only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy because deliverable generation runs in worker jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, by re-running the affected Moves P2 build path after deployment.

## Rollback Plan

Revert the merge commit and redeploy through the same ACA main deploy workflow.

## Audit Evidence

- PR and CI for this change.
- ACA main deploy run for the merge SHA.
- Runtime invariant output showing web and worker jobs on one digest.
- Signed-in Moves generation proof showing the P2 batch reaches generated outputs rather than contract quarantine.

## Known Gaps

Live signed-in proof is pending until this release is merged and deployed.
