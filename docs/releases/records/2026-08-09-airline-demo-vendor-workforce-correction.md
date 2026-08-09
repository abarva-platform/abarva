# 2026-08-09-airline-demo-vendor-workforce-correction — Vendor Scope And Workforce Correction

## Release ID

`2026-08-09-airline-demo-vendor-workforce-correction`

## Status

`candidate`

## Plain-English Summary

Corrects a synthetic airline demo source-data inconsistency where a digital-platform supplier row also implied responsibility for the HCM managed-services support model. The supplier row now covers only the direct booking web platform, and the HCM support effort is represented as internal workforce roles instead of a supplier scope overlap.

## Layer Impact

- `client-data-lane`: Updates Layer 1 tenant input CSVs for the airline demo tenant. The change does not directly mutate Azure/Postgres or product read models.
- Layer 3 and Layer 4 visibility: Requires the governed data-build/projection job path before product surfaces can show the corrected supplier scope or workforce economics.

## Client Applicability

- All clients: No.
- Specific clients: Airline synthetic demonstration tenant only.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `datasets/tenant-inputs/active/skyharbor-air/current/07_vendors_contracts.csv`: Removes HCM managed-services scope from the digital-platform supplier row.
- `datasets/tenant-inputs/active/skyharbor-air/current/03_workforce_roles.csv`: Adds three internal HCM support roles totaling 23 FTE.
- `scripts/source/repair-skyharbor-deloitte-workday-scope.ts`: Adds a tenant-scoped ACA operator repair/readback job for the Source raw table that backs the live Vendor 360 views.
- `package.json`: Adds `source:skyharbor:deloitte-scope-repair`.

## QA / Validation

- Pass: CSV parse/readback for the two changed files.
- Pass: Targeted semantic readback confirmed the supplier row has only `Direct Booking Web Platform` as supported system and only `Distribution, Sales & E-Commerce` as supported function.
- Pass: Targeted semantic readback confirmed three HCM support rows total 23 FTE and remain internal employee rows.
- Pass: `npm run audit:tenant-input-quality -- --tenant skyharbor-air`
- Pass: `npm run build:canonical-tenant-data`
- Pass: `npm run project:tower-mart:airline-demo:dry-run`
- Known pre-existing failure: `npm run audit:canonical-tenant-inputs -- --tenant skyharbor-air` still audits all active tenants and fails on existing active-template drift unrelated to this two-file correction.
- Pending: governed ACA operator execution of `source:skyharbor:deloitte-scope-repair` after the script is merged and deployed into the digest-pinned image.

## Rollout Plan

1. Merge the source-data correction to `main`.
2. Let the repo-owned ACA main workflow build the new digest-pinned image.
3. Run the governed ACA operator repair/readback job for the Source raw table using the approved digest-pinned image.
4. Run the governed projection path needed for workforce-consuming read models.
5. Verify product readback for the supplier scope and workforce projection before calling the correction live.

## Deployment Authority

- Repo-owned deploy workflow: Required for the image that contains the corrected source files.
- Shared runtime mutators: Not changed by this PR.
- Approved image digest: To be recorded after merge/deploy.
- ACA runtime invariant: Required if a web deploy occurs.
- Worker image invariant: Required for any operator job run.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after data-build/projection job completes.

## Rollback Plan

Revert the source-data PR and rerun the same governed data-build/projection job path. Because this change is limited to source CSV rows, rollback is a forward rebuild from restored Layer 1 input rather than a destructive database repair.

## Audit Evidence

- PR for this release.
- Local CSV semantic readback output.
- Local canonical data build output.
- Local Tower mart dry-run output.
- Governed ACA operator job proof bundle after live projection.
- Signed-in product readback after live projection.

## Known Gaps

- Live Azure/Postgres projection and product readback are not complete until the governed operator job runs after merge/deploy.
- Repo-wide canonical tenant input audit still has pre-existing active-template drift unrelated to this correction.
