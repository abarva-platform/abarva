# 2026-06-12-source-e2e-self-healing-gates — Source E2E Self-Healing Gates

## Release ID

`2026-06-12-source-e2e-self-healing-gates`

## Status

`candidate`

## Plain-English Summary

This release raises the Source module's end-to-end quality bar for enterprise sourcing events. The SkyHarbor IT outsourcing evidence room is deepened to an $80B-airline-scale RFP data room, Source generation now binds parsed uploaded evidence into the prompt context, and the flagship RFP package must pass a partner-grade consulting rubric before it can be persisted or exported.

## Layer Impact

- `global-control-lane`: Source artifact generation, quality review, prompt context binding, and export guards now apply across clients.
- `client-data-lane`: The SkyHarbor synthetic Source E2E data room is enhanced with richer evidence files and reconciliation proof.
- `internal-admin`: Adds a repeatable Playwright crawl and evidence-room generation script for operators.

## Client Applicability

- All clients: Source RFP generation and export quality controls.
- Specific clients: SkyHarbor test package evidence room and crawl data.
- Internal only: Playwright crawl, Gate A receipt, and validation reports.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `scripts/testing/generate-source-e2e-evidence-room.mjs`.
- Enhanced `docs/testing/source-e2e-it-outsourcing/datasets-evidence-v2/03_System_Workload_Volumetrics.csv`.
- Enhanced `docs/testing/source-e2e-it-outsourcing/datasets-evidence-v2/06_Tower_Scope_Service_Catalog.csv`.
- Added evidence files 11-15 for data centers/private cloud, network topology, security/compliance, transition blackouts, and run-vs-change baseline.
- Added `docs/build/source-e2e-self-healing/GATE_A_EVIDENCE_ROOM_RECEIPT.md`.
- Added a consulting-grade 10-dimension quality rubric under `src/lib/deliverables/quality/`.
- Wired Source RFP generation to review and, if needed, rewrite once before persisting.
- Bound parsed uploaded evidence excerpts and fact summaries into Source generation context.
- Blocked RFP DOCX/PDF/HTML/deal-pack export unless the authored RFP passed the quality gate.
- Added `tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts`.

## QA / Validation

- `node scripts/testing/generate-source-e2e-evidence-room.mjs` passed; Gate A receipt generated.
- `npx eslint` on touched Source generation, quality, export, test, and crawl files passed.
- `npx jest src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts src/lib/source/exports/__tests__/narrative-export-quality-gate.test.ts src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false` touched-path filter passed; the full repo check still reports pre-existing missing optional packages in the local symlinked dependency tree (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`).
- Live Playwright crawl and deployment proof will be attached before final handoff.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps image from `main`, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the new revision, then run the encoded live crawl against `https://app.abarva.ai`.

## Rollback Plan

Rollback by shifting Azure Container Apps traffic back to the prior healthy revision. No destructive migration is included. The evidence-room files and tests can remain in the repo; runtime behavior reverts with the image.

## Audit Evidence

- Gate A receipt: `docs/build/source-e2e-self-healing/GATE_A_EVIDENCE_ROOM_RECEIPT.md`.
- Encoded crawl: `tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts`.
- Focused unit test output listed above.
- Final live crawl screenshots/report pending deployment.

## Known Gaps

- The live crawl is intentionally pending until the merged image is deployed to Azure Container Apps; running it on the current production image would test old behavior.
