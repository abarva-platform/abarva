# 2026-09-27-moves-artifact-key-hydration — Moves Generated Artifact Hydration

## Release ID

`2026-09-27-moves-artifact-key-hydration`

## Status

`candidate`

## Plain-English Summary

Moves phase workspaces now match generated Office companion artifacts back to their canonical deliverable slots. A generated file can keep its storage-specific artifact type while the phase build panel uses the governed deliverable key for build status and review flow.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Moves phase pages and artifact APIs now expose and consume the canonical deliverable key separately from the stored artifact type.
- Governed workflow: phase build rows resync when generated artifacts hydrate after page load, without changing gate approval or sign-off rules.

## Client Applicability

- All clients: applies to Moves workspaces using generated phase deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Phase page preload maps generated artifacts to canonical deliverable keys from metadata.
- Program artifacts API returns `deliverableTypeKey` when metadata supplies it.
- Moves workspace client prefers `deliverableTypeKey` when hydrating phase build artifacts.
- Phase Approve & Build rows resync when current generated artifacts arrive after initial render.
- Regression coverage proves generated Office companions hydrate the canonical phase build rows.

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand --testNamePattern="hydrates phase build rows from generated Office companions"`
- Pass: `./node_modules/.bin/jest --runTestsByPath src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/PhaseApproveAndBuild.tsx src/components/strategic-moves/MovesPhaseStandaloneClient.tsx 'src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx' 'src/app/api/v1/programs/[programId]/artifacts/route.ts'`
- Pass: `npm run typecheck`
- Mutation proof: removing the canonical-key preference makes the new regression fail on the build count.
- Mutation proof: removing late artifact-row resync makes the new regression fail on the build count.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Not changed by this PR.
- Approved image digest: Captured after workflow deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a Moves phase with existing generated deliverables shows built rows and sign-off/review path remains governed.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release only changes read/hydration behavior.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/8581
- CI run: to be added after PR creation.
- Deploy workflow run: to be added after deployment.
- Runtime invariant output: to be added after deployment.
- Signed-in smoke: to be added after deployment.

## Known Gaps

The release does not generate, approve, or sign off any deliverable by itself. Live completion still requires the existing governed review/sign-off path to accept the generated phase output before a phase gate can pass.
