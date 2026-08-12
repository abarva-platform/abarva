# 2026-08-11-source-new-event-optional-evidence-rows — New Event Optional Evidence Rows

## Release ID

`2026-08-11-source-new-event-optional-evidence-rows`

## Status

`candidate`

## Plain-English Summary

The Source New Event simplified stage front now renders optional evidence as structured rows with source, status, template, upload, and answer actions. Optional rows are visibly useful but do not block the approval gate.

## Layer Impact

- `global-control-lane`: Updates the shared Source New Event workflow UI only. No parser, schema, data-plane, or tenant-data changes are included.

## Client Applicability

- All clients: Source New Event users using the simplified stage front.
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
- PASS: `npm run release:check`
- PASS: `git diff --check`

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

This is a presentation and workflow-clarity fix. It does not implement new optional-evidence parsers, artifact quality scoring, or the full Source 11-stage QA backlog.
