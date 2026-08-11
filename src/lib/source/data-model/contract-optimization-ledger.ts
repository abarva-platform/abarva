import type { Contract360View } from './contract-360-view';
import {
  evidenceItemsById,
  type ContractOptimizationEvidenceItem,
  type ContractOptimizationEvidencePack,
} from './contract-optimization-evidence';
import type { SourceContract360Row } from './types';
import type { ContractLeverageEntry } from './vendor-contract-portfolio';

export type ContractOptimizationLedgerKind =
  | 'recoverable_leakage'
  | 'avoided_cost'
  | 'negotiated_improvement'
  | 'realized_value';

export type ContractOptimizationLedgerState =
  | 'quantified'
  | 'needs_evidence'
  | 'workflow_required'
  | 'not_established';

export type ContractOptimizationEvidenceStatus =
  | 'EVIDENCE_AVAILABLE'
  | 'EVIDENCE_MISSING'
  | 'WORKFLOW_REQUIRED'
  | 'NOT_ESTABLISHED';

export type ContractOptimizationEvidenceClass =
  | 'system_evidenced'
  | 'document_evidenced'
  | 'human_validated'
  | 'inferred'
  | 'missing';

export type ContractOptimizationState =
  | 'EVIDENCE_MISSING'
  | 'WORKFLOW_REQUIRED'
  | 'READY_FOR_REVIEW'
  | 'VALUE_CONFIRMED';

export interface ContractOptimizationLedgerLine {
  readonly id: string;
  readonly kind: ContractOptimizationLedgerKind;
  readonly label: string;
  readonly amountUsd: number | null;
  readonly state: ContractOptimizationLedgerState;
  readonly evidenceClass: ContractOptimizationEvidenceClass;
  readonly evidence: string;
  readonly nextAction: string;
  readonly sourceRefs: readonly string[];
  readonly lineageFields: readonly string[];
}

export interface ContractOptimizationLedgerSummary {
  readonly lines: readonly ContractOptimizationLedgerLine[];
  readonly quantifiedLeakageUsd: number;
  readonly avoidedCostUsd: number;
  readonly negotiatedImprovementUsd: number;
  readonly realizedValueUsd: number;
  readonly evidenceReadyCount: number;
  readonly evidenceGapCount: number;
  readonly headline: string;
  readonly decisionRecord: ContractOptimizationDecisionRecord;
}

export interface ContractOptimizationDecisionRecord {
  readonly tenant_key: string | null;
  readonly dataset_version: string;
  readonly contract_id: string | null;
  readonly vendor_id: string | null;
  readonly optimization_state: ContractOptimizationState;
  readonly recoverable_leakage: number | null;
  readonly avoided_cost: number | null;
  readonly negotiated_improvement: number | null;
  readonly realized_value: number | null;
  readonly evidence_status: Readonly<Record<ContractOptimizationLedgerKind, ContractOptimizationEvidenceStatus>>;
  readonly evidence_classes: readonly ContractOptimizationDecisionEvidence[];
  readonly evidence_refs: readonly string[];
  readonly confidence: number | null;
  readonly owner: string | null;
  readonly next_action: string;
  readonly door1_event_id: string | null;
  readonly tower_claim_refs: readonly string[];
}

export interface ContractOptimizationDecisionEvidence {
  readonly ledger_line_id: string;
  readonly kind: ContractOptimizationLedgerKind;
  readonly evidence_class: ContractOptimizationEvidenceClass;
  readonly source_refs: readonly string[];
  readonly lineage_fields: readonly string[];
}

const SYSTEM_LINEAGE_FIELDS = [
  'source_system',
  'source_record_id',
  'source_file/report',
  'extract_timestamp',
  'effective_date',
  'calculation_rule',
  'confidence',
  'review_state',
] as const;

const DOCUMENT_LINEAGE_FIELDS = [
  'source_system',
  'document_id',
  'source_file/report',
  'page/span',
  'effective_date',
  'calculation_rule',
  'confidence',
  'review_state',
] as const;

