# 2026-08-12-source-vendor-response-upload-package-clarity — Source vendor response upload package clarity

## Release ID

`2026-08-12-source-vendor-response-upload-package-clarity`

## Status

`candidate`

## Plain-English Summary

The Source Responses file-readiness ledger now tells operators exactly what must be uploaded for each vendor before parser-backed scoring can start. The UI states the minimum package as two required files per vendor: one main proposal package and one pricing workbook. SLA, staffing, transition, exceptions, and proof exhibits are shown as conditional or optional evidence that can arrive inside the main proposal or as separate exhibits.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source UI only. The change updates the existing Responses-stage file-readiness panel copy and requirement labels.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, all users on the Source Responses-stage canvas receive the presentation change after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/responses/VendorResponseFileReadinessPanel.tsx`
- `src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx`
- `docs/backlog/tracks/04-source-commercial/SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`

## QA / Validation

- `npx jest src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx --runInBand` passed.
- `npx eslint src/components/source/canvas/responses/VendorResponseFileReadinessPanel.tsx src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx` passed.
- `git diff --check` pending before PR.
- `npm run release:check -- --base origin/main --head HEAD` pending before PR.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, parser production ingestion, data migration, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because the deploy workflow updates worker jobs with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, a Source Responses route should show the minimum two-file package and conditional evidence rows.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior UI. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Local focused test and lint output from the candidate branch.
- Post-deploy ACA runtime invariant and signed-in Responses-stage screenshot required after merge.

## Known Gaps

- This does not implement new parser production ingestion, file persistence, scoring persistence, vendor communication dispatch, or approval automation.
- Conditional evidence still depends on the existing parser/readiness substrate and buyer workflow policy.
