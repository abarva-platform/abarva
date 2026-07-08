# 2026-07-08-strategy-to-moves-execution-mode — Intelligence AbarVa Solution Contract

## Release ID

`2026-07-08-strategy-to-moves-execution-mode`

## Status

`candidate`

## Plain-English Summary

This release teaches aVa Intelligence to answer strategy and execution questions as the CXO front door to AbarVa, not as a generic strategy advisor. When a user asks about top bets, industry trends, a Data & AI strategy, an 8-week plan, an executive-council roadmap, vendor implications, value realization, or how to solve something through AbarVa, aVa must explain the operating model: Intelligence frames the bets, Home grounds the current-state evidence, Moves runs the governed phase plan, Source validates vendor/commercial levers, and Tower tracks value realization.

## Layer Impact

- `global-control-lane`: Changes the live Intelligence synthesis prompt contract for all tenants.
- `user-facing answer behavior`: Adds deterministic classification and prompt instructions for `strategy_to_abarva_solution` and `strategy_to_moves_execution` answer modes.
- `quality/eval`: Adds regression coverage for trigger detection, required Moves phases, Home/Source/Tower linkage, no artifact-creation overclaiming, and synthesis-path contract injection.

## Client Applicability

- All clients: Yes, for Intelligence answers that ask or imply strategy, top bets, execution, roadmap, business-case, executive-council, vendor/commercial implications, value realization, current-state evidence, or Moves phase planning.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag; this is part of the shared Intelligence prompt contract.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: Adds `strategy_to_abarva_solution` and `strategy_to_moves_execution` classification plus the AbarVa operating-model answer contract.
- `src/lib/intelligence/ask/synthesizer.ts`: Injects the contract into the active Claude synthesis path for both right-canvas and answer-only streaming modes.
- `src/lib/intelligence/ask/response-policy.test.ts`: Covers trigger classification and required answer-contract content.
- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`: Verifies the active synthesizer path carries the contract.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Not run: live deployed Intelligence question. This PR must merge and deploy before live signed-in proof can be captured.

## Rollout Plan

Merge to `main` through PR review. The repo-owned ACA main deploy workflow builds and deploys the new image to the shared lab runtime. After deploy, run live Intelligence prompts for Lakeshore such as: "Help me decide the right AI bets for supply chain. What is the industry doing?", "How would AbarVa solve this?", and "If I run the supply-chain AI top bets through Moves for 8 weeks, what would the plan look like by phases?" Confirm the answers include a CXO-quality strategy read, "How AbarVa would solve this" when relevant, Home current-state grounding, candidate supply-chain Moves, P0-P5 Moves phases for execution asks, Source implications, Tower metrics, executive-council artifacts, and gaps/assumptions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the repo-owned ACA main deploy workflow may shift traffic.
- Approved image digest: Assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required if workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a representative Intelligence strategy-to-Moves prompt after deploy.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. No migration rollback is required because this change only affects prompt contracts and tests.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4591
- Local test output: focused Jest pass and TypeScript pass in `/private/tmp/nexus-strategy-moves-mode`.
- Live proof: Pending merge and ACA deploy.

## Known Gaps

This change fixes the Intelligence answer path. Source, Moves, and Tower native answer paths may still need their own shared product-operating-model contract if they answer cross-surface strategy questions directly. The immediate defect came from Intelligence, so this PR keeps the runtime change scoped there.
