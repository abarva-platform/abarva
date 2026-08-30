# 2026-08-30-source-impact-fallback — Source Impact Fallback

## Release ID

`2026-08-30-source-impact-fallback`

## Status

`candidate`

## Plain-English Summary

The Source workspace now keeps impact cards visible when the prebuilt impact views return no rows by deriving the same operator-ready cards from governed Source and consumption read models. The fallback keeps unsupported claims blocked: candidate opportunity is still separate from finance-confirmed realized value.

## Layer Impact

Layer 4 Products (`global-control-lane`): Source workspace presentation now has a deterministic fallback over existing Source and consumption views.

Layer 4 Projections (`global-control-lane`): No schema change. Existing read models remain the preferred source; the fallback only activates when those impact views return empty.

## Client Applicability

- All clients: Source workspace adapter behavior is shared.
- Specific clients: none named in this public record.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace provider controls remain unchanged.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` passed.
- `npx jest --runTestsByPath '/private/tmp/nexus-source-impact-l4-param-fix-20260829b/src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx tsc --noEmit --pretty false --incremental false` was attempted locally and failed with a Node heap out-of-memory condition before producing type diagnostics.

## Rollout Plan

Merge through PR to `main`, then use the repo-owned Azure Container Apps main deploy workflow. After the deployment reaches 100% traffic, run a signed-in Source workspace proof for the affected route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: only the repo-owned workflow may shift traffic.
- Approved image digest: assigned by the workflow after merge.
- ACA runtime invariant: required before live proof.
- Worker image invariant: required before live proof.
- Feature/env flag update path: no env or feature flag update required.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required because this is a read-path/product adapter change only.

## Audit Evidence

Inspect the PR, scoped Jest output, scoped ESLint output, ACA deployment run, and post-deploy signed-in Source workspace proof.

## Known Gaps

None known for this adapter behavior. Broader Source page design and data coverage work remains tracked separately.
