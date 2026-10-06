# 2026-09-09-source-client-final-generation-context — Bind Accepted Final Content Downstream

## Release ID

`2026-09-09-source-client-final-generation-context`

## Status

`candidate`

## Plain-English Summary

When a reviewer accepts an uploaded client-final artifact, Source now extracts the accepted file's text into the artifact state used by downstream generation. Later deliverables therefore bind the authoritative reviewed content instead of treating the upstream artifact as empty or retaining stale generated-draft text.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Source: client-final acceptance now keeps the artifact lifecycle record and downstream generation context aligned.
- No Layer 1, Layer 2, Layer 3, schema, migration, tenant-data loader, or canonical-fact behavior changes.

## Client Applicability

- All clients: Yes, for Source event artifact acceptance and downstream generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Update the Source client-final acceptance route to run the existing bounded upload-text extractor.
- Replace the generated artifact body with text extracted from the accepted authoritative file.
- Record extraction method, availability, and warnings in artifact generation metadata.
- Add route-level regression coverage proving the client-final body is landed for downstream use.

## QA / Validation

- `npm test -- --runInBand --runTestsByPath './src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/__tests__/route.test.ts' './src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts' './src/lib/source/agent-generation/__tests__/prompt-registry.test.ts'` — PASS, 3 suites and 61 tests.
- `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/__tests__/route.test.ts'` — PASS.

## Rollout Plan

Merge through a protected-branch pull request. Allow the repo-owned ACA main deploy workflow to build and deploy the exact merge SHA. After the runtime invariant is confirmed, accept a reviewed client-final Source artifact and prove that its dependent artifact generates without an upstream-empty error.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Captured by the deployment workflow after merge.
- ACA runtime invariant: Template image and 100% traffic revision must match the approved digest.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, authenticated Source client-final acceptance followed by dependent artifact generation.

## Rollback Plan

Revert the pull request and redeploy the prior main image through the repo-owned ACA workflow. Existing accepted files remain in the artifact registry; rollback only restores the earlier downstream-body behavior.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest and ESLint output listed above.
- Repo-owned ACA deployment run and digest invariant proof.
- Authenticated dependent-generation proof after deployment.

## Known Gaps

Files whose bounded extractor returns no text continue to fail closed for downstream generation until parseable content is available.
