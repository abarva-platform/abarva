# 2026-06-29-cio-tower-packet-row-consistency — Tower packet and row-state consistency

## Release ID

`2026-06-29-cio-tower-packet-row-consistency`

## Status

`candidate`

## Plain-English Summary

Tower now treats governed CIO metric packets as real Tower evidence when row-level program detail is still thin. The dashboard and aVa opener should no longer claim that no program or measured-value rows exist when the metric layer already has governed budget/value packets.

## Layer Impact

- `global-control-lane`: Updates shared Tower rendering/model logic for all tenants using the CIO command-center surface.
- `client-data-lane`: No schema or data migration. The change only changes how already-loaded metric packets are interpreted in the UI model.

## Client Applicability

- All clients: Yes, Tower dashboard model behavior is shared.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed.
- Targeted regression proves governed metric packets can supply IT spend, initiative budget, and measured value without emitting false empty-row language.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps deploy workflow to publish the new image, then verify the signed-in Tower page on `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: Required for live ACA rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Active revision and 100% traffic must match the main deploy digest.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, verify Tower no longer displays contradictory empty-row language when metric packets are present.

## Rollback Plan

Revert this PR from `main` and redeploy the previous approved ACA image. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Unit test: `TowerCioDashboardSurface.test.tsx`
- Live proof: pending after deploy.

## Known Gaps

This does not backfill missing row-level program names, owners, or proof rows. It only keeps the surface honest when metric packets are present but the detail table binding is incomplete.
