# 2026-06-28-moves-cio-demo-p1-p2 — Moves CIO Demo P1/P2 Buildout

## Release ID

`2026-06-28-moves-cio-demo-p1-p2`

## Status

`candidate`

## Plain-English Summary

Moves now uses client-safe sponsor copy when a Move has no named sponsor and stores generated phase deliverables in the durable File Cabinet vault. This lets generated P1/P2 artifacts participate in the same review/regenerate lifecycle as uploaded evidence and gate artifacts.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves UI copy and generated-artifact persistence behavior change for all clients.
- `client-data-lane`: No schema or migration change; generated Move artifacts are additionally registered in existing `move_artifacts` storage.

## Client Applicability

- All clients: yes, for Strategic Moves surfaces and generated artifact cabinet behavior.
- Specific clients: Lakeshore is the live proof tenant for this release.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Strategic Moves sponsor display helper: `src/components/strategic-moves/sponsor-display.ts`.
- Moves list/detail/phase surfaces now render `Sponsor: To be assigned` instead of raw `Unassigned` when no sponsor person exists.
- `/api/v1/programs/:programId/generate` now registers generated deliverables in `move_artifacts` as `generated_deliverable` so review/regenerate can operate on the generated document itself.
- Tests updated for sponsor copy and generated artifact vault persistence.

## QA / Validation

- Scoped Jest for the Moves phase workspace and generate route must pass before merge.
- Scoped ESLint must pass for touched files.
- `npm run release:check` must pass.
- Live proof after deployment must generate Lakeshore P1/P2 artifacts, run P2 review/regenerate, and capture File Cabinet inventory.

## Rollout Plan

Merge to `main`, build the exact git SHA through ACR, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic to the new healthy revision, then run signed-in Lakeshore browser/API proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: `az acr build`, `az containerapp update`, traffic assignment.
- Approved image digest: to be recorded after build.
- ACA runtime invariant: `app.abarva.ai` must run the digest-pinned ACA image, not Vercel.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Roll traffic back to the prior healthy ACA revision. No data migration rollback is required. Existing generated artifact rows are additive and can remain as audit history.

## Audit Evidence

- PR URL and merge SHA.
- ACA revision, image digest, and health check.
- Signed-in Lakeshore proof bundle with screenshots, generated artifact IDs, review/regenerate IDs, and wrong-tenant negative proof.

## Known Gaps

- This release does not create or assign a fake sponsor person. The Move still requires a supported sponsor assignment workflow or real sponsor selection to replace `To be assigned` with a named person.
