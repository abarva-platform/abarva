import type { SourceContract360Row } from "./types";

export type OptimizationOpportunityValueType =
  | "recoverable_leakage"
  | "avoided_cost"
  | "negotiable_improvement";

export type OptimizationOpportunityStage =
  | "signal"
  | "quantified"
  | "validated"
  | "approval_required"
  | "target_position"
  | "agreed"
  | "finance_confirmed"
  | "baseline_conflict"
  | "evidence_required"
  | "workflow_required";

export type OptimizationEvidenceGrade =
  | "system_evidenced"
  | "document_evidenced"
  | "human_validated"
  | "finance_confirmed"
  | "missing"
  | "conflicted";

export interface OptimizationBaselineRead {
  readonly status: "ready" | "conflict" | "missing";
  readonly headline: string;
  readonly detail: string;
  readonly annualValueUsd: number | null;
  readonly pricingScheduleAnnualValueUsd: number | null;
  readonly actualAnnualSpendUsd: number | null;
  readonly totalCommittedValueUsd: number | null;
  readonly conflictAmountUsd: number | null;
  readonly sourceRefs: readonly string[];
}

export interface OpportunitySourceReference {
  readonly sourceSystem: string;
  readonly sourceRecordId: string | null;
  readonly sourceFileReport: string | null;
  readonly tableName: string;
  readonly pageSpan: string | null;
  readonly reviewState: string | null;
}

export interface OpportunityCalculationLine {
  readonly lineId: string;
  readonly invoiceId: string | null;
  readonly invoiceLineId: string | null;
  readonly servicePeriod: string | null;
  readonly skuOrService: string | null;
  readonly quantity: number | null;
  readonly quantityBasis: string;
  readonly unitOfMeasure: string | null;
  readonly billedRateUsd: number | null;
  readonly contractRateUsd: number | null;
  readonly amountUsd: number;
  readonly inclusion: "included" | "excluded" | "pending_review";
  readonly inclusionReason: string;
  readonly pricingScheduleRef: string | null;
  readonly contractTermRef: string | null;
  readonly amendmentRef: string | null;
  readonly sourceRefs: readonly OpportunitySourceReference[];
}

export interface OpportunityCalculationRead {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly formula: string;
  readonly eligibleQuantity: number;
  readonly billedRateUsd: number | null;
  readonly contractRateUsd: number | null;
  readonly approvedExceptionsUsd: number;
  readonly calculatedAmountUsd: number;
  readonly includedLineCount: number;
  readonly excludedLineCount: number;
  readonly pendingLineCount: number;
  readonly lines: readonly OpportunityCalculationLine[];
}

export interface ContractOptimizationOpportunity {
  readonly opportunityId: string;
  readonly contractId: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly valueType: OptimizationOpportunityValueType;
  readonly amountUsd: number | null;
  readonly amountState: "exact" | "range" | "not_sized";
  readonly stage: OptimizationOpportunityStage;
  readonly evidenceGrade: OptimizationEvidenceGrade;
  readonly confidence: number | null;
  readonly deadline: string | null;
  readonly owner: string | null;
  readonly blockingGap: string | null;
  readonly nextAction: string;
  readonly sourceSystems: readonly string[];
  readonly evidenceRefs: readonly OpportunitySourceReference[];
  readonly calculation: OpportunityCalculationRead | null;
  readonly overlapTreatment: string;
  readonly approvalState: string;
  readonly narrative: string;
}

export interface FinanceRealizationLink {
  readonly realizationId: string;
  readonly amountUsd: number;
  readonly basis: string;
  readonly confirmationDate: string | null;
  readonly owner: string | null;
  readonly towerClaimRefs: readonly string[];
  readonly linkedOpportunityIds: readonly string[];
  readonly sourceRefs: readonly OpportunitySourceReference[];
}

export interface OptimizationCaseRead {
  readonly caseId: string;
  readonly door1EventId: string | null;
  readonly caseState:
    | "intake"
    | "baseline_confirmed"
    | "evidence_review"
    | "calculation_validated"
    | "outreach_approval"
    | "outcome_recorded"
    | "finance_handoff"
    | "closed";
  readonly owner: string | null;
  readonly nextAction: string;
}

export interface OptimizationApprovalDecisionRead {
  readonly decision: "approved" | "sent_back" | "held";
  readonly rationale: string;
  readonly decidedByRole: string | null;
  readonly decidedAt: string | null;
}

export interface OptimizationApprovalRequestRead {
  readonly approvalRequestId: string;
  readonly caseId: string;
  readonly opportunityId: string | null;
  readonly approvalType: string;
  readonly approvalState: "pending" | "approved" | "sent_back" | "cancelled";
  readonly requestedByRole: string | null;
  readonly requestedAt: string | null;
  readonly decisions: readonly OptimizationApprovalDecisionRead[];
}

export interface OptimizationNegotiatedOutcomeRead {
  readonly outcomeId: string;
  readonly caseId: string;
  readonly opportunityId: string;
  readonly outcomeState: "proposed" | "agreed" | "rejected" | "withdrawn";
  readonly agreedAmountUsd: number | null;
  readonly effectiveDate: string | null;
  readonly sourceDocumentId: string | null;
}

export interface ContractOptimizationOpportunitySet {
  readonly tenantKey: string | null;
  readonly datasetVersion: string;
  readonly contractId: string;
  readonly vendorId: string | null;
  readonly vendorName: string | null;
  readonly contractName: string | null;
  readonly recommendation: string;
  readonly recommendationDetail: string;
  readonly actionState:
    | "request_evidence"
    | "review_calculation"
    | "validate_opportunity"
    | "start_optimize_contract"
    | "approve_vendor_outreach"
    | "record_outcome"
    | "confirm_finance_realization";
  readonly baseline: OptimizationBaselineRead;
  readonly selectedOpportunityId: string | null;
  readonly opportunities: readonly ContractOptimizationOpportunity[];
  readonly optimizationCase?: OptimizationCaseRead | null;
  readonly approvalRequests?: readonly OptimizationApprovalRequestRead[];
  readonly negotiatedOutcomes?: readonly OptimizationNegotiatedOutcomeRead[];
  readonly financeRealizations: readonly FinanceRealizationLink[];
  readonly evidenceRequirements: readonly string[];
  readonly potentialRecoverableUsd: number;
  readonly potentialAvoidableUsd: number;
  readonly potentialNegotiableUsd: number;
  readonly financeConfirmedUsd: number;
}

