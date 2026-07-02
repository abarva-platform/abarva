# 2026-07-02-source-src47-board-pack-visual-polish — Source SRC47 Board-Pack Visual Polish

## Release ID

`2026-07-02-source-src47-board-pack-visual-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source AMS Contract Optimization executive brief for board-pack visual QA. It keeps the sourcing logic, exposure math, findings, levers, and recommended path unchanged, while making the exported brief safer to render by shortening the title hierarchy and replacing a fragile value-leakage arrow chain with a readable table.

## Layer Impact

- `global-control-lane`: Updates the shared Source contract optimization brief renderer.
- `public-demo`: Improves the SkyHarbor Air controlled CXO demo export package.

## Client Applicability

- All clients: Applies to the reusable Source contract optimization brief pattern.
- Specific clients: SkyHarbor Air demo event `SKYH-AMS-CONTRACT-OPT-2026`.
- Internal only: None.
- Public/demo only: Controlled CXO demo polish.
- Feature flag: None.

## Changes Included

- Uses a concise `AMS Contract Optimization Brief` title for AMS contract optimization exports.
- Preserves the full contract name as scoped context below the title.
- Replaces the value-leakage arrow chain with a renderer-safe sequence table.
- Adds regression coverage to prevent arrow glyphs and protect the improved title/table structure.

## QA / Validation

- PASS: Focused Jest for Source contract optimization MVE and answer engine.
- PASS: Focused ESLint for touched Source files.
- PASS: `tsc --noEmit`.
- PASS: `git diff --check`.
- NOT RUN YET: `npm run release:check` after this candidate record update.
- NOT RUN YET: Signed-in SkyHarbor browser/API proof after deployment.
- NOT RUN YET: PDF/PPTX/HTML visual QA package after deployment.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main lane, assign 100% traffic to the healthy revision, and verify the exported Source contract optimization artifacts from `https://app.abarva.ai`.

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

Audit evidence will include PR URL, CI/check output, ACA revision and digest, signed-in proof captures, exported MD/DOCX/PDF/HTML/PPTX artifacts, rendered page images, and the final CXO demo ZIP.

## Known Gaps

DOCX visual rendering depends on local LibreOffice availability. If the local render dependency is unavailable, DOCX will be structurally inspected and the PDF/PPTX/HTML exports will receive image-based visual QA.
