import { createHash } from "node:crypto";

import type { SourceContract360Row } from "./types";

type Row = Record<string, unknown>;

export type SourceFactEntityKind =
  | "contract"
  | "contract_clause"
  | "invoice_line"
  | "sla_period"
  | "finance_confirmation";

export type SourceFactConflictSeverity = "info" | "warning" | "blocker";

export interface SourceRecordSnapshot {
  readonly tenantKey: string | null;
  readonly datasetVersion: string;
  readonly snapshotId: string;
  readonly sourceSystem: string;
  readonly sourceTable: string;
  readonly sourceRecordId: string;
  readonly sourceRecordHash: string;
  readonly contractId: string;
  readonly vendorId: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly payload: Row;
}

export interface EvidenceEntityLink {
  readonly tenantKey: string | null;
  readonly datasetVersion: string;
  readonly linkId: string;
  readonly entityKind: SourceFactEntityKind;
  readonly entityId: string;
  readonly snapshotId: string;
  readonly contractId: string;
  readonly vendorId: string | null;
  readonly linkBasis: string;
  readonly confidence: number;
  readonly reviewState: string;
}

export interface CanonicalFactAssertion {
  readonly tenantKey: string | null;
  readonly datasetVersion: string;
  readonly assertionId: string;
  readonly entityKind: SourceFactEntityKind;
  readonly entityId: string;
  readonly contractId: string;
  readonly vendorId: string | null;
  readonly factKey: string;
  readonly valueText: string | null;
  readonly valueNumeric: number | null;
  readonly valueDate: string | null;
  readonly currency: string | null;
  readonly unit: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly sourceSystem: string;
  readonly sourceTable: string;
  readonly sourceRecordId: string | null;
  readonly sourceDocumentId: string | null;
  readonly sourcePage: string | null;
  readonly sourceSpan: string | null;
  readonly assertionBasis: string;
  readonly confidence: number;
  readonly reviewState: string;
  readonly sourceRefs: readonly string[];
}

export interface FactConflict {
  readonly tenantKey: string | null;
  readonly datasetVersion: string;
  readonly conflictId: string;
  readonly entityKind: SourceFactEntityKind;
  readonly entityId: string;
  readonly contractId: string;
  readonly vendorId: string | null;
  readonly factKey: string;
  readonly conflictType: "numeric_mismatch" | "text_mismatch" | "date_mismatch";
  readonly severity: SourceFactConflictSeverity;
  readonly resolutionState: "unresolved" | "resolved" | "waived";
  readonly summary: string;
  readonly assertionIds: readonly string[];
  readonly numericDelta: number | null;
  readonly percentDelta: number | null;
  readonly sourceRefs: readonly string[];
}

export interface ContractOptimizationFactLayer {
  readonly snapshots: readonly SourceRecordSnapshot[];
  readonly entityLinks: readonly EvidenceEntityLink[];
  readonly assertions: readonly CanonicalFactAssertion[];
  readonly conflicts: readonly FactConflict[];
}

export interface BuildContractOptimizationFactLayerInput {
  readonly tenantKey: string | null;
  readonly datasetVersion?: string;
  readonly contract: SourceContract360Row | null;
  readonly overview: Row | null;
  readonly pricingRows: readonly Row[];
  readonly invoiceRows: readonly Row[];
  readonly slaRows?: readonly Row[];
  readonly financeRow?: Row | null;
  readonly pdfClauseRows?: readonly Row[];
}

const DATASET_FALLBACK = "source-v4-golden-contract-evidence";

