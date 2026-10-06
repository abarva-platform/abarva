# 2026-09-21-source-stage04-candidate-registry-surface — Stage 04 Candidate Registry Details

## Release ID

`2026-09-21-source-stage04-candidate-registry-surface`

## Status

`candidate`

## Plain-English Summary

The Source Stage 04 vendor panel already separated accepted candidates from suppliers already under contract. This change raises the floor of that panel by carrying explicitly recorded candidate-registry details through to the screen: category, function, and archetype eligibility keys; contact policy; active-contact count; and authority plus registry source references.

Missing registry fields remain visible as not recorded. The panel still sends nothing, contacts nobody, selects no respondent, and withholds rows when the accepted-candidate authority or contract register cannot be read.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 Source projection: extends the existing read-only Stage 04 panel view model and renderer.
- Layer 3 canonical authority/read model: reads existing governed supplier-master fields and candidate-registry payload fields only. No schema, migration, or row mutation is introduced.

## Client Applicability

- All clients: yes, for Source New events whose Stage 04 panel is rendered.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/candidate-suppliers/event-candidate-authority-repository.ts`
- `src/lib/source/new-workspace/stage04-vendor-panel.ts`
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`
- Focused repository, behavior, and component coverage for explicit registry fields and missing-policy honesty.
- `EXECUTION_STATUS.md` claim appended before implementation.

## QA / Validation

- PASS: red-first focused suite initially failed because the mounted panel dropped registry fields.
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/source/candidate-suppliers/__tests__/event-candidate-authority-repository.test.ts src/__tests__/behaviors/stage04-vendor-panel-says-what-it-knows.test.ts src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` — 3 suites, 56 tests.
- PASS: focused mutation proof killed 3 of 3 planted faults: dropping registry source references, defaulting an unrecorded contact policy to review-required, and suppressing eligibility rendering.
- PASS: scoped ESLint over the changed repository, behavior, composer, component, and component-test files.
- PASS: `npm run typecheck` — clean.
- PASS: `npm run release:check`.
- PASS: `git diff --check`.
- Pending before merge: PR CI.

## Rollout Plan

Merge to `main` through the protected PR path. The normal repo-owned Azure Container Apps main deploy workflow may build and deploy the resulting image after merge. No manual Azure mutation, migration apply, data-plane build, feature flag, supplier communication, invitation, NDA dispatch, or tenant-data write is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none.
- Approved image digest: pending main workflow.
- ACA runtime invariant: pending main workflow and readback.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, because the change alters a governed Source New surface. No signed-in proof is claimed in this release record.

## Rollback Plan

Revert the PR. That removes the additional rendered registry details and returns the Stage 04 panel to the prior accepted-candidate / existing-contract grouping behavior.

## Audit Evidence

Inspect the PR diff, focused test output, mutation proof output, TypeScript/ESLint/release-check output, PR CI, and post-deploy signed-in Source New browser proof.

## Known Gaps

- This reads only fields already available to the repository. It does not create, repair, seed, or apply any supplier-registry schema.
- Missing contact policy or eligibility remains not recorded; it is not inferred from supplier names, categories, files, or contract history.
- No signed-in browser proof is claimed yet.
