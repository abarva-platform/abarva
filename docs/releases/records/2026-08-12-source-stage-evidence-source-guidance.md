# 2026-08-12-source-stage-evidence-source-guidance — Source Stage Evidence Source Guidance

## Release ID

`2026-08-12-source-stage-evidence-source-guidance`

## Status

`candidate`

## Plain-English Summary

The simplified Source stage screen now explains each evidence row in operational terms: where the client can usually get the data, what grain to load, which fields AbarVa will parse, which formats are accepted, and whether the row blocks the approval gate. Required evidence can no longer be marked as "not needed" from this compact screen; it must be uploaded, answered, or remain visibly blocking.

## Layer Impact

- Lane: `global-control-lane`.
- Product layer: Updates the shared Source New Event stage UI used to guide evidence collection and stage progression.
- Canonical model: Extends the client-side simplified stage view model with existing canonical evidence requirement metadata. No schema or tenant-data change.
- Source adapters: No parser or adapter changes.

## Client Applicability

- All clients: Applies to Source New Event stage screens using the simplified front.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source simplified-stage routing only; this change adds no new flag.

## Changes Included

- `src/lib/source/simple-front.ts`
- `src/components/source/canvas/SimpleStageFront.tsx`
- `src/components/source/canvas/__tests__/SimpleStageFront.test.tsx`
- `src/__tests__/integration/source/source-simple-front.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/source/canvas/__tests__/SimpleStageFront.test.tsx src/__tests__/integration/source/source-simple-front.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/SimpleStageFront.tsx src/components/source/canvas/__tests__/SimpleStageFront.test.tsx src/lib/source/simple-front.ts src/__tests__/integration/source/source-simple-front.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming the new row guidance is visible in production.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Pull request URL after publication.
- Focused component test output.
- GitHub checks and deploy workflow run after merge.
- ACA revision/digest readback after deployment.

## Known Gaps

This release improves stage evidence clarity only. It does not implement new file parsers, artifact quality scoring, rich proposal parsing, aVa hard QA, or full 11-stage certification.
