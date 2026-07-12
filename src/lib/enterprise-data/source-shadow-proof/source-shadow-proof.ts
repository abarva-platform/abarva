import fs from "node:fs/promises";
import path from "node:path";

type ReadinessStatus = "shadow_ready" | "partially_ready" | "blocked";
type EvidenceStatus = "present" | "partial" | "missing";
type LeverageFindingType =
  | "spend_concentration"
  | "contract_renewal_or_timing_pressure"
  | "sla_leakage"
  | "rate_exposure"
  | "scope_overlap"
  | "vendor_consolidation"
  | "transition_risk"
  | "missing_evidence_blocker"
  | "value_tracking_opportunity";

interface CanonicalRecord {
  sourceObjectId: string;
  canonicalObjectKey?: string;
  domain: string;
  objectType: string;
  attributes: Record<string, { value: unknown; confidence?: number }>;
  evidenceReferences: Array<{
    evidenceKey: string;
    sourceObjectId?: string;
    excerpt?: string;
    confidence?: number;
  }>;
  confidence?: number;
  dataStatus: string;
  qualityStatus: string;
}

interface ModuleReadinessProof {
  summary: {
    tenantKey: string;
    packetId: string;
    canonicalRecordsEvaluated: number;
    targetOperationsEvaluated: number;
    qualityGateStatus: string;
    writesPhysicalTables: boolean;
    activeTenantAccessLayerUpdated: boolean;
  };
  sourceRecords: CanonicalRecord[];
}

interface CandidateRecord {
  candidateVersionKey: string;
  currentStatus: string;
  dryRunOnly: boolean;
  writesPhysicalTables: boolean;
  activeTenantAccessLayerUpdated: boolean;
  moduleRuntimeConsumptionChanged: boolean;
  lineage: {
    tenantKey: string;
    packetId: string;
  };
  promotionControl: {
    promotionEnabled: boolean;
    noModuleReadsCandidateByDefault: boolean;
  };
}

interface PromotionGateResult {
  decisionRecord: {
    decision: string;
    promotionEnabled: boolean;
    failedChecks: string[];
    blockers: string[];
    activeTenantAccessLayerUpdated: boolean;
    writesPhysicalTables: boolean;
    moduleRuntimeConsumptionChanged: boolean;
    noModuleReadsCandidateByDefault: boolean;
  };
}

interface WorkbenchPreview {
  tenantKey: string;
  tenantDataVersion: string;
  facts: WorkbenchFact[];
  relationships: WorkbenchRelationship[];
  derivedInsights: Array<{
    derivedObjectKey: string;
    sourceObjectIds: string[];
    status: string;
  }>;
  module: "source";
  previewMode: boolean;
  runtimeEligible: boolean;
  readinessStatus: string;
  blockers: string[];
  previewWarnings: string[];
}

interface WorkbenchFact {
  objectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  domain: string;
  label: string;
  previewValues: Record<string, string | number | boolean | null>;
  evidenceKeys: string[];
  confidence?: number;
}

interface WorkbenchRelationship {
  graphObjectKey: string;
  edgeKey: string;
  fromNodeKey: string;
  toNodeKey: string;
  relationshipType: string;
  evidenceKeys: string[];
  confidence: number;
  status: string;
}

interface DerivedPlanStage {
  derivedEntries: Array<{
    derivedObjectKey: string;
    targetModules: string[];
    evidenceKeys: string[];
    sourceObjectIds: string[];
    status: string;
  }>;
}

interface GraphPlanStage {
  graphEntries: Array<{
    graphObjectKey: string;
    targetModules: string[];
    sourceObjectIds: string[];
    status: string;
    edges: WorkbenchRelationship[];
  }>;
}

interface TargetWriteOperation {
  operationId: string;
  action: string;
  targetStore: string;
  sourceObjectId: string;
  evidenceKey?: string;
}

interface SourcePackData {
  agreementText: string;
  invoices: InvoiceRow[];
  servicePerformance: ServiceMetricRow[];
  staffing: StaffingRow[];
  changeOrders: ChangeOrderRow[];
}

interface InvoiceRow {
  month: string;
  category: string;
  contracted_amount_usd: number;
  invoiced_amount_usd: number;
  variance_reason: string;
  evidence_reference: string;
}

interface ServiceMetricRow {
  metric: string;
  contract_baseline: number;
  current_actual: number;
  unit: string;
  trend: string;
  evidence_reference: string;
}

interface StaffingRow {
  tower: string;
  committed_fte: number;
  observed_fte: number;
  location_mix: string;
  coverage: string;
  evidence_reference: string;
}

interface ChangeOrderRow {
  request_id: string;
  category: string;
  amount_usd: number;
  recurring: boolean;
  catalog_mapped: boolean;
  approval_evidence: string;
  owner_role: string;
}

interface EvidenceReadinessRow {
  category: string;
  status: EvidenceStatus;
  evidenceRefs: string[];
  detail: string;
  missingEvidence: string[];
}

interface VendorCommercialFact {
  factId: string;
  factType: string;
  statement: string;
  sourceObjectIds: string[];
  evidenceRefs: string[];
  confidence: number;
  safeForExecutiveBrief: boolean;
}

interface LeverageFinding {
  findingId: string;
  findingType: LeverageFindingType;
  summary: string;
  supportingCanonicalObjectIds: string[];
  supportingEvidenceRefs: string[];
  confidence: number;
  assumptions: string[];
  risk: string;
  proposedSourcingAction: string;
}

interface EvidenceTraceRow {
  claimId: string;
  claimText: string;
  claimType:
    | "candidate_context"
    | "evidence_readiness"
    | "commercial_fact"
    | "leverage_finding"
    | "proposed_action"
    | "value_commitment"
    | "guardrail";
  sourceType:
    | "canonical_record"
    | "evidence_reference"
    | "module_workbench_preview_fact"
    | "derived_insight"
    | "graph_relationship"
    | "explicit_assumption";
  sourceId: string;
  evidenceRefs: string[];
  confidence: number;
  safeForExecutiveBrief: boolean;
  assumption: boolean;
  missingEvidence: boolean;
}

interface ProposedMemoryRecord {
  memoryKey: string;
  recordType:
    | "source_shadow_event"
    | "sourcing_opportunity"
    | "evidence_gap"
    | "leverage_finding"
    | "proposed_sourcing_action"
    | "proposed_award_or_negotiation_path"
    | "proposed_value_commitment"
    | "tower_handoff_preview";
  status: "proposed";
  summary: string;
  evidenceLinked: boolean;
  sourceEvidenceRefs: string[];
  confidence: number;
  humanApprovalRequired: true;
  promotionEligible: false;
  reasonNotPromoted: string;
}

