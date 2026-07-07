# 2026-06-22-home-intelligence-19-dimension-binding — Restore canonical 19-dimension context roster

## Release ID

`2026-06-22-home-intelligence-19-dimension-binding`

## Status

`candidate`

## Plain-English Summary

Home and Intelligence were rendering the binding payload honestly, but the payload exposed only eight roll-up buckets instead of the canonical nineteen enterprise context dimensions. This change expands the shared binding payload to the 19-dimension roster for every tenant, including Apex Retail, while preserving the same tenant evidence totals.

## Layer Impact

- `global-control-lane`: Corrects the shared Home/Intelligence binding read-model used by all clients.
- `client-data-lane`: No data migration or tenant data change; this only changes how the existing binding payload is shaped for display and surface context.

## Client Applicability

- All clients: Home and Intelligence context dimension roster.
- Specific clients: Apex Retail is the observed failure, but the bug affected every tenant payload.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Home/Intelligence surface flags; no new flag.

## Changes Included

- `src/lib/intelligence/binding/binding-payload.ts`: expands short roll-up payloads to canonical 19 dimensions before rendering.
- `src/lib/intelligence/binding/universal-dimensions.ts`: defines the canonical 19-dimension roster and roll-up mapping.
- `src/lib/intelligence/binding/__tests__/binding-payload.test.ts`: asserts every tenant resolves to 19 dimensions.
- `scripts/qa/home-live-gate.mjs`: fails if Home shows 8 roll-up dimensions instead of 19.
- `scripts/qa/tenant-matrix-gate.mjs`: adds a cross-surface `dims19` matrix check.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/intelligence/binding/__tests__/binding-payload.test.ts src/components/home/__tests__/HomeSurface.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand`.
- Pass: `npx eslint src/lib/intelligence/binding/binding-payload.ts src/lib/intelligence/binding/universal-dimensions.ts src/lib/intelligence/binding/__tests__/binding-payload.test.ts scripts/qa/home-live-gate.mjs scripts/qa/tenant-matrix-gate.mjs`.
- Pass: `node --check scripts/qa/home-live-gate.mjs && node --check scripts/qa/tenant-matrix-gate.mjs`.
- Pass: `npm run release:check`.
- Not-run: live signed-in Apex Home proof; this requires the deployed ACA revision and tenant auth state/cookie.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA deploy to build and shift the new revision, then run the signed-in Home/Intelligence matrix for Apex Retail and the remaining pilot tenants.

## Deployment Authority

- Repo-owned deploy workflow: Required through the existing ACA main deploy workflow.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this UI/read-model fix.
- Feature/env flag update path: No new flag.
- Live signed-in proof required: Yes, Apex Home must show 19 dimensions and the matrix `dims19` column must pass.

## Rollback Plan

Revert this PR to return to the previous eight-roll-up payload shaping.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA deploy run: Pending.
- Post-deploy crawl: Pending.
- Signed-in Apex Home proof: Pending.

## Known Gaps

This fixes the displayed context roster and surface context dimension count. It does not add new tenant evidence, and it does not complete Tower typed `AgentAnswer` parity.
