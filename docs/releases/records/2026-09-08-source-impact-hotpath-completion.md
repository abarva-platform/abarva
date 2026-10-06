# 2026-09-08-source-impact-hotpath-completion — Source Impact Hot Path Completion

## Release ID

`2026-09-08-source-impact-hotpath-completion`

## Status

`candidate`

## Plain-English Summary

The Source workspace impact endpoint now reads the two canonical core row sets it needs for contract evidence and action candidates, then completes the companion display rows in process. This avoids several redundant database view reads on the initial workspace path while keeping the same evidence/action rows as the basis for visible claim cards, vendor position summaries, page storyline rows, and aVa grounding bundles.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source workspace read behavior changes for the impact payload endpoint. No schemas, loaders, migrations, or tenant data are changed.

Layer 3 Canonical Model: No change.

## Client Applicability

- All clients: Source workspace users reading the impact payload through the Source workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace provider and impact-mode behavior only.

## Changes Included

- Source workspace impact adapter now generates claim cards, vendor positions, storyline rows, and aVa grounding bundles from loaded evidence/action rows.
- Fallback rebuild remains available when the core evidence/action rows are empty or only placeholder evidence is returned.
- Focused Source workspace adapter tests updated to assert the fast path and fallback path separately.

## QA / Validation

- `npm test -- portfolioAdapter.ecl.test.ts --runInBand` passed.
- `npm test -- page-tenant-routing.test.ts --runInBand` passed.
- `npm test -- src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` passed.
- `npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image. After deploy, verify the Source workspace impact endpoint with a signed-in browser route and confirm the response no longer invokes the broad derived-overlay timing path when loaded evidence/action rows are available.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow if worker images are touched.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace impact endpoint timing and page text proof.

## Rollback Plan

Revert the pull request and redeploy the previous known-good ACA revision through the repo-owned workflow. No data rollback is required because this is read-path code only.

## Audit Evidence

- Pull request URL.
- Focused Jest output.
- TypeScript and ESLint output.
- Release check output.
- ACA deploy workflow URL and runtime invariant.
- Signed-in Source workspace impact timing proof.

## Known Gaps

This does not change the underlying Layer 4 helper view definitions. It only removes redundant helper-view reads from the request hot path when canonical evidence/action rows are already loaded.
