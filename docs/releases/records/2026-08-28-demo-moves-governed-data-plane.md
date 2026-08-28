# 2026-08-28-demo-moves-governed-data-plane — Route Demo Moves Reads To Governed Data Plane

## Release ID

`2026-08-28-demo-moves-governed-data-plane`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves landing page selected the legacy operational read adapter for one configured demo healthcare tenant when no global data-plane environment variable was set. The governed activation job had loaded rows into Azure Postgres, but the route could still read the older plane and show an empty Moves portfolio. This release makes the tenant classification shared and routes that tenant's Moves reads to the governed Azure Postgres adapter by default.

## Layer Impact

- Products: Strategic Moves portfolio reads for the configured demo healthcare tenant now resolve to the governed operational data plane without requiring a query parameter or global environment change.
- Source adapters / data access: The programs and Strategic Moves preference read adapters now use the shared foundation-tenant helper instead of a duplicated local tenant list.

## Client Applicability

- All clients: No.
- Specific clients: Configured foundation/demo tenant keys and aliases only.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: Existing explicit `ABARVA_DATA_PLANE=azure-postgres` behavior is unchanged; this closes the unset-env fallback for foundation/demo tenants.

## Changes Included

- `src/lib/tenant/foundation-tenants.ts`: adds the configured healthcare demo tenant canonical key to the shared foundation tenant set.
- `src/lib/data-plane/read-adapters/resolveDataPlane.ts`: removes the duplicated governed-tenant list and imports the shared foundation-tenant helper.
- Focused adapter tests cover canonical and alias tenant keys for the programs and Strategic Moves preference read paths.

## QA / Validation

- Pass: `git diff --check`.
- Pass: `npx jest --runTestsByPath src/lib/data-plane/read-adapters/__tests__/programs-read-adapter.test.ts src/lib/data-plane/read-adapters/__tests__/strategic-moves-preferences-read-adapter.test.ts --runInBand` — 2 suites, 28 tests.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Fail resolved: initial `npm run release:check -- --base origin/main --head HEAD` correctly rejected this release record because this section did not state explicit pass/fail/not-run/blocked statuses.
- Not run yet: signed-in production browser proof; required after merge and ACA deploy.

## Rollout Plan

Open a PR, squash-merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned web image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this release.
- Approved image digest: Resolved by the repo-owned main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/strategic-moves` must show governed Moves rows for the configured demo healthcare tenant.

## Rollback Plan

Revert the PR or deploy the previous healthy ACA revision. The change is code-only and does not mutate stored data.

## Audit Evidence

- PR URL: pending.
- CI / deploy run: pending.
- Signed-in screenshot: pending.

## Known Gaps

This release does not change the activated Moves data itself. It only fixes the route's default read-plane selection for the configured demo healthcare tenant.