const HUMAN_VALIDATION_LINEAGE_FIELDS = [
  'source_system',
  'source_record_id',
  'source_file/report',
  'extract_timestamp',
  'effective_date',
  'calculation_rule',
  'confidence',
  'review_state',
  'approver_role',
] as const;

const INFERRED_LINEAGE_FIELDS = [
  'source_system',
  'source_record_id',
  'source_file/report',
  'extract_timestamp',
  'effective_date',
  'inference_rule',
  'confidence',
  'review_state',
] as const;

const MISSING_LINEAGE_FIELDS = [
  'source_system',
  'source_record_id',
  'source_file/report',
  'extract_timestamp',
  'effective_date',
  'document_id',
  'page/span',
  'calculation_rule',
  'confidence',
  'review_state',
] as const;

export function buildContractOptimizationLedger(input: {
  readonly view: Contract360View | null;
  readonly contract?: SourceContract360Row | null;
  readonly leverage: ContractLeverageEntry | null;
  readonly optimizationEvidence?: ContractOptimizationEvidencePack | null;
  readonly datasetVersion?: string;
  readonly door1EventId?: string | null;
}): ContractOptimizationLedgerSummary {
  const { view, leverage } = input;
  const c = view?.contract ?? input.contract ?? null;
  const perf = view?.operationalPerformance ?? null;
  const fin = view?.financialExposure ?? null;
  const evidenceById = evidenceItemsById(input.optimizationEvidence ?? view?.optimizationEvidence);
  const slaEvidence = evidenceById.get('recoverable:sla-credit-gap') ?? null;
  const invoiceRateEvidence = evidenceById.get('recoverable:invoice-rate-card') ?? null;
  const avoidedEvidence = evidenceById.get('avoided:renewal-uplift') ?? null;
  const negotiatedEvidence = evidenceById.get('negotiated:commercial-levers') ?? null;
  const realizedEvidence = evidenceById.get('realized:tower-finance-proof') ?? null;

  const serviceCreditsEarned = finiteOrNull(perf?.service_credits_earned);
  const serviceCreditsClaimed = finiteOrNull(perf?.service_credits_claimed);
  const unclaimedCredits =
    serviceCreditsEarned == null
      ? null
      : Math.max(0, serviceCreditsEarned - (serviceCreditsClaimed ?? 0));

  const realizedValueUsd = sum(
    (view?.towerValueClaims ?? [])
      .filter((claim) => isClaimableState(claim.claim_state))
      .map((claim) => finiteOrZero(claim.calculated_value)),
  );
  const realizedEvidenceUsd = finiteOrNull(realizedEvidence?.amount);
  const governedRealizedValueUsd =
    realizedEvidenceUsd != null && isRealizedEvidence(realizedEvidence)
      ? realizedEvidenceUsd
      : realizedValueUsd;

  const actualSpend = finiteOrNull(fin?.actual_annual_spend ?? c?.actual_annual_spend);
  const annualValue = finiteOrNull(fin?.contracted_annual_value ?? c?.annual_value);
  const annualVariance =
    actualSpend != null && annualValue != null ? annualValue - actualSpend : null;

  const weakLeverageCount = leverage?.weakSignalCount ?? 0;
  const hasNegotiationEvidence =
    Boolean(c?.benchmarking_clause) || Boolean(c?.alternatives_available) || weakLeverageCount > 0;

  const lines: ContractOptimizationLedgerLine[] = [
    {
      id: 'recoverable:sla-credit-gap',
      kind: 'recoverable_leakage',
      label: 'SLA credits earned but not claimed',
      amountUsd: evidenceAmountOrNull(slaEvidence) ?? (unclaimedCredits != null && unclaimedCredits > 0 ? unclaimedCredits : null),
      state: evidenceState(slaEvidence) ??
        (unclaimedCredits != null && unclaimedCredits > 0
          ? 'quantified'
          : serviceCreditsEarned != null
            ? 'not_established'
            : 'needs_evidence'),
      evidenceClass: evidenceClass(slaEvidence) ?? (serviceCreditsEarned != null ? 'system_evidenced' : 'missing'),
      evidence: evidenceNarrative(slaEvidence) ??
        (unclaimedCredits != null && unclaimedCredits > 0
          ? 'source.contract_operational_performance carries service_credits_earned and service_credits_claimed.'
          : serviceCreditsEarned != null
            ? 'The operational row is present, but it does not show earned credits above claimed credits.'
            : 'Load or map SLA credit history before claiming credit leakage.'),
      nextAction: evidenceNextAction(slaEvidence) ??
        (unclaimedCredits != null && unclaimedCredits > 0
          ? 'Validate credit entitlement with Legal / Vendor Management and add recovery owner.'
          : 'Request the SLA credit register and monthly service-credit claim log.'),
      sourceRefs: evidenceRefs(slaEvidence, ['source.contract_operational_performance.service_credits_earned', 'source.contract_operational_performance.service_credits_claimed']),
      lineageFields: lineageFieldsFor(slaEvidence, serviceCreditsEarned != null ? SYSTEM_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS),
    },
    {
      id: 'recoverable:invoice-rate-card',
      kind: 'recoverable_leakage',
      label: 'Invoice, duplicate, off-contract, and rate-card variance',
      amountUsd: evidenceAmountOrNull(invoiceRateEvidence),
      state: evidenceState(invoiceRateEvidence) ?? 'needs_evidence',
      evidenceClass: evidenceClass(invoiceRateEvidence) ?? 'missing',
      evidence: evidenceNarrative(invoiceRateEvidence) ?? 'Invoice-line, PO, rate-card, and active-contract matching rows are not part of this Contract 360 read yet.',
      nextAction: evidenceNextAction(invoiceRateEvidence) ?? 'Load AP invoice lines, PO lines, rate-card schedule, and active contract periods for the selected contract.',
      sourceRefs: evidenceRefs(invoiceRateEvidence, ['invoice_po_reconciliation', 'rate_card_schedule', 'contract_document_inventory']),
      lineageFields: lineageFieldsFor(invoiceRateEvidence, MISSING_LINEAGE_FIELDS),
    },
    {
      id: 'avoided:renewal-uplift',
      kind: 'avoided_cost',
      label: 'Renewal uplift avoided / shelfware removed / scope rationalized',
      amountUsd: evidenceAmountOrNull(avoidedEvidence),
      state: evidenceState(avoidedEvidence) ?? (annualVariance != null ? 'workflow_required' : 'needs_evidence'),
      evidenceClass: evidenceClass(avoidedEvidence) ?? (annualVariance != null ? 'inferred' : 'missing'),
      evidence: evidenceNarrative(avoidedEvidence) ??
        (annualVariance != null
          ? `Contracted-to-actual annual variance is visible (${formatUsd(annualVariance)}), but cause is not classified as value.`
          : 'No annual-value versus actual-spend comparison is available for this contract.'),
      nextAction: evidenceNextAction(avoidedEvidence) ?? 'Classify the variance with usage, entitlement, renewal quote, and scope evidence before treating any amount as avoided cost.',
      sourceRefs: evidenceRefs(avoidedEvidence, ['source.contract_360.annual_value', 'source.contract_360.actual_annual_spend']),
      lineageFields: lineageFieldsFor(avoidedEvidence, annualVariance != null ? INFERRED_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS),
    },
    {
      id: 'negotiated:commercial-levers',
      kind: 'negotiated_improvement',
      label: 'Price, term, index cap, volume tier, and termination leverage',
      amountUsd: evidenceAmountOrNull(negotiatedEvidence),
      state: evidenceState(negotiatedEvidence) ?? (hasNegotiationEvidence ? 'workflow_required' : 'needs_evidence'),
      evidenceClass: evidenceClass(negotiatedEvidence) ?? (hasNegotiationEvidence ? 'document_evidenced' : 'missing'),
      evidence: evidenceNarrative(negotiatedEvidence) ??
        (hasNegotiationEvidence
          ? `${weakLeverageCount} weak leverage signal(s) and commercial term fields are visible, but no signed concession exists yet.`
          : 'No benchmark, alternatives, renewal owner, or negotiation concession evidence is established.'),
      nextAction: evidenceNextAction(negotiatedEvidence) ?? 'Start contract optimization to convert leverage signals into an evidence-backed negotiation plan and executive approval packet.',
      sourceRefs: evidenceRefs(negotiatedEvidence, ['source.contract_360.benchmarking_clause', 'source.contract_360.alternatives_available', 'computeContractLeverageSignals(source.contract_360)']),
      lineageFields: lineageFieldsFor(negotiatedEvidence, hasNegotiationEvidence ? DOCUMENT_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS),
    },
    {
      id: 'realized:tower-finance-proof',
      kind: 'realized_value',
      label: 'Finance-confirmed realized value',
      amountUsd: governedRealizedValueUsd > 0 ? governedRealizedValueUsd : null,
      state: evidenceState(realizedEvidence) ?? (governedRealizedValueUsd > 0 ? 'quantified' : 'not_established'),
      evidenceClass: evidenceClass(realizedEvidence) ?? (governedRealizedValueUsd > 0 ? 'human_validated' : 'missing'),
      evidence: evidenceNarrative(realizedEvidence) ??
        (governedRealizedValueUsd > 0
          ? 'tower.value_claim has accepted claim rows with calculated_value for this contract/vendor/application scope.'
          : 'Tower has not cleared a finance-confirmed claimable value row for this contract context.'),
      nextAction: evidenceNextAction(realizedEvidence) ??
        (governedRealizedValueUsd > 0
          ? 'Review Tower provenance before using the amount externally.'
          : 'After agreement, register measurement owner, cadence, baseline, actuals, and finance attestation in Tower.'),
      sourceRefs: evidenceRefs(realizedEvidence, ['tower.value_claim.claim_state', 'tower.value_claim.calculated_value']),
      lineageFields: lineageFieldsFor(realizedEvidence, governedRealizedValueUsd > 0 ? HUMAN_VALIDATION_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS),
    },
  ];

  const quantifiedLeakageUsd = sum(
    lines
      .filter((line) => line.kind === 'recoverable_leakage' && line.state === 'quantified')
      .map((line) => finiteOrZero(line.amountUsd)),
  );
  const avoidedCostUsd = sum(
    lines
      .filter((line) => line.kind === 'avoided_cost' && line.amountUsd != null && line.evidenceClass !== 'missing')
      .map((line) => finiteOrZero(line.amountUsd)),
  );
  const negotiatedImprovementUsd = sum(
    lines
      .filter((line) => line.kind === 'negotiated_improvement' && line.amountUsd != null && line.evidenceClass !== 'missing')
      .map((line) => finiteOrZero(line.amountUsd)),
  );
  const evidenceReadyCount = lines.filter((line) => line.state === 'quantified' || line.state === 'workflow_required').length;
  const evidenceGapCount = lines.filter(isEvidenceGap).length;

  return {
    lines,
    quantifiedLeakageUsd,
    avoidedCostUsd,
    negotiatedImprovementUsd,
    realizedValueUsd: governedRealizedValueUsd,
    evidenceReadyCount,
    evidenceGapCount,
    headline:
      quantifiedLeakageUsd > 0
        ? `${formatUsd(quantifiedLeakageUsd)} recoverable opportunity is visible before approval.`
        : 'No recoverable opportunity is quantified yet; contract optimization must collect the missing evidence before sizing value.',
    decisionRecord: buildDecisionRecord({
      c,
      lines,
      quantifiedLeakageUsd,
      avoidedCostUsd,
      negotiatedImprovementUsd,
      realizedValueUsd: governedRealizedValueUsd,
      datasetVersion: input.datasetVersion ?? 'unknown',
      door1EventId: input.door1EventId ?? null,
      towerClaimRefs: view?.towerValueClaims.map((claim) => claim.claim_id) ?? [],
    }),
  };
}