export function buildContractOptimizationFactLayer(
  input: BuildContractOptimizationFactLayerInput,
): ContractOptimizationFactLayer {
  const contractId =
    text(input.overview?.contract_id) ??
    text(input.contract?.contract_id) ??
    text(input.invoiceRows[0]?.contract_id) ??
    "unknown-contract";
  const tenantKey =
    input.tenantKey ??
    text(input.overview?.tenant_key) ??
    text(input.overview?._tenant_key) ??
    text(input.contract?.tenant_key);
  const datasetVersion =
    input.datasetVersion ??
    text(input.overview?.dataset_version) ??
    text(input.financeRow?.dataset_version) ??
    DATASET_FALLBACK;
  const vendorId =
    text(input.overview?.vendor_id) ?? text(input.contract?.vendor_ref);

  const pricingSnapshots = buildSnapshots({
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    rows: input.pricingRows,
    sourceTable: "source.golden_contract_pricing_schedule",
    sourceSystemFallback: "CLM / pricing schedule",
  });
  const invoiceSnapshots = buildSnapshots({
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    rows: input.invoiceRows,
    sourceTable: "source.golden_contract_invoice_lines",
    sourceSystemFallback: "AP / ERP",
  });
  const slaSnapshots = buildSnapshots({
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    rows: input.slaRows ?? [],
    sourceTable: "source.golden_contract_sla_incident_service_credit_monthly",
    sourceSystemFallback: "ITSM / service management",
  });
  const financeSnapshots = input.financeRow
    ? buildSnapshots({
        tenantKey,
        datasetVersion,
        contractId,
        vendorId,
        rows: [input.financeRow],
        sourceTable: "source.golden_contract_finance_value_confirmation",
        sourceSystemFallback: "Finance / Tower",
      })
    : [];
  const pdfClauseSnapshots = buildSnapshots({
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    rows: input.pdfClauseRows ?? [],
    sourceTable: "source.contract_pdf_clause_extractions",
    sourceSystemFallback: "CLM / contract repository",
  });
  const snapshots = [
    ...pricingSnapshots,
    ...invoiceSnapshots,
    ...slaSnapshots,
    ...financeSnapshots,
    ...pdfClauseSnapshots,
  ];
  const entityLinks: EvidenceEntityLink[] = [
    ...pricingSnapshots.map((snapshot) => ({
      tenantKey,
      datasetVersion,
      linkId: `LINK-${snapshot.snapshotId}`,
      entityKind: "contract" as const,
      entityId: contractId,
      snapshotId: snapshot.snapshotId,
      contractId,
      vendorId,
      linkBasis: "Pricing schedule row linked to contract by contract_id.",
      confidence: 0.88,
      reviewState: "system_extracted",
    })),
    ...invoiceSnapshots.map((snapshot) => ({
      tenantKey,
      datasetVersion,
      linkId: `LINK-${snapshot.snapshotId}`,
      entityKind: "invoice_line" as const,
      entityId: snapshot.sourceRecordId,
      snapshotId: snapshot.snapshotId,
      contractId,
      vendorId,
      linkBasis:
        "Invoice line linked to contract by contract_id, vendor, PO or service period.",
      confidence: 0.86,
      reviewState: "system_extracted",
    })),
    ...slaSnapshots.map((snapshot) => ({
      tenantKey,
      datasetVersion,
      linkId: `LINK-${snapshot.snapshotId}`,
      entityKind: "sla_period" as const,
      entityId: `${contractId}:${snapshot.sourceRecordId}`,
      snapshotId: snapshot.snapshotId,
      contractId,
      vendorId,
      linkBasis:
        "SLA monthly row linked to contract by contract_id and period.",
      confidence: 0.86,
      reviewState: "system_extracted",
    })),
    ...financeSnapshots.map((snapshot) => ({
      tenantKey,
      datasetVersion,
      linkId: `LINK-${snapshot.snapshotId}`,
      entityKind: "finance_confirmation" as const,
      entityId: snapshot.sourceRecordId,
      snapshotId: snapshot.snapshotId,
      contractId,
      vendorId,
      linkBasis:
        "Finance value confirmation linked to contract and Tower claim references.",
      confidence: 0.92,
      reviewState: "finance_validated",
    })),
    ...pdfClauseSnapshots.map((snapshot) => ({
      tenantKey,
      datasetVersion,
      linkId: `LINK-${snapshot.snapshotId}`,
      entityKind: "contract_clause" as const,
      entityId: snapshot.sourceRecordId,
      snapshotId: snapshot.snapshotId,
      contractId,
      vendorId,
      linkBasis:
        "Parsed contract clause linked by source file, page, concept, and contract_id.",
      confidence: number(snapshot.payload.confidence) ?? 0.8,
      reviewState: text(snapshot.payload.review_state) ?? "document_extracted",
    })),
  ];

  const assertions: CanonicalFactAssertion[] = [];
  pushMoneyAssertion(assertions, {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    entityKind: "contract",
    entityId: contractId,
    factKey: "contract_annual_value_usd",
    value: number(input.overview?.annual_value_usd),
    sourceSystem: "CLM / contract repository",
    sourceTable: "source.golden_contract_overview",
    sourceRecordId: text(input.overview?.source_record_id) ?? contractId,
    assertionBasis: "Annual value asserted by golden contract overview.",
    confidence: 0.9,
    reviewState: text(input.overview?.review_state) ?? "system_extracted",
  });
  pushMoneyAssertion(assertions, {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    entityKind: "contract",
    entityId: contractId,
    factKey: "contract_annual_value_usd",
    value: number(input.contract?.annual_value),
    sourceSystem: "Source Contract 360",
    sourceTable: "source.contract_360",
    sourceRecordId: contractId,
    assertionBasis: "Annual value asserted by Contract 360 register.",
    confidence: input.contract?.source_confidence ?? 0.82,
    reviewState: "system_projected",
  });
  const pricingAnnual = roundCurrency(
    sum(input.pricingRows.map((row) => number(row.annual_value_usd))),
  );
  pushMoneyAssertion(assertions, {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    entityKind: "contract",
    entityId: contractId,
    factKey: "contract_annual_value_usd",
    value: pricingAnnual > 0 ? pricingAnnual : null,
    sourceSystem: "CLM / pricing schedule",
    sourceTable: "source.golden_contract_pricing_schedule",
    sourceRecordId: `${contractId}:pricing-schedule-total`,
    assertionBasis: "Annual value summed from pricing schedule line items.",
    confidence: 0.88,
    reviewState: "system_calculated",
  });
  pushMoneyAssertion(assertions, {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    entityKind: "contract",
    entityId: contractId,
    factKey: "contract_actual_annual_spend_usd",
    value:
      number(input.overview?.actual_annual_spend_usd) ??
      number(input.contract?.actual_annual_spend),
    sourceSystem: "AP / ERP",
    sourceTable: "source.golden_contract_overview",
    sourceRecordId: text(input.overview?.source_record_id) ?? contractId,
    assertionBasis:
      "Actual annual spend asserted by governed contract overview.",
    confidence: 0.86,
    reviewState: "system_extracted",
  });
  pushMoneyAssertion(assertions, {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    entityKind: "contract",
    entityId: contractId,
    factKey: "contract_total_committed_value_usd",
    value:
      number(input.overview?.total_committed_value_usd) ??
      number(input.contract?.total_committed_value),
    sourceSystem: "CLM / contract repository",
    sourceTable: "source.golden_contract_overview",
    sourceRecordId: text(input.overview?.source_record_id) ?? contractId,
    assertionBasis:
      "Total committed value asserted by governed contract overview.",
    confidence: 0.86,
    reviewState: "system_extracted",
  });

  for (const row of input.invoiceRows) {
    const invoiceLineId =
      text(row.invoice_line_id) ??
      text(row.source_record_id) ??
      stableRowId(row);
    const common = {
      tenantKey,
      datasetVersion,
      contractId,
      vendorId,
      entityKind: "invoice_line" as const,
      entityId: invoiceLineId,
      sourceSystem: text(row.source_system) ?? "AP / ERP",
      sourceTable: "source.golden_contract_invoice_lines",
      sourceRecordId: text(row.source_record_id) ?? invoiceLineId,
      confidence: 0.86,
      reviewState: text(row.review_state) ?? "system_extracted",
      periodStart: text(row.service_period_start),
      periodEnd: text(row.service_period_end),
    };
    pushQuantityAssertion(assertions, {
      ...common,
      factKey: "invoice_line_quantity",
      value: number(row.quantity) ?? derivedRateVarianceQuantity(row),
      unit: text(row.unit_of_measure) ?? text(row.uom) ?? null,
      assertionBasis:
        number(row.quantity) == null
          ? "Quantity derived from exception amount divided by billed-minus-contract rate; native quantity must be loaded when available."
          : "Native invoice-line quantity from AP extract.",
    });
    pushMoneyAssertion(assertions, {
      ...common,
      factKey: "invoice_line_billed_rate_usd",
      value: number(row.billed_rate_usd),
      assertionBasis: "Billed rate from invoice line.",
    });
    pushMoneyAssertion(assertions, {
      ...common,
      factKey: "invoice_line_contract_rate_usd",
      value: number(row.matched_contract_rate_usd),
      assertionBasis:
        "Matched operative contract rate from invoice/rate-card match.",
    });
    pushMoneyAssertion(assertions, {
      ...common,
      factKey: "invoice_line_exception_amount_usd",
      value: number(row.exception_amount_usd),
      assertionBasis:
        "Exception amount from governed invoice exception extract.",
    });
  }

  for (const row of input.slaRows ?? []) {
    const periodId =
      text(row.period_month) ?? text(row.source_record_id) ?? stableRowId(row);
    const common = {
      tenantKey,
      datasetVersion,
      contractId,
      vendorId,
      entityKind: "sla_period" as const,
      entityId: `${contractId}:${periodId}`,
      sourceSystem: text(row.source_system) ?? "ITSM / service management",
      sourceTable: "source.golden_contract_sla_incident_service_credit_monthly",
      sourceRecordId: text(row.source_record_id) ?? periodId,
      confidence: 0.86,
      reviewState: text(row.review_state) ?? "system_extracted",
      periodStart: text(row.period_month),
      periodEnd: text(row.period_month),
    };
    pushMoneyAssertion(assertions, {
      ...common,
      factKey: "service_credits_earned_usd",
      value: number(row.service_credits_earned_usd),
      assertionBasis: "Monthly service credits earned from SLA/ITSM evidence.",
    });
    pushMoneyAssertion(assertions, {
      ...common,
      factKey: "service_credits_claimed_usd",
      value: number(row.service_credits_claimed_usd),
      assertionBasis:
        "Monthly service credits claimed from vendor/service review evidence.",
    });
  }

  if (input.financeRow) {
    pushMoneyAssertion(assertions, {
      tenantKey,
      datasetVersion,
      contractId,
      vendorId,
      entityKind: "finance_confirmation",
      entityId:
        text(input.financeRow.value_claim_id) ?? `${contractId}:finance`,
      factKey: "finance_confirmed_realized_value_usd",
      value: number(input.financeRow.realized_value_usd),
      sourceSystem: "Finance / Tower",
      sourceTable: "source.golden_contract_finance_value_confirmation",
      sourceRecordId:
        text(input.financeRow.source_record_id) ??
        text(input.financeRow.value_claim_id) ??
        `${contractId}:finance`,
      assertionBasis:
        "Finance-confirmed realized value from value confirmation record.",
      confidence: 0.92,
      reviewState: text(input.financeRow.review_state) ?? "finance_validated",
    });
  }

  for (const row of input.pdfClauseRows ?? []) {
    pushClauseAssertion(assertions, {
      tenantKey,
      datasetVersion,
      contractId,
      vendorId,
      entityKind: "contract_clause",
      entityId:
        text(row.extraction_id) ??
        [
          text(row.source_file_id) ?? contractId,
          text(row.source_page) ?? "page",
          text(row.concept_ref) ?? "concept",
        ].join(":"),
      factKey: text(row.concept_ref) ?? "contract.unmapped_clause",
      valueText: text(row.value_text) ?? text(row.source_excerpt),
      valueNumeric: number(row.value_num),
      sourceSystem: "CLM / contract repository",
      sourceTable: "source.contract_pdf_clause_extractions",
      sourceRecordId: text(row.extraction_id) ?? sourceRecordIdFor(row),
      sourceDocumentId: text(row.source_file_id),
      sourcePage: text(row.source_page),
      sourceSpan: text(row.source_section),
      assertionBasis:
        text(row.method) ??
        "Parsed physical contract/PDF clause extraction with page lineage.",
      confidence: number(row.confidence) ?? 0.8,
      reviewState: text(row.review_state) ?? "document_extracted",
    });
  }

  return {
    snapshots,
    entityLinks,
    assertions,
    conflicts: detectFactConflicts(assertions),
  };
}

