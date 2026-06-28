# 2026-06-28-moves-p2-review-decision-jsonb-hotfix — Moves P2 Review Decision JSONB Hotfix

## Release ID

`2026-06-28-moves-p2-review-decision-jsonb-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the production persistence path for Moves P2 review decisions. The live
review packet could be read, but saving “approve for P3 draft” failed because
list-shaped review fields were passed to Azure/Postgres without JSONB
serialization.

## Layer Impact

- `global-control-lane`: Shared Moves review-decision save behavior for all
  clients using the File Cabinet review workflow.

## Client Applicability

- All clients: Yes, for Moves P2 review-decision persistence.
- Specific clients: Lakeshore is the live proof tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/deliverables/artifact-review-decisions.ts`
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-decision/__tests__/route.test.ts`

## QA / Validation

- PASS: Focused Jest for artifact review decisions and review-decision route.
- PASS: Scoped ESLint on changed files.
- PASS: Release control gate after this record update.
- REQUIRED AFTER DEPLOY: signed-in Lakeshore proof that review decision POST
  persists and turns on P3 draft readiness while P2 final and P3 final remain
  blocked.

## Rollout Plan

Merge to `main`, deploy through the approved ACA main deploy workflow, then
rerun the signed-in Lakeshore and wrong-tenant proof against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: Azure Container Apps web image and worker image sync.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: To be captured after deploy.
- Worker image invariant: ACA main deploy updates worker jobs to the same image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback ACA traffic to the prior healthy revision. No schema rollback is
required; the additive review-package migration remains safe and this hotfix
only changes JSONB serialization on insert.

## Audit Evidence

- Hotfix PR and CI run.
- ACA deploy run, revision, digest, traffic, and health proof.
- Signed-in Lakeshore API payloads and screenshots.
- Wrong-tenant negative proof payloads and screenshots.

## Known Gaps

This hotfix does not generate P3 artifacts and does not mark P2 final. It only
repairs review-decision persistence so the already-designed readiness contract
can be live-proven.

