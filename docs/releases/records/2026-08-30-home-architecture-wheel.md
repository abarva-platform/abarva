# 2026-08-30-home-architecture-wheel — Home Architecture Wheel

## Release ID

`2026-08-30-home-architecture-wheel`

## Status

`candidate`

## Plain-English Summary

Home's current-state architecture page now opens with a conceptual architecture wheel. The wheel
starts with business blocks and accountability, then lets the reader drill into logical system views
and the detailed run-map cards that already existed.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 / Products: updates the Home v4 architecture rendering only. No source, canonical,
projection, serving, cube, or database schema changes are included.

## Client Applicability

- All clients: Yes, for Home v4 current-state architecture rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home routing/provider controls only.

## Changes Included

- `src/components/home/v4/ArchitecturePage.tsx`: adds the deterministic architecture wheel over
  existing run-map blocks so architecture opens conceptually before logical and physical drilldown.
- `src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx`: asserts the wheel remains
  present and keeps the typed-view counting basis visible.

## QA / Validation

- `npx jest src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand` — pass.
- `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx` — pass.
- `git diff --check` — pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow will publish the web runtime
with the next digest-pinned main deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required for live web runtime.
- Shared runtime mutators: None in this release.
- Approved image digest: Set by the main ACA deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the Home change is live.

## Rollback Plan

Revert the PR. This restores the prior Home architecture page entry layout; no data rollback is
required.

## Audit Evidence

- Local Jest output for the Home architecture grain test.
- Pull request and CI checks for this release candidate.
- ACA deployment run and signed-in Home proof after merge, if deployed.

## Known Gaps

This is the first productized architecture-wheel entry experience. It does not complete the broader
Home narrative quality work, org/interview surfaces, or final CXO visual polish across every Home
tab.