export function detectFactConflicts(
  assertions: readonly CanonicalFactAssertion[],
): readonly FactConflict[] {
  const groups = new Map<string, CanonicalFactAssertion[]>();
  for (const assertion of assertions) {
    const key = [
      assertion.tenantKey ?? "",
      assertion.datasetVersion,
      assertion.entityKind,
      assertion.entityId,
      assertion.factKey,
    ].join("|");
    const group = groups.get(key) ?? [];
    group.push(assertion);
    groups.set(key, group);
  }

  const conflicts: FactConflict[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const numericValues = group
      .map((assertion) => assertion.valueNumeric)
      .filter(
        (value): value is number => value != null && Number.isFinite(value),
      );
    if (numericValues.length >= 2) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const tolerance = Math.max(1000, Math.abs(max) * 0.005);
      const delta = roundCurrency(max - min);
      if (delta > tolerance) {
        const first = group[0];
        conflicts.push({
          tenantKey: first.tenantKey,
          datasetVersion: first.datasetVersion,
          conflictId: [first.entityId, first.factKey, "numeric-conflict"].join(
            ":",
          ),
          entityKind: first.entityKind,
          entityId: first.entityId,
          contractId: first.contractId,
          vendorId: first.vendorId,
          factKey: first.factKey,
          conflictType: "numeric_mismatch",
          severity:
            first.factKey === "contract_annual_value_usd"
              ? "blocker"
              : "warning",
          resolutionState: "unresolved",
          summary: `${first.factKey} has conflicting values across governed sources: ${formatUsd(min)} to ${formatUsd(max)}.`,
          assertionIds: group.map((assertion) => assertion.assertionId),
          numericDelta: delta,
          percentDelta: max === 0 ? null : roundQuantity(delta / Math.abs(max)),
          sourceRefs: Array.from(
            new Set(group.flatMap((assertion) => assertion.sourceRefs)),
          ),
        });
      }
      continue;
    }

    const dateValues = distinctValues(
      group.map((assertion) => assertion.valueDate),
    );
    if (dateValues.length > 1)
      conflicts.push(nonNumericConflict(group, "date_mismatch"));

    const textValues = distinctValues(
      group.map((assertion) => assertion.valueText),
    );
    if (textValues.length > 1)
      conflicts.push(nonNumericConflict(group, "text_mismatch"));
  }
  return conflicts;
}

