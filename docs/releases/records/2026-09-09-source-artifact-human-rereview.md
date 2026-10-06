# Source Artifact Human Re-review

## Release ID

`2026-09-09-source-artifact-human-rereview`

## Status

`candidate`

## Plain-English Summary

Allows an authorized operator to rerun the existing consulting-grade quality gate after editing an AI-authored decision artifact. The review uses the current persisted body and governed event context; it does not generate a replacement draft beforehand.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer 4, product workflow:** extends the artifact-generation route with an explicit human-edited-body review mode.
- No schema, tenant data model, adapter, or canonical-object change is included.

## Client Applicability

- **All clients:** available wherever decision-artifact generation is authorized.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none.

## Changes Included

- `POST /api/v1/source/:eventId/artifacts/:artifactCode/generate` accepts `{ "reviewExistingBody": true }`.
- The route rejects an empty persisted body and artifact types that do not require the consulting-grade gate.
- Re-review preserves prior generation and human-edit metadata, then records the new quality and section-verification receipts.
- Focused unit coverage for ordinary generation, successful re-review input resolution, and missing-body refusal.

## QA / Validation

- **PASS:** focused Jest suite for human-edited-body input resolution.
- **PASS:** scoped ESLint for touched TypeScript files.
- **PASS:** TypeScript no-emit check.
- **PASS:** release-record validation.
- **NOT RUN:** live signed-in proof; required after deployment with a corrected flagship artifact re-review, Gate B receipt readback, and export smoke.

## Rollout Plan

1. Merge by squash through the protected `main` branch.
2. Build and deploy through `.github/workflows/aca-main-deploy.yml`.
3. Verify the digest-pinned ACA runtime invariant.
4. Run signed-in re-review and export proof on an active Source event.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** none outside the repo-owned workflow.
- **Approved image digest:** captured from the successful deploy run.
- **ACA runtime invariant:** template, active revision, and 100% traffic image must match the approved digest.
- **Worker image invariant:** unchanged.
- **Feature/env flag update path:** none.
- **Live signed-in proof required:** yes.

## Rollback Plan

Revert the squash commit and redeploy through the same main workflow. Existing artifact bodies and review receipts remain auditable; no database rollback is required.

## Audit Evidence

- PR, merge SHA, deployment run, ACA revision and digest: captured at rollout.
- Focused test, lint, TypeScript, and release-check output: captured before merge.
- Signed-in artifact re-review response and export smoke: captured after deploy.

## Known Gaps

- Re-review remains intentionally limited to artifact classes already registered for the consulting-grade gate.
