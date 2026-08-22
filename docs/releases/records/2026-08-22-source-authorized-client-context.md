# 2026-08-22-source-authorized-client-context — Preserve authorized Source client context

## Release ID

`2026-08-22-source-authorized-client-context`

## Status

`candidate`

## Plain-English Summary

Source deep links can carry an explicit client context when that context is already authorized for the signed-in session. The proxy still rejects foreign client injection for locked sessions, but it no longer removes same-tenant Source client context after that guard has already run.

## Layer Impact

- Layer 4 Products: Source route handling only. No Source data, tenant data, canonical objects, adapters, cubes, or workflow records are changed.
- Control plane: Proxy routing behavior is narrowed so Source uses the same tenant guard as the rest of the product without a second blanket strip.

## Client Applicability

- All clients: Yes, for signed-in Source routes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/proxy.ts`: Adds an explicit helper for protected-tree blanket stripping and removes Source from that blanket strip. The existing unauthorized-client predicate still runs before this branch.
- `src/__tests__/unit/proxy-public-routes.test.ts`: Adds regression coverage that Source is excluded from the blanket strip while Home, Tower, and Admin still strip for non-admins.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/__tests__/unit/proxy-public-routes.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts' --runInBand`
- Pass: `npx eslint src/proxy.ts src/__tests__/unit/proxy-public-routes.test.ts 'src/app/(maestro)/source/preview/workspace/page.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/api/source/workspace/contract/[contractId]/route.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/route.ts'`
- Pending: full typecheck, release check, PR checks, ACA deploy, and signed-in browser proof after merge.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA. No manual Azure mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured from the ACA workflow after merge.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source route proof under an authorized client session.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to redeploy the prior proxy behavior. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local tests: listed above.
- ACA runtime invariant: pending.
- Signed-in proof: pending.

## Known Gaps

- This release only corrects route-context preservation. It does not certify Source data completeness, cube refresh, aVa answer quality, upload parsing, or workflow artifact quality.
