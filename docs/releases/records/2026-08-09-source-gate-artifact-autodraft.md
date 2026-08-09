# 2026-08-09-source-gate-artifact-autodraft — Source Gate Artifact Auto-Draft

## Release ID

`2026-08-09-source-gate-artifact-autodraft`

## Status

`candidate`

## Plain-English Summary

Source stage approvals now trigger AI-prepared drafts for the approved stage's required gate artifacts instead of only attempting a single primary artifact for the next stage. The artifact list is derived from the canonical Source artifact specification so the workflow output stays aligned with the stage's real gate requirements.

The canvas stage-promotion endpoint now follows the same approved-stage invariant, so direct approval and canvas promotion both draft artifacts for the stage just approved.

Stage-entry auto-drafts can also use earlier AI-prepared draft bodies as drafting context while preserving the stricter accepted-authoritative upstream rule for manual generation and client-final authority.

Stage-entry auto-drafts now wait for required upstream draft bodies when upstream generation is still queued or running, so dependent stage artifacts do not fail permanently just because an earlier draft is still in flight. AMS events that explicitly reference an RFP or competitive market event also remain on the full competitive sourcing journey instead of being shortened to a contract-optimization journey by trigger wording alone.

Approval-triggered auto-drafts now run through Next's post-response lifecycle hook instead of a detached promise, so the route can return promptly while the runtime still has an explicit wait handle for durable job enqueueing and inline worker processing.

## Layer Impact

- `global-control-lane`: Layer 4 Product projection changes only. The Source approval route and artifact generation orchestration change how existing per-event artifact rows are drafted after approval; no canonical data model, intake shape, adapter, schema, or migration changes are included.
- `client-data-lane`: No tenant data load, schema migration, manifest, canonical promotion, or read-model rebuild is included.

## Client Applicability

- All clients: Source events using the stage approval route receive the corrected artifact auto-draft trigger.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/events/[eventId]/approve/route.ts`
- `src/app/api/v1/source/[eventId]/stage/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
- `src/lib/source/contracts/upstream-satisfaction.ts`
- `src/lib/source/queries.ts`
- `src/lib/source/stage-entry-autodraft.ts`
- `src/lib/source/sourcing-motion-journeys.ts`
- `src/lib/source/__tests__/stage-entry-autodraft.test.ts`
- `src/lib/source/__tests__/sourcing-motion-journeys.test.ts`
- `src/lib/source/contracts/__tests__/upstream-satisfaction.test.ts`
- `src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts`
- `src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts`

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath src/lib/source/__tests__/stage-entry-autodraft.test.ts 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts'` passed.
- `./node_modules/.bin/jest --runTestsByPath 'src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts' src/lib/source/__tests__/stage-entry-autodraft.test.ts` passed.
- `./node_modules/.bin/jest --runTestsByPath src/lib/source/contracts/__tests__/upstream-satisfaction.test.ts src/lib/source/__tests__/stage-entry-autodraft.test.ts` passed.
- `./node_modules/.bin/jest --runTestsByPath src/lib/source/__tests__/stage-entry-autodraft.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts` passed.
- `./node_modules/.bin/jest --runTestsByPath src/lib/source/contracts/__tests__/upstream-satisfaction.test.ts src/lib/source/__tests__/stage-entry-autodraft.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts 'src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts'` passed.
- `./node_modules/.bin/jest --runTestsByPath src/lib/source/__tests__/stage-entry-autodraft.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts 'src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts'` passed.
- `./node_modules/.bin/eslint src/lib/source/stage-entry-autodraft.ts src/lib/source/__tests__/stage-entry-autodraft.test.ts 'src/app/api/v1/source/events/[eventId]/approve/route.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts'` passed.
- `npx eslint 'src/app/api/v1/source/events/[eventId]/approve/route.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts' src/lib/source/stage-entry-autodraft.ts` passed.
- `./node_modules/.bin/eslint src/lib/source/stage-entry-autodraft.ts src/lib/source/queries.ts src/lib/source/sourcing-motion-journeys.ts src/lib/source/__tests__/stage-entry-autodraft.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts` passed.
- `./node_modules/.bin/eslint 'src/app/api/v1/source/[eventId]/stage/route.ts' 'src/app/api/v1/source/[eventId]/stage/__tests__/route.test.ts'` passed.
- `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/tsc --noEmit --pretty false` passed.
- `./node_modules/.bin/jest --runTestsByPath src/lib/source/__tests__/gate-advance-contract.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/contracts/__tests__/generation-eligibility.test.ts src/lib/source/contracts/__tests__/upstream-satisfaction.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` found a pre-existing Source governance fixture mismatch outside this release's changed files; the four adjacent non-fixture suites passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image. No migration or manual data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify after deployment before claiming the change is live.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a Source gate approval produces reviewable artifact draft state in the signed-in app.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data migration rollback is required; queued/generated draft rows remain normal reviewable artifacts.

## Audit Evidence

PR URL, commit SHA, CI results, ACA deploy workflow run, runtime invariant proof, and signed-in Source gate/artifact proof.

## Known Gaps

This release does not redesign Source navigation into a compact tree explorer and does not add a new required workshop-session evidence capture step. Those are separate UX/governance slices.