function buildSnapshots(input: {
  readonly tenantKey: string | null;
  readonly datasetVersion: string;
  readonly contractId: string;
  readonly vendorId: string | null;
  readonly rows: readonly Row[];
  readonly sourceTable: string;
  readonly sourceSystemFallback: string;
}): SourceRecordSnapshot[] {
  return input.rows.map((row) => {
    const sourceRecordId = sourceRecordIdFor(row);
    return {
      tenantKey: input.tenantKey,
      datasetVersion: input.datasetVersion,
      snapshotId: [
        input.contractId,
        input.sourceTable.split(".").pop() ?? "source",
        sourceRecordId,
      ].join(":"),
      sourceSystem: text(row.source_system) ?? input.sourceSystemFallback,
      sourceTable: input.sourceTable,
      sourceRecordId,
      sourceRecordHash: sha256(row),
      contractId: input.contractId,
      vendorId: input.vendorId,
      periodStart: periodDate(row.service_period_start ?? row.period_month),
      periodEnd: periodDate(row.service_period_end ?? row.period_month),
      payload: row,
    };
  });
}

function pushMoneyAssertion(
  assertions: CanonicalFactAssertion[],
  input: Omit<
    CanonicalFactAssertion,
    | "assertionId"
    | "valueText"
    | "valueNumeric"
    | "valueDate"
    | "currency"
    | "unit"
    | "periodStart"
    | "periodEnd"
    | "sourceDocumentId"
    | "sourcePage"
    | "sourceSpan"
    | "sourceRefs"
  > & {
    readonly value: number | null;
    readonly periodStart?: string | null;
    readonly periodEnd?: string | null;
    readonly unit?: string | null;
    readonly sourceDocumentId?: string | null;
    readonly sourcePage?: string | null;
    readonly sourceSpan?: string | null;
  },
): void {
  if (input.value == null || !Number.isFinite(input.value)) return;
  assertions.push({
    ...input,
    assertionId: assertionIdFor(input),
    valueText: null,
    valueNumeric: roundCurrency(input.value),
    valueDate: null,
    currency: "USD",
    unit: input.unit ?? null,
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
    sourceDocumentId: input.sourceDocumentId ?? null,
    sourcePage: input.sourcePage ?? null,
    sourceSpan: input.sourceSpan ?? null,
    sourceRefs: sourceRefsFor(input),
  });
}

