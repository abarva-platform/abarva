import { createHash } from "node:crypto";

import { Client } from "pg";

import {
  buildContractOptimizationFactLayer,
  type ContractOptimizationFactLayer,
} from "../../src/lib/source/data-model/contract-optimization-facts";
import {
  buildContractOptimizationOpportunitySet,
  type ContractOptimizationOpportunity,
  type ContractOptimizationOpportunitySet,
  type OpportunityCalculationLine,
  type OpportunitySourceReference,
} from "../../src/lib/source/data-model/contract-optimization-opportunity";
import type { SourceContract360Row } from "../../src/lib/source/data-model/types";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

type Row = Record<string, unknown>;

const DEFAULT_TENANT_KEY = "skyharbor_global";
const DEFAULT_DATASET_ID = "skyharbor-source-v4-202608-golden-evidence";
const DEFAULT_DATASET_VERSION = "v4-golden-evidence";
const DEFAULT_CONTRACT_IDS = ["CTR-090", "CTR-061"];

interface Args {
  readonly apply: boolean;
  readonly tenantKey: string;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly contractIds: readonly string[];
}

interface ContractEvidenceRows {
  readonly contract: SourceContract360Row | null;
  readonly overview: Row | null;
  readonly pricingRows: readonly Row[];
  readonly invoiceRows: readonly Row[];
  readonly poRows: readonly Row[];
  readonly rateRows: readonly Row[];
  readonly slaRows: readonly Row[];
  readonly usageRows: readonly Row[];
  readonly renewalRows: readonly Row[];
  readonly financeRow: Row | null;
  readonly pdfClauseRows: readonly Row[];
}

interface ContractProjection {
  readonly contractId: string;
  readonly opportunitySet: ContractOptimizationOpportunitySet | null;
  readonly factLayer: ContractOptimizationFactLayer;
}

interface ContractCalculationCoverage {
  readonly contractId: string;
  readonly opportunityCount: number;
  readonly amountBearingOpportunityCount: number;
  readonly calculationRunCount: number;
  readonly missingCalculationOpportunityIds: readonly string[];
  readonly mismatchedCalculationOpportunityIds: readonly string[];
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const value = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    if (index >= 0) return argv[index + 1];
    return argv
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };

  return {
    apply:
      argv.includes("--apply") ||
      process.env.SOURCE_CONTRACT_OPTIMIZATION_SPINE_APPLY === "true",
    tenantKey:
      value("--tenant-key") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_TENANT_KEY ??
      DEFAULT_TENANT_KEY,
    datasetId:
      value("--dataset-id") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_DATASET_ID ??
      DEFAULT_DATASET_ID,
    datasetVersion:
      value("--dataset-version") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_DATASET_VERSION ??
      DEFAULT_DATASET_VERSION,
    contractIds: [
      ...new Set(
        (
          value("--contract-id") ??
          process.env.SOURCE_CONTRACT_OPTIMIZATION_CONTRACT_ID ??
          DEFAULT_CONTRACT_IDS.join(",")
        )
          .split(",")
          .map((contractId) => contractId.trim())
          .filter(Boolean),
      ),
    ],
  };
}

function databaseUrl(): string {
  const url =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/gu, '""')}"`;
}

