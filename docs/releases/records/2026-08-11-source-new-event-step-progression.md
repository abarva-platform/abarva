# 2026-08-11-source-new-event-step-progression — New Event Step Progression Clarity

## Release ID

`2026-08-11-source-new-event-step-progression`

## Status

`candidate`

## Plain-English Summary

The Source New Event step screen now shows required inputs as an evidence table with source, status, and row actions. The bottom of the screen now has an explicit approval-gate block that tells the user what remains open or what the approval gate will do next. The primary gate action is disabled until all required inputs meet their minimum readiness state.

## Layer Impact

- `global-control-lane`: Updates the shared Source New Event workflow UI only. No data model, parser, or tenant data changes are included.

## Client Applicability

- All clients: Source New Event users who see the simplified stage front.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source simplified stage front gating only; this release does not add a new flag.

## Changes Included

- `src/components/source/canvas/SimpleStageFront.tsx`
- `src/components/source/canvas/__tests__/SimpleStageFront.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/source/canvas/__tests__/SimpleStageFront.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/SimpleStageFront.tsx src/components/source/canvas/__tests__/SimpleStageFront.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a Source New Event stage screen using the simplified front.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Pull request URL after publication.
- GitHub checks and deploy workflow run.
- ACA revision/digest and signed-in browser proof after deployment.

## Known Gaps

This is a progression-clarity and client-side gate-lock UI fix. It does not change upload parsing, artifact quality scoring, server-side approval semantics, or the full Source 11-stage QA backlog.
