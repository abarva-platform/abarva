# 2026-09-10-moves-generated-artifact-approval-lookup — Moves Generated Artifact Approval Lookup

## Release ID

`2026-09-10-moves-generated-artifact-approval-lookup`

## Status

`candidate`

## Plain-English Summary

Moves generated-artifact approval now uses the same tenant identity lookup shape as the artifact cabinet. This lets a signed-in reviewer approve a generated artifact when older generated rows were persisted under the tenant key while the current session resolves to the canonical client id.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Moves artifact approval can bridge a generated draft into the governed deliverable record without failing on tenant-id alias drift.

Canonical model layer: No schema or data model change. The route still checks program visibility before artifact lookup and still rejects generated artifacts that do not belong to the requested Move.

## Client Applicability

- All clients: Yes, for Moves generated-artifact approval.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts`
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts' --runInBand` passed.

## Rollout Plan

Merge through PR, then deploy via the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Verify after deploy before claiming live proof.
- Worker image invariant: Verify affected web and worker images after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Moves synthetic approval path.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

- Pull request URL after creation.
- Focused route regression test output.
- Post-deploy Moves synthetic smoke output.

## Known Gaps

No data cleanup is included.
