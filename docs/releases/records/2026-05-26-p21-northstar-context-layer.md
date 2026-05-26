# 2026-05-26-p21-northstar-context-layer - Northstar Context Layer + Dynamic Ingestion Pilot

## Release ID

`2026-05-26-p21-northstar-context-layer`

## Status

`candidate`

## Plain-English Summary

Adds a comprehensive Northstar Clinical Technologies pilot substrate for a $22.6B global clinical technology enterprise. The release includes a generated synthetic context layer, upload-template catalog, deterministic ingestion scaffold, Northstar admin visualization pages, five CXO demo personas, and verification that the pack can demonstrate how uploads become approved, evidence-backed, agent-ready context.

## Layer Impact

- `client-data-lane`: adds the Northstar synthetic dataset with financials, ERP, CMDB, integrations, vendors, initiatives, org/roles, QMS, DORA, AI tooling, incidents, and market corpus files.
- `corpus-knowledge-lane`: adds Northstar industry-context source files and corpus chunks for medtech / clinical technology reasoning.
- `agent-quality-lane`: adds deterministic context-ingestion classification, extraction, validation, approval, commit, and evidence-writing helpers that future Sentinel/Source wiring can consume.
- `app-control-lane`: adds authenticated admin pages under `/admin/context-layer` to show templates, uploads, approval queue, sync stages, and evidence map.
- `ops-release-lane`: adds generator, verifier, smoke test, package scripts, and this release record.

## Client Applicability

- Specific clients: Northstar Clinical Technologies is added as a new demo/pilot client key and persona family.
- All clients: no behavior change to existing Apex, Meridian, or First Capital tenant data.
- Internal only: Northstar admin context-layer pages are authenticated operator/demo surfaces.
- Public/demo: the five Northstar CXO demo personas are available for provisioning through the existing demo-user scripts.
- Feature flag: none in this scaffold release.

## Changes Included

- Dataset generator: `scripts/seed/generate-northstar-context-layer.mjs`
- Dataset verifier: `scripts/verify/northstar-context-layer-scaffold.mjs`
- Generated pack: `datasets/northstar-clinical-tech-synthetic-v1/`
- Template catalog: `docs/build/northstar/NORTHSTAR_CONTEXT_LAYER_TEMPLATE_CATALOG.md`
- Execution report: `docs/build/northstar/NORTHSTAR_CONTEXT_LAYER_EXECUTION_REPORT.html`
- Ingestion runtime scaffold: `src/lib/context-ingestion/*`
- Admin pages: `src/app/(maestro)/admin/context-layer/*`
- API route: `src/app/api/context-ingestion/northstar/route.ts`
- Demo persona/client wiring: `src/lib/client-config.ts`, `src/lib/auth/cxo-personas.ts`, `src/testing/test-users/spec.ts`, provisioning scripts.
- Smoke: `scripts/smoke/northstar-context-ingestion.spec.ts`

## QA / Validation

- PASS target: `node scripts/seed/generate-northstar-context-layer.mjs`
- PASS target: `npm run verify:northstar-context-layer`
- PASS target: `npm run smoke:northstar-context-ingestion`
- PASS target: focused ESLint and TypeScript checks before merge.
- Any production deploy remains gated on the normal GitHub checks and Vercel deployment status.

## Rollout Plan

Merge to main after local verification and CI are green. The pack is additive and does not mutate existing tenant tables by itself. Provision Northstar demo users only when the pilot environment is ready, using the existing dry-run/apply flow for CXO personas or test users.

## Rollback Plan

Revert the application commit to remove the Northstar client wiring, context-layer routes, runtime scaffold, and generated dataset. Because this release is additive and file-backed, rollback does not require deleting production tenant data unless a later provisioning step explicitly created demo users.

## Audit Evidence

- Generated dataset row counts in `datasets/northstar-clinical-tech-synthetic-v1/99-verification/expected-row-counts.json`.
- Template catalog documenting the context dimensions and upload process.
- HTML execution report with left-side menu for pilot review.
- Smoke output from `npm run smoke:northstar-context-ingestion`.
- Verification output from `npm run verify:northstar-context-layer`.
- GitHub PR checks and Vercel deployment logs for the merge.

## Known Gaps

- The Northstar pack is generated and scaffolded; loading it into Azure Postgres as durable tenant rows is a follow-up.
- The ingestion scaffold is deterministic and local-first; full PDF/DOCX/OCR extraction through the AI egress wrapper is a follow-up production hardening slice.
- The admin pages visualize the process and canonical counts; they do not yet provide a full authenticated file-upload UI with storage-backed versioning.