function buildDecisionRecord(input: {
  readonly c: SourceContract360Row | null;
  readonly lines: readonly ContractOptimizationLedgerLine[];
  readonly quantifiedLeakageUsd: number;
  readonly avoidedCostUsd: number;
  readonly negotiatedImprovementUsd: number;
  readonly realizedValueUsd: number;
  readonly datasetVersion: string;
  readonly door1EventId: string | null;
  readonly towerClaimRefs: readonly string[];
}): ContractOptimizationDecisionRecord {
  const statusByKind = ledgerEvidenceStatus(input.lines);
  const next = input.lines.find((line) => line.state === 'needs_evidence') ?? input.lines.find((line) => line.state === 'workflow_required') ?? input.lines[0];
  return {
    tenant_key: input.c?.tenant_key ?? null,
    dataset_version: input.datasetVersion,
    contract_id: input.c?.contract_id ?? null,
    vendor_id: input.c?.vendor_ref ?? null,
    optimization_state: optimizationState(input.lines, input.realizedValueUsd),
    recoverable_leakage: input.quantifiedLeakageUsd > 0 ? input.quantifiedLeakageUsd : null,
    avoided_cost: input.avoidedCostUsd > 0 ? input.avoidedCostUsd : null,
    negotiated_improvement: input.negotiatedImprovementUsd > 0 ? input.negotiatedImprovementUsd : null,
    realized_value: input.realizedValueUsd > 0 ? input.realizedValueUsd : null,
    evidence_status: statusByKind,
    evidence_classes: input.lines.map((line) => ({
      ledger_line_id: line.id,
      kind: line.kind,
      evidence_class: line.evidenceClass,
      source_refs: line.sourceRefs,
      lineage_fields: line.lineageFields,
    })),
    evidence_refs: Array.from(new Set(input.lines.flatMap((line) => line.sourceRefs))),
    confidence: finiteOrNull(input.c?.source_confidence),
    owner: input.c?.renewal_owner_ref ?? null,
    next_action: next?.nextAction ?? 'Collect governed evidence before opening the optimization decision.',
    door1_event_id: input.door1EventId,
    tower_claim_refs: input.towerClaimRefs,
  };
}

