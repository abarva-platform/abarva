# 2026-05-25-sentinel-pin-client-key — Sentinel Tenant Pin Uses Client Key

## Release ID

`2026-05-25-sentinel-pin-client-key`

## Status

`candidate`

## Plain-English Summary

The Meridian production stress rerun showed that the Sentinel synthesizer could still assert Apex because its tenant-identity pin was being built from a database UUID instead of the canonical tenant client key. The pin helper treated the unknown UUID as the default client option, which is Apex. This release threads the resolved client key into ask synthesis, uses that key for the tenant pin and cross-tenant leak detector, and makes unknown/invalid values fail closed instead of defaulting to Apex.

## Layer Impact

- `agent-reasoning-lane`: Sentinel ask synthesis now builds the authoritative tenant identity pin from `tenantClientKey` while continuing to use the database tenant id for audit and egress metadata.
- `app-control-lane`: `/api/intelligence/ask` passes the resolved authenticated client key into `askIntelligence`.
- `client-data-lane`: invalid tenant identifiers, including database UUIDs passed to the pin builder by mistake, no longer resolve to Apex tenant context.
- `ops-release-lane`: the tenant-pin smoke test and unit tests now guard the UUID fallback regression.

## Client Applicability

- All clients: yes
- Specific clients: Meridian Health receives the immediate P0 correction; Apex Retail and First Capital receive safer fail-closed tenant handling.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/app/api/intelligence/ask/route.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/tenant-identity-pin.ts`
- `src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts`
- `scripts/smoke/sentinel-tenant-pin.spec.ts`

## QA / Validation

- `npm run smoke:sentinel-tenant-pin` passed.
- `eslint src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/tenant-identity-pin.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts scripts/smoke/sentinel-tenant-pin.spec.ts` passed using the shared workspace dependency tree.
- `jest src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts --runInBand` passed with the new UUID regression case.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.

## Rollout Plan

Merge to `main`, allow the production post-deploy crawl to pass, then rerun the Meridian full-module stress report against `https://app.abarva.ai`.

## Rollback Plan

Revert the merge commit if post-deploy crawl or Meridian rerun fails. No database migrations are included.

## Audit Evidence

- PR URL and post-deploy crawl run will be attached after merge.
- The final stress report will be written to `audit-artifacts/full-module-stress-meridian-2026-05-25-0747/FULL_MODULE_STRESS_TEST_REPORT.html`.

## Known Gaps

The stress report still logs existing static Apex references on several non-agent pages; this release only fixes Sentinel ask synthesis tenant identity.
