# 2026-07-22-source-direct-download-authority — Source Direct Download Authority

## Release ID

`2026-07-22-source-direct-download-authority`

## Status

`candidate`

## Plain-English Summary

Direct artifact download links now respect the same client-final authority rules as the Files list and render/export path. If an older generated artifact link points at a slot where the client has since accepted a final artifact, the default download serves the authoritative final instead of silently returning the stale draft. Operators can still retrieve the original stale artifact explicitly with `includeHistory=1`.

## Layer Impact

- Release lane: `global-control-lane` because this is shared Source route behavior for all tenants, with no client-specific schema or data mutation.
- Product runtime: Updates the tenant-scoped Source direct download route for File Cabinet artifacts.
- Evidence integrity: Prevents stale generated artifacts from being retrieved as current client artifacts after a client-final sibling exists.
- Governance/audit: Adds response headers that disclose when a requested artifact id was substituted by the authoritative sibling.

## Client Applicability

- All clients: Yes, for Source events with File Cabinet artifacts and client-final acceptance history.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts`
- `src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts`
- `docs/backlog/source-product-backlog.md`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts' src/lib/source/__tests__/client-final-artifacts.test.ts --runInBand` — passed, 19 tests.
- `npx eslint 'src/app/api/v1/source/artifacts/[artifactId]/download/route.ts' 'src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts'` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — passed.
- `npm run release:check` — passed.
- PR checks, ACA deploy proof, runtime invariant, and signed-in live proof are required before this record can move from `candidate` to `released`.

## Rollout Plan

Merge to `main` through a governed PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned web image to `app.abarva.ai`. No migration or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR; deploy must be performed by the repo-owned main workflow.
- Approved image digest: Pending main deploy.
- ACA runtime invariant: Required after main deploy.
- Worker image invariant: No worker changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, direct stale download link should serve the authoritative final by default, and `includeHistory=1` should preserve the originally-requested stale id.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow roll forward with the revert commit. No schema rollback is required.

## Audit Evidence

- PR URL: Pending.
- Release checks: Focused Jest, ESLint, TypeScript, and `npm run release:check` passed locally.
- ACA deploy run: Pending.
- Runtime invariant report: Pending.
- Signed-in live proof bundle: Pending.

## Known Gaps

Deal Pack artifact assembly authority remains open as `SOURCE-ARTIFACT-AUTHORITY-001` item #6 and is intentionally out of scope for this slice.
