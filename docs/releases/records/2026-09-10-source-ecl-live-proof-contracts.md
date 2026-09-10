# 2026-09-10-source-ecl-live-proof-contracts — Source ECL Live Proof Contracts

## Release ID

`2026-09-10-source-ecl-live-proof-contracts`

## Status

`released; live-proven`

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
- PR checks for #7531 — PASS.
- ACA deploy run `34439389838` for merge SHA `59bfd05571aa59e4930f935a0ff8d42a305014f5` — PASS.
- Carried forward into active main SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`.
- Runtime invariant on active digest `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160` — PASS.
- ECL product live proof run `34443822224` — PASS: Source 9/9 named surfaces, all default entry routes accepted, and zero browser proof issues.

## Rollout Plan

Open a PR, squash merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned image, then verify the ACA runtime invariant and Source live-proof path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160` on active SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`.
- ACA runtime invariant: PASS on active revision `ca-abarva-web-lab-eastus--mb9a0225d`.
- Worker image invariant: PASS for required worker jobs on the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace plus ECL product live proof.

## Rollback Plan

Revert the squash merge and redeploy through the repo-owned ACA main deploy workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL: #7531.
- CI checks: PASS.
- ACA deploy runs: `34439389838`, carried forward by `34442823605`.
- Runtime invariant proof: PASS on active digest `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160`.
- Live proof: PASS in ECL product live proof run `34443822224`.

## Known Gaps

The diagnostics panel is intentionally hidden unless requested through the diagnostics/debug query parameter, so normal users will not see the serving-surface coverage strip during ordinary workspace use. This release does not change any ECL serving SQL, tenant data, or aVa answer behavior.
