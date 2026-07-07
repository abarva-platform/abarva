# 2026-06-29-cio-tower-page-metric-packet-binding — Bind Tower Page to Governed Metric Packets

## Release ID

`2026-06-29-cio-tower-page-metric-packet-binding`

## Status

`candidate`

## Plain-English Summary

The live Tower chat used governed `cio_tower` metric packets, but the Tower dashboard could still fall back to older budget rollups when the page failed to resolve the active client into the canonical Tower tenant key. This change makes Tower tenant canonicalization handle display names like `Lakeshore Holdings` and `SkyHarbor Air`, and loads dashboard metric packets from the active client key, display name, and client id candidates.

## Layer Impact

- `global-control-lane`: Updates shared Tower page binding and tenant-key canonicalization.
- `client-data-lane`: Ensures all canonical Tower tenants read the same governed metric packet rows for dashboard and chat.

## Client Applicability

- All clients: Applies to all canonical Tower tenants.
- Specific clients: Verified against the Lakeshore mismatch where chat showed `$877.9M` while the dashboard showed the legacy `$983.6M` fallback.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/metric-packet.ts` canonicalizes display names and punctuation/space variants.
- `src/lib/cio-tower/metric-packet-store.ts` can load packets from multiple tenant identity candidates.
- `src/app/(maestro)/tower/page.tsx` passes active client key, name, and id to the packet loader.
- Existing Tower answer test now covers human-readable tenant names.

## QA / Validation

- `pass`: `npx jest --runTestsByPath src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed `12/12` tests. The duplicate manual mock warnings are pre-existing repo noise.
- `pending`: `npm run release:check` must pass before PR.
- `pending after deploy`: signed-in browser reload on `/tower` must show dashboard IT spend from the governed metric packet, matching the Tower chat answer for the same tenant.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the corrected image. Then reload `/tower` in the signed-in browser and rerun the Tower quality job if needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned main deploy only
- Approved image digest: produced by the main deploy workflow after merge
- ACA runtime invariant: required by deploy workflow
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Tower dashboard/chat metric parity on the deployed app.

## Rollback Plan

Rollback by redeploying the prior approved main digest. This change is read-path only; it does not mutate Tower data.

## Audit Evidence

- Pre-fix browser evidence: signed-in Lakeshore `/tower` showed dashboard IT spend `$983.6M` while chat answered `$877.9M`.
- PR URL: pending.
- Post-deploy browser proof: pending.

## Known Gaps

This fixes canonical packet binding for the dashboard. It does not redesign the Tower visual surface, enrich missing source data, or change the governed source-file assumptions behind the metric values.
