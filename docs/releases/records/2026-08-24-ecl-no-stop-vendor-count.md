# 2026-08-24-ecl-no-stop-vendor-count — ECL no-stop proof vendor denominator

## Release ID

`2026-08-24-ecl-no-stop-vendor-count`

## Status

`candidate`

## Plain-English Summary

Updates the ECL no-stop proof harness to expect the concentrated vendor projection produced by the dense commercial realism pass. The source data now intentionally models repeat suppliers and a long tail, so the Vendor 360 projection has fewer supplier rows than the earlier one-contract-per-vendor fixture.

## Layer Impact

`client-data-lane`: source adapters and products are unchanged. This affects release-control automation only: the no-stop proof now checks the corrected Vendor 360 denominator while retaining the same projection, cube, and drift gates.

## Client Applicability

- All clients: No direct runtime change.
- Specific clients: None.
- Internal only: ECL proof and operator automation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/ecl-no-stop-data-pipeline.yml` expected `source_vendor_360` count updated from the old flat-supplier fixture count to the concentrated dense-source count.

## QA / Validation

- Local projection readback file verified `projection_manifest=7`, `source_contract_360=230`, `source_vendor_360=101`, `source_value_levers=230`, `source_event_workspace=173`, `home_enterprise_landscape=2946`, `tower_command_center=930`, and `intelligence_context_pack=9`.
- `npm run release:check` is expected to pass with this release record included.

## Rollout Plan

Merge to main by pull request. No data-plane load, product route change, runtime image change, migration, or tenant promotion is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert this workflow-only change if the dense commercial fixture is intentionally reverted to the earlier flat supplier model.

## Audit Evidence

- Pull request for this release.
- Local projection readback summary under `reports/ecl-dense-source-projection-local-load-2026-08-23/`.

## Known Gaps

This does not run or verify the Azure data-build job. Azure load/readback remains a separate governed execution step.
