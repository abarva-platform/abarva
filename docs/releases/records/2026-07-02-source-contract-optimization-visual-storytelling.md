# 2026-07-02-source-contract-optimization-visual-storytelling — Source Contract Optimization Visual Storytelling

## Release ID

`2026-07-02-source-contract-optimization-visual-storytelling`

## Status

`candidate`

## Plain-English Summary

This release upgrades the Source existing AMS contract optimization output from a mostly prose brief into a more strategy-consulting-grade executive artifact. It adds deterministic visual insight data, consulting-style exhibits, and question-specific aVa chart/table response parts while preserving the proven sourcing logic, exposure rollup, findings, levers, and recommended path.

## Layer Impact

- `global-control-lane`: Updates shared Source contract optimization profile, answer, page, and export behavior.
- `public-demo`: Improves SkyHarbor Air controlled demo presentation quality for the existing-contract optimization use case.

## Client Applicability

- All clients: No broad behavior change outside the Source contract optimization pattern.
- Specific clients: SkyHarbor Air demo event `SKYH-AMS-CONTRACT-OPT-2026`.
- Internal only: None.
- Public/demo only: Controlled CXO demo polish.
- Feature flag: None.

## Changes Included

- Adds a structured `visualInsights` contract to the Source contract optimization MVE profile.
- Adds strategy consulting exhibits to the AMS Contract Optimization Brief: exposure bridge, invoice variance trend, operational pressure, and staffing coverage reconciliation.
- Adds compact visual insight cards to the live Source contract optimization panel.
- Adds question-specific aVa chart/table response parts for exposure, cure, proof, missing-evidence, and renewal decision questions.
- Adds regression coverage for visual insight data, brief exhibits, page visual cards, and aVa chart/table output.

## QA / Validation

- PASS: Focused Jest for Source contract optimization MVE, Source answer engine, and Source contract optimization panel.
- PASS: Focused ESLint for touched Source files.
- PASS: `git diff --check`.
- NOT RUN YET: Full TypeScript `tsc --noEmit`.
- NOT RUN YET: `npm run release:check` after this candidate record update.
- NOT RUN YET: Signed-in SkyHarbor browser/API proof after deployment.
- NOT RUN YET: DOCX/PDF/Markdown export visual QA after deployment.

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

Audit evidence will include PR URL, CI/check output, ACA revision and digest, signed-in proof screenshots/API payloads, aVa answer captures, and exported MD/DOCX/PDF artifacts.

## Known Gaps

This release adds deterministic visuals and consulting-style exhibits, but full external board-pack design remains a future polish area. It does not add real messy-upload extraction proof or alter the core sourcing optimization logic.
