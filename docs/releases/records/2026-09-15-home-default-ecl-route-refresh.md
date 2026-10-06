# 2026-09-15 - Home Default ECL Route Refresh

## Release ID

`2026-09-15-home-default-ecl-route-refresh`

## Status

`candidate`

## Plain-English Summary

Updates the production Home route so the executive brief reads the governed ECL serving projection by default for reviewed Home tenants, instead of only doing that on the privileged preview URL or one hardcoded tenant branch. The visible tenant label is now tied to the bundle being rendered, so a fallback bundle cannot be presented under a different active tenant name.

## Layer Impact

`global-control-lane`; Home Layer 4 projection routing and proof tooling.

- L4 Home: `/home` now follows the shared ECL product-provider default and uses the reviewed snapshot only through the explicit legacy override or when the ECL projection itself falls back.
- Proof tooling: default-route browser smoke now targets the real `/home` route for Home rather than treating `/home/preview` as production coverage.
- L1/L2/L3: unchanged; this release does not load, rebuild, or mutate tenant data.

## Client Applicability

- All clients: shared Home route behavior.
- Specific clients: reviewed Home tenants with existing governed Home bundles.
- Internal only: predeploy proof script behavior.
- Public/demo only: no public route change.
- Feature flag: governed by existing `ECL_PRODUCT_DEFAULT_PROVIDER` / `ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE` provider controls.

## Changes Included

- Repoint `/home` to `getHomeEclProjectionBundleOrReviewedSnapshotWithSource` whenever the shared ECL provider is active.
- Preserve the reviewed snapshot path behind the existing legacy provider override.
- Bind the Home shell tenant label to the rendered Home bundle.
- Update ECL browser smoke so default-route mode verifies `/home?tenant=...` for Home.
- Add route-level regression coverage for the default ECL route, unsupported-tenant label fallback, and legacy override.
- This release record.

## QA / Validation

- Focused Home route/projection tests: `PASS` (17 tests).
- ECL product browser predeploy gate: `PASS`.
- Data-plane readback from this host: `BLOCKED`; no `DATABASE_URL` is available in the local environment.
- Signed-in browser proof from this host: `BLOCKED`; the in-app browser is unauthenticated and `/home` redirects to `/sign-in`.

## Rollout Plan

Merge through protected `main`, deploy the exact merge SHA through the repo-owned ACA workflow, verify the digest-pinned runtime invariant, then run signed-in Home proof on the production `/home#executive_brief` route for reviewed Home tenants.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository workflow only
- Approved image digest: produced by the repo-owned workflow after merge
- ACA runtime invariant: template image, 100%-traffic revision, and required worker job images must match the approved digest before calling the release live
- Worker image invariant: verify with the existing ACA runtime invariant check
- Feature/env flag update path: no flag or env mutation in this release
- Live signed-in proof required: `/home#executive_brief` after deploy

## Rollback Plan

Revert this PR through a new PR and redeploy the prior approved digest. No data rollback is required because this release changes only route selection and proof tooling.

## Audit Evidence

- PR and merge SHA
- Focused Home route/projection test output
- ECL product browser predeploy gate output
- ACA deploy run, digest, revision, traffic, and runtime-invariant proof
- Signed-in Home browser proof after deploy

## Known Gaps

- This does not rebuild the Home ECL projection. If the serving projection rows are stale or absent, the governed data-build job lane remains the required fix.
- Signed-in proof could not be completed from this unauthenticated browser session before deployment.