interface TowerHandoffPreview {
  valueCommitmentType: "proposed_source_value_commitment";
  valueHypothesis: string;
  baselineEvidence: string[];
  targetMetricSuggestion: string[];
  measurementFrequency: string;
  ownerNeeded: string[];
  confidence: number;
  evidenceGaps: string[];
  realizedValueClaimed: false;
  attestationRequired: true;
  physicalOutcomeLedgerTablesWritten: false;
  allowedValueStates: {
    potentialValue: true;
    proposedCommitment: true;
    measuredValue: false;
    realizedValue: false;
    attestedRealizedValue: false;
  };
}

interface Guardrails {
  sourceRuntimeChanged: false;
  productionTenantDataWritten: false;
  physicalSourceTablesWritten: false;
  physicalOutcomeLedgerTablesWritten: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  candidateReadByDefault: false;
  realizedValueClaimed: false;
  shadowProofOnly: true;
}

export interface SourceShadowProof {
  tenantKey: string;
  candidateVersionId: string;
  generatedAt: string;
  sourceContext: {
    sourceEventId: string;
    candidateStatus: string;
    canonicalRecordsInspected: number;
    targetWriteOperationsInspected: number;
    sourceWorkbenchFactsInspected: number;
    sourceRelationshipsInspected: number;
    sourceArtifactsInspected: string[];
    contextWarnings: string[];
  };
  sourceOpportunityAssessment: {
    readinessStatus: ReadinessStatus;
    answer: string;
    rationale: string[];
  };
  evidenceReadiness: EvidenceReadinessRow[];
  vendorCommercialFacts: VendorCommercialFact[];
  leverageFindings: LeverageFinding[];
  riskAndAssumptions: string[];
  proposedSourcingActions: string[];
  proposedDecisionBrief: {
    title: string;
    opportunitySummary: string;
    recommendedPath: string;
    notLiveStatement: string;
  };
  proposedModuleMemory: ProposedMemoryRecord[];
  proposedOutcomeLedgerCommitment: TowerHandoffPreview;
  towerHandoffPreview: TowerHandoffPreview;
  evidenceTrace: EvidenceTraceRow[];
  guardrails: Guardrails;
  blockers: string[];
  validationSummary: {
    qualityGateStatus: "pass" | "fail";
    evidenceTraceCount: number;
    leverageFindingCount: number;
    proposedMemoryRecordCount: number;
    safeExecutiveClaimCount: number;
    assumptionClaimCount: number;
    missingEvidenceClaimCount: number;
    guardrailsHeld: boolean;
  };
}

