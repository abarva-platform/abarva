# 2026-06-05-lakeshore-auth-persona-pinning — Lakeshore Auth Persona And Tenant Pinning

## Release ID

`2026-06-05-lakeshore-auth-persona-pinning`

## Status

`candidate`

## Plain-English Summary

Lakeshore demo identities are now treated as first-class tenant-pinned accounts in the auth routing layer, not only as rows in the client registry. The change ensures Lakeshore email-domain users resolve to the Lakeshore tenant even if Clerk metadata drifts, Source event slug guards recognize Lakeshore event IDs, and the shared tenant-isolation proof fixtures include Lakeshore.

## Layer Impact

- `global-control-lane`: Updates shared auth/session routing guardrails and test coverage used by all client sessions.
- `client-data-lane`: Adds Lakeshore-specific persona and proof coverage so the Lakeshore demo tenant can be verified without falling back to Apex or Meridian.

## Client Applicability

- All clients: The shared auth routing functions and Source slug guard remain global.
- Specific clients: Lakeshore Holdings receives explicit email-domain, persona, and isolation-fixture coverage.
- Internal only: None.
- Public/demo only: Demo-code sign-in and e2e persona fixtures now include Lakeshore.
- Feature flag: None.

## Changes Included

- `src/lib/auth/access-routing.ts` recognizes `@lakeshore-holdings.example.com`, `+lakeshore@abarva.com`, and Lakeshore Source event slug hints.
- `src/lib/auth/cxo-personas.ts` adds the missing Lakeshore tenant-admin persona that the canonical auth allowlist already referenced.
- `src/lib/programs/enhancement-seed-planner.ts` adds a Lakeshore route stub so canonical `/tenant/lakeshore-holdings` slug checks resolve in tenant-isolation probes.
- `tests/e2e/_helpers/auth.ts` adds a Lakeshore demo account helper.
- `tests/e2e/tenant-isolation/fixtures/personas.ts` adds Lakeshore to the server-ticket tenant-isolation matrix.
- `src/lib/auth/__tests__/tenant-isolation-probes.test.ts` and `tests/unit/access-routing.test.ts` add Lakeshore routing and isolation assertions.
- `reports/2026-06-05-lakeshore-auth-persona-proof/README.md` preserves the sanitized live proof.

## QA / Validation

- `npx jest tests/unit/access-routing.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts --runInBand`: pass, 2 suites / 76 tests.
- `git diff --check`: pass.
- `npm run release:check -- --base origin/main --head HEAD`: pass.
- `BASE_URL=https://app.abarva.ai npx playwright test tests/e2e/tenant-isolation/protected-route.spec.ts tests/e2e/tenant-isolation/cross-tenant-probe.spec.ts tests/e2e/tenant-isolation/logout-redirect.spec.ts --project=chromium --reporter=line`: pass, 17 tests.
- Live Clerk/DB inspection: pass for Lakeshore CIO, CFO, and tenant admin after Lakeshore-scoped provisioning.
- Live adversarial route proof: pass for `/home`, `/source`, `/tower`, and `/strategic-moves` with a Lakeshore CFO session and hostile Apex client override.
- Live `/api/intelligence/ask` proof: pass; answer named Lakeshore Holdings and rejected Apex/Meridian context despite Apex in request body/surface context.
- Live sign-out proof: pass; `/home` redirected to `/sign-in?redirect=%2Fhome` after sign-out.

## Rollout Plan

Merge to main through the normal PR flow. Deploy through the Vercel production app. Lakeshore-scoped persona provisioning has already been applied once in the live environment with `--skip-ban`; rerun only if the live Clerk/DB records drift.

## Rollback Plan

Revert the PR. Existing Lakeshore CIO/CFO metadata remains intact; reverting only removes the new fallback guards, admin persona source record, and proof fixtures.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3125
- Live pre-fix inspection confirmed `cio@lakeshore-holdings.example.com` and `cfo@lakeshore-holdings.example.com` exist in Clerk with `role=maestro`, `clientId=lakeshore`, and `tenantKey=lakeshore-holdings`.
- Live pre-fix inspection confirmed `admin@lakeshore-holdings.example.com` was allowed by source but not present in Clerk or `persons`.
- `reports/2026-06-05-lakeshore-auth-persona-proof/README.md` contains the sanitized proof summary and command list.

## Known Gaps

Runtime fallback protections require PR merge and deployment. Live demo auth works today because Clerk metadata and DB memberships are correct.