function tenantAliases(tenantKey: string): string[] {
  return [
    ...new Set(
      [tenantKey, tenantKey === "skyharbor_global" ? "skyharbor" : null].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ];
}

async function queryRows(
  client: Client,
  tableName: string,
  args: Args,
  contractId: string,
  orderBy = "_source_row_number",
): Promise<Row[]> {
  const result = await client.query<Row>(
    `SELECT *
       FROM source.${quoteIdent(tableName)}
      WHERE _tenant_key = $1
        AND _dataset_id = $2
        AND contract_id = $3
      ORDER BY ${orderBy}`,
    [args.tenantKey, args.datasetId, contractId],
  );
  return result.rows;
}

async function readContractEvidence(
  client: Client,
  args: Args,
  contractId: string,
): Promise<ContractEvidenceRows> {
  const [
    contractResult,
    overviewRows,
    pricingRows,
    invoiceRows,
    poRows,
    rateRows,
    slaRows,
    usageRows,
    renewalRows,
    financeRows,
    pdfClauseRows,
  ] = await Promise.all([
    client.query<SourceContract360Row>(
      `SELECT *
         FROM source.contract_360
        WHERE tenant_key = ANY($1::text[])
          AND contract_id = $2
        LIMIT 1`,
      [tenantAliases(args.tenantKey), contractId],
    ),
    queryRows(client, "golden_contract_overview", args, contractId),
    queryRows(client, "golden_contract_pricing_schedule", args, contractId),
    queryRows(client, "golden_contract_invoice_lines", args, contractId),
    queryRows(client, "golden_contract_po_contract_match", args, contractId),
    queryRows(client, "golden_contract_rate_card_variance", args, contractId),
    queryRows(
      client,
      "golden_contract_sla_incident_service_credit_monthly",
      args,
      contractId,
      "period_month",
    ),
    queryRows(
      client,
      "golden_contract_usage_entitlement_monthly",
      args,
      contractId,
      "period_month, sku_or_service",
    ),
    queryRows(
      client,
      "golden_contract_renewal_negotiation_history",
      args,
      contractId,
      "event_date, renewal_event_id",
    ),
    queryRows(
      client,
      "golden_contract_finance_value_confirmation",
      args,
      contractId,
      "confirmation_date DESC NULLS LAST, _loaded_at DESC NULLS LAST",
    ),
    queryRows(
      client,
      "contract_pdf_clause_extractions",
      args,
      contractId,
      "source_page, concept_ref",
    ),
  ]);
  const scopeRows = overviewRows[0]
    ? await queryRows(
        client,
        "golden_contract_application_scope",
        args,
        contractId,
      )
    : [];

  return {
    contract:
      contractResult.rows[0] ??
      contractFromGoldenOverview(overviewRows[0] ?? null, {
        scopeRows,
        slaRows,
      }),
    overview: overviewRows[0] ?? null,
    pricingRows,
    invoiceRows,
    poRows,
    rateRows,
    slaRows,
    usageRows,
    renewalRows,
    financeRow: financeRows[0] ?? null,
    pdfClauseRows,
  };
}

function contractFromGoldenOverview(
  overview: Row | null,
  evidence: {
    readonly scopeRows: readonly Row[];
    readonly slaRows: readonly Row[];
  },
): SourceContract360Row | null {
  if (!overview) return null;
  const contractId = stringValue(overview.contract_id);
  const vendorId = stringValue(overview.vendor_id);
  const vendorName = stringValue(overview.vendor_name);
  const contractName = stringValue(overview.contract_name);
  if (!contractId || !vendorId || !vendorName || !contractName) return null;

  const scopedApplicationCount = evidence.scopeRows.length;
  const criticalApplicationCount = evidence.scopeRows.filter((row) => {
    const criticality = stringValue(row.criticality)?.toLowerCase() ?? "";
    return ["critical", "tier 1", "tier1", "high"].includes(criticality);
  }).length;
  const sev1Sev2Incidents = evidence.slaRows.reduce(
    (sum, row) =>
      sum +
      (numberValue(row.sev1_incident_count) ?? 0) +
      (numberValue(row.sev2_incident_count) ?? 0),
    0,
  );
  const linkedBudgetAmount = evidence.scopeRows.reduce(
    (sum, row) => sum + (numberValue(row.annual_run_cost_usd) ?? 0),
    0,
  );

  return {
    tenant_key: stringValue(overview.tenant_key) ?? "",
    contract_id: contractId,
    vendor_ref: vendorId,
    vendor_name: vendorName,
    vendor_category: stringValue(overview.contract_archetype),
    contract_name: contractName,
    scope_summary: stringValue(overview.contract_english_overview),
    annual_value: numberValue(overview.annual_value_usd),
    total_committed_value: numberValue(overview.total_committed_value_usd),
    committed_annual_spend: numberValue(overview.annual_value_usd),
    actual_annual_spend: numberValue(overview.actual_annual_spend_usd),
    end_date: dateOrNull(stringValue(overview.end_date)),
    notice_period_days: numberValue(overview.notice_period_days),
    auto_renew: booleanValue(overview.auto_renew),
    renewal_decision_state: stringValue(overview.notice_deadline)
      ? `notice_deadline_${stringValue(overview.notice_deadline)}`
      : null,
    renewal_owner_ref: stringValue(overview.decision_owner_role_ref),
    benchmarking_clause: "Documented in golden contract evidence package.",
    exit_rights_summary:
      "See executed agreement, order form, renewal, and termination clauses.",
    alternatives_available:
      "Evaluate with sourcing strategy and supplier alternative evidence.",
    concentration_note: stringValue(overview.business_functions_supported),
    source_confidence: 0.86,
    resolved_annual_value: numberValue(overview.annual_value_usd),
    resolved_total_committed_value: numberValue(
      overview.total_committed_value_usd,
    ),
    annual_value_conflict_flag: false,
    total_committed_value_conflict_flag: false,
    scoped_application_count: scopedApplicationCount,
    critical_application_count: criticalApplicationCount,
    linked_budget_amount: linkedBudgetAmount || null,
    linked_actual_amount: numberValue(overview.actual_annual_spend_usd),
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: sev1Sev2Incidents,
    operational_evidence_gap: false,
    initiative_dependency_count: 0,
  };
}

function stringValue(value: unknown): string | null {
  if (typeof value !== "string") return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = stringValue(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(value: unknown): boolean {
  const text = stringValue(value)?.toLowerCase();
  return text === "true" || text === "yes" || text === "1";
}

function buildProjection(
  args: Args,
  contractId: string,
  rows: ContractEvidenceRows,
): ContractProjection {
  const opportunitySet = buildContractOptimizationOpportunitySet({
    tenantKey: args.tenantKey,
    datasetVersion: args.datasetVersion,
    contract: rows.contract,
    overview: rows.overview,
    pricingRows: rows.pricingRows,
    invoiceRows: rows.invoiceRows,
    poRows: rows.poRows,
    rateRows: rows.rateRows,
    slaRows: rows.slaRows,
    usageRows: rows.usageRows,
    renewalRows: rows.renewalRows,
    financeRow: rows.financeRow,
    pdfClauseRows: rows.pdfClauseRows,
  });
  const factLayer = buildContractOptimizationFactLayer({
    tenantKey: args.tenantKey,
    datasetVersion: args.datasetVersion,
    contract: rows.contract,
    overview: rows.overview,
    pricingRows: rows.pricingRows,
    invoiceRows: rows.invoiceRows,
    slaRows: rows.slaRows,
    financeRow: rows.financeRow,
    pdfClauseRows: rows.pdfClauseRows,
  });
  return { contractId, opportunitySet, factLayer };
}

function calculationCoverage(
  projection: ContractProjection,
): ContractCalculationCoverage {
  const opportunities = projection.opportunitySet?.opportunities ?? [];
  const amountBearing = opportunities.filter(
    (opportunity) => opportunity.amountUsd !== null,
  );
  const missingCalculationOpportunityIds = amountBearing
    .filter((opportunity) => !opportunity.calculation)
    .map((opportunity) => opportunity.opportunityId);
  const mismatchedCalculationOpportunityIds = amountBearing
    .filter((opportunity) => {
      const calculated = opportunity.calculation?.calculatedAmountUsd;
      if (calculated === undefined) return false;
      return Math.abs(calculated - (opportunity.amountUsd ?? 0)) > 0.01;
    })
    .map((opportunity) => opportunity.opportunityId);

  return {
    contractId: projection.contractId,
    opportunityCount: opportunities.length,
    amountBearingOpportunityCount: amountBearing.length,
    calculationRunCount: opportunities.filter((opportunity) =>
      Boolean(opportunity.calculation),
    ).length,
    missingCalculationOpportunityIds,
    mismatchedCalculationOpportunityIds,
  };
}

function assertCalculationCoverage(
  projections: readonly ContractProjection[],
): void {
  const failures = projections
    .map(calculationCoverage)
    .filter(
      (coverage) =>
        coverage.missingCalculationOpportunityIds.length > 0 ||
        coverage.mismatchedCalculationOpportunityIds.length > 0,
    );
  if (failures.length === 0) return;

  throw new Error(
    `Contract optimization projection has unreproducible amount(s): ${JSON.stringify(
      failures,
    )}`,
  );
}

async function assertRequiredTables(client: Client): Promise<void> {
  const tableNames = [
    "optimization_opportunity",
    "opportunity_evidence",
    "calculation_rule",
    "calculation_run",
    "calculation_input",
    "calculation_output",
    "opportunity_valuation",
    "evidence_requirement",
    "opportunity_requirement_status",
    "evidence_request",
    "opportunity_stage_event",
    "optimization_baseline",
    "optimization_case",
    "case_opportunity",
    "finance_realization",
    "finance_realization_evidence",
    "source_record_snapshot",
    "evidence_entity_link",
    "canonical_fact_assertion",
    "fact_conflict",
  ];
  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'source'
        AND table_name = ANY($1::text[])`,
    [tableNames],
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = tableNames.filter((tableName) => !found.has(tableName));
  if (missing.length > 0) {
    throw new Error(
      `Missing source contract optimization tables: ${missing.join(", ")}. Run migrations first.`,
    );
  }
}

async function deleteExistingProjection(
  client: Client,
  args: Args,
  contractId: string,
): Promise<void> {
  const opportunities = await client.query<{ opportunity_id: string }>(
    `SELECT opportunity_id
       FROM source.optimization_opportunity
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  const opportunityIds = opportunities.rows.map((row) => row.opportunity_id);

  if (opportunityIds.length > 0) {
    await client.query(
      `DELETE FROM source.finance_realization_evidence evidence
        USING source.finance_realization realization
       WHERE evidence.tenant_key = realization.tenant_key
         AND evidence.dataset_version = realization.dataset_version
         AND evidence.realization_id = realization.realization_id
         AND realization.tenant_key = $1
         AND realization.dataset_version = $2
         AND realization.opportunity_id = ANY($3::text[])`,
      [args.tenantKey, args.datasetVersion, opportunityIds],
    );
    await client.query(
      `DELETE FROM source.finance_realization
        WHERE tenant_key = $1
          AND dataset_version = $2
          AND opportunity_id = ANY($3::text[])`,
      [args.tenantKey, args.datasetVersion, opportunityIds],
    );
  }

  await client.query(
    `DELETE FROM source.optimization_case
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  await client.query(
    `DELETE FROM source.optimization_baseline
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  await client.query(
    `DELETE FROM source.optimization_opportunity
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  await client.query(
    `DELETE FROM source.evidence_entity_link
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  await client.query(
    `DELETE FROM source.fact_conflict
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  await client.query(
    `DELETE FROM source.canonical_fact_assertion
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
  await client.query(
    `DELETE FROM source.source_record_snapshot
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, contractId],
  );
}

async function persistFactLayer(
  client: Client,
  args: Args,
  layer: ContractOptimizationFactLayer,
): Promise<void> {
  for (const snapshot of layer.snapshots) {
    await client.query(
      `INSERT INTO source.source_record_snapshot (
         tenant_key, dataset_version, snapshot_id, source_system, source_table,
         source_record_id, source_record_hash, native_record_key, contract_id,
         vendor_id, period_start, period_end, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $6, $8, $9, $10::date, $11::date, $12::jsonb)`,
      [
        args.tenantKey,
        snapshot.datasetVersion,
        snapshot.snapshotId,
        snapshot.sourceSystem,
        snapshot.sourceTable,
        snapshot.sourceRecordId,
        snapshot.sourceRecordHash,
        snapshot.contractId,
        snapshot.vendorId,
        dateOrNull(snapshot.periodStart),
        dateOrNull(snapshot.periodEnd),
        JSON.stringify(snapshot.payload),
      ],
    );
  }

  for (const link of layer.entityLinks) {
    await client.query(
      `INSERT INTO source.evidence_entity_link (
         tenant_key, dataset_version, link_id, entity_kind, entity_id, snapshot_id,
         contract_id, vendor_id, link_basis, confidence, review_state, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '{}'::jsonb)`,
      [
        args.tenantKey,
        link.datasetVersion,
        link.linkId,
        link.entityKind,
        link.entityId,
        link.snapshotId,
        link.contractId,
        link.vendorId,
        link.linkBasis,
        link.confidence,
        link.reviewState,
      ],
    );
  }

  for (const assertion of layer.assertions) {
    await client.query(
      `INSERT INTO source.canonical_fact_assertion (
         tenant_key, dataset_version, assertion_id, entity_kind, entity_id,
         contract_id, vendor_id, fact_key, value_text, value_numeric, value_date,
         currency, unit, period_start, period_end, source_system, source_table,
         source_record_id, source_document_id, source_page, source_span,
         assertion_basis, confidence, review_state, source_refs, payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date, $12, $13,
         $14::date, $15::date, $16, $17, $18, $19, $20, $21, $22, $23, $24,
         $25::jsonb, '{}'::jsonb
       )`,
      [
        args.tenantKey,
        assertion.datasetVersion,
        assertion.assertionId,
        assertion.entityKind,
        assertion.entityId,
        assertion.contractId,
        assertion.vendorId,
        assertion.factKey,
        assertion.valueText,
        assertion.valueNumeric,
        dateOrNull(assertion.valueDate),
        assertion.currency,
        assertion.unit,
        dateOrNull(assertion.periodStart),
        dateOrNull(assertion.periodEnd),
        assertion.sourceSystem,
        assertion.sourceTable,
        assertion.sourceRecordId,
        assertion.sourceDocumentId,
        assertion.sourcePage,
        assertion.sourceSpan,
        assertion.assertionBasis,
        assertion.confidence,
        assertion.reviewState,
        JSON.stringify(assertion.sourceRefs),
      ],
    );
  }

  for (const conflict of layer.conflicts) {
    await client.query(
      `INSERT INTO source.fact_conflict (
         tenant_key, dataset_version, conflict_id, entity_kind, entity_id,
         contract_id, vendor_id, fact_key, conflict_type, severity,
         resolution_state, summary, assertion_ids, numeric_delta, percent_delta,
         source_refs, payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb,
         $14, $15, $16::jsonb, '{}'::jsonb
       )`,
      [
        args.tenantKey,
        conflict.datasetVersion,
        conflict.conflictId,
        conflict.entityKind,
        conflict.entityId,
        conflict.contractId,
        conflict.vendorId,
        conflict.factKey,
        conflict.conflictType,
        conflict.severity,
        conflict.resolutionState,
        conflict.summary,
        JSON.stringify(conflict.assertionIds),
        conflict.numericDelta,
        conflict.percentDelta,
        JSON.stringify(conflict.sourceRefs),
      ],
    );
  }
}

async function persistOpportunitySet(
  client: Client,
  args: Args,
  set: ContractOptimizationOpportunitySet,
): Promise<void> {
  const baselineId = `${set.contractId}:commercial-baseline`;
  await client.query(
    `INSERT INTO source.optimization_baseline (
       tenant_key, dataset_version, baseline_id, contract_id, baseline_state,
       annual_value_usd, pricing_schedule_annual_value_usd, actual_annual_spend_usd,
       total_committed_value_usd, conflict_amount_usd, detail, source_refs, payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb)`,
    [
      args.tenantKey,
      set.datasetVersion,
      baselineId,
      set.contractId,
      set.baseline.status,
      set.baseline.annualValueUsd,
      set.baseline.pricingScheduleAnnualValueUsd,
      set.baseline.actualAnnualSpendUsd,
      set.baseline.totalCommittedValueUsd,
      set.baseline.conflictAmountUsd,
      set.baseline.detail,
      JSON.stringify(set.baseline.sourceRefs),
      JSON.stringify({ headline: set.baseline.headline }),
    ],
  );

  for (const opportunity of set.opportunities) {
    await persistOpportunity(client, args, set, opportunity);
  }

  const caseId = `${set.contractId}:optimize-contract`;
  await client.query(
    `INSERT INTO source.optimization_case (
       tenant_key, dataset_version, optimization_case_id, contract_id, vendor_id,
       baseline_id, case_state, owner, next_action, payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'evidence_review', $7, $8, $9::jsonb)`,
    [
      args.tenantKey,
      set.datasetVersion,
      caseId,
      set.contractId,
      set.vendorId ?? "unknown-vendor",
      baselineId,
      set.opportunities[0]?.owner ?? null,
      set.recommendationDetail,
      JSON.stringify({
        recommendation: set.recommendation,
        selected_opportunity_id: set.selectedOpportunityId,
      }),
    ],
  );

  for (const [index, opportunity] of set.opportunities.entries()) {
    await client.query(
      `INSERT INTO source.case_opportunity (
         tenant_key, dataset_version, optimization_case_id, opportunity_id,
         selected_for_action, sequence, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb)`,
      [
        args.tenantKey,
        set.datasetVersion,
        caseId,
        opportunity.opportunityId,
        opportunity.opportunityId === set.selectedOpportunityId,
        index + 1,
      ],
    );
  }

  for (const realization of set.financeRealizations) {
    await client.query(
      `INSERT INTO source.finance_realization (
         tenant_key, dataset_version, realization_id, optimization_case_id,
         opportunity_id, amount_usd, basis, confirmation_date, finance_owner_role,
         tower_claim_refs, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10::jsonb, $11::jsonb)`,
      [
        args.tenantKey,
        set.datasetVersion,
        realization.realizationId,
        caseId,
        realization.linkedOpportunityIds[0] ?? set.selectedOpportunityId,
        realization.amountUsd,
        realization.basis,
        dateOrNull(realization.confirmationDate),
        realization.owner,
        JSON.stringify(realization.towerClaimRefs),
        JSON.stringify({
          linked_opportunity_ids: realization.linkedOpportunityIds,
        }),
      ],
    );

    for (const ref of realization.sourceRefs) {
      await client.query(
        `INSERT INTO source.finance_realization_evidence (
           tenant_key, dataset_version, realization_id, evidence_class,
           source_table, source_record_id, source_document_id, source_page,
           review_state, payload
         )
         VALUES ($1, $2, $3, 'finance_value_confirmation', $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          args.tenantKey,
          set.datasetVersion,
          realization.realizationId,
          ref.tableName,
          ref.sourceRecordId,
          ref.sourceFileReport,
          ref.pageSpan,
          ref.reviewState ?? "finance_confirmed",
          JSON.stringify(ref),
        ],
      );
    }
  }
}

async function persistOpportunity(
  client: Client,
  args: Args,
  set: ContractOptimizationOpportunitySet,
  opportunity: ContractOptimizationOpportunity,
): Promise<void> {
  await client.query(
    `INSERT INTO source.optimization_opportunity (
       tenant_key, dataset_version, opportunity_id, contract_id, vendor_id,
       value_type, stage, amount_usd, amount_state, evidence_grade, confidence,
       owner, next_action, blocking_gap, deadline, overlap_treatment,
       approval_state, narrative, payload
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
       $15::date, $16, $17, $18, $19::jsonb
     )`,
    [
      args.tenantKey,
      set.datasetVersion,
      opportunity.opportunityId,
      opportunity.contractId,
      set.vendorId ?? "unknown-vendor",
      opportunity.valueType === "negotiable_improvement"
        ? "negotiated_improvement"
        : opportunity.valueType,
      opportunity.stage,
      opportunity.amountUsd,
      opportunity.amountState,
      opportunity.evidenceGrade,
      opportunity.confidence,
      opportunity.owner,
      opportunity.nextAction,
      opportunity.blockingGap,
      dateOrNull(opportunity.deadline),
      opportunity.overlapTreatment,
      opportunity.approvalState,
      opportunity.narrative,
      JSON.stringify({
        label: opportunity.label,
        short_label: opportunity.shortLabel,
        source_systems: opportunity.sourceSystems,
      }),
    ],
  );

  await insertOpportunityEvidence(
    client,
    args,
    set.datasetVersion,
    opportunity,
  );
  await insertOpportunityValuation(
    client,
    args,
    set.datasetVersion,
    opportunity,
  );
  await insertEvidenceRequirement(
    client,
    args,
    set.datasetVersion,
    opportunity,
  );
  await insertCalculation(client, args, set.datasetVersion, opportunity);

  await client.query(
    `INSERT INTO source.opportunity_stage_event (
       tenant_key, dataset_version, opportunity_id, from_stage, to_stage,
       reason, changed_by_role, payload
     )
     VALUES ($1, $2, $3, null, $4, $5, 'source_projection_job', '{}'::jsonb)`,
    [
      args.tenantKey,
      set.datasetVersion,
      opportunity.opportunityId,
      opportunity.stage,
      opportunity.narrative,
    ],
  );
}

async function insertOpportunityEvidence(
  client: Client,
  args: Args,
  datasetVersion: string,
  opportunity: ContractOptimizationOpportunity,
): Promise<void> {
  for (const ref of opportunity.evidenceRefs) {
    await client.query(
      `INSERT INTO source.opportunity_evidence (
         tenant_key, dataset_version, opportunity_id, evidence_class,
         source_system, source_table, source_record_id, source_file_report,
         source_document_id, source_page, source_span, review_state,
         evidence_status, amount_usd, payload
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $9, $10,
         'EVIDENCE_AVAILABLE', $11, $12::jsonb
       )`,
      [
        args.tenantKey,
        datasetVersion,
        opportunity.opportunityId,
        evidenceClassFor(opportunity, ref),
        ref.sourceSystem,
        ref.tableName,
        ref.sourceRecordId,
        ref.sourceFileReport,
        ref.pageSpan,
        ref.reviewState ?? "system_extracted",
        null,
        JSON.stringify(ref),
      ],
    );
  }
}

async function insertOpportunityValuation(
  client: Client,
  args: Args,
  datasetVersion: string,
  opportunity: ContractOptimizationOpportunity,
): Promise<void> {
  await client.query(
    `INSERT INTO source.opportunity_valuation (
       tenant_key, dataset_version, opportunity_id, valuation_type,
       amount_usd, valuation_state, basis, source_run_id, effective_date, payload
     )
     VALUES ($1, $2, $3, 'potential', $4, $5, $6, $7, $8::date, $9::jsonb)`,
    [
      args.tenantKey,
      datasetVersion,
      opportunity.opportunityId,
      opportunity.amountUsd,
      opportunity.stage,
      opportunity.overlapTreatment,
      opportunity.calculation
        ? calculationRunId(
            opportunity.opportunityId,
            opportunity.calculation.ruleVersion,
          )
        : null,
      dateOrNull(opportunity.deadline),
      JSON.stringify({
        amount_state: opportunity.amountState,
        evidence_grade: opportunity.evidenceGrade,
      }),
    ],
  );
}

async function insertEvidenceRequirement(
  client: Client,
  args: Args,
  datasetVersion: string,
  opportunity: ContractOptimizationOpportunity,
): Promise<void> {
  const requirementId = `${opportunity.opportunityId}:minimum-evidence`;
  const status = opportunity.blockingGap
    ? opportunity.amountUsd == null
      ? "missing"
      : "workflow_required"
    : "met";
  await client.query(
    `INSERT INTO source.evidence_requirement (
       tenant_key, dataset_version, requirement_id, evidence_class,
       requirement_text, grain, minimum_period_months, owner_role, payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '{}'::jsonb)
     ON CONFLICT (tenant_key, dataset_version, requirement_id)
     DO UPDATE SET evidence_class = EXCLUDED.evidence_class,
                   requirement_text = EXCLUDED.requirement_text,
                   grain = EXCLUDED.grain,
                   minimum_period_months = EXCLUDED.minimum_period_months,
                   owner_role = EXCLUDED.owner_role`,
    [
      args.tenantKey,
      datasetVersion,
      requirementId,
      opportunity.valueType,
      opportunity.blockingGap ??
        `Evidence is available for ${opportunity.label}.`,
      grainFor(opportunity),
      minimumPeriodFor(opportunity),
      opportunity.owner,
    ],
  );
  await client.query(
    `INSERT INTO source.opportunity_requirement_status (
       tenant_key, dataset_version, opportunity_id, requirement_id, status,
       status_detail, owner, due_date, payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, '{}'::jsonb)`,
    [
      args.tenantKey,
      datasetVersion,
      opportunity.opportunityId,
      requirementId,
      status,
      opportunity.blockingGap ?? "Minimum evidence is present.",
      opportunity.owner,
      dateOrNull(opportunity.deadline),
    ],
  );
  if (status !== "met") {
    await client.query(
      `INSERT INTO source.evidence_request (
         tenant_key, dataset_version, evidence_request_id, opportunity_id,
         requirement_id, request_text, owner, due_date, request_state, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, 'open', '{}'::jsonb)`,
      [
        args.tenantKey,
        datasetVersion,
        `${opportunity.opportunityId}:evidence-request`,
        opportunity.opportunityId,
        requirementId,
        opportunity.nextAction,
        opportunity.owner,
        dateOrNull(opportunity.deadline),
      ],
    );
  }
}

async function insertCalculation(
  client: Client,
  args: Args,
  datasetVersion: string,
  opportunity: ContractOptimizationOpportunity,
): Promise<void> {
  const calculation = opportunity.calculation;
  if (!calculation) return;
  await client.query(
    `INSERT INTO source.calculation_rule (
       tenant_key, dataset_version, rule_id, rule_version, formula,
       input_contract, output_contract, payload
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, '{}'::jsonb)
     ON CONFLICT (tenant_key, dataset_version, rule_id, rule_version)
     DO UPDATE SET formula = EXCLUDED.formula,
                   input_contract = EXCLUDED.input_contract,
                   output_contract = EXCLUDED.output_contract`,
    [
      args.tenantKey,
      datasetVersion,
      calculation.ruleId,
      calculation.ruleVersion,
      calculation.formula,
      JSON.stringify([
        "quantity",
        "unit_of_measure",
        "billed_rate_usd",
        "contract_rate_usd",
        "exception_amount_usd",
        "service_period",
      ]),
      JSON.stringify(["calculated_amount_usd", "eligible_quantity"]),
    ],
  );
  const runId = calculationRunId(
    opportunity.opportunityId,
    calculation.ruleVersion,
  );
  await client.query(
    `INSERT INTO source.calculation_run (
       tenant_key, dataset_version, calculation_run_id, opportunity_id,
       rule_id, rule_version, run_state, run_hash, completed_at, payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, now(), $8::jsonb)`,
    [
      args.tenantKey,
      datasetVersion,
      runId,
      opportunity.opportunityId,
      calculation.ruleId,
      calculation.ruleVersion,
      sha256(JSON.stringify(calculation)),
      JSON.stringify({
        included_line_count: calculation.includedLineCount,
        excluded_line_count: calculation.excludedLineCount,
        pending_line_count: calculation.pendingLineCount,
      }),
    ],
  );

  for (const line of calculation.lines) {
    await insertCalculationLineInputs(
      client,
      args,
      datasetVersion,
      runId,
      line,
    );
  }

  for (const output of [
    {
      outputKey: "calculated_amount_usd",
      amountUsd: calculation.calculatedAmountUsd,
      quantity: null,
      unit: "USD",
    },
    {
      outputKey: "eligible_quantity",
      amountUsd: null,
      quantity: calculation.eligibleQuantity,
      unit: calculation.lines[0]?.unitOfMeasure ?? null,
    },
  ]) {
    await client.query(
      `INSERT INTO source.calculation_output (
         tenant_key, dataset_version, calculation_run_id, output_key,
         amount_usd, quantity, unit, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb)`,
      [
        args.tenantKey,
        datasetVersion,
        runId,
        output.outputKey,
        output.amountUsd,
        output.quantity,
        output.unit,
      ],
    );
  }
}

async function insertCalculationLineInputs(
  client: Client,
  args: Args,
  datasetVersion: string,
  runId: string,
  line: OpportunityCalculationLine,
): Promise<void> {
  const sourceRef =
    line.sourceRefs.find((ref) => ref.tableName.includes("invoice_lines")) ??
    line.sourceRefs[0];
  const values = [
    {
      key: "quantity",
      numeric: line.quantity,
      text: null,
      unit: line.unitOfMeasure,
      reason: line.quantityBasis,
    },
    {
      key: "unit_of_measure",
      numeric: null,
      text: line.unitOfMeasure,
      unit: null,
      reason: "Native or matched unit used by the deterministic calculation.",
    },
    {
      key: "billed_rate_usd",
      numeric: line.billedRateUsd,
      text: null,
      unit: "USD",
      reason: "Invoice billed rate.",
    },
    {
      key: "contract_rate_usd",
      numeric: line.contractRateUsd,
      text: null,
      unit: "USD",
      reason: "Matched operative contract rate.",
    },
    {
      key: "exception_amount_usd",
      numeric: line.amountUsd,
      text: null,
      unit: "USD",
      reason: line.inclusionReason,
    },
    {
      key: "service_period",
      numeric: null,
      text: line.servicePeriod,
      unit: null,
      reason: "Service period for period-bounded validation.",
    },
  ];
  for (const value of values) {
    await client.query(
      `INSERT INTO source.calculation_input (
         tenant_key, dataset_version, calculation_run_id, input_key,
         source_table, source_record_id, value_numeric, value_text, unit,
         inclusion_state, inclusion_reason, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
      [
        args.tenantKey,
        datasetVersion,
        runId,
        `${line.lineId}.${value.key}`,
        sourceRef?.tableName ?? null,
        sourceRef?.sourceRecordId ?? line.invoiceLineId,
        value.numeric,
        value.text,
        value.unit,
        line.inclusion,
        value.reason,
        JSON.stringify({
          line_id: line.lineId,
          invoice_id: line.invoiceId,
          invoice_line_id: line.invoiceLineId,
          sku_or_service: line.skuOrService,
          pricing_schedule_ref: line.pricingScheduleRef,
          contract_term_ref: line.contractTermRef,
          amendment_ref: line.amendmentRef,
        }),
      ],
    );
  }
}

function evidenceClassFor(
  opportunity: ContractOptimizationOpportunity,
  ref: OpportunitySourceReference,
): string {
  if (ref.tableName.includes("sla")) return "sla";
  if (ref.tableName.includes("invoice")) return "invoice";
  if (ref.tableName.includes("pricing")) return "rate_card";
  if (ref.tableName.includes("rate_card")) return "rate_card";
  if (ref.tableName.includes("usage")) return "usage";
  if (ref.tableName.includes("renewal")) return "renewal";
  if (ref.tableName.includes("finance")) return "finance_value_confirmation";
  if (ref.tableName.includes("pdf")) return "contract_term";
  return opportunity.valueType;
}

function grainFor(opportunity: ContractOptimizationOpportunity): string {
  if (opportunity.opportunityId.includes("rate-variance"))
    return "invoice_line";
  if (opportunity.opportunityId.includes("rate-card"))
    return "rate_card_line";
  if (opportunity.opportunityId.includes("sla")) return "contract_month";
  if (opportunity.opportunityId.includes("scope")) return "sku_month";
  if (opportunity.opportunityId.includes("negotiated"))
    return "negotiation_event";
  return "contract";
}

function minimumPeriodFor(
  opportunity: ContractOptimizationOpportunity,
): number {
  if (opportunity.opportunityId.includes("sla")) return 24;
  if (opportunity.opportunityId.includes("scope")) return 12;
  if (opportunity.opportunityId.includes("rate-variance")) return 12;
  if (opportunity.opportunityId.includes("rate-card")) return 12;
  return 1;
}

function calculationRunId(opportunityId: string, ruleVersion: string): string {
  return `${opportunityId}:calculation:${ruleVersion}`;
}

function dateOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) return null;
  return date;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function countPersisted(
  client: Client,
  args: Args,
): Promise<Record<string, number>> {
  const result = await client.query<Record<string, string>>(
    `SELECT
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS optimization_opportunity,
       (SELECT count(*)::text FROM source.opportunity_evidence WHERE tenant_key = $1 AND dataset_version = $2) AS opportunity_evidence,
       (SELECT count(*)::text FROM source.calculation_run WHERE tenant_key = $1 AND dataset_version = $2) AS calculation_run,
       (SELECT count(*)::text FROM source.calculation_input WHERE tenant_key = $1 AND dataset_version = $2) AS calculation_input,
       (SELECT count(*)::text FROM source.opportunity_valuation WHERE tenant_key = $1 AND dataset_version = $2) AS opportunity_valuation,
       (SELECT count(*)::text FROM source.evidence_request WHERE tenant_key = $1 AND dataset_version = $2) AS evidence_request,
       (SELECT count(*)::text FROM source.finance_realization WHERE tenant_key = $1 AND dataset_version = $2) AS finance_realization,
       (SELECT count(*)::text FROM source.source_record_snapshot WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS source_record_snapshot,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS canonical_fact_assertion,
       (SELECT count(*)::text FROM source.fact_conflict WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = ANY($3::text[])) AS fact_conflict`,
    [args.tenantKey, args.datasetVersion, args.contractIds],
  );
  const row = result.rows[0] ?? {};
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Number(value ?? 0)]),
  );
}

async function countPersistedCalculationCoverage(
  client: Client,
  args: Args,
): Promise<Record<string, ContractCalculationCoverage>> {
  const result = await client.query<{
    contract_id: string;
    opportunity_count: string;
    amount_bearing_opportunity_count: string;
    calculation_run_count: string;
    missing_calculation_opportunity_ids: string[] | null;
    mismatched_calculation_opportunity_ids: string[] | null;
  }>(
    `WITH opportunity AS (
       SELECT opportunity_id, contract_id, amount_usd
         FROM source.optimization_opportunity
        WHERE tenant_key = $1
          AND dataset_version = $2
          AND contract_id = ANY($3::text[])
     ),
     calculation AS (
       SELECT run.opportunity_id,
              max(output.amount_usd) FILTER (WHERE output.output_key = 'calculated_amount_usd') AS calculated_amount_usd
         FROM source.calculation_run run
         LEFT JOIN source.calculation_output output
           ON output.tenant_key = run.tenant_key
          AND output.dataset_version = run.dataset_version
          AND output.calculation_run_id = run.calculation_run_id
        WHERE run.tenant_key = $1
          AND run.dataset_version = $2
        GROUP BY run.opportunity_id
     )
     SELECT opportunity.contract_id,
            count(*)::text AS opportunity_count,
            count(*) FILTER (WHERE opportunity.amount_usd IS NOT NULL)::text AS amount_bearing_opportunity_count,
            count(calculation.opportunity_id)::text AS calculation_run_count,
            coalesce(
              array_agg(opportunity.opportunity_id ORDER BY opportunity.opportunity_id)
                FILTER (
                  WHERE opportunity.amount_usd IS NOT NULL
                    AND calculation.opportunity_id IS NULL
                ),
              ARRAY[]::text[]
            ) AS missing_calculation_opportunity_ids,
            coalesce(
              array_agg(opportunity.opportunity_id ORDER BY opportunity.opportunity_id)
                FILTER (
                  WHERE opportunity.amount_usd IS NOT NULL
                    AND calculation.opportunity_id IS NOT NULL
                    AND (
                      calculation.calculated_amount_usd IS NULL
                      OR abs(calculation.calculated_amount_usd - opportunity.amount_usd) > 0.01
                    )
                ),
              ARRAY[]::text[]
            ) AS mismatched_calculation_opportunity_ids
       FROM opportunity
       LEFT JOIN calculation
         ON calculation.opportunity_id = opportunity.opportunity_id
      GROUP BY opportunity.contract_id
      ORDER BY opportunity.contract_id`,
    [args.tenantKey, args.datasetVersion, args.contractIds],
  );

  return Object.fromEntries(
    result.rows.map((row) => [
      row.contract_id,
      {
        contractId: row.contract_id,
        opportunityCount: Number(row.opportunity_count),
        amountBearingOpportunityCount: Number(
          row.amount_bearing_opportunity_count,
        ),
        calculationRunCount: Number(row.calculation_run_count),
        missingCalculationOpportunityIds:
          row.missing_calculation_opportunity_ids ?? [],
        mismatchedCalculationOpportunityIds:
          row.mismatched_calculation_opportunity_ids ?? [],
      },
    ]),
  );
}

async function main(): Promise<void> {
  const args = parseArgs();
  const client = new Client(
    postgresClientOptions(
      databaseUrl(),
      "source-contract-optimization-spine-project",
    ),
  );
  await client.connect();

  try {
    await client.query("begin");
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    await assertRequiredTables(client);

    const projections: ContractProjection[] = [];
    for (const contractId of args.contractIds) {
      const evidenceRows = await readContractEvidence(client, args, contractId);
      projections.push(buildProjection(args, contractId, evidenceRows));
    }
    assertCalculationCoverage(projections);

    if (args.apply) {
      for (const projection of projections) {
        await deleteExistingProjection(client, args, projection.contractId);
        if (projection.opportunitySet) {
          await persistOpportunitySet(client, args, projection.opportunitySet);
        }
        await persistFactLayer(client, args, projection.factLayer);
      }
    }

    const persistedRows = args.apply ? await countPersisted(client, args) : {};
    const persistedCalculationCoverage = args.apply
      ? await countPersistedCalculationCoverage(client, args)
      : {};
    await client.query(args.apply ? "commit" : "rollback");

    console.log(
      JSON.stringify(
        {
          event: "source_contract_optimization_spine_projected",
          apply: args.apply,
          tenant_key: args.tenantKey,
          dataset_id: args.datasetId,
          dataset_version: args.datasetVersion,
          contract_ids: args.contractIds,
          generated_rows: {
            opportunities: projections.reduce(
              (sum, projection) =>
                sum + (projection.opportunitySet?.opportunities.length ?? 0),
              0,
            ),
            calculation_runs: projections.reduce(
              (sum, projection) =>
                sum + calculationCoverage(projection).calculationRunCount,
              0,
            ),
            finance_realizations: projections.reduce(
              (sum, projection) =>
                sum +
                (projection.opportunitySet?.financeRealizations.length ?? 0),
              0,
            ),
            source_record_snapshots: projections.reduce(
              (sum, projection) => sum + projection.factLayer.snapshots.length,
              0,
            ),
            canonical_fact_assertions: projections.reduce(
              (sum, projection) => sum + projection.factLayer.assertions.length,
              0,
            ),
            fact_conflicts: projections.reduce(
              (sum, projection) => sum + projection.factLayer.conflicts.length,
              0,
            ),
          },
          contracts: projections.map((projection) => ({
            contract_id: projection.contractId,
            opportunity_count:
              projection.opportunitySet?.opportunities.length ?? 0,
            selected_opportunity_id:
              projection.opportunitySet?.selectedOpportunityId ?? null,
            baseline_status:
              projection.opportunitySet?.baseline.status ?? "missing",
            calculation_coverage: calculationCoverage(projection),
            persisted_calculation_coverage:
              persistedCalculationCoverage[projection.contractId] ?? null,
            fact_conflicts: projection.factLayer.conflicts.map((conflict) => ({
              conflict_id: conflict.conflictId,
              severity: conflict.severity,
              summary: conflict.summary,
            })),
          })),
          persisted_rows: persistedRows,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
