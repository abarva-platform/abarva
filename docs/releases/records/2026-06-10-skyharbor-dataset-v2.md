# 2026-06-10-skyharbor-dataset-v2 — SkyHarbor comprehensive synthetic dataset v2 + SLA dimension

## Release ID

`2026-06-10-skyharbor-dataset-v2`

## Status

`candidate`

## Plain-English Summary

SkyHarbor's existing context was thin and chunk-only — structured facts barely
loaded (audit: 10 facts, 2 records). This adds a comprehensive, template-aligned,
loader-ready synthetic dataset for an ~$80B airline with a ~$2.0B IT budget,
spanning all modules, so the governed Admin bulk loader can commit STRUCTURED
FACTS (not just narrative chunks): application/CMDB (600), infrastructure estate
(698, incl. IBM Z mainframe + legacy Teradata/Netezza + AWS/Azure/GCP), vendor
contracts (120 ≈ $1.91B incl. IBM AMS $280M & AWS $180M), SLA register (72),
integration topology (500), IT financials (168 lines = $2.0B FY26), org roles
(272: CEO/7 C-Level/9 SVP/37 VP/119 Director/99 Sr Mgr), transformation
initiatives (60), DORA (40), incidents (400), AI tooling (40), business
capabilities (80), ERP landscape (60).

Each CSV's columns match its NORTHSTAR context template's `requiredFields`, so
`stage_and_process` promotes them to `enterprise_context_records`/`facts`. Adds a
new `sla-register` template + `service_levels` dimension (SLAs had no template).
100% synthetic cover-name data; deterministic generator.

This release covers data + the SLA dimension only. The actual ACA load, indexing,
and `agent_ready` promotion are subsequent gated steps.

## Layer Impact

- `client-data-lane`: new synthetic dataset for `skyharbor-air` (not yet loaded).
- `global-control-lane`: additive `service_levels` dimension + `sla-register`
  template in the context-ingestion registry (exhaustive maps updated; record_type
  `service_level`). No behavior change for existing dimensions.

## Client Applicability

- Specific clients: `skyharbor-air` only (synthetic demo tenant).
- Internal only: the SLA template/dimension is shared infra but additive.
- Feature flag: none.

## Changes Included

- `scripts/skyharbor/generate-skyharbor-v2.mjs` — deterministic generator.
- `datasets/skyharbor-air-synthetic-v2/` — 14 CSVs + `manifest.json` (2,839 rows).
- `docs/governance/dataset-manifests/skyharbor-air-synthetic-v2.json` — governance manifest.
- `src/lib/context-ingestion/types.ts` — `service_levels` dimension.
- `src/lib/context-ingestion/template-registry.ts` — `sla-register` template.
- `src/lib/context-ingestion/csv-upload-connector.ts` — segment map (`service_levels → it_landscape`).
- `src/lib/context-ingestion/admin-structured-context-promotion.ts` — record_type `service_level`.

## QA / Validation

- Generator runs deterministically; counts verified ($2.0B budget, $1.91B vendor, 272 org by level, 600 apps, multi-cloud + legacy infra present).
- `npm run validate:context-corpus:manifests` → passed.
- `npx tsc --noEmit` → clean for changed files.
- `npx eslint` (changed files) → clean.
- `npm run audit:architecture-rules` → 0 violations.
- Context-ingestion suite: 55/57 pass. The 2 failures (`csv-upload-connector.test.ts`
  fact-supersede `.update` mock) are **pre-existing on origin/main (249752b27)** — a
  test-mock gap, not introduced here (verified via stash). Flagged for separate fix.

## Rollout Plan

Merge to `main` via squash. No runtime effect until the dataset is loaded via an
ACA VNet job (`stage_and_process`) — a subsequent gated step. The SLA
template/dimension is additive and inert until an SLA dataset is loaded.

## Rollback Plan

Revert the squash commit. No data is loaded by this PR; the dataset files and the
additive template/dimension have no runtime effect until a load is run.

## Audit Evidence

- This PR; generator output; manifest validator pass; arch-rules JSON.
- Data audit + ingestion plan: `docs/source/SKYHARBOR_DATASET_AND_INGESTION_PLAN.md`.

## Known Gaps

- Not yet loaded to the data plane (ACA load is the next step).
- Indexing (→ `retrievable`) and `agent_ready` promotion machinery still to be built
  (shared blocker with the archetype framework lane).
- Pre-existing fact-supersede test-mock gap (flagged separately).