function ledgerEvidenceStatus(
  lines: readonly ContractOptimizationLedgerLine[],
): Readonly<Record<ContractOptimizationLedgerKind, ContractOptimizationEvidenceStatus>> {
  return {
    recoverable_leakage: evidenceStatusForKind(lines, 'recoverable_leakage'),
    avoided_cost: evidenceStatusForKind(lines, 'avoided_cost'),
    negotiated_improvement: evidenceStatusForKind(lines, 'negotiated_improvement'),
    realized_value: evidenceStatusForKind(lines, 'realized_value'),
  };
}

function evidenceStatusForKind(
  lines: readonly ContractOptimizationLedgerLine[],
  kind: ContractOptimizationLedgerKind,
): ContractOptimizationEvidenceStatus {
  const kindLines = lines.filter((line) => line.kind === kind);
  if (kindLines.some((line) => line.state === 'quantified')) return 'EVIDENCE_AVAILABLE';
  if (kindLines.some((line) => line.state === 'workflow_required')) return 'WORKFLOW_REQUIRED';
  if (kindLines.some((line) => line.state === 'needs_evidence')) return 'EVIDENCE_MISSING';
  return 'NOT_ESTABLISHED';
}

function optimizationState(
  lines: readonly ContractOptimizationLedgerLine[],
  realizedValueUsd: number,
): ContractOptimizationState {
  if (realizedValueUsd > 0) return 'VALUE_CONFIRMED';
  if (lines.some((line) => line.state === 'needs_evidence')) return 'EVIDENCE_MISSING';
  if (lines.some((line) => line.state === 'workflow_required')) return 'WORKFLOW_REQUIRED';
  return 'READY_FOR_REVIEW';
}