function pushQuantityAssertion(
  assertions: CanonicalFactAssertion[],
  input: Omit<
    Parameters<typeof pushMoneyAssertion>[1],
    "currency" | "value"
  > & { readonly value: number | null; readonly unit: string | null },
): void {
  if (input.value == null || !Number.isFinite(input.value)) return;
  assertions.push({
    ...input,
    assertionId: assertionIdFor(input),
    valueText: null,
    valueNumeric: roundQuantity(input.value),
    valueDate: null,
    currency: null,
    unit: input.unit,
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
    sourceDocumentId: input.sourceDocumentId ?? null,
    sourcePage: input.sourcePage ?? null,
    sourceSpan: input.sourceSpan ?? null,
    sourceRefs: sourceRefsFor(input),
  });
}

function pushClauseAssertion(
  assertions: CanonicalFactAssertion[],
  input: Omit<
    CanonicalFactAssertion,
    | "assertionId"
    | "valueDate"
    | "currency"
    | "unit"
    | "periodStart"
    | "periodEnd"
    | "sourceRefs"
  > & {
    readonly valueText: string | null;
    readonly valueNumeric: number | null;
  },
): void {
  if (input.valueText == null && input.valueNumeric == null) return;
  assertions.push({
    ...input,
    assertionId: assertionIdFor(input),
    valueText: input.valueText,
    valueNumeric:
      input.valueNumeric == null ? null : roundQuantity(input.valueNumeric),
    valueDate: dateValue(input.valueText),
    currency:
      input.valueNumeric != null &&
      /value|cost|spend|credit|variance|amount/iu.test(input.factKey)
        ? "USD"
        : null,
    unit:
      input.valueNumeric != null && /day|period/iu.test(input.factKey)
        ? "days"
        : null,
    periodStart: null,
    periodEnd: null,
    sourceRefs: sourceRefsFor(input),
  });
}

