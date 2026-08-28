# Tower Synthetic Source Data - Layer 2 Signoff

Package: `tower-layer1-v2026-08-business-case`
Layer: Source adapters
Status: locally validated; Azure write path prepared; live Azure write requires governed ACA job approval
As of: 2026-08-24

## Layer 2 Purpose

Layer 2 converts client-owned Layer 1 source files into auditable adapter outputs. The client does not see this layer. It exists so every future canonical object can be traced back to the exact source file and CSV row that produced it.

This layer answers four questions:

1. Which source files were read?
2. Which adapter handled each file?
3. What canonical object did each source row emit?
4. Can every emitted object be traced back to a source file and source row?

## Adapter Coverage

| Adapter | Source file | Emits |
| --- | --- | --- |
| `meridian_budget_domain_adapter` | `20_it_budget_by_domain.csv` | Budget |
| `meridian_it_project_adapter` | `21_it_project_portfolio.csv` | Project |
| `meridian_ai_business_case_adapter` | `22_ai_business_cases.csv` | AIUseCase |
| `meridian_tool_rollout_adapter` | `23_ai_tool_rollout.csv` | Tool |
| `meridian_monthly_value_adapter` | `24_monthly_value_tracking.csv` | MetricObservation |
| `meridian_finance_approval_adapter` | `25_finance_approval_ledger.csv` | ApprovalEvent |
| `meridian_evidence_adapter` | `26_evidence_register.csv` | Evidence |

## Expected Azure Landing Counts

The Layer 2 Azure load lands records into `ecl_source` only.

| Record type | Count |
| --- | ---: |
| Source files | 9 |
| Total source records | 1,981 |
| Client source extract records | 987 |
| Adapter run records | 7 |
| Adapter emission records | 987 |

The 9 source files are the 7 Layer 1 source extracts plus 2 Layer 2 adapter audit files.

## Validation Results

Local validation must pass:

- 7 adapter runs
- 987 adapter emissions for 987 Layer 1 source rows
- 0 adapter emissions without preserved lineage
- 0 duplicate emitted canonical object IDs
- 0 tenant payload drift rows
- 0 adapter-lineage drift rows

Azure readback is a separate gate. It is not complete until a governed ACA operator job writes this package to `ecl_source` and the readback SQL confirms the same counts above.

## Azure Load Contract

The real Azure load must run through the governed ACA operator job after this loader and package are merged and built into a digest-pinned image.

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script tower:healthcare-demo-layer2-source-adapters:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --env TOWER_LAYER2_TENANT_KEY=meridian-health \
  --env TOWER_LAYER2_ASSESSMENT_ID=meridian-tower-layer2-source-adapters-v2026-08 \
  --env TOWER_LAYER2_BUILD_VERSION=tower-layer2-source-adapters-v2026-08 \
  --env TOWER_LAYER2_INPUT_SOURCE_VERSION=tower-layer1-v2026-08-business-case \
  --env TOWER_LAYER2_IDEMPOTENCY_KEY=meridian-tower-layer2-source-adapters-v2026-08:<main-sha> \
  --out-dir /tmp/tower-layer2-aca-proof
```

The loader refuses direct Azure writes unless both are true:

- `DATABASE_URL` is present.
- `TOWER_LAYER2_AZURE_WRITE_APPROVED=true`.

## Sunset Rule

After Azure readback passes, older overlapping Tower source-adapter demo slices can be sunset. The purge must be scoped by tenant and assessment ID. Do not delete unrelated source files, canonical rows, cube rows, product projections, or other tenant data.

Layer 2 signoff means the adapter landing layer is credible and loadable. It does not mean Layer 3 canonical objects or Layer 4 Tower screens are refreshed.
