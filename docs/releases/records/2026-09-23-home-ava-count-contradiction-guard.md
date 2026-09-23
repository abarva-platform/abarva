# 2026-09-23-home-ava-count-contradiction-guard - Home aVa Count Contradiction Guard

## Release ID

`2026-09-23-home-ava-count-contradiction-guard`

## Status

`candidate`

## Plain-English Summary

Home aVa now checks answer and caveat text against the served Home record-family counts before packaging the response. If model text or recovery text repeats a stale family count for contract or data-asset evidence, the answer is corrected to the count in the served Home bundle before display and export.

## Layer Impact

Product projection: Home answer packaging now applies a deterministic consistency guard using counts already present in the rendered Home bundle. No intake files, canonical records, serving-table rows, loaders, adapters, tenancy rules, or security checks are changed.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: Home aVa responses are guarded against stale family-count wording when the bundle carries deterministic family rows.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/preview/ava-answer.ts`
- `src/lib/home/preview/__tests__/ava-answer.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/preview/__tests__/ava-answer.test.ts src/app/api/home/preview/ask/__tests__/route.test.ts` - passed.
- `npx eslint src/lib/home/preview/ava-answer.ts src/lib/home/preview/__tests__/ava-answer.test.ts` - passed.
- `npm run typecheck` - passed.

## Rollout Plan

Open a PR, merge to `main` after checks pass, and let the repo-owned Azure Container Apps main deploy workflow build and promote the image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if the deploy workflow updates workers.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home aVa answer behavior.

## Rollback Plan

Revert the Home aVa answer guard and deploy through the same repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL after creation.
- GitHub checks for focused answer tests, typecheck, and release gate.
- ACA main deploy run after merge.
- Signed-in Home aVa proof showing stale family-count wording is not emitted for live served record counts.

## Known Gaps

This does not regenerate governed Home content or repair stale authored claims inside a served bundle. It blocks the stale count from reaching Home aVa answers and exports while upstream content regeneration remains gated separately.
