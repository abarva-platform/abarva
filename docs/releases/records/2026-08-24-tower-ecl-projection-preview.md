# 2026-08-24-tower-ecl-projection-preview — Tower ECL Projection Preview

## Release ID

`2026-08-24-tower-ecl-projection-preview`

## Status

`candidate`

## Plain-English Summary

Adds a non-default Tower preview path that can read the governed ECL Tower projection table and show
whether the projection is loaded, how many rows it carries, which page areas it covers, and which
claims remain gated. The default Tower command center is unchanged.

## Layer Impact

- `global-control-lane`: Adds product-route read behavior for an explicit preview provider query.
- Layer 4 Products: Tower can display a governed ECL projection proof panel without treating that
  projection as the legacy Tower mart or as a default provider.

## Client Applicability

- All clients: No default behavior change.
- Specific clients: Only tenants with ECL projection rows and an explicit `provider=ecl_projection_db`
  query can see the preview panel.
- Internal only: Intended for operator/browser QA of the ECL projection path.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/tower/eclProjectionPreview.ts`: reads `ecl_projection.tower_command_center` for the dense
  ECL assessment and summarizes rows, gates, totals, and priority rows.
- `src/app/(maestro)/tower/page.tsx`: renders the ECL preview panel only when explicitly requested by
  query parameter.

## QA / Validation

- `npx eslint 'src/app/(maestro)/tower/page.tsx' src/lib/tower/eclProjectionPreview.ts`: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`:
  passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and
deploy the resulting image. No data load, schema migration, default-provider repoint, or traffic
operation is introduced by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Set by the deploy workflow after merge.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the Tower ECL preview is live-proven.

## Rollback Plan

Revert the PR or deploy the previous ACA main image. Because this is read-only and non-default, no
data rollback is required.

## Audit Evidence

- PR URL: to be attached after opening the PR.
- Local validation commands listed above.
- Live signed-in proof: pending post-deploy.

## Known Gaps

- This does not repoint the default Tower command center to ECL.
- This does not synthesize a full Tower mart view model from ECL.
- Browser proof is pending until after merge and deployment.
