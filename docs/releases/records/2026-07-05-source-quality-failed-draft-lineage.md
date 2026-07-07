# 2026-07-05-source-quality-failed-draft-lineage — Preserve Reviewable Source Drafts When Quality Gate Fails

## Release ID

`2026-07-05-source-quality-failed-draft-lineage`

## Status

`candidate`

## Plain-English Summary

Source now preserves a generated RFP draft even when the partner-grade quality gate fails. The draft is marked `needs_review`, carries the failed quality-gate details, and is still stored in the File Cabinet so a client can review it, upload an approved final version, and preserve the draft-to-final authority chain.

## Layer Impact

- `global-control-lane`: Updates shared Source artifact generation behavior for all clients using Source artifact generation.
- `client-data-lane`: No schema or migration change. Existing Source artifact rows and File Cabinet records are used.

## Client Applicability

- All clients: Yes, for Source generated artifacts with consulting-grade quality review.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
  - Preserves quality-failed drafts as durable reviewable artifacts.
  - Marks preserved failed-quality drafts as `needs_review`.
  - Returns `qualityGateFailed` and the failure detail while keeping `ok: true` for the persisted draft.
  - Keeps non-quality failures, such as egress or empty output, as hard failures.

## QA / Validation

- Local QA: Pending.
- Signed-in live proof before fix: Fail for RFP updated-document path because failed-quality RFP drafts were discarded before File Cabinet lineage existed.
- Signed-in live proof target after fix: Source fresh-event journey must allow a generated quality-failed RFP draft to be reviewed/edited and superseded by an uploaded client-final RFP.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the signed-in Source buyer journey proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Azure Container Apps image deployment only.
- Approved image digest: Assigned by deployment workflow.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must receive 100% traffic on the new healthy revision.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this route change and redeploy the prior ACA image. No database rollback is required.

## Audit Evidence

- PR: Pending.
- Local validation: Pending.
- Live proof bundle before fix: `/Users/anand/Downloads/source-recording-readiness-live-20260705004702`.
- Post-deploy proof bundle: Pending.

## Known Gaps

None known for the route behavior. Export routes may still block failed-quality RFP exports until a client-final artifact is accepted or the quality gate passes.
