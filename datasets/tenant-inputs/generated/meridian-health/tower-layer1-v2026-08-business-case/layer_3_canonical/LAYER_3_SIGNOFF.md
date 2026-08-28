# Tower Synthetic Source Data - Layer 3 Signoff

Package: `tower-layer1-v2026-08-business-case`
Layer: Canonical enterprise model
Status: locally generated; Azure write path prepared; live Azure write pending merged digest image
As of: 2026-08-24

## Layer 3 Purpose

Layer 3 is the source of truth for the synthetic Tower demo package. It converts the Layer 2 source-adapter rows into stable canonical objects, relationships, and measures.

This layer answers six plain questions:

1. What IT budgets exist by domain?
2. Which projects are AI-related and which are ordinary IT?
3. Which AI use cases have a business case?
4. Which AI tools are being rolled out?
5. Which values are promised, finance-reviewed, validated, or board-claimable?
6. Which evidence item supports each project, business case, and monthly value observation?

## Canonical Counts

| Canonical object | Count | Meaning |
| --- | ---: | --- |
| Budget | 8 | IT budget by domain or segment |
| Program / project | 140 | Total IT project portfolio rows |
| AI use case | 42 | AI-related business cases and foundation work |
| AI tool | 13 | Tool rollouts such as copilots, workflow assistants, or analytic agents |
| Monthly value observation | 504 | Monthly tracking rows across AI use cases |
| Finance approval event | 84 | Sponsor claim, target review, or actual validation events |
| Evidence item | 196 | Portfolio, business case, monthly metric, or finance-validation evidence |

Layer 3 also carries 280 relationships and 20 governed metric definitions.

Azure stores these rows using the approved physical object families: 512 `metric` objects, 140 `program` objects, 42 `ai_use_case` objects, 13 `ai_tool` objects, and 280 `control` objects. The more specific business meaning, such as Budget, Monthly value observation, Finance approval event, and Evidence item, is retained as `canonical_semantic_type` on each canonical object.

## Value Semantics

These terms must remain separate in every product projection:

| Term | Plain meaning |
| --- | --- |
| Approved budget | What the organization approved to spend on the project or domain |
| Promised value | The sponsor or business case estimate before full validation |
| Finance-reviewed value | Value Finance has reviewed but not fully validated as actual |
| Finance-validated value | Value Finance has accepted against a measurement method |
| Board-claimable value | Validated value cleared for executive or board reporting |

Approved budget is never a fallback for promised value. Promised value is never a fallback for validated value. If one value is missing, downstream products must show a gap instead of substituting another metric.

## AI Portfolio Semantics

The total IT project portfolio contains 140 projects. Only 42 are AI-related. The non-AI projects stay in the canonical portfolio so Tower can compare AI investment against the full IT budget, but they do not receive synthetic promised-value measures.

The AI-related population is intentionally split:

| Population | Count | Tracking rule |
| --- | ---: | --- |
| Direct-value AI cases | 28 | Carry promised annual value, ROI band, payback target, readiness, monthly value observations, and finance events |
| Foundation AI cases | 14 | Carry readiness and enablement evidence, but no direct ROI claim |
| Tool rollouts | 13 | Carry target users, active users, adoption target, actual adoption, and linked business-case count |

## Refresh Process for All Product Pages

The monthly refresh should run in this order:

1. Layer 1 intake: Data owners refresh source extracts for IT budget, project portfolio, AI business cases, tool rollout, monthly value tracking, finance approvals, and evidence.
2. Layer 2 adapters: Each source file lands into `ecl_source` with source file, source row, adapter run, and adapter emission lineage.
3. Layer 3 canonical: Canonical objects, relationships, metric definitions, and measures are rebuilt from Layer 2 only.
4. Cube build: Cubes are rebuilt from Layer 3 only. They may denormalize for speed, but they do not own facts.
5. Product projections: Home, Source, Intelligence, Tower, and any charting surface read disposable projections derived from the cube or canonical layer.
6. Product QA: Run fact-lineage checks, readback counts, route smoke tests, and signed-in visual QA before demo or client use.
7. Sunset: Retire older overlapping layers only after the replacement layer has passed readback, parity checks, and product-route proof.

## Azure Load Contract

The real Azure load must run through the governed ACA operator job after this loader and package are merged and built into a digest-pinned image.

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script tower:healthcare-demo-layer3-canonical:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --env TOWER_LAYER3_TENANT_KEY=meridian-health \
  --env TOWER_LAYER3_ASSESSMENT_ID=meridian-tower-layer2-source-adapters-v2026-08 \
  --env TOWER_LAYER3_BUILD_VERSION=tower-layer3-canonical-v2026-08 \
  --env TOWER_LAYER3_INPUT_SOURCE_VERSION=tower-layer1-v2026-08-business-case \
  --env TOWER_LAYER3_IDEMPOTENCY_KEY=meridian-tower-layer3-canonical-v2026-08:<main-sha> \
  --out-dir /tmp/tower-layer3-aca-proof
```

The loader refuses direct Azure writes unless all are true:

- `DATABASE_URL` is present.
- `TOWER_LAYER3_WRITE=true`.
- `TOWER_LAYER3_AZURE_WRITE_APPROVED=true`.

## Validation Gates

Layer 3 signoff requires:

- 987 canonical objects loaded.
- Physical object family counts match: 512 metric, 140 program, 42 AI use case, 13 AI tool, and 280 control.
- 280 canonical relationships loaded.
- 20 metric definitions loaded.
- More than 2,500 measures loaded.
- 0 objects without source-record lineage.
- 0 relationships without source-record lineage.
- 0 measures without source-record lineage.
- 0 tenant payload drift rows.
- 0 canonical objects whose source record is absent from Layer 2.
- 0 product projection or cube rows written by the Layer 3 loader.

Layer 3 signoff does not mean Tower, Home, Source, Intelligence, or cubes are refreshed. Those are Layer 4 and cube work.
