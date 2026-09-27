# 2026-09-26-moves-generated-deliverable-signoff-bridge — Moves Generated Deliverable Sign-Off Bridge

## Release ID

`2026-09-26-moves-generated-deliverable-signoff-bridge`

## Status

`candidate`

## Plain-English Summary

Strategic Moves generated deliverables now materialize an unsigned `deliverables_v2` draft row after the governed generation artifact is saved. The generated Office companion is stored in the Move artifact vault with metadata pointing at that exact deliverable row and version, so the existing sign-off route and phase gate continue to read one authoritative store.

The sign-off route also fails closed when a generated version declares that an Office companion must be scanned but no current companion matches its `deliverableId` and `versionId`. Reviewer-facing sign-off errors now surface readiness blockers and require a deliberate acknowledgement before approving over those blockers.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: `deliverables_v2` remains the authoritative lifecycle store for governed sign-off and phase gates.
- Product projection: Strategic Moves generated deliverables become signable through the existing document panel once materialized.
- Governance/control: client-readiness scanning now rejects missing or mismatched generated Office companion linkage instead of silently scanning only HTML.

## Client Applicability

- All clients: Applies to Strategic Moves generated deliverable sign-off behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Moves generation persistence now upserts an unsigned deliverable draft and links a generated Office companion to the returned row/version.
- The sign-off route requires matching Office companion metadata for generated versions that opt into companion scanning.
- The reviewer action surfaces 422 readiness and scannability failures, including an explicit blocker acknowledgement flow.
- Tests cover gate closed/open behavior, missing companion failure, blocker acknowledgement, persistence metadata linkage, and document-panel sign-off visibility.

## QA / Validation

- `NODE_PATH=$PWD/node_modules ./node_modules/.bin/jest --runTestsByPath 'src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__/route.test.ts' src/lib/deliverables/orchestrator/__tests__/persistence.test.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts src/components/strategic-moves/__tests__/deliverable-approval-action.test.tsx src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx --runInBand` — Pass, 63 tests.
- `npm run typecheck` — Pass.
- `npm run audit:test-ci-coverage:write` — Pass, census refreshed.
- `npm run lint` — Pass with existing warnings, 0 errors.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Pass.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deployment workflow. No migration, data backfill, or feature flag change is included. Existing generated artifacts that predate this change can be repaired by rerunning the governed generation action so the authoritative draft row and companion linkage are created through the product path.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime deployment.
- Shared runtime mutators: Do not use ad-hoc ACA runtime mutation.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required if worker jobs are updated by the deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify a generated Move deliverable offers sign-off, sign it off through the UI, and confirm the phase gate hard check clears.

## Rollback Plan

Revert the merge commit and redeploy the prior approved image through the repo-owned ACA deployment workflow. No schema rollback is required because the change uses existing tables and artifact registry fields.

## Audit Evidence

- Pull request URL: To be added when opened.
- CI run: To be added after PR checks complete.
- Deployment proof: ACA runtime invariant and signed-in browser proof after merge/deploy.
- Local validation: commands listed in QA / Validation.

## Known Gaps

Live signed-in proof is pending merge and deployment.
