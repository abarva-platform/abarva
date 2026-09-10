# 2026-09-10-source-ecl-live-proof-contracts — Source ECL Live Proof Contracts

## Release ID

`2026-09-10-source-ecl-live-proof-contracts`

## Status

`candidate`

## Plain-English Summary

Source's ECL projection workspace again satisfies the product live-proof contract: the DB-mode read path reads the distinct Source event serving views, and the Source workspace can render the shared ECL serving-surface coverage panel when diagnostics are explicitly requested. Normal Source dashboard navigation and contract-detail presentation remain unchanged.

## Layer Impact

Release lane: `global-control-lane`.

Layer 2 source adapters: the Source workspace DB projection adapter now reads the event, compare, and approval serving views together instead of returning an empty event rowset.

Layer 4 products: the Source workspace imports and diagnostics-gates the shared serving-surface coverage component used by peer product surfaces.

## Client Applicability

- All clients: Yes, for Source workspace ECL projection mode.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Diagnostics panel renders only when explicitly requested through the diagnostics/debug query parameter.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `npm run ecl:product-browser:predeploy-gate` — PASS.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` — PASS, 16 tests.

## Rollout Plan

Open a PR, squash merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned image, then verify the ACA runtime invariant and Source live-proof path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace plus ECL product live proof.

## Rollback Plan

Revert the squash merge and redeploy through the repo-owned ACA main deploy workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI checks: Pending.
- ACA deploy run: Pending.
- Runtime invariant proof: Pending.
- Live proof: Pending.

## Known Gaps

The diagnostics panel is intentionally hidden unless requested through the diagnostics/debug query parameter, so normal users will not see the serving-surface coverage strip during ordinary workspace use. This release does not change any ECL serving SQL, tenant data, or aVa answer behavior.