function isEvidenceGap(line: ContractOptimizationLedgerLine): boolean {
  return line.evidenceClass === 'missing';
}

function isClaimableState(value: string | null | undefined): boolean {
  return /^(accepted|claimable|finance_validated|realized|realised)$/i.test(value ?? '');
}

function evidenceAmountOrNull(
  item: ContractOptimizationEvidenceItem | null,
): number | null {
  const amount = finiteOrNull(item?.amount);
  if (amount == null || amount <= 0) return null;
  if (item?.amount_state === 'not_quantified' || item?.amount_state === 'not_established') {
    return null;
  }
  return amount;
}

function evidenceState(
  item: ContractOptimizationEvidenceItem | null,
): ContractOptimizationLedgerState | null {
  if (!item) return null;
  if (item.evidence_class === 'missing' || item.amount_state === 'not_quantified') {
    return item.ledger_type === 'realized_value' ? 'not_established' : 'needs_evidence';
  }
  if (item.amount_state === 'workflow_required' || item.amount_state === 'addressable_exposure') {
    return 'workflow_required';
  }
  if (item.amount_state === 'quantified' || item.amount_state === 'finance_validated') {
    return 'quantified';
  }
  if (item.amount_state === 'not_established') return 'not_established';
  return null;
}

function evidenceClass(
  item: ContractOptimizationEvidenceItem | null,
): ContractOptimizationEvidenceClass | null {
  return item?.evidence_class ?? null;
}

