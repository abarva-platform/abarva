# 2026-08-08-source-contract360-evidence-wiring — Contract 360 Evidence Wiring

## Release ID

`2026-08-08-source-contract360-evidence-wiring`

## Status

`candidate`

## Plain-English Summary

Contract 360 now reads the loaded contract evidence detail package for selected contracts instead of relying only on the older portfolio rollup projections. The Scope tab can show the contract overview, business functions, systems/services, source file, scope rows, and commercial pricing line items. The Performance tab can show SLA credit history, invoice exceptions, rate-card variance, recoverable leakage, avoided cost, negotiated improvement, and finance-confirmed realized value when governed evidence rows exist.

The Story tab now avoids rendering a false missing-evidence conclusion while the contract detail read is still loading. It shows an evidence-loading state until the governed detail API resolves.

## Layer Impact

- `global-control-lane`: Updates shared Source product projection code and the shared Contract 360 tab rendering path for every tenant.
- `client-data-lane`: Adds read-model access to tenant-scoped contract evidence detail tables. It does not mutate data; it consumes rows already loaded by the approved evidence package.
- `public-demo`: Improves the demo surface by making evidence-rich contracts show their loaded contract overview, scope, pricing, performance, and finance-confirmation facts.

## Client Applicability

- All clients: Yes, the UI and read-model path are shared.
- Specific clients: Evidence-rich behavior appears only for tenants/contracts that have populated the shared evidence classes.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/types.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/contract-360-view.ts`
- `src/lib/source/data-model/contract-optimization-spine.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`
- `src/app/api/source/workspace/contract/[contractId]/route.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint -- <touched files>` passed.
- Live browser check after the first deploy found that evidence-rich tabs populated correctly after detail load, but the Story tab could briefly render stale missing-evidence copy before the contract detail API resolved. This follow-up patch adds a loading/error guard for that state.
- `npm run build` was attempted in the Codex worktree and failed before application compilation because Turbopack rejected the worktree `node_modules` symlink pointing outside the project root. GitHub/ACA build remains required.
- Local CLI data-plane read could not be treated as proof because no `ABARVA_AZURE_DATABASE_URL` / `DATABASE_URL` was present in the shell; live signed-in browser validation remains required after deployment.

## Rollout Plan

Merge through PR, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then browser-test the affected Source Contract 360 routes for the two evidence-rich contracts.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Populated by ACA deploy after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. This release is not QA-passed until Contract 360 Scope, Performance, Relationship, Evidence, and Optimize are browser-verified for both evidence-rich contracts.

## Rollback Plan

Revert the PR. The underlying evidence tables remain loaded; rollback only returns Contract 360 to the older projection behavior.

## Audit Evidence

- PR URL after creation.
- GitHub Actions ACA deploy run after merge.
- Signed-in browser screenshots or trace for both selected contracts after deploy.

## Known Gaps

This candidate does not claim QA pass. It requires live signed-in browser proof that the tabs render the loaded evidence and do not show stale missing-evidence language where evidence exists.

Local worktree build is blocked by Turbopack symlink handling; use the repo-owned build/deploy workflow as the build authority for this candidate.