function nonNumericConflict(
  group: readonly CanonicalFactAssertion[],
  conflictType: "text_mismatch" | "date_mismatch",
): FactConflict {
  const first = group[0];
  return {
    tenantKey: first.tenantKey,
    datasetVersion: first.datasetVersion,
    conflictId: [first.entityId, first.factKey, conflictType].join(":"),
    entityKind: first.entityKind,
    entityId: first.entityId,
    contractId: first.contractId,
    vendorId: first.vendorId,
    factKey: first.factKey,
    conflictType,
    severity: "warning",
    resolutionState: "unresolved",
    summary: `${first.factKey} has conflicting ${conflictType === "date_mismatch" ? "dates" : "text values"} across governed sources.`,
    assertionIds: group.map((assertion) => assertion.assertionId),
    numericDelta: null,
    percentDelta: null,
    sourceRefs: Array.from(
      new Set(group.flatMap((assertion) => assertion.sourceRefs)),
    ),
  };
}

function assertionIdFor(input: {
  readonly entityId: string;
  readonly factKey: string;
  readonly sourceTable: string;
  readonly sourceRecordId: string | null;
}): string {
  return [
    input.entityId,
    input.factKey,
    input.sourceTable.replace(/^source\./, ""),
    input.sourceRecordId ?? "record",
  ].join(":");
}

function sourceRefsFor(input: {
  readonly sourceTable: string;
  readonly sourceRecordId: string | null;
  readonly sourceDocumentId?: string | null;
  readonly sourcePage?: string | null;
  readonly sourceSpan?: string | null;
}): string[] {
  const refs = [
    input.sourceRecordId
      ? `${input.sourceTable}:${input.sourceRecordId}`
      : input.sourceTable,
  ];
  if (input.sourceDocumentId) {
    refs.push(
      [
        input.sourceDocumentId,
        input.sourcePage ? `p${input.sourcePage}` : null,
        input.sourceSpan,
      ]
        .filter(Boolean)
        .join(":"),
    );
  }
  return refs;
}

function sourceRecordIdFor(row: Row): string {
  return (
    text(row.source_record_id) ??
    text(row.extraction_id) ??
    text(row.invoice_line_id) ??
    text(row.line_item_id) ??
    text(row.period_month) ??
    text(row.value_claim_id) ??
    stableRowId(row)
  );
}

function dateValue(value: string | null): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : null;
}

function periodDate(value: unknown): string | null {
  const textValue = text(value);
  if (!textValue) return null;
  if (/^\d{4}-\d{2}$/u.test(textValue)) return `${textValue}-01`;
  if (/^\d{4}-\d{2}-\d{2}/u.test(textValue)) return textValue.slice(0, 10);
  return null;
}

function derivedRateVarianceQuantity(row: Row): number | null {
  const quantity = number(row.quantity);
  if (quantity != null) return quantity;
  const billed = number(row.billed_rate_usd);
  const contract = number(row.matched_contract_rate_usd);
  const amount = number(row.exception_amount_usd);
  if (
    billed == null ||
    contract == null ||
    amount == null ||
    billed === contract
  ) {
    return null;
  }
  return amount / (billed - contract);
}

function stableRowId(row: Row): string {
  return sha256(row).slice("sha256:".length, "sha256:".length + 16);
}

function sha256(row: Row): string {
  return `sha256:${createHash("sha256").update(stableJson(row)).digest("hex")}`;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Row)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Row)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function number(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function sum(values: Iterable<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (value != null && Number.isFinite(value)) total += value;
  }
  return total;
}

function distinctValues(values: Iterable<string | null>): string[] {
  return Array.from(
    new Set(
      Array.from(values).filter((value): value is string => Boolean(value)),
    ),
  );
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function formatUsd(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "not established";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
