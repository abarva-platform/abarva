# 2026-09-08 Source-Tower Contract Drill-Through

## Release ID

`2026-09-08-source-tower-contract-drillthrough`

## Status

`candidate`

## Plain-English Summary

Source keeps its concise executive contract shortlist while adding a compact finder for any governed contract by identifier, vendor, or agreement name. Tower actions that already route to Source now preserve the governed contract identifier and offer a read-only link to the matching Contract 360 Optimize view.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source contract discovery and Tower action drill-through are updated.
- Layers 1-3: No intake, adapter, canonical data, calculation, or tenant record changes.

## Client Applicability

- All clients: Yes, when governed Source contracts or Source-directed Tower actions are present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace contract finder with a 20-result display cap.
- Tower serving-reader fallback from `primary_object_id` to the governed `contract_id` already present in the display payload.
- Tower action view and drawer support for a read-only Source Contract 360 link.
- Focused Source, Tower reader, view-model, and drawer tests.

## QA / Validation

- Focused Jest suites: PASS (4 suites, 81 tests).
- Scoped ESLint: PASS.
- TypeScript no-emit check under Node 24: PASS.
- Release-control check: PASS.
- Live signed-in Source and Tower proof: required after deployment.

## Rollout Plan

Merge by squash through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA, after which signed-in Source and Tower drill-through checks are run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded by the deployment workflow after merge.
- ACA runtime invariant: Template, active revision, and 100% traffic image must match the workflow-approved digest.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; find a non-shortlisted contract in Source and open a Source-directed Tower action into the same Contract 360 record.

## Rollback Plan

Revert the squash merge through a new PR and redeploy the resulting main SHA. No data rollback is required.

## Audit Evidence

- PR URL and merge SHA after candidate publication.
- CI and ACA main-deploy runs for the exact merge SHA.
- Focused local test, lint, typecheck, and release-check output.
- Signed-in Source and Tower browser proof after deployment.

## Known Gaps

The link is read-only. It does not create a Move, approve an action, or mutate Source or Tower data.
