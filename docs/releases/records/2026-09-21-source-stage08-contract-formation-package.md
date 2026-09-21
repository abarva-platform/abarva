# 2026-09-21-source-stage08-contract-formation-package — Source Stage 08 Contract-Formation Package

## Release ID

`2026-09-21-source-stage08-contract-formation-package`

## Status

`candidate`

## Plain-English Summary

Source Stage 08 readiness now distinguishes a draft package, a contract-ready package, a pending-signature package, and an executed package before any Contract 360 handoff can be called ready. The readiness package is composed only from reviewed selection memo evidence, approved pricing evidence, governed clause/library references, SOW scope, named approval authority, evidence lineage, and executed-signature authority. If any required component is missing, the read-only handoff verdict fails closed.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: tightens deterministic Source Transition readiness logic and the rendered Stage 08 handoff panel over existing event stage and artifact metadata. No Layer 1 intake, Layer 2 adapter, Layer 3 canonical state, schema, migration, tenant-data write, contract publication, or supplier communication changes.

## Client Applicability

- All clients: Source users viewing Stage 08 / Transition readiness receive the stricter read-only contract-formation verdict.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extends `src/lib/source/award-sow-handoff-readiness-types.ts` with contract-formation state and package component metadata.
- Updates `src/lib/source/award-sow-handoff-readiness.ts` so Stage 08 readiness has a `contract_formation_package` checkpoint and blocks missing pricing, clause/library references, SOW scope, named approval authority, evidence lineage, or executed-signature authority.
- Updates `src/components/source/SourceAwardSowHandoffReadinessPanel.tsx` to render the contract-formation state without implying contract publication.
- Adds focused builder and rendered workspace coverage in the Stage 08 readiness suites.

## QA / Validation

- Red-first verification: `npx jest --runTestsByPath src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts --runInBand` failed before implementation on the missing package checkpoint, missing `contractFormationState`, missing package metadata, and executed-looking-without-authority cases.
- Focused green: `npx jest --runTestsByPath src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts --runInBand` — passed, 15 tests.
- Mutation proof: temporarily disabling the missing-signature-authority refusal made `blocks executed-looking evidence that omits named signature authority` fail because the package became handoff-ready. Restoring the refusal returned the focused suites to green.
- Coverage census refresh: `npm run audit:test-ci-coverage:write` refreshed the authoritative generated census after the current mainline added an unrun test to a previously fully covered directory. The Stage 08 suites remain registered in their existing pull-request workflow.
- Coverage ratchet proof: temporarily removing the generated partial-directory entry made `npm run audit:test-ci-coverage:check` fail and name the stale directory; regeneration restored the artifact, and `npm run coverage:behavior-gate` passed all 89 suites and 767 tests.
- Repository gates: `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck` and `npm run release:check` passed.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. No manual Azure mutation, data-plane job, migration, feature flag, signature workflow, supplier communication, contract publication, or traffic command is part of this release.

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

PR URL: https://github.com/abarva-platform/abarva/pull/8149

CI results, merge commit, repo-owned ACA deploy workflow run, focused Jest output, mutation-proof output, and post-deploy runtime digest invariant output.

## Known Gaps

No signed-in product proof is claimed here. This change does not create awards, approvals, contracts, SOWs, Contract 360 rows, supplier communications, legal approvals, signature actions, schema, migrations, or tenant-data writes. Contract publication and signed-in acceptance remain separate gated work.
