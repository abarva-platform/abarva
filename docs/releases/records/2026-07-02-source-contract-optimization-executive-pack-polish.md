# 2026-07-02-source-contract-optimization-executive-pack-polish — Source Contract Optimization Executive Pack Polish

## Release ID

`2026-07-02-source-contract-optimization-executive-pack-polish`

## Status

`candidate`

## Plain-English Summary

This release polishes the Source existing AMS contract optimization experience for controlled CXO demos. It adds a one-page executive front sheet to the optimization brief, makes the decision snapshot easier to read in exported formats, and compresses aVa contract-optimization answers into a cleaner executive structure while preserving the same findings, levers, exposure rollup, and recommended path.

## Layer Impact

- `global-control-lane`: Updates shared Source answer and export-generation behavior for the contract optimization pattern.
- `public-demo`: Improves SkyHarbor Air controlled demo presentation quality for the existing-contract optimization use case.

## Client Applicability

- All clients: No broad behavior change outside the Source contract optimization answer/export path.
- Specific clients: SkyHarbor Air demo event `SKYH-AMS-CONTRACT-OPT-2026`.
- Internal only: None.
- Public/demo only: Controlled CXO demo polish.
- Feature flag: None.

## Changes Included

- Adds a one-page executive front sheet to the AMS Contract Optimization Brief.
- Converts the brief decision snapshot from a wide table into executive bullets to reduce DOCX/PDF layout risk.
- Compresses contract optimization aVa answers into direct answer, top drivers, financial exposure, action required, and evidence note.
- Adds regression coverage for the executive front sheet, answer brevity, and absence of old RFP/demo identity in generated brief content.

## QA / Validation

- PASS: Focused Jest for Source contract optimization, Source answer engine, Source canvas, and Source tenant-scope tests.
- PASS: Focused ESLint for touched files.
- PASS: `tsc --noEmit`.
- PASS: `npm run release:check`.
- NOT RUN YET: Signed-in SkyHarbor browser/API proof after deployment.
- NOT RUN YET: DOCX/PDF/Markdown export checks for client-facing identity, front sheet content, forbidden-term cleanup, and readability.

## Rollout Plan

Merge to `main`, build through the approved Azure Container Apps deploy lane, assign 100% traffic to the healthy revision, and verify on `https://app.abarva.ai` with signed-in SkyHarbor proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps image/revision only.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% ingress traffic only after health verification.
- Worker image invariant: No worker/job image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision or revert the merged commit and redeploy through the same ACA lane. No schema, migration, or data-plane rollback is required.

## Audit Evidence

Audit evidence will include PR URL, CI/check output, ACA revision and digest, signed-in proof screenshots/API payloads, and exported MD/DOCX/PDF artifacts.

## Known Gaps

Full external board-pack styling is still a future polish area. This release focuses on executive readability without changing the sourcing logic.