export interface SourceShadowProofOptions {
  repoRoot: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_OUTPUT_DIR = "reports/source-shadow-proof/skyharbor";
const SOURCE_PACK_DIR =
  "datasets/source/contract-optimization/skyharbor-ams-renewal-2026";
const CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const MODULE_READINESS_PROOF_PATH =
  "reports/module-readiness-proof/skyharbor/module-readiness-proof.json";
const SOURCE_WORKBENCH_PREVIEW_PATH =
  "reports/candidate-module-workbench-previews/skyharbor/source-workbench-preview.json";
const DERIVED_PLAN_PATH =
  "reports/candidate-module-derived-plans/skyharbor/module-derived-plan-stage.json";
const GRAPH_PLAN_PATH =
  "reports/candidate-module-graph-plans/skyharbor/module-graph-plan-stage.json";
const PROMOTION_GATE_PATH =
  "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json";
const TARGET_WRITE_PLAN_PATH =
  "audit-artifacts/target-writer-dry-run/skyharbor/target-write-plan.json";
const SOURCE_EVENT_EVIDENCE_KEY =
  "skyharbor-air-pr10-candidate:evidence-registry.csv:sha-source-datasets-source-contract-optimization-skyharbor";
const REASON_NOT_PROMOTED =
  "Shadow proof only: inactive candidate data has not been promoted, active tenant access is unchanged, and Source runtime consumption is disabled.";

export async function buildSourceShadowProof(
  options: SourceShadowProofOptions,
): Promise<SourceShadowProof> {
  const repoRoot = options.repoRoot;
  const generatedAt = options.generatedAt ?? "2026-07-12T00:00:00.000Z";
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const candidate = await readJson<CandidateRecord>(
    path.resolve(repoRoot, CANDIDATE_RECORD_PATH),
  );
  const moduleProof = await readJson<ModuleReadinessProof>(
    path.resolve(repoRoot, MODULE_READINESS_PROOF_PATH),
  );
  const sourceWorkbench = await readJson<WorkbenchPreview>(
    path.resolve(repoRoot, SOURCE_WORKBENCH_PREVIEW_PATH),
  );
  const derivedPlan = await readJson<DerivedPlanStage>(
    path.resolve(repoRoot, DERIVED_PLAN_PATH),
  );
  const graphPlan = await readJson<GraphPlanStage>(
    path.resolve(repoRoot, GRAPH_PLAN_PATH),
  );
  const promotionGate = await readJson<PromotionGateResult>(
    path.resolve(repoRoot, PROMOTION_GATE_PATH),
  );
  const targetWritePlan = await readJson<TargetWriteOperation[]>(
    path.resolve(repoRoot, TARGET_WRITE_PLAN_PATH),
  );
  const sourcePack = await readSourcePack(repoRoot);

  const sourceRecords = selectSourceRecords(moduleProof.sourceRecords);
  const evidenceReadiness = buildEvidenceReadiness(sourceRecords, sourcePack);
  const vendorCommercialFacts = buildVendorCommercialFacts(
    sourceRecords,
    sourcePack,
  );
  const leverageFindings = buildLeverageFindings(sourceRecords, sourcePack);
  const blockers = buildBlockers(
    evidenceReadiness,
    sourceWorkbench,
    promotionGate,
  );
  const readinessStatus: ReadinessStatus =
    evidenceReadiness.filter((row) => row.status === "present").length >= 6
      ? "shadow_ready"
      : evidenceReadiness.some((row) => row.status === "present")
        ? "partially_ready"
        : "blocked";
  const riskAndAssumptions = buildRisksAndAssumptions(
    evidenceReadiness,
    sourceWorkbench,
  );
  const proposedSourcingActions = leverageFindings.map(
    (finding) => finding.proposedSourcingAction,
  );
  const towerHandoffPreview = buildTowerHandoffPreview(
    sourcePack,
    evidenceReadiness,
  );
  const proposedModuleMemory = buildModuleMemoryPreview(
    candidate,
    leverageFindings,
    evidenceReadiness,
    towerHandoffPreview,
    generatedAt,
  );
  const evidenceTrace = buildEvidenceTrace({
    candidate,
    sourceRecords,
    sourceWorkbench,
    derivedPlan,
    graphPlan,
    vendorCommercialFacts,
    leverageFindings,
    towerHandoffPreview,
    evidenceReadiness,
  });
  const guardrails = buildGuardrails();
  const guardrailsHeld = Object.entries(guardrails).every(([key, value]) =>
    key === "shadowProofOnly" ? value === true : value === false,
  );

  const proof: SourceShadowProof = {
    tenantKey: candidate.lineage.tenantKey,
    candidateVersionId: candidate.candidateVersionKey,
    generatedAt,
    sourceContext: {
      sourceEventId: "skyharbor-ams-renewal-2026",
      candidateStatus: candidate.currentStatus,
      canonicalRecordsInspected: moduleProof.summary.canonicalRecordsEvaluated,
      targetWriteOperationsInspected: targetWritePlan.length,
      sourceWorkbenchFactsInspected: sourceWorkbench.facts.length,
      sourceRelationshipsInspected: sourceWorkbench.relationships.length,
      sourceArtifactsInspected: [
        "executed-ams-master-services-agreement-synthetic.md",
        "invoice-baseline-fy26-synthetic.csv",
        "service-performance-baseline-fy26-synthetic.csv",
        "staffing-location-attestation-fy26-synthetic.csv",
        "change-order-ledger-fy26-synthetic.csv",
      ],
      contextWarnings: [
        ...sourceWorkbench.previewWarnings,
        "Source shadow proof consumes inactive candidate context and referenced synthetic Source artifacts only.",
      ],
    },
    sourceOpportunityAssessment: {
      readinessStatus,
      answer:
        readinessStatus === "shadow_ready"
          ? "There is enough inactive candidate evidence to run a Source workflow shadow proof."
          : "The inactive candidate evidence is not sufficient for a full Source workflow shadow proof.",
      rationale: [
        `${countByStatus(evidenceReadiness, "present")} of ${evidenceReadiness.length} required evidence categories are present.`,
        "The proof can propose sourcing actions and value hypotheses, but cannot claim realized savings or update Source/Tower runtime state.",
        "Candidate context remains synthetic/planning-grade and must be approved by source owners before active runtime use.",
      ],
    },
    evidenceReadiness,
    vendorCommercialFacts,
    leverageFindings,
    riskAndAssumptions,
    proposedSourcingActions,
    proposedDecisionBrief: {
      title: "SkyHarbor AMS Renewal Source Shadow Proof",
      opportunitySummary:
        "Inactive candidate evidence supports a shadow Source workflow for AMS renewal leverage, invoice variance review, SLA remedy analysis, staffing underfill review, and change-order baseline control.",
      recommendedPath:
        "Run a controlled incumbent optimization path: preserve renewal rights, request benchmark/audit backup, normalize recurring change orders into catalog pricing, validate SLA credits, and define a Tower handoff as a proposed value commitment only.",
      notLiveStatement:
        "Shadow proof only - inactive candidate data. No Source runtime route changed, no production data was written, no candidate was promoted, and no realized value is claimed.",
    },
    proposedModuleMemory,
    proposedOutcomeLedgerCommitment: towerHandoffPreview,
    towerHandoffPreview,
    evidenceTrace,
    guardrails,
    blockers,
    validationSummary: {
      qualityGateStatus:
        readinessStatus !== "blocked" &&
        guardrailsHeld &&
        evidenceTrace.every(
          (trace) => trace.evidenceRefs.length > 0 || trace.assumption,
        ) &&
        towerHandoffPreview.realizedValueClaimed === false
          ? "pass"
          : "fail",
      evidenceTraceCount: evidenceTrace.length,
      leverageFindingCount: leverageFindings.length,
      proposedMemoryRecordCount: proposedModuleMemory.length,
      safeExecutiveClaimCount: evidenceTrace.filter(
        (trace) => trace.safeForExecutiveBrief,
      ).length,
      assumptionClaimCount: evidenceTrace.filter((trace) => trace.assumption)
        .length,
      missingEvidenceClaimCount: evidenceTrace.filter(
        (trace) => trace.missingEvidence,
      ).length,
      guardrailsHeld,
    },
  };

  await writeArtifacts(path.resolve(repoRoot, outputDir), proof);
  if (proof.validationSummary.qualityGateStatus !== "pass") {
    throw new Error("Source shadow proof quality gate failed.");
  }
  return proof;
}

async function readSourcePack(repoRoot: string): Promise<SourcePackData> {
  const dir = path.resolve(repoRoot, SOURCE_PACK_DIR);
  const agreementText = await fs.readFile(
    path.join(dir, "executed-ams-master-services-agreement-synthetic.md"),
    "utf8",
  );
  return {
    agreementText,
    invoices: parseCsv(
      await fs.readFile(
        path.join(dir, "invoice-baseline-fy26-synthetic.csv"),
        "utf8",
      ),
    ).map((row) => ({
      month: row.month,
      category: row.category,
      contracted_amount_usd: Number(row.contracted_amount_usd),
      invoiced_amount_usd: Number(row.invoiced_amount_usd),
      variance_reason: row.variance_reason,
      evidence_reference: row.evidence_reference,
    })),
    servicePerformance: parseCsv(
      await fs.readFile(
        path.join(dir, "service-performance-baseline-fy26-synthetic.csv"),
        "utf8",
      ),
    ).map((row) => ({
      metric: row.metric,
      contract_baseline: Number(row.contract_baseline),
      current_actual: Number(row.current_actual),
      unit: row.unit,
      trend: row.trend,
      evidence_reference: row.evidence_reference,
    })),
    staffing: parseCsv(
      await fs.readFile(
        path.join(dir, "staffing-location-attestation-fy26-synthetic.csv"),
        "utf8",
      ),
    ).map((row) => ({
      tower: row.tower,
      committed_fte: Number(row.committed_fte),
      observed_fte: Number(row.observed_fte),
      location_mix: row.location_mix,
      coverage: row.coverage,
      evidence_reference: row.evidence_reference,
    })),
    changeOrders: parseCsv(
      await fs.readFile(
        path.join(dir, "change-order-ledger-fy26-synthetic.csv"),
        "utf8",
      ),
    ).map((row) => ({
      request_id: row.request_id,
      category: row.category,
      amount_usd: Number(row.amount_usd),
      recurring: row.recurring === "true",
      catalog_mapped: row.catalog_mapped === "true",
      approval_evidence: row.approval_evidence,
      owner_role: row.owner_role,
    })),
  };
}

function selectSourceRecords(records: CanonicalRecord[]): CanonicalRecord[] {
  return records.filter((record) => {
    const text = searchable(record);
    return (
      text.includes("vendor") ||
      text.includes("contract") ||
      text.includes("source") ||
      text.includes("spend") ||
      text.includes("invoice") ||
      text.includes("sla") ||
      text.includes("pricing") ||
      record.sourceObjectId.includes("sha-ven") ||
      record.sourceObjectId.includes("sha-source")
    );
  });
}

function buildEvidenceReadiness(
  sourceRecords: CanonicalRecord[],
  sourcePack: SourcePackData,
): EvidenceReadinessRow[] {
  const vendorRefs = refsFor(sourceRecords, (record) =>
    record.sourceObjectId.includes("sha-ven"),
  );
  const sourceRefs = [SOURCE_EVENT_EVIDENCE_KEY];
  const spendRefs = refsFor(sourceRecords, (record) =>
    record.sourceObjectId.includes("sha-spend"),
  );
  return [
    readiness(
      "vendor inventory",
      vendorRefs.length > 0 ? "present" : "missing",
      vendorRefs,
      `${vendorRefs.length} vendor records are available in candidate context.`,
      ["Client-approved vendor master and supplier risk record."],
    ),
    readiness(
      "contract evidence",
      "present",
      sourceRefs,
      "Synthetic executed agreement extract is referenced by the Source event evidence pack.",
      ["Client-approved executed agreement and amendments."],
    ),
    readiness(
      "rate/pricing evidence",
      hasRateCard(sourcePack.agreementText) ? "present" : "missing",
      sourceRefs,
      "Rate card and base monthly fee are present in the agreement extract.",
      ["Rate card approval history and current invoice backup."],
    ),
    readiness(
      "SLA/obligation evidence",
      sourcePack.servicePerformance.length > 0 ? "present" : "missing",
      sourceRefs,
      `${sourcePack.servicePerformance.length} service performance metrics are available.`,
      ["Service credit ledger and supplier root-cause/cure evidence."],
    ),
    readiness(
      "spend/value evidence",
      sourcePack.invoices.length > 0 && spendRefs.length > 0
        ? "present"
        : "partial",
      unique([...sourceRefs, ...spendRefs]),
      "Invoice baseline and Tower value-signal records are available, but value remains unquantified/proxy-grade.",
      ["Finance-approved baseline and value owner signoff."],
    ),
    readiness(
      "sourcing scope",
      "present",
      sourceRefs,
      "Agreement scope, out-of-scope services, and change-order process are available.",
      ["Approved future-state scope and incumbent negotiation strategy."],
    ),
    readiness(
      "transition/operational risk evidence",
      "partial",
      sourceRefs,
      "Transition assistance clause and staffing/service risk signals are available; a detailed transition plan is not.",
      ["Transition plan, retained team model, and exit-risk owner approvals."],
    ),
    readiness(
      "Tower value metric/handoff evidence",
      spendRefs.length > 0 ? "partial" : "missing",
      spendRefs,
      "Tower value signals exist as hypotheses and proxy metrics only.",
      [
        "Outcome Ledger owner, baseline approval, measurement cadence, and attestation process.",
      ],
    ),
  ];
}

function readiness(
  category: string,
  status: EvidenceStatus,
  evidenceRefs: string[],
  detail: string,
  missingEvidence: string[],
): EvidenceReadinessRow {
  return {
    category,
    status,
    evidenceRefs: unique(evidenceRefs),
    detail,
    missingEvidence: status === "present" ? [] : missingEvidence,
  };
}

function buildVendorCommercialFacts(
  sourceRecords: CanonicalRecord[],
  sourcePack: SourcePackData,
): VendorCommercialFact[] {
  const agreementRefs = [SOURCE_EVENT_EVIDENCE_KEY];
  const vendorRefs = refsFor(sourceRecords, (record) =>
    record.sourceObjectId.includes("sha-ven"),
  );
  const invoiceVariance = invoiceTotals(sourcePack.invoices);
  const staffingGap = sourcePack.staffing.reduce(
    (sum, row) => sum + Math.max(0, row.committed_fte - row.observed_fte),
    0,
  );
  const recurringChangeOrderExposure = sourcePack.changeOrders
    .filter((row) => row.recurring)
    .reduce((sum, row) => sum + row.amount_usd, 0);
  const renewalNoticeDate =
    sourcePack.agreementText.match(
      /renewal notice date:\*\* ([0-9-]+)/i,
    )?.[1] ?? "not found";
  const baseMonthlyFee = extractCurrencyAfter(
    sourcePack.agreementText,
    /Base recurring services are priced at \*\*\$([\d,]+) per month/i,
  );

  return [
    fact(
      "fact-vendor-inventory",
      "vendor_inventory",
      `${vendorRefs.length} vendor records are present in the inactive candidate context.`,
      sourceRecords
        .filter((record) => record.sourceObjectId.includes("sha-ven"))
        .map((record) => record.sourceObjectId),
      vendorRefs,
      0.82,
      true,
    ),
    fact(
      "fact-renewal-date",
      "renewal_window",
      `The synthetic agreement lists a renewal notice date of ${renewalNoticeDate}.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      agreementRefs,
      0.86,
      true,
    ),
    fact(
      "fact-base-fee",
      "pricing_baseline",
      `The synthetic agreement lists a base recurring service fee of ${formatUsd(baseMonthlyFee)} per month for the 2026 run year.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      agreementRefs,
      0.86,
      true,
    ),
    fact(
      "fact-invoice-variance",
      "invoice_variance",
      `The FY26 invoice baseline shows ${formatUsd(invoiceVariance.invoiced)} invoiced against ${formatUsd(invoiceVariance.contracted)} contracted, a ${formatUsd(invoiceVariance.variance)} variance before validation.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      agreementRefs,
      0.84,
      true,
    ),
    fact(
      "fact-change-orders",
      "change_order_exposure",
      `The synthetic change-order ledger includes ${formatUsd(recurringChangeOrderExposure)} recurring change-order exposure that is not fully catalog-mapped.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      agreementRefs,
      0.8,
      true,
    ),
    fact(
      "fact-staffing-gap",
      "staffing_underfill",
      `Staffing attestations show ${staffingGap} fewer observed FTE than committed across the three listed towers.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      agreementRefs,
      0.8,
      true,
    ),
  ];
}

function buildLeverageFindings(
  sourceRecords: CanonicalRecord[],
  sourcePack: SourcePackData,
): LeverageFinding[] {
  const refs = [SOURCE_EVENT_EVIDENCE_KEY];
  const vendorRecordIds = sourceRecords
    .filter((record) => record.sourceObjectId.includes("sha-ven"))
    .map((record) => record.sourceObjectId);
  const invoiceVariance = invoiceTotals(sourcePack.invoices);
  const recurringUnmapped = sourcePack.changeOrders.filter(
    (row) => row.recurring && !row.catalog_mapped,
  );
  const p1 = sourcePack.servicePerformance.find((row) =>
    row.metric.toLowerCase().includes("p1 restore"),
  );
  const changeSuccess = sourcePack.servicePerformance.find((row) =>
    row.metric.toLowerCase().includes("change success"),
  );
  const staffingGap = sourcePack.staffing.reduce(
    (sum, row) => sum + Math.max(0, row.committed_fte - row.observed_fte),
    0,
  );

  return [
    finding(
      "LF-001",
      "spend_concentration",
      `AMS base run invoices show a ${formatUsd(invoiceVariance.variance)} FY26 variance above contracted baseline in synthetic evidence.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      refs,
      0.82,
      [
        "Invoice variance must be validated by Finance and supplier backup before negotiation.",
      ],
      "Synthetic invoice baseline may not represent approved production spend.",
      "Open an incumbent commercial review focused on variance drivers, pass-through backup, and catalog mapping.",
    ),
    finding(
      "LF-002",
      "contract_renewal_or_timing_pressure",
      "The agreement contains a 2026-09-30 renewal notice date and annual benchmark/audit rights after year two.",
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      refs,
      0.86,
      [
        "The synthetic renewal clause must be matched to the executed agreement and amendment history.",
      ],
      "Missing counsel/procurement approval would block formal notice strategy.",
      "Preserve renewal rights, issue benchmark/audit data request, and align renegotiation milestones to the notice window.",
    ),
    finding(
      "LF-003",
      "sla_leakage",
      p1 && changeSuccess
        ? `P1 restore is ${p1.current_actual}% against ${p1.contract_baseline}% target, and change success is ${changeSuccess.current_actual}% against ${changeSuccess.contract_baseline}% target in synthetic service data.`
        : "Service performance evidence is incomplete.",
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      refs,
      0.8,
      [
        "Service-credit calculation requires supplier root-cause and credit ledger evidence.",
      ],
      "SLA misses may have cure/earn-back terms and capped credits.",
      "Validate service credits, root-cause closure, and chronic-miss remedies before renewal negotiation.",
    ),
    finding(
      "LF-004",
      "scope_overlap",
      `${formatUsd(sum(recurringUnmapped.map((row) => row.amount_usd)))} in recurring change orders are not catalog mapped in synthetic change-order evidence.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      refs,
      0.8,
      [
        "Recurring change orders require owner acceptance evidence and catalog mapping review.",
      ],
      "Some change orders may be legitimate new demand rather than leakage.",
      "Convert recurring demand to priced catalog lines or remove unsupported charges from the renewal baseline.",
    ),
    finding(
      "LF-005",
      "transition_risk",
      `Staffing attestations show ${staffingGap} committed-vs-observed FTE gap and coverage gaps in airline operations and data/integration support.`,
      ["sha-source-datasets-source-contract-optimization-skyharbor"],
      refs,
      0.78,
      [
        "FTE gaps need supplier attestation, shift rosters, and service owner review.",
      ],
      "Underfill claims can be disputed without roster-level evidence.",
      "Require staffing cure plan, coverage attestation, and transition-assistance readiness before award or renewal decision.",
    ),
    finding(
      "LF-006",
      "vendor_consolidation",
      `${vendorRecordIds.length} vendor records are visible, but the candidate pack does not contain enough approved contract economics to recommend vendor consolidation.`,
      vendorRecordIds,
      refsFor(sourceRecords, (record) =>
        record.sourceObjectId.includes("sha-ven"),
      ),
      0.62,
      [
        "Vendor consolidation requires spend by vendor, contract terms, service criticality, and transition risk evidence.",
      ],
      "Insufficient evidence for an executive consolidation recommendation.",
      "Keep vendor consolidation as a discovery workstream, not a decision recommendation.",
    ),
    finding(
      "LF-007",
      "value_tracking_opportunity",
      "Tower should track only proposed value commitments until Finance, Operations, Technology, and Source owners approve baselines and measurement definitions.",
      ["sha-spend-008"],
      refsFor(
        sourceRecords,
        (record) => record.sourceObjectId === "sha-spend-008",
      ),
      0.82,
      [
        "Outcome Ledger setup requires owner, cadence, metric definitions, and attestation path.",
      ],
      "Potential value can be confused with measured or realized value without strict labels.",
      "Create a proposed Tower handoff for invoice variance, recurring change-order exposure, SLA remedies, and staffing underfill metrics.",
    ),
  ];
}

function buildTowerHandoffPreview(
  sourcePack: SourcePackData,
  evidenceReadiness: EvidenceReadinessRow[],
): TowerHandoffPreview {
  const invoiceVariance = invoiceTotals(sourcePack.invoices);
  const recurringChangeOrderExposure = sourcePack.changeOrders
    .filter((row) => row.recurring)
    .reduce((sum, row) => sum + row.amount_usd, 0);
  const evidenceGaps = evidenceReadiness.flatMap((row) => row.missingEvidence);
  return {
    valueCommitmentType: "proposed_source_value_commitment",
    valueHypothesis: `Potential sourcing value exists in validating ${formatUsd(invoiceVariance.variance)} invoice variance, ${formatUsd(recurringChangeOrderExposure)} recurring change-order exposure, SLA remedies, and staffing underfill. This is a proposed commitment only, not measured or realized value.`,
    baselineEvidence: [SOURCE_EVENT_EVIDENCE_KEY],
    targetMetricSuggestion: [
      "validated invoice variance by reason code",
      "recurring change-order exposure converted to catalog pricing",
      "eligible SLA credit or remedy amount",
      "committed-versus-observed FTE gap",
      "approved run-rate baseline after renegotiation",
    ],
    measurementFrequency:
      "monthly during sourcing event; quarterly after any approved award or renewal",
    ownerNeeded: [
      "Source event owner",
      "Finance baseline owner",
      "Technology service owner",
      "Tower outcome owner",
    ],
    confidence: evidenceGaps.length > 0 ? 0.72 : 0.82,
    evidenceGaps,
    realizedValueClaimed: false,
    attestationRequired: true,
    physicalOutcomeLedgerTablesWritten: false,
    allowedValueStates: {
      potentialValue: true,
      proposedCommitment: true,
      measuredValue: false,
      realizedValue: false,
      attestedRealizedValue: false,
    },
  };
}

function buildModuleMemoryPreview(
  candidate: CandidateRecord,
  leverageFindings: LeverageFinding[],
  evidenceReadiness: EvidenceReadinessRow[],
  towerHandoff: TowerHandoffPreview,
  generatedAt: string,
): ProposedMemoryRecord[] {
  const base = {
    status: "proposed" as const,
    humanApprovalRequired: true as const,
    promotionEligible: false as const,
    reasonNotPromoted: REASON_NOT_PROMOTED,
  };
  const records: ProposedMemoryRecord[] = [
    memory(
      "source-shadow-event",
      "source_shadow_event",
      `Source shadow proof generated for ${candidate.candidateVersionKey} at ${generatedAt}.`,
      [SOURCE_EVENT_EVIDENCE_KEY],
      0.86,
      base,
    ),
    memory(
      "sourcing-opportunity",
      "sourcing_opportunity",
      "Candidate evidence supports an AMS renewal optimization shadow workflow.",
      [SOURCE_EVENT_EVIDENCE_KEY],
      0.82,
      base,
    ),
    ...evidenceReadiness
      .filter((row) => row.status !== "present")
      .map((row, index) =>
        memory(
          `evidence-gap-${index + 1}`,
          "evidence_gap",
          `${row.category}: ${row.missingEvidence.join("; ")}`,
          row.evidenceRefs,
          0.74,
          base,
        ),
      ),
    ...leverageFindings.map((finding) =>
      memory(
        finding.findingId.toLowerCase(),
        "leverage_finding",
        finding.summary,
        finding.supportingEvidenceRefs,
        finding.confidence,
        base,
      ),
    ),
    memory(
      "proposed-sourcing-action",
      "proposed_sourcing_action",
      "Preserve renewal rights, request benchmark/audit support, validate variance, normalize recurring change orders, and define Tower handoff metrics.",
      [SOURCE_EVENT_EVIDENCE_KEY],
      0.8,
      base,
    ),
    memory(
      "proposed-negotiation-path",
      "proposed_award_or_negotiation_path",
      "Proceed as incumbent optimization and renegotiation shadow path until approved evidence supports a formal renewal, rebid, or award decision.",
      [SOURCE_EVENT_EVIDENCE_KEY],
      0.76,
      base,
    ),
    memory(
      "proposed-value-commitment",
      "proposed_value_commitment",
      towerHandoff.valueHypothesis,
      towerHandoff.baselineEvidence,
      towerHandoff.confidence,
      base,
    ),
    memory(
      "tower-handoff-preview",
      "tower_handoff_preview",
      "Tower handoff preview created as proposed commitment only; realized value is false and attestation is required.",
      towerHandoff.baselineEvidence,
      towerHandoff.confidence,
      base,
    ),
  ];
  return records;
}

function memory(
  key: string,
  recordType: ProposedMemoryRecord["recordType"],
  summary: string,
  evidenceRefs: string[],
  confidence: number,
  base: Pick<
    ProposedMemoryRecord,
    | "status"
    | "humanApprovalRequired"
    | "promotionEligible"
    | "reasonNotPromoted"
  >,
): ProposedMemoryRecord {
  return {
    memoryKey: `source-shadow:${key}`,
    recordType,
    summary,
    evidenceLinked: evidenceRefs.length > 0,
    sourceEvidenceRefs: unique(evidenceRefs),
    confidence,
    ...base,
  };
}

function buildEvidenceTrace(input: {
  candidate: CandidateRecord;
  sourceRecords: CanonicalRecord[];
  sourceWorkbench: WorkbenchPreview;
  derivedPlan: DerivedPlanStage;
  graphPlan: GraphPlanStage;
  vendorCommercialFacts: VendorCommercialFact[];
  leverageFindings: LeverageFinding[];
  towerHandoffPreview: TowerHandoffPreview;
  evidenceReadiness: EvidenceReadinessRow[];
}): EvidenceTraceRow[] {
  const traces: EvidenceTraceRow[] = [
    trace(
      "claim-candidate-inactive",
      "Candidate context is inactive and not promoted.",
      "guardrail",
      "canonical_record",
      input.candidate.candidateVersionKey,
      [],
      0.95,
      true,
      true,
      false,
    ),
    ...input.evidenceReadiness.map((row, index) =>
      trace(
        `claim-evidence-${index + 1}`,
        `${row.category} evidence is ${row.status}. ${row.detail}`,
        "evidence_readiness",
        row.evidenceRefs.length > 0
          ? "evidence_reference"
          : "explicit_assumption",
        row.evidenceRefs[0] ?? row.category,
        row.evidenceRefs,
        row.status === "present" ? 0.84 : 0.68,
        row.status !== "missing",
        row.evidenceRefs.length === 0,
        row.status !== "present",
      ),
    ),
    ...input.vendorCommercialFacts.map((fact) =>
      trace(
        fact.factId,
        fact.statement,
        "commercial_fact",
        "evidence_reference",
        fact.evidenceRefs[0] ?? fact.factId,
        fact.evidenceRefs,
        fact.confidence,
        fact.safeForExecutiveBrief,
        false,
        false,
      ),
    ),
    ...input.leverageFindings.map((finding) =>
      trace(
        finding.findingId,
        finding.summary,
        "leverage_finding",
        finding.supportingEvidenceRefs.length > 0
          ? "evidence_reference"
          : "explicit_assumption",
        finding.supportingEvidenceRefs[0] ?? finding.findingId,
        finding.supportingEvidenceRefs,
        finding.confidence,
        finding.findingType !== "missing_evidence_blocker",
        finding.supportingEvidenceRefs.length === 0,
        finding.findingType === "missing_evidence_blocker",
      ),
    ),
    trace(
      "claim-source-preview-facts",
      `${input.sourceWorkbench.facts.length} Source workbench preview facts are available.`,
      "candidate_context",
      "module_workbench_preview_fact",
      "source-workbench-preview",
      input.sourceWorkbench.facts.flatMap((fact) => fact.evidenceKeys),
      0.84,
      true,
      false,
      false,
    ),
    trace(
      "claim-derived-plan",
      `${sourceDerived(input.derivedPlan)?.sourceObjectIds.length ?? 0} source records feed the Source derived plan.`,
      "candidate_context",
      "derived_insight",
      sourceDerived(input.derivedPlan)?.derivedObjectKey ??
        "candidate-workbench-derived:source",
      sourceDerived(input.derivedPlan)?.evidenceKeys ?? [],
      0.82,
      true,
      false,
      false,
    ),
    trace(
      "claim-graph-plan",
      `${sourceGraph(input.graphPlan)?.edges.length ?? 0} graph edges are planned for Source workbench preview.`,
      "candidate_context",
      "graph_relationship",
      sourceGraph(input.graphPlan)?.graphObjectKey ??
        "candidate-workbench-graph:source",
      sourceGraph(input.graphPlan)?.edges.flatMap(
        (edge) => edge.evidenceKeys,
      ) ?? [],
      0.8,
      true,
      false,
      false,
    ),
    trace(
      "claim-tower-handoff",
      input.towerHandoffPreview.valueHypothesis,
      "value_commitment",
      "evidence_reference",
      SOURCE_EVENT_EVIDENCE_KEY,
      input.towerHandoffPreview.baselineEvidence,
      input.towerHandoffPreview.confidence,
      true,
      false,
      input.towerHandoffPreview.evidenceGaps.length > 0,
    ),
  ];
  return traces;
}

function trace(
  claimId: string,
  claimText: string,
  claimType: EvidenceTraceRow["claimType"],
  sourceType: EvidenceTraceRow["sourceType"],
  sourceId: string,
  evidenceRefs: string[],
  confidence: number,
  safeForExecutiveBrief: boolean,
  assumption: boolean,
  missingEvidence: boolean,
): EvidenceTraceRow {
  return {
    claimId,
    claimText,
    claimType,
    sourceType,
    sourceId,
    evidenceRefs: unique(evidenceRefs),
    confidence,
    safeForExecutiveBrief,
    assumption,
    missingEvidence,
  };
}

function buildBlockers(
  evidenceReadiness: EvidenceReadinessRow[],
  sourceWorkbench: WorkbenchPreview,
  promotionGate: PromotionGateResult,
): string[] {
  return unique([
    ...sourceWorkbench.blockers,
    ...promotionGate.decisionRecord.blockers,
    ...evidenceReadiness.flatMap((row) => row.missingEvidence),
    "Source runtime route remains unchanged; this is not a live sourcing event.",
    "Outcome Ledger write is preview-only; realized value is not claimed.",
  ]);
}

function buildRisksAndAssumptions(
  evidenceReadiness: EvidenceReadinessRow[],
  sourceWorkbench: WorkbenchPreview,
): string[] {
  return unique([
    ...sourceWorkbench.previewWarnings,
    ...evidenceReadiness
      .filter((row) => row.status !== "present")
      .map((row) => `${row.category}: ${row.missingEvidence.join("; ")}`),
    "All commercial figures come from synthetic candidate evidence and require Finance/Procurement validation before use in a real negotiation.",
    "Potential value and proposed commitment are allowed; measured, realized, and attested value are not claimed.",
  ]);
}

function buildGuardrails(): Guardrails {
  return {
    sourceRuntimeChanged: false,
    productionTenantDataWritten: false,
    physicalSourceTablesWritten: false,
    physicalOutcomeLedgerTablesWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    realizedValueClaimed: false,
    shadowProofOnly: true,
  };
}

async function writeArtifacts(
  outputDir: string,
  proof: SourceShadowProof,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "source-shadow-proof.json"),
    `${JSON.stringify(proof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "tower-handoff-preview.json"),
    `${JSON.stringify(proof.towerHandoffPreview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "module-memory-preview.json"),
    `${JSON.stringify({ proposedRecords: proof.proposedModuleMemory }, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "evidence-trace.json"),
    `${JSON.stringify({ evidenceTrace: proof.evidenceTrace }, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "source-shadow-proof-summary.md"),
    markdownSummary(proof),
  );
  await fs.writeFile(
    path.join(outputDir, "source-decision-brief.html"),
    htmlBrief(proof),
  );
}

function markdownSummary(proof: SourceShadowProof): string {
  const evidenceRows = proof.evidenceReadiness
    .map(
      (row) =>
        `| ${row.category} | ${row.status} | ${row.detail} | ${row.missingEvidence.join("; ") || "None"} |`,
    )
    .join("\n");
  const findingRows = proof.leverageFindings
    .map(
      (finding) =>
        `| ${finding.findingId} | ${finding.findingType} | ${finding.summary} | ${finding.confidence} |`,
    )
    .join("\n");

  return `# Source Shadow Proof

Tenant: \`${proof.tenantKey}\`
Candidate: \`${proof.candidateVersionId}\`
Generated: \`${proof.generatedAt}\`

${proof.proposedDecisionBrief.notLiveStatement}

## Readiness

- Status: ${proof.sourceOpportunityAssessment.readinessStatus}
- Candidate facts inspected: ${proof.sourceContext.canonicalRecordsInspected}
- Source workbench facts inspected: ${proof.sourceContext.sourceWorkbenchFactsInspected}
- Evidence trace rows: ${proof.validationSummary.evidenceTraceCount}
- Leverage findings: ${proof.validationSummary.leverageFindingCount}
- Proposed memory records: ${proof.validationSummary.proposedMemoryRecordCount}
- Guardrails held: ${proof.validationSummary.guardrailsHeld}

## Evidence Readiness

| Category | Status | Detail | Missing evidence |
| --- | --- | --- | --- |
${evidenceRows}

## Leverage Findings

| ID | Type | Summary | Confidence |
| --- | --- | --- | --- |
${findingRows}

## Tower Handoff

${proof.towerHandoffPreview.valueHypothesis}

Realized value claimed: ${proof.towerHandoffPreview.realizedValueClaimed}

## Guardrails

- Source runtime changed: ${proof.guardrails.sourceRuntimeChanged}
- Production tenant data written: ${proof.guardrails.productionTenantDataWritten}
- Physical Source tables written: ${proof.guardrails.physicalSourceTablesWritten}
- Physical Outcome Ledger tables written: ${proof.guardrails.physicalOutcomeLedgerTablesWritten}
- Active Tenant Access Layer updated: ${proof.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${proof.guardrails.candidatePromoted}
- Module runtime consumption changed: ${proof.guardrails.moduleRuntimeConsumptionChanged}
- Candidate read by default: ${proof.guardrails.candidateReadByDefault}
- Realized value claimed: ${proof.guardrails.realizedValueClaimed}
- Shadow proof only: ${proof.guardrails.shadowProofOnly}
`;
}

function htmlBrief(proof: SourceShadowProof): string {
  const evidenceCards = proof.evidenceReadiness
    .map(
      (row) => `<div class="card">
        <span class="eyebrow">${escapeHtml(row.status)}</span>
        <h3>${escapeHtml(row.category)}</h3>
        <p>${escapeHtml(row.detail)}</p>
      </div>`,
    )
    .join("");
  const findingRows = proof.leverageFindings
    .map(
      (finding) => `<tr>
        <td>${escapeHtml(finding.findingId)}</td>
        <td>${escapeHtml(finding.findingType)}</td>
        <td>${escapeHtml(finding.summary)}</td>
        <td>${escapeHtml(finding.proposedSourcingAction)}</td>
      </tr>`,
    )
    .join("");
  const riskItems = proof.riskAndAssumptions
    .map((risk) => `<li>${escapeHtml(risk)}</li>`)
    .join("");
  const actionItems = proof.proposedSourcingActions
    .map((action) => `<li>${escapeHtml(action)}</li>`)
    .join("");
  const traceRows = proof.evidenceTrace
    .filter((traceRow) => traceRow.safeForExecutiveBrief)
    .slice(0, 12)
    .map(
      (traceRow) => `<tr>
        <td>${escapeHtml(traceRow.claimId)}</td>
        <td>${escapeHtml(traceRow.claimText)}</td>
        <td>${escapeHtml(traceRow.sourceType)}</td>
        <td>${traceRow.evidenceRefs.map(escapeHtml).join("<br>")}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(proof.proposedDecisionBrief.title)}</title>
  <style>
    :root { --ink: #181817; --muted: #696760; --line: #dedbd4; --paper: #f8f7f3; --panel: #fff; --teal: #168f82; --navy: #071532; --amber: #b87512; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1400px; margin: 0 auto; padding: 36px 44px 56px; }
    .banner { background: var(--navy); color: #fff; border-radius: 8px; padding: 14px 18px; font-weight: 800; margin-bottom: 22px; }
    h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; letter-spacing: 0; }
    h1 { font-size: 44px; line-height: 1.05; margin: 0 0 12px; }
    h2 { font-size: 25px; margin: 0 0 14px; }
    h3 { margin: 8px 0; font-size: 20px; }
    .lede { color: var(--muted); font-size: 20px; max-width: 920px; margin: 0 0 24px; }
    .metrics, .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .metric, .card, section { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
    .metric { padding: 18px; }
    .metric span, .eyebrow { color: var(--teal); font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 7px; font-size: 27px; }
    section { padding: 22px; margin-top: 16px; }
    .card { padding: 18px; min-height: 150px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-top: 1px solid var(--line); padding: 11px 9px; text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
    li + li { margin-top: 8px; }
    code { font: 13px "SFMono-Regular", Consolas, monospace; }
    .note { color: var(--amber); font-weight: 800; }
    @media (max-width: 900px) { main { padding: 24px 18px 42px; } .metrics, .cards { grid-template-columns: 1fr; } h1 { font-size: 34px; } table { display: block; overflow-x: auto; } }
  </style>
</head>
<body>
  <main>
    <div class="banner">Shadow proof only - inactive candidate data. Not live. Not promoted. No realized value claimed.</div>
    <h1>${escapeHtml(proof.proposedDecisionBrief.title)}</h1>
    <p class="lede">${escapeHtml(proof.proposedDecisionBrief.opportunitySummary)}</p>
    <div class="metrics">
      <div class="metric"><span>Readiness</span><strong>${escapeHtml(proof.sourceOpportunityAssessment.readinessStatus)}</strong></div>
      <div class="metric"><span>Facts inspected</span><strong>${proof.sourceContext.canonicalRecordsInspected}</strong></div>
      <div class="metric"><span>Leverage findings</span><strong>${proof.leverageFindings.length}</strong></div>
      <div class="metric"><span>Realized value</span><strong>${proof.guardrails.realizedValueClaimed}</strong></div>
    </div>
    <section>
      <h2>Recommended Sourcing Path</h2>
      <p>${escapeHtml(proof.proposedDecisionBrief.recommendedPath)}</p>
      <p class="note">${escapeHtml(proof.proposedDecisionBrief.notLiveStatement)}</p>
    </section>
    <section>
      <h2>Evidence Readiness</h2>
      <div class="cards">${evidenceCards}</div>
    </section>
    <section>
      <h2>Vendor and Commercial Leverage</h2>
      <table><thead><tr><th>ID</th><th>Type</th><th>Finding</th><th>Proposed action</th></tr></thead><tbody>${findingRows}</tbody></table>
    </section>
    <section>
      <h2>Risks and Assumptions</h2>
      <ul>${riskItems}</ul>
    </section>
    <section>
      <h2>Proposed Source Actions</h2>
      <ul>${actionItems}</ul>
    </section>
    <section>
      <h2>Proposed Tower Handoff</h2>
      <p>${escapeHtml(proof.towerHandoffPreview.valueHypothesis)}</p>
      <p>Allowed states: potential value and proposed commitment only. Measured value, realized value, and attested realized value are false in this proof.</p>
    </section>
    <section>
      <h2>Evidence Trace</h2>
      <table><thead><tr><th>Claim</th><th>Text</th><th>Source type</th><th>Evidence</th></tr></thead><tbody>${traceRows}</tbody></table>
    </section>
  </main>
</body>
</html>
`;
}

function invoiceTotals(rows: InvoiceRow[]): {
  contracted: number;
  invoiced: number;
  variance: number;
} {
  const contracted = sum(rows.map((row) => row.contracted_amount_usd));
  const invoiced = sum(rows.map((row) => row.invoiced_amount_usd));
  return { contracted, invoiced, variance: invoiced - contracted };
}

function fact(
  factId: string,
  factType: string,
  statement: string,
  sourceObjectIds: string[],
  evidenceRefs: string[],
  confidence: number,
  safeForExecutiveBrief: boolean,
): VendorCommercialFact {
  return {
    factId,
    factType,
    statement,
    sourceObjectIds,
    evidenceRefs: unique(evidenceRefs),
    confidence,
    safeForExecutiveBrief,
  };
}

function finding(
  findingId: string,
  findingType: LeverageFindingType,
  summary: string,
  supportingCanonicalObjectIds: string[],
  supportingEvidenceRefs: string[],
  confidence: number,
  assumptions: string[],
  risk: string,
  proposedSourcingAction: string,
): LeverageFinding {
  return {
    findingId,
    findingType,
    summary,
    supportingCanonicalObjectIds,
    supportingEvidenceRefs: unique(supportingEvidenceRefs),
    confidence,
    assumptions,
    risk,
    proposedSourcingAction,
  };
}

function sourceDerived(stage: DerivedPlanStage) {
  return stage.derivedEntries.find((entry) =>
    entry.targetModules.includes("source"),
  );
}

function sourceGraph(stage: GraphPlanStage) {
  return stage.graphEntries.find((entry) =>
    entry.targetModules.includes("source"),
  );
}

function hasRateCard(agreementText: string): boolean {
  return agreementText.includes("Rate card excerpt");
}

function extractCurrencyAfter(text: string, regex: RegExp): number {
  const match = text.match(regex);
  return match ? Number(match[1].replaceAll(",", "")) : 0;
}

function refsFor(
  records: CanonicalRecord[],
  predicate: (record: CanonicalRecord) => boolean,
): string[] {
  return unique(
    records
      .filter(predicate)
      .flatMap((record) =>
        record.evidenceReferences.map((reference) => reference.evidenceKey),
      ),
  );
}

function countByStatus(
  rows: EvidenceReadinessRow[],
  status: EvidenceStatus,
): number {
  return rows.filter((row) => row.status === status).length;
}

function searchable(record: CanonicalRecord): string {
  return JSON.stringify(record).toLowerCase();
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseCsv(input: string): Record<string, string>[] {
  const rows = input.trim().split(/\r?\n/).map(parseCsvLine);
  const [header, ...data] = rows;
  return data.map((row) =>
    Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""])),
  );
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
