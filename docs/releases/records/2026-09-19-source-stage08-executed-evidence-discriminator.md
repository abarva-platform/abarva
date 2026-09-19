# 2026-09-19-source-stage08-executed-evidence-discriminator — Source Stage 08 Executed Evidence Discriminator

## Release ID

`2026-09-19-source-stage08-executed-evidence-discriminator`

## Status

`candidate`

## Plain-English Summary

Source Stage 08 readiness now refuses to treat a generic Contract Record artifact as proof of an executed agreement or final SOW. A final artifact must carry explicit signed, executed, or final SOW evidence, and pending-signature, unsigned, blocked, missing, or gap-log language keeps Contract 360 handoff blocked.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: tightens deterministic Source readiness logic and rendered Transition workspace behavior over existing event stages and artifact metadata. No Layer 1 intake, Layer 2 adapter, Layer 3 canonical state, schema, migration, or tenant data is changed.

## Client Applicability

- All clients: Source users viewing Stage 08 / Transition readiness receive the stricter read-only handoff verdict.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `src/lib/source/award-sow-handoff-readiness.ts` so executed agreement/SOW readiness requires explicit signed, executed, or final SOW evidence and fails closed on pending-signature or gap language.
- Adds focused builder coverage in `src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts`.
- Adds rendered workspace coverage in `src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts`.
- Updates the local execution backlog and stage map for the verified Stage 08 award/SOW and Contract 360 handoff gaps.

## QA / Validation

- `node build-source-board.mjs --json` — passed after tracker updates; regenerated `source-board-summary.json` and `source-board.html`.
- `node build-execution-queue.mjs` — passed after tracker updates; regenerated `EXECUTION_QUEUE.md`.
- `npx jest --runTestsByPath src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts` — failed before the implementation on the pending-signature Contract Record case.
- Mutation proof: temporarily disabling the negative-signal discriminator made the same focused Jest suite fail on the builder and rendered workspace tests.
- `npx jest --runTestsByPath src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts` — passed after restoring the discriminator, 9 tests.
- `npx eslint src/lib/source/award-sow-handoff-readiness.ts src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. No manual Azure mutation, data-plane job, migration, feature flag, or traffic command is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify after deployment that template image and 100% traffic revision image match the approved digest.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not claimed by this release record.

## Rollback Plan

Revert the PR or deploy the previous known-good main image through the repo-owned workflow. Since this is Layer 4 readiness logic only, there is no migration or data rollback.

## Audit Evidence

PR URL, CI results, merge commit, repo-owned ACA deploy workflow run, focused Jest output, mutation-proof output, and post-deploy runtime digest invariant output.

## Known Gaps

No signed-in product proof is claimed here. This change does not create awards, approvals, contracts, SOWs, Contract 360 rows, supplier communications, schema, migrations, or tenant-data writes. Canonical Contract 360 publication, governed contract-formation package scope, and approval authority thresholds remain separate backlog items.