function evidenceNarrative(item: ContractOptimizationEvidenceItem | null): string | null {
  if (!item) return null;
  const basis = item.calculation_rule?.trim();
  const systems = item.source_systems.length > 0 ? ` Evidence comes from ${item.source_systems.join(', ')}.` : '';
  if (!basis && !systems) return null;
  return `${basis ?? 'Governed evidence is present for this ledger item.'}${systems}`;
}

function evidenceNextAction(item: ContractOptimizationEvidenceItem | null): string | null {
  if (!item) return null;
  if (item.decision_state === 'finance_accepted') {
    return 'Use the finance-attested value in Tower and retain the source evidence chain for audit.';
  }
  if (item.decision_state === 'executed') {
    return 'Confirm the executed commercial change is reflected in invoices and Tower measurement.';
  }
  if (item.decision_state === 'approved') {
    return 'Move the approved position into agreement execution and measurement setup.';
  }
  if (item.decision_state === 'workflow_required') {
    return 'Start contract optimization to convert the evidenced exposure into an approved negotiation or value action.';
  }
  if (item.decision_state === 'candidate') {
    return 'Review the evidence with Procurement, Legal, Finance, and the service owner before external use.';
  }
  return null;
}

function evidenceRefs(
  item: ContractOptimizationEvidenceItem | null,
  fallback: readonly string[],
): readonly string[] {
  if (!item) return fallback;
  return Array.from(
    new Set([
      ...item.evidence_refs,
      ...item.source_systems.map((system) => `source_system:${system}`),
      ...item.source_record_ids.map((id) => `source_record:${id}`),
      ...item.document_refs.map((id) => `document:${id}`),
      ...item.page_spans.map((span) => `page_span:${span}`),
      ...(item.tower_claim_id ? [`tower_claim:${item.tower_claim_id}`] : []),
    ]),
  );
}

function lineageFieldsFor(
  item: ContractOptimizationEvidenceItem | null,
  fallback: readonly string[],
): readonly string[] {
  if (!item) return fallback;
  if (item.evidence_class === 'human_validated') return HUMAN_VALIDATION_LINEAGE_FIELDS;
  if (item.evidence_class === 'document_evidenced') return DOCUMENT_LINEAGE_FIELDS;
  if (item.evidence_class === 'inferred') return INFERRED_LINEAGE_FIELDS;
  if (item.evidence_class === 'system_evidenced') return SYSTEM_LINEAGE_FIELDS;
  return MISSING_LINEAGE_FIELDS;
}

function isRealizedEvidence(item: ContractOptimizationEvidenceItem | null): boolean {
  return item?.ledger_type === 'realized_value' && item.amount_state === 'finance_validated';
}

function finiteOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function finiteOrZero(value: unknown): number {
  return finiteOrNull(value) ?? 0;
}

function sum(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}