type Row = Record<string, unknown>;

export interface BuildContractOptimizationOpportunitySetInput {
  readonly tenantKey: string | null;
  readonly datasetVersion?: string;
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

const DATASET_FALLBACK = "source-v4-golden-contract-evidence";
const RATE_VARIANCE_RULE = "source.contract_optimization.rate_variance.v1";
const RATE_VARIANCE_FORMULA =
  "Eligible quantity × (billed rate - operative contract rate) - approved exceptions = rate-variance opportunity";
const VMS_RATE_CARD_RULE = "source.contract_optimization.vms_rate_card_variance.v1";
const VMS_RATE_CARD_FORMULA =
  "SUM(hours × (billed hourly rate - operative rate-card hourly rate)) for VMS/rate-card lines with no amendment = labor rate-card variance";
const OFF_CONTRACT_BILLING_RULE =
  "source.contract_optimization.off_contract_billing.v1";
const OFF_CONTRACT_BILLING_FORMULA =
  "SUM(exception amount) for invoice lines classified as off-contract billing, excluding rate-variance lines = recoverable leakage candidate";
const SLA_CREDIT_RECOVERY_RULE =
  "source.contract_optimization.sla_credit_recovery.v1";
const SLA_CREDIT_RECOVERY_FORMULA =
  "SUM(max(service credits earned - service credits claimed, 0)) by contract month = unclaimed SLA credit opportunity";
const SCOPE_RATIONALIZATION_RULE =
  "source.contract_optimization.scope_rationalization.v1";
const SCOPE_RATIONALIZATION_FORMULA =
  "SUM(approved or review-ready renewal scope-reduction estimate) supported by usage and entitlement evidence = avoided future spend candidate";
const NEGOTIATED_IMPROVEMENT_RULE =
  "source.contract_optimization.negotiated_improvement.v1";
const NEGOTIATED_IMPROVEMENT_FORMULA =
  "SUM(documented target position or finance-approved negotiation estimate) for price, term, benchmark, or volume levers = negotiated improvement candidate";

export function buildContractOptimizationOpportunitySet(
  input: BuildContractOptimizationOpportunitySetInput,
): ContractOptimizationOpportunitySet | null {
  const contractId =
    text(input.overview?.contract_id) ??
    text(input.contract?.contract_id) ??
    text(input.invoiceRows[0]?.contract_id);
  if (!contractId) return null;

  const tenantKey =
    input.tenantKey ??
    text(input.overview?.tenant_key) ??
    text(input.overview?._tenant_key) ??
    text(input.contract?.tenant_key) ??
    null;
  const datasetVersion =
    input.datasetVersion ??
    text(input.overview?.dataset_version) ??
    text(input.financeRow?.dataset_version) ??
    DATASET_FALLBACK;
  const vendorId =
    text(input.overview?.vendor_id) ?? text(input.contract?.vendor_ref) ?? null;
  const vendorName =
    text(input.overview?.vendor_name) ??
    text(input.contract?.vendor_name) ??
    null;
  const contractName =
    text(input.overview?.contract_name) ??
    text(input.contract?.contract_name) ??
    null;
  const annualValue =
    number(input.overview?.annual_value_usd) ??
    number(input.contract?.annual_value);
  const actualSpend =
    number(input.overview?.actual_annual_spend_usd) ??
    number(input.contract?.actual_annual_spend);
  const totalCommitted =
    number(input.overview?.total_committed_value_usd) ??
    number(input.contract?.total_committed_value);
  const pricingAnnual = roundCurrency(
    sum(input.pricingRows.map((row) => number(row.annual_value_usd))),
  );
  const baseline = buildBaseline({
    contractId,
    annualValue,
    pricingAnnual,
    actualSpend,
    totalCommitted,
  });

  const pdfRefs = clauseRefs(input.pdfClauseRows);
  const sourceRef = (
    row: Row,
    tableName: string,
    pageSpan: string | null = null,
  ): OpportunitySourceReference => ({
    sourceSystem: text(row.source_system) ?? "Source evidence package",
    sourceRecordId: text(row.source_record_id),
    sourceFileReport:
      text(row.source_file_report) ?? text(row.source_file_name),
    tableName,
    pageSpan,
    reviewState: text(row.review_status) ?? text(row.review_state),
  });

  const opportunities =
    baseline.status === "conflict"
      ? buildConflictOpportunities(input, baseline, sourceRef)
      : buildReadyOpportunities(
          input,
          contractId,
          baseline,
          sourceRef,
          pdfRefs,
        );
  const financeRealizations =
    baseline.status === "conflict"
      ? []
      : buildFinanceRealizations(input, contractId, sourceRef, opportunities);

  const evidenceRequirements =
    baseline.status === "conflict"
      ? [
          "Resolve annual-value versus pricing-schedule baseline before sizing or approving an optimization case.",
        ]
      : opportunities
          .map((opportunity) => opportunity.blockingGap)
          .filter((value): value is string => Boolean(value));

  const potentialRecoverableUsd = sum(
    opportunities
      .filter((opportunity) => opportunity.valueType === "recoverable_leakage")
      .map((opportunity) => opportunity.amountUsd),
  );
  const potentialAvoidableUsd = sum(
    opportunities
      .filter((opportunity) => opportunity.valueType === "avoided_cost")
      .map((opportunity) => opportunity.amountUsd),
  );
  const potentialNegotiableUsd = sum(
    opportunities
      .filter(
        (opportunity) => opportunity.valueType === "negotiable_improvement",
      )
      .map((opportunity) => opportunity.amountUsd),
  );
  const financeConfirmedUsd = sum(
    financeRealizations.map((item) => item.amountUsd),
  );

  const selectedOpportunityId =
    opportunities.find((opportunity) =>
      opportunity.opportunityId.endsWith(":rate-variance"),
    )?.opportunityId ??
    opportunities[0]?.opportunityId ??
    null;

  return {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId,
    vendorName,
    contractName,
    recommendation:
      baseline.status === "conflict"
        ? "Build evidence before optimizing."
        : "Act now on governed evidence.",
    recommendationDetail:
      baseline.status === "conflict"
        ? "The contract is material, but the pricing schedule does not reconcile to stated annual value. Resolve the commercial baseline before sizing or approving an optimization case."
        : "Begin with invoice-line rate validation, then move off-contract billing, SLA credits, scope rationalization, and negotiated improvement through their required approvals.",
    actionState:
      baseline.status === "conflict"
        ? "request_evidence"
        : selectedOpportunityId
          ? "review_calculation"
          : "request_evidence",
    baseline,
    selectedOpportunityId,
    opportunities,
    optimizationCase: null,
    approvalRequests: [],
    negotiatedOutcomes: [],
    financeRealizations,
    evidenceRequirements,
    potentialRecoverableUsd,
    potentialAvoidableUsd,
    potentialNegotiableUsd,
    financeConfirmedUsd,
  };
}

function buildBaseline(input: {
  readonly contractId: string;
  readonly annualValue: number | null;
  readonly pricingAnnual: number;
  readonly actualSpend: number | null;
  readonly totalCommitted: number | null;
}): OptimizationBaselineRead {
  const sourceRefs = [
    "source.golden_contract_overview.annual_value_usd",
    "source.golden_contract_pricing_schedule.annual_value_usd",
    "source.contract_360.annual_value",
  ];
  if (input.annualValue == null || input.pricingAnnual <= 0) {
    return {
      status: "missing",
      headline: "Commercial baseline is incomplete.",
      detail:
        "Annual contract value or pricing schedule detail is missing, so optimization cannot be sized.",
      annualValueUsd: input.annualValue,
      pricingScheduleAnnualValueUsd:
        input.pricingAnnual > 0 ? input.pricingAnnual : null,
      actualAnnualSpendUsd: input.actualSpend,
      totalCommittedValueUsd: input.totalCommitted,
      conflictAmountUsd: null,
      sourceRefs,
    };
  }
  const conflictAmount = roundCurrency(input.pricingAnnual - input.annualValue);
  const tolerance = Math.max(1000, Math.abs(input.annualValue) * 0.005);
  if (Math.abs(conflictAmount) > tolerance) {
    return {
      status: "conflict",
      headline: "Commercial baseline conflict.",
      detail: `Pricing schedule totals ${formatUsd(input.pricingAnnual)} while the stated annual value is ${formatUsd(input.annualValue)}. Resolve the baseline before approving an optimization case.`,
      annualValueUsd: input.annualValue,
      pricingScheduleAnnualValueUsd: input.pricingAnnual,
      actualAnnualSpendUsd: input.actualSpend,
      totalCommittedValueUsd: input.totalCommitted,
      conflictAmountUsd: conflictAmount,
      sourceRefs,
    };
  }
  return {
    status: "ready",
    headline: "Commercial baseline reconciles.",
    detail: `The pricing schedule ties to the stated annual value at ${formatUsd(input.annualValue)}; opportunity sizing can proceed with line-level evidence.`,
    annualValueUsd: input.annualValue,
    pricingScheduleAnnualValueUsd: input.pricingAnnual,
    actualAnnualSpendUsd: input.actualSpend,
    totalCommittedValueUsd: input.totalCommitted,
    conflictAmountUsd: null,
    sourceRefs,
  };
}

function buildReadyOpportunities(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  baseline: OptimizationBaselineRead,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity[] {
  const rateOpportunity = buildRateVarianceOpportunity(
    input,
    contractId,
    sourceRef,
    pdfRefs,
  );
  const offContractOpportunity = buildInvoiceExceptionOpportunity(
    input,
    contractId,
    sourceRef,
    pdfRefs,
  );
  const vmsRateCardOpportunity = buildVmsRateCardOpportunity(
    input,
    contractId,
    sourceRef,
    pdfRefs,
  );
  const slaOpportunity = buildSlaOpportunity(
    input,
    contractId,
    sourceRef,
    pdfRefs,
  );
  const shelfwareOpportunity = buildShelfwareOpportunity(
    input,
    contractId,
    sourceRef,
    pdfRefs,
  );
  const negotiatedOpportunity = buildNegotiatedOpportunity(
    input,
    contractId,
    sourceRef,
    pdfRefs,
  );
  return [
    rateOpportunity,
    offContractOpportunity,
    vmsRateCardOpportunity,
    slaOpportunity,
    shelfwareOpportunity,
    negotiatedOpportunity,
  ]
    .filter((item): item is ContractOptimizationOpportunity => Boolean(item))
    .map((opportunity) => ({
      ...opportunity,
      narrative:
        baseline.status === "ready"
          ? opportunity.narrative
          : `${opportunity.narrative} Baseline state: ${baseline.headline}`,
    }));
}

function buildVmsRateCardOpportunity(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity | null {
  const rows = input.rateRows.filter(
    (row) => (number(row.rate_variance_usd) ?? 0) > 0,
  );
  if (rows.length === 0) return null;

  const includedLines = rows.map((row) => {
    const variance = number(row.rate_variance_usd) ?? 0;
    const hours = number(row.hours_last_12_months);
    const billedRate = number(row.billed_rate_usd_per_hour);
    const contractRate = number(row.contract_rate_usd_per_hour);
    const role = text(row.labor_or_service_role);
    return {
      lineId:
        text(row.rate_card_line_id) ??
        text(row.source_record_id) ??
        "rate-card-line",
      invoiceId: null,
      invoiceLineId: null,
      servicePeriod: "last 12 months",
      skuOrService: role ?? text(row.location) ?? "rate-card line",
      quantity: hours,
      quantityBasis:
        "Native VMS/rate-card hours from the labor or service role rate-band extract.",
      unitOfMeasure: "hour",
      billedRateUsd: billedRate,
      contractRateUsd: contractRate,
      amountUsd: roundCurrency(variance),
      inclusion: "included" as const,
      inclusionReason:
        "Rate-card row has positive rate_variance_usd and no amendment reference approving the higher billed rate.",
      pricingScheduleRef: text(row.rate_card_line_id),
      contractTermRef: "doc.extraction:contract.pricing_schedule",
      amendmentRef: text(row.amendment_reference) ?? "No rate-card amendment found",
      sourceRefs: [
        sourceRef(row, "source.golden_contract_rate_card_variance"),
        ...pdfRefs
          .filter((ref) => ref.pageSpan?.includes("pricing"))
          .slice(0, 2),
      ],
    };
  });
  const calculatedAmount = roundCurrency(
    sum(includedLines.map((line) => line.amountUsd)),
  );
  const firstLine = includedLines[0];
  return {
    opportunityId: `${contractId}:vms-rate-card-variance`,
    contractId,
    label: "VMS labor rate-card variance",
    shortLabel: "VMS rate-card variance",
    valueType: "recoverable_leakage",
    amountUsd: calculatedAmount,
    amountState: "exact",
    stage: "quantified",
    evidenceGrade: "system_evidenced",
    confidence: 0.88,
    deadline: text(input.overview?.notice_deadline) ?? null,
    owner:
      text(input.overview?.decision_owner_role_ref) ??
      text(input.contract?.renewal_owner_ref) ??
      "Procurement owner",
    blockingGap:
      "Procurement must confirm no approved amendment, exception, or rate-card update covers these billed rates before asserting recovery.",
    nextAction:
      "Review the VMS/rate-card variance rows with the CLM amendment search and supplier account team.",
    sourceSystems: ["VMS / rate card", "CLM pricing schedule"],
    evidenceRefs: uniqueRefs(includedLines.flatMap((line) => line.sourceRefs)),
    calculation: {
      ruleId: VMS_RATE_CARD_RULE,
      ruleVersion: "1.0.0",
      formula: VMS_RATE_CARD_FORMULA,
      eligibleQuantity: roundQuantity(
        sum(includedLines.map((line) => line.quantity ?? 0)),
      ),
      billedRateUsd: firstLine?.billedRateUsd ?? null,
      contractRateUsd: firstLine?.contractRateUsd ?? null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: calculatedAmount,
      includedLineCount: includedLines.length,
      excludedLineCount: 0,
      pendingLineCount: 0,
      lines: includedLines,
    },
    overlapTreatment:
      "Separated from AP invoice-line rate variance. VMS labor rate-card rows are included once as their own recoverable-leakage opportunity.",
    approvalState: "requires_vms_rate_exception_review",
    narrative:
      "VMS/rate-card rows show billed hourly rates above operative contract rates without an approving amendment reference.",
  };
}

function buildConflictOpportunities(
  input: BuildContractOptimizationOpportunitySetInput,
  baseline: OptimizationBaselineRead,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
): ContractOptimizationOpportunity[] {
  const contractId =
    text(input.overview?.contract_id) ??
    text(input.contract?.contract_id) ??
    "contract";
  const refs = [
    ...input.pricingRows
      .slice(0, 3)
      .map((row) => sourceRef(row, "source.golden_contract_pricing_schedule")),
    ...(input.overview
      ? [sourceRef(input.overview, "source.golden_contract_overview")]
      : []),
  ];
  return [
    {
      opportunityId: `${contractId}:baseline-conflict`,
      contractId,
      label: "Commercial baseline conflict",
      shortLabel: "Baseline conflict",
      valueType: "recoverable_leakage",
      amountUsd: null,
      amountState: "not_sized",
      stage: "baseline_conflict",
      evidenceGrade: "conflicted",
      confidence: 0.92,
      deadline: text(input.overview?.notice_deadline) ?? null,
      owner:
        text(input.overview?.decision_owner_role_ref) ??
        text(input.contract?.renewal_owner_ref) ??
        "Commercial owner",
      blockingGap: baseline.detail,
      nextAction:
        "Reconcile the contract annual value to pricing schedule line totals before moving any opportunity into approval.",
      sourceSystems: ["CLM / contract repository", "Pricing schedule"],
      evidenceRefs: refs,
      calculation: null,
      overlapTreatment:
        "No opportunity amount is displayed until the commercial baseline is resolved.",
      approvalState: "blocked_by_baseline_conflict",
      narrative:
        "This contract is material and potentially actionable, but the current evidence conflicts. AbarVa should refuse to manufacture a savings thesis until the baseline reconciles.",
    },
  ];
}

function buildRateVarianceOpportunity(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity | null {
  const pricingBySku = new Map(
    input.pricingRows.map((row) => [text(row.sku_or_service_code) ?? "", row]),
  );
  const rateRows = input.invoiceRows.filter(
    (row) =>
      text(row.exception_type)?.toLowerCase() === "rate_variance" &&
      (number(row.exception_amount_usd) ?? 0) > 0,
  );
  const excludedRows = input.invoiceRows.filter(
    (row) =>
      text(row.exception_type) == null ||
      number(row.exception_amount_usd) === 0,
  );
  const pendingRows = input.invoiceRows.filter(
    (row) => text(row.exception_type)?.toLowerCase() === "off_contract_billing",
  );
  if (rateRows.length === 0) return null;

  const includedLines = rateRows.map((row) => {
    const billedRate = number(row.billed_rate_usd);
    const contractRate = number(row.matched_contract_rate_usd);
    const exceptionAmount = number(row.exception_amount_usd) ?? 0;
    const quantity =
      billedRate != null && contractRate != null && billedRate !== contractRate
        ? exceptionAmount / (billedRate - contractRate)
        : null;
    const sku = text(row.sku_or_service_code);
    const pricing = sku ? pricingBySku.get(sku) : null;
    return {
      lineId:
        text(row.invoice_line_id) ??
        text(row.source_record_id) ??
        "invoice-line",
      invoiceId: text(row.invoice_id),
      invoiceLineId: text(row.invoice_line_id),
      servicePeriod: period(row.service_period_start, row.service_period_end),
      skuOrService: sku ?? text(row.line_description),
      quantity: quantity == null ? null : roundQuantity(quantity),
      quantityBasis:
        "Derived from invoice exception amount divided by billed-minus-contract rate because the source invoice extract does not carry an explicit quantity column.",
      unitOfMeasure: text(pricing?.unit_of_measure) ?? "invoice service unit",
      billedRateUsd: billedRate,
      contractRateUsd: contractRate,
      amountUsd: roundCurrency(exceptionAmount),
      inclusion: "included" as const,
      inclusionReason:
        "Invoice line has exception_type=rate_variance and positive exception_amount_usd.",
      pricingScheduleRef: text(pricing?.line_item_id) ?? sku,
      contractTermRef: "doc.extraction:contract.pricing_schedule",
      amendmentRef: "No approved exception or amendment recorded",
      sourceRefs: [
        sourceRef(row, "source.golden_contract_invoice_lines"),
        ...(pricing
          ? [sourceRef(pricing, "source.golden_contract_pricing_schedule")]
          : []),
        ...pdfRefs
          .filter((ref) => ref.pageSpan?.includes("pricing"))
          .slice(0, 2),
      ],
    };
  });
  const excludedLines = excludedRows.slice(0, 8).map((row) => ({
    lineId:
      text(row.invoice_line_id) ?? text(row.source_record_id) ?? "invoice-line",
    invoiceId: text(row.invoice_id),
    invoiceLineId: text(row.invoice_line_id),
    servicePeriod: period(row.service_period_start, row.service_period_end),
    skuOrService: text(row.sku_or_service_code) ?? text(row.line_description),
    quantity: null,
    quantityBasis: "No rate exception on this line.",
    unitOfMeasure: null,
    billedRateUsd: number(row.billed_rate_usd),
    contractRateUsd: number(row.matched_contract_rate_usd),
    amountUsd: 0,
    inclusion: "excluded" as const,
    inclusionReason: "Line has no positive rate-variance exception.",
    pricingScheduleRef: text(row.sku_or_service_code),
    contractTermRef: "doc.extraction:contract.pricing_schedule",
    amendmentRef: null,
    sourceRefs: [sourceRef(row, "source.golden_contract_invoice_lines")],
  }));
  const pendingLines = pendingRows.slice(0, 4).map((row) => ({
    lineId:
      text(row.invoice_line_id) ?? text(row.source_record_id) ?? "invoice-line",
    invoiceId: text(row.invoice_id),
    invoiceLineId: text(row.invoice_line_id),
    servicePeriod: period(row.service_period_start, row.service_period_end),
    skuOrService: text(row.sku_or_service_code) ?? text(row.line_description),
    quantity: null,
    quantityBasis: "Pending review as off-contract billing, not rate variance.",
    unitOfMeasure: null,
    billedRateUsd: number(row.billed_rate_usd),
    contractRateUsd: number(row.matched_contract_rate_usd),
    amountUsd: number(row.exception_amount_usd) ?? 0,
    inclusion: "pending_review" as const,
    inclusionReason:
      "Off-contract billing requires coverage review before classification.",
    pricingScheduleRef: text(row.sku_or_service_code),
    contractTermRef: "doc.extraction:contract.pricing_schedule",
    amendmentRef: null,
    sourceRefs: [sourceRef(row, "source.golden_contract_invoice_lines")],
  }));
  const lines = [...includedLines, ...pendingLines, ...excludedLines];
  const calculatedAmount = roundCurrency(
    sum(includedLines.map((line) => line.amountUsd)),
  );
  const firstLine = includedLines[0];
  return {
    opportunityId: `${contractId}:rate-variance`,
    contractId,
    label: "Invoice-line rate variance",
    shortLabel: "Rate variance",
    valueType: "recoverable_leakage",
    amountUsd: calculatedAmount,
    amountState: "exact",
    stage: "quantified",
    evidenceGrade: "system_evidenced",
    confidence: 0.94,
    deadline: text(input.overview?.notice_deadline) ?? null,
    owner:
      text(input.overview?.decision_owner_role_ref) ??
      text(input.contract?.renewal_owner_ref) ??
      "Procurement owner",
    blockingGap: null,
    nextAction:
      "Review the included invoice lines and complete the CLM amendment/exception search before treating the rate variance as validated.",
    sourceSystems: ["AP / ERP invoice line extract", "CLM pricing schedule"],
    evidenceRefs: uniqueRefs(includedLines.flatMap((line) => line.sourceRefs)),
    calculation: {
      ruleId: RATE_VARIANCE_RULE,
      ruleVersion: "1.0.0",
      formula: RATE_VARIANCE_FORMULA,
      eligibleQuantity: roundQuantity(
        sum(includedLines.map((line) => line.quantity ?? 0)),
      ),
      billedRateUsd: firstLine?.billedRateUsd ?? null,
      contractRateUsd: firstLine?.contractRateUsd ?? null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: calculatedAmount,
      includedLineCount: includedLines.length,
      excludedLineCount: excludedLines.length,
      pendingLineCount: pendingLines.length,
      lines,
    },
    overlapTreatment:
      "Included only in the recoverable opportunity calculation. Pending off-contract lines are excluded until coverage review is complete, so the page avoids double counting.",
    approvalState: "requires_amendment_exception_review",
    narrative:
      "Billed rates exceed operative contract rates on named invoice lines. The amount is reproducible from AP invoice lines and the pricing schedule.",
  };
}

function buildInvoiceExceptionOpportunity(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity | null {
  const rows = input.invoiceRows.filter(
    (row) =>
      text(row.exception_type)?.toLowerCase() === "off_contract_billing" &&
      (number(row.exception_amount_usd) ?? 0) > 0,
  );
  if (rows.length === 0) return null;
  const includedLines = rows.map((row) => ({
    lineId:
      text(row.invoice_line_id) ?? text(row.source_record_id) ?? "invoice-line",
    invoiceId: text(row.invoice_id),
    invoiceLineId: text(row.invoice_line_id),
    servicePeriod: period(row.service_period_start, row.service_period_end),
    skuOrService: text(row.sku_or_service_code) ?? text(row.line_description),
    quantity: 1,
    quantityBasis:
      "One governed invoice exception line classified as off-contract billing.",
    unitOfMeasure: "invoice exception line",
    billedRateUsd: number(row.billed_rate_usd),
    contractRateUsd: number(row.matched_contract_rate_usd),
    amountUsd: roundCurrency(number(row.exception_amount_usd) ?? 0),
    inclusion: "included" as const,
    inclusionReason:
      "Invoice line has exception_type=off_contract_billing and positive exception_amount_usd.",
    pricingScheduleRef: text(row.sku_or_service_code),
    contractTermRef: "doc.extraction:contract.scope",
    amendmentRef: null,
    sourceRefs: [sourceRef(row, "source.golden_contract_invoice_lines")],
  }));
  const amount = roundCurrency(
    sum(includedLines.map((line) => line.amountUsd)),
  );
  return {
    opportunityId: `${contractId}:off-contract-billing`,
    contractId,
    label: "Off-contract invoice exceptions",
    shortLabel: "Off-contract billing",
    valueType: "recoverable_leakage",
    amountUsd: amount,
    amountState: "exact",
    stage: "quantified",
    evidenceGrade: "system_evidenced",
    confidence: 0.86,
    deadline: text(input.overview?.notice_deadline) ?? null,
    owner:
      text(input.overview?.decision_owner_role_ref) ??
      text(input.contract?.renewal_owner_ref) ??
      "AP / Procurement owner",
    blockingGap:
      "AP and Procurement must confirm coverage, exceptions, and dispute eligibility before recovery is asserted externally.",
    nextAction:
      "Review off-contract invoice lines against PO coverage and active agreement scope.",
    sourceSystems: ["AP / ERP invoice line extract", "Procurement / PO"],
    evidenceRefs: [
      ...includedLines.flatMap((line) => line.sourceRefs),
      ...pdfRefs.filter((ref) => ref.pageSpan?.includes("scope")).slice(0, 2),
    ],
    calculation: {
      ruleId: OFF_CONTRACT_BILLING_RULE,
      ruleVersion: "1.0.0",
      formula: OFF_CONTRACT_BILLING_FORMULA,
      eligibleQuantity: includedLines.length,
      billedRateUsd: null,
      contractRateUsd: null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: amount,
      includedLineCount: includedLines.length,
      excludedLineCount: 0,
      pendingLineCount: 0,
      lines: includedLines,
    },
    overlapTreatment:
      "Separated from rate variance. Off-contract lines are not included in the rate-variance calculation.",
    approvalState: "requires_ap_procurement_review",
    narrative:
      "Named invoice lines appear outside active pricing or coverage. The amount is quantified, but the recovery position still requires coverage review.",
  };
}

function buildSlaOpportunity(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity | null {
  if (input.slaRows.length === 0) return null;
  const earned = sum(
    input.slaRows.map((row) => number(row.service_credits_earned_usd)),
  );
  const claimed = sum(
    input.slaRows.map((row) => number(row.service_credits_claimed_usd)),
  );
  const received = sum(
    input.slaRows.map((row) => number(row.service_credits_received_usd)),
  );
  const includedLines = input.slaRows
    .map((row) => {
      const rowGap = roundCurrency(
        Math.max(
          0,
          (number(row.service_credits_earned_usd) ?? 0) -
            (number(row.service_credits_claimed_usd) ?? 0),
        ),
      );
      return {
        lineId:
          text(row.sla_month_id) ??
          text(row.month) ??
          text(row.source_record_id) ??
          "sla-month",
        invoiceId: null,
        invoiceLineId: null,
        servicePeriod:
          text(row.period_month) ??
          text(row.month) ??
          text(row.service_month) ??
          text(row.reporting_month) ??
          null,
        skuOrService:
          text(row.service_tower) ??
          text(row.sla_name) ??
          "monthly SLA credit",
        quantity:
          number(row.sev1_sev2_incidents) ??
          number(row.credit_eligible_incidents) ??
          null,
        quantityBasis:
          "Monthly service-credit record; amount is earned credits less claimed credits for the period.",
        unitOfMeasure:
          number(row.sev1_sev2_incidents) != null ? "incident" : "month",
        billedRateUsd: null,
        contractRateUsd: null,
        amountUsd: rowGap,
        inclusion: "included" as const,
        inclusionReason:
          "Monthly service credits earned exceed service credits claimed.",
        pricingScheduleRef: null,
        contractTermRef: "doc.extraction:contract.sla_credit",
        amendmentRef: null,
        sourceRefs: [
          sourceRef(
            row,
            "source.golden_contract_sla_incident_service_credit_monthly",
          ),
        ],
      };
    })
    .filter((line) => line.amountUsd > 0);
  const gap = roundCurrency(sum(includedLines.map((line) => line.amountUsd)));
  if (gap <= 0) return null;
  return {
    opportunityId: `${contractId}:sla-credit-recovery`,
    contractId,
    label: "SLA credits earned but not claimed",
    shortLabel: "SLA credits",
    valueType: "recoverable_leakage",
    amountUsd: gap,
    amountState: "exact",
    stage: "quantified",
    evidenceGrade: "system_evidenced",
    confidence: 0.9,
    deadline: text(input.overview?.notice_deadline) ?? null,
    owner: "Vendor management / service owner",
    blockingGap:
      "Entitlement, vendor-responsibility exclusions, and claim status require legal/vendor-management review.",
    nextAction:
      "Validate entitlement against SLA clause and service-review pack before issuing a recovery claim.",
    sourceSystems: ["ITSM / service management", "CLM / contract repository"],
    evidenceRefs: [
      ...includedLines.slice(0, 6).flatMap((line) => line.sourceRefs),
      ...pdfRefs.filter((ref) => ref.pageSpan?.includes("credit")).slice(0, 2),
    ],
    calculation: {
      ruleId: SLA_CREDIT_RECOVERY_RULE,
      ruleVersion: "1.0.0",
      formula: SLA_CREDIT_RECOVERY_FORMULA,
      eligibleQuantity: includedLines.length,
      billedRateUsd: null,
      contractRateUsd: null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: gap,
      includedLineCount: includedLines.length,
      excludedLineCount: input.slaRows.length - includedLines.length,
      pendingLineCount: 0,
      lines: includedLines,
    },
    overlapTreatment:
      "Tracked as recoverable opportunity. Credits already received are kept out of the finance-confirmed outcome calculation.",
    approvalState: "requires_entitlement_review",
    narrative: `Monthly SLA evidence shows ${formatUsd(earned)} earned, ${formatUsd(claimed)} claimed, and ${formatUsd(received)} received.`,
  };
}

function buildShelfwareOpportunity(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity | null {
  const reviewed = input.renewalRows.find(
    (row) =>
      text(row.finding_or_offer_summary)?.toLowerCase().includes("unused") ||
      text(row.finding_or_offer_summary)
        ?.toLowerCase()
        .includes("rationalization") ||
      text(row.event_type)?.toLowerCase().includes("license") ||
      text(row.event_type)?.toLowerCase().includes("true-up"),
  );
  const amount =
    number(reviewed?.estimated_value_usd) ??
    number(input.financeRow?.avoided_cost_usd);
  if (amount == null || amount <= 0) return null;
  const usageRefs = input.usageRows
    .slice(0, 6)
    .map((row) =>
      sourceRef(row, "source.golden_contract_usage_entitlement_monthly"),
    );
  const calculationLine: OpportunityCalculationLine = {
    lineId:
      text(reviewed?.event_id) ??
      text(reviewed?.source_record_id) ??
      `${contractId}:scope-rationalization`,
    invoiceId: null,
    invoiceLineId: null,
    servicePeriod:
      text(reviewed?.event_date) ??
      text(reviewed?.effective_date) ??
      "renewal planning period",
    skuOrService:
      text(reviewed?.event_type) ??
      text(reviewed?.finding_or_offer_summary) ??
      "scope rationalization",
    quantity:
      number(reviewed?.quantity_delta) ??
      number(reviewed?.affected_quantity) ??
      null,
    quantityBasis:
      "Renewal scope-reduction estimate supported by usage and entitlement evidence; final inclusion requires business-owner approval.",
    unitOfMeasure: text(reviewed?.unit_of_measure) ?? "opportunity",
    billedRateUsd: null,
    contractRateUsd: null,
    amountUsd: roundCurrency(amount),
    inclusion: "included",
    inclusionReason:
      "Renewal/sourcing evidence records a positive estimated avoided-cost value for scope rationalization.",
    pricingScheduleRef: null,
    contractTermRef: "doc.extraction:contract.scope",
    amendmentRef: text(reviewed?.amendment_reference),
    sourceRefs: [
      ...(reviewed
        ? [
            sourceRef(
              reviewed,
              "source.golden_contract_renewal_negotiation_history",
            ),
          ]
        : []),
      ...usageRefs,
    ],
  };
  return {
    opportunityId: `${contractId}:scope-rationalization`,
    contractId,
    label: "Shelfware and scope rationalization",
    shortLabel: "Scope reduction",
    valueType: "avoided_cost",
    amountUsd: roundCurrency(amount),
    amountState: "exact",
    stage: "approval_required",
    evidenceGrade: "human_validated",
    confidence: 0.78,
    deadline: text(input.overview?.notice_deadline) ?? null,
    owner: text(reviewed?.owner_role_ref) ?? "Business owner",
    blockingGap:
      "Usage supports a reduction hypothesis; business owner must approve reclaim eligibility and service impact.",
    nextAction:
      "Confirm reclaim list with application owners and convert approved quantity into renewal scope.",
    sourceSystems: ["Usage / entitlement platform", "Sourcing workspace"],
    evidenceRefs: [
      ...calculationLine.sourceRefs,
      ...pdfRefs.filter((ref) => ref.pageSpan?.includes("scope")).slice(0, 2),
    ],
    calculation: {
      ruleId: SCOPE_RATIONALIZATION_RULE,
      ruleVersion: "1.0.0",
      formula: SCOPE_RATIONALIZATION_FORMULA,
      eligibleQuantity: calculationLine.quantity ?? 1,
      billedRateUsd: null,
      contractRateUsd: null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: roundCurrency(amount),
      includedLineCount: 1,
      excludedLineCount: 0,
      pendingLineCount: 0,
      lines: [calculationLine],
    },
    overlapTreatment:
      "Avoided future spend only. It is not a recoverable opportunity and is not finance-confirmed until the reduced commitment is booked.",
    approvalState: "business_owner_approval_required",
    narrative:
      text(reviewed?.finding_or_offer_summary) ??
      "Usage and entitlement evidence supports a scope-reduction hypothesis.",
  };
}

function buildNegotiatedOpportunity(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  pdfRefs: readonly OpportunitySourceReference[],
): ContractOptimizationOpportunity | null {
  const reviewed =
    input.renewalRows.find((row) =>
      text(row.finding_or_offer_summary)?.toLowerCase().includes("benchmark"),
    ) ??
    input.renewalRows.find((row) => number(row.estimated_value_usd) != null);
  const amount =
    number(input.financeRow?.negotiated_improvement_usd) ??
    number(reviewed?.estimated_value_usd);
  if (amount == null || amount <= 0) return null;
  const calculationLine: OpportunityCalculationLine = {
    lineId:
      text(reviewed?.event_id) ??
      text(reviewed?.source_record_id) ??
      `${contractId}:negotiated-improvement`,
    invoiceId: null,
    invoiceLineId: null,
    servicePeriod:
      text(reviewed?.event_date) ??
      text(reviewed?.effective_date) ??
      "negotiation planning period",
    skuOrService:
      text(reviewed?.event_type) ??
      text(reviewed?.finding_or_offer_summary) ??
      "price and term improvement",
    quantity: 1,
    quantityBasis:
      "One documented commercial target or approved negotiation estimate.",
    unitOfMeasure: "negotiation target",
    billedRateUsd: null,
    contractRateUsd: null,
    amountUsd: roundCurrency(amount),
    inclusion: "included",
    inclusionReason:
      "Documented positive negotiated-improvement target; remains a target until vendor agreement or executed amendment.",
    pricingScheduleRef: null,
    contractTermRef: "doc.extraction:contract.benchmark_or_pricing",
    amendmentRef: text(reviewed?.amendment_reference),
    sourceRefs: [
      ...(reviewed
        ? [
            sourceRef(
              reviewed,
              "source.golden_contract_renewal_negotiation_history",
            ),
          ]
        : []),
      ...(input.financeRow
        ? [
            sourceRef(
              input.financeRow,
              "source.golden_contract_finance_value_confirmation",
            ),
          ]
        : []),
    ],
  };
  return {
    opportunityId: `${contractId}:negotiated-improvement`,
    contractId,
    label: "Negotiated price and term improvement",
    shortLabel: "Negotiated improvement",
    valueType: "negotiable_improvement",
    amountUsd: roundCurrency(amount),
    amountState: "exact",
    stage: "target_position",
    evidenceGrade: "document_evidenced",
    confidence: 0.82,
    deadline: text(input.overview?.notice_deadline) ?? null,
    owner: text(reviewed?.owner_role_ref) ?? "Strategic sourcing owner",
    blockingGap:
      "This is a negotiation target/approved position, not booked savings. It requires vendor agreement or executed amendment.",
    nextAction:
      "Build the vendor-facing concession packet and route it through approval before outreach.",
    sourceSystems: ["CLM / contract repository", "Sourcing platform"],
    evidenceRefs: [
      ...calculationLine.sourceRefs,
      ...pdfRefs
        .filter(
          (ref) =>
            ref.pageSpan?.includes("benchmark") ||
            ref.pageSpan?.includes("pricing") ||
            ref.pageSpan?.includes("termination"),
        )
        .slice(0, 3),
    ],
    calculation: {
      ruleId: NEGOTIATED_IMPROVEMENT_RULE,
      ruleVersion: "1.0.0",
      formula: NEGOTIATED_IMPROVEMENT_FORMULA,
      eligibleQuantity: 1,
      billedRateUsd: null,
      contractRateUsd: null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: roundCurrency(amount),
      includedLineCount: 1,
      excludedLineCount: 0,
      pendingLineCount: 0,
      lines: [calculationLine],
    },
    overlapTreatment:
      "Negotiated improvement is tracked as a target position until agreement. It is not added to the finance-confirmed outcome.",
    approvalState: "vendor_outreach_not_approved",
    narrative:
      text(reviewed?.finding_or_offer_summary) ??
      "Documented pricing and benchmark levers support a negotiation target.",
  };
}

function buildFinanceRealizations(
  input: BuildContractOptimizationOpportunitySetInput,
  contractId: string,
  sourceRef: (
    row: Row,
    tableName: string,
    pageSpan?: string | null,
  ) => OpportunitySourceReference,
  opportunities: readonly ContractOptimizationOpportunity[],
): FinanceRealizationLink[] {
  const amount = number(input.financeRow?.realized_value_usd);
  if (amount == null || amount <= 0 || !input.financeRow) return [];
  const towerRefs = split(text(input.financeRow.tower_claim_refs));
  return [
    {
      realizationId:
        text(input.financeRow.value_claim_id) ??
        `finance-realization-${contractId.toLowerCase()}`,
      amountUsd: roundCurrency(amount),
      basis:
        text(input.financeRow.realized_value_basis) ??
        "Finance-confirmed outcome linked to originating opportunities.",
      confirmationDate: projectedFinanceConfirmationDate(input),
      owner: text(input.financeRow.finance_owner_role_ref),
      towerClaimRefs: towerRefs,
      linkedOpportunityIds: opportunities
        .filter((opportunity) => opportunity.stage !== "baseline_conflict")
        .slice(0, 3)
        .map((opportunity) => opportunity.opportunityId),
      sourceRefs: [
        sourceRef(
          input.financeRow,
          "source.golden_contract_finance_value_confirmation",
        ),
      ],
    },
  ];
}

function projectedFinanceConfirmationDate(
  input: BuildContractOptimizationOpportunitySetInput,
): string | null {
  const rawDate = isoDate(text(input.financeRow?.confirmation_date));
  const evidenceAsOf = latestEvidencePeriodEnd(input);
  if (rawDate && evidenceAsOf && rawDate > evidenceAsOf) return evidenceAsOf;
  return rawDate;
}

function latestEvidencePeriodEnd(
  input: BuildContractOptimizationOpportunitySetInput,
): string | null {
  const monthlyDates = [...input.slaRows, ...input.usageRows]
    .map((row) => text(row.period_month))
    .map(monthEndDate)
    .filter((value): value is string => Boolean(value))
    .sort();
  return monthlyDates.at(-1) ?? null;
}

function monthEndDate(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})/u.exec(value.trim());
  if (!match) return isoDate(value);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const end = new Date(Date.UTC(year, month, 0));
  return end.toISOString().slice(0, 10);
}

function isoDate(value: string | null): string | null {
  if (!value) return null;
  const date = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : null;
}

function clauseRefs(
  rows: readonly Row[],
): readonly OpportunitySourceReference[] {
  return rows.map((row) => ({
    sourceSystem: "CLM / contract repository",
    sourceRecordId: text(row.extraction_id),
    sourceFileReport: text(row.source_file_name),
    tableName: "source.contract_pdf_clause_extractions",
    pageSpan:
      text(row.source_file_id) && text(row.source_page) && text(row.concept_ref)
        ? `${text(row.source_file_id)}:p${text(row.source_page)}:${text(row.concept_ref)}`
        : null,
    reviewState: text(row.review_state),
  }));
}

function uniqueRefs(
  refs: readonly OpportunitySourceReference[],
): OpportunitySourceReference[] {
  const seen = new Set<string>();
  const unique: OpportunitySourceReference[] = [];
  for (const ref of refs) {
    const key = [
      ref.tableName,
      ref.sourceRecordId,
      ref.sourceFileReport,
      ref.pageSpan,
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(ref);
  }
  return unique;
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
  return roundCurrency(total);
}

function split(value: string | null): string[] {
  return (value ?? "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function period(start: unknown, end: unknown): string | null {
  const startText = text(start);
  const endText = text(end);
  if (!startText && !endText) return null;
  if (startText && endText) return `${startText} to ${endText}`;
  return startText ?? endText;
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
