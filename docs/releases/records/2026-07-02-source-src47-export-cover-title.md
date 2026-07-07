# 2026-07-02-source-src47-export-cover-title — Source SRC47 Export Cover Title

## Release ID

`2026-07-02-source-src47-export-cover-title`

## Status

`candidate`

## Plain-English Summary

This release completes the SRC47 board-pack visual polish by applying the concise AMS Contract Optimization title to the DOCX/PDF cover metadata, not only the Markdown body. The full agreement name remains preserved inside the brief as the contract in scope.

## Layer Impact

- `global-control-lane`: Updates the shared Source contract optimization export API wrapper.
- `public-demo`: Improves SkyHarbor Air controlled CXO demo export cover readability.

## Client Applicability

- All clients: Applies to the reusable Source contract optimization export route.
- Specific clients: SkyHarbor Air demo event `SKYH-AMS-CONTRACT-OPT-2026`.
- Internal only: None.
- Public/demo only: Controlled CXO demo polish.
- Feature flag: None.

## Changes Included

- Uses the configured concise document title for DOCX/PDF export cover pages.
- Keeps the full contract name in the authored brief body under contract scope.
- Preserves event code, artifact code, generated timestamp, and export metadata.

## QA / Validation

- PASS: Focused Jest for Source contract optimization MVE and answer engine.
- PASS: Scoped ESLint for touched files.
- PASS: `tsc --noEmit`.
- PASS: `git diff --check`.
- NOT RUN YET: `npm run release:check` after this candidate record update.
- NOT RUN YET: Signed-in SkyHarbor browser/API proof after deployment.
- NOT RUN YET: PDF cover visual QA after deployment.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main lane, assign 100% traffic to the healthy revision, and verify the exported Source contract optimization PDF/DOCX cover from `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps image/revision only.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% ingress traffic only after health verification.
- Worker image invariant: No worker/job image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision or revert this commit and redeploy through the same ACA lane. No schema, migration, or data-plane rollback is required.

## Audit Evidence

Audit evidence will include PR URL, CI/check output, ACA revision and digest, signed-in export captures, rendered PDF cover image, and the final SRC47 CXO demo ZIP.

## Known Gaps

DOCX visual rendering still depends on local LibreOffice availability. If the local render dependency is unavailable, DOCX will be structurally inspected and PDF rendering will be used for page-level visual proof.
