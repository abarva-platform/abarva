# Source Stored Evidence Task Readback

## Release ID

`2026-09-19-source-stored-evidence-task-readback`

## Status

`candidate`

## Plain-English Summary

Source event tasks now recognize a previously uploaded template file even when
its typed facts have not been extracted yet. The page shows the file as stored
and awaiting extraction instead of asking the user to upload it again. The
workflow remains locked until the governed typed facts are available.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: Source event task readback binds existing artifact-registry
  records to the matching evidence task without changing canonical facts or
  readiness state.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extend task evidence hydration with a non-authoritative stored-file binding.
- Pass registry filename, kind, format, and size into the hydration read model.
- Replace the duplicate-upload prompt with a review-existing-file action.
- Add behavior tests proving a stored file does not unlock Continue.

## QA / Validation

- PASS: `npm test -- --runInBand src/lib/source/facts/view/__tests__/task-evidence-hydration.test.ts`
- PASS: `npm test -- --runInBand src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- PASS: `npm run test:nav -- --runInBand`
- PASS: Scoped ESLint on all changed TypeScript and test files.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: `git diff --check`

## Rollout Plan

Squash-merge through a protected pull request. The repository-owned ACA main
deploy workflow builds and deploys the exact merge SHA. Run signed-in Source
event proof after the runtime invariant passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repository workflow only.
- Approved image digest: Recorded after deployment.
- ACA runtime invariant: Template image, active 100% traffic revision image,
  and required worker images must match.
- Worker image invariant: Required before live claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash-merge and redeploy the resulting main SHA through the same
repository-owned workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request and CI run.
- ACA deployment run and digest readback.
- Signed-in event screenshot or DOM proof showing Uploaded, awaiting extraction,
  and a disabled Continue action.

## Known Gaps

This change does not parse or approve the stored file. Extraction and governed
evidence review remain required before the task becomes complete.
