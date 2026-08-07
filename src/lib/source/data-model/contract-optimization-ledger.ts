import type { Contract360View } from './contract-360-view';
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
  readonly datasetVersion?: string;
  readonly door1EventId?: string | null;
}): ContractOptimizationLedgerSummary {
  const { view, leverage } = input;
  const c = view?.contract ?? input.contract ?? null;
  const perf = view?.operationalPerformance ?? null;
  const fin = view?.financialExposure ?? null;

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
      amountUsd: unclaimedCredits != null && unclaimedCredits > 0 ? unclaimedCredits : null,
      state:
        unclaimedCredits != null && unclaimedCredits > 0
          ? 'quantified'
          : serviceCreditsEarned != null
            ? 'not_established'
            : 'needs_evidence',
      evidenceClass: serviceCreditsEarned != null ? 'system_evidenced' : 'missing',
      evidence:
        unclaimedCredits != null && unclaimedCredits > 0
          ? 'source.contract_operational_performance carries service_credits_earned and service_credits_claimed.'
          : serviceCreditsEarned != null
            ? 'The operational row is present, but it does not show earned credits above claimed credits.'
            : 'Load or map SLA credit history before claiming credit leakage.',
      nextAction:
        unclaimedCredits != null && unclaimedCredits > 0
          ? 'Validate credit entitlement with Legal / Vendor Management and add recovery owner.'
          : 'Request the SLA credit register and monthly service-credit claim log.',
      sourceRefs: ['source.contract_operational_performance.service_credits_earned', 'source.contract_operational_performance.service_credits_claimed'],
      lineageFields: serviceCreditsEarned != null ? SYSTEM_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS,
    },
    {
      id: 'recoverable:invoice-rate-card',
      kind: 'recoverable_leakage',
      label: 'Invoice, duplicate, off-contract, and rate-card variance',
      amountUsd: null,
      state: 'needs_evidence',
      evidenceClass: 'missing',
      evidence: 'Invoice-line, PO, rate-card, and active-contract matching rows are not part of this Contract 360 read yet.',
      nextAction: 'Load AP invoice lines, PO lines, rate-card schedule, and active contract periods for the selected contract.',
      sourceRefs: ['invoice_po_reconciliation', 'rate_card_schedule', 'contract_document_inventory'],
      lineageFields: MISSING_LINEAGE_FIELDS,
    },
    {
      id: 'avoided:renewal-uplift',
      kind: 'avoided_cost',
      label: 'Renewal uplift avoided / shelfware removed / scope rationalized',
      amountUsd: null,
      state: annualVariance != null ? 'workflow_required' : 'needs_evidence',
      evidenceClass: annualVariance != null ? 'inferred' : 'missing',
      evidence:
        annualVariance != null
          ? `Contracted-to-actual annual variance is visible (${formatUsd(annualVariance)}), but cause is not classified as value.`
          : 'No annual-value versus actual-spend comparison is available for this contract.',
      nextAction: 'Classify the variance with usage, entitlement, renewal quote, and scope evidence before treating any amount as avoided cost.',
      sourceRefs: ['source.contract_360.annual_value', 'source.contract_360.actual_annual_spend'],
      lineageFields: annualVariance != null ? INFERRED_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS,
    },
    {
      id: 'negotiated:commercial-levers',
      kind: 'negotiated_improvement',
      label: 'Price, term, index cap, volume tier, and termination leverage',
      amountUsd: null,
      state: hasNegotiationEvidence ? 'workflow_required' : 'needs_evidence',
      evidenceClass: hasNegotiationEvidence ? 'document_evidenced' : 'missing',
      evidence:
        hasNegotiationEvidence
          ? `${weakLeverageCount} weak leverage signal(s) and commercial term fields are visible, but no signed concession exists yet.`
          : 'No benchmark, alternatives, renewal owner, or negotiation concession evidence is established.',
      nextAction: 'Run Door 1 to convert leverage signals into an evidence-backed negotiation plan and executive approval packet.',
      sourceRefs: ['source.contract_360.benchmarking_clause', 'source.contract_360.alternatives_available', 'computeContractLeverageSignals(source.contract_360)'],
      lineageFields: hasNegotiationEvidence ? DOCUMENT_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS,
    },
    {
      id: 'realized:tower-finance-proof',
      kind: 'realized_value',
      label: 'Finance-confirmed realized value',
      amountUsd: realizedValueUsd > 0 ? realizedValueUsd : null,
      state: realizedValueUsd > 0 ? 'quantified' : 'not_established',
      evidenceClass: realizedValueUsd > 0 ? 'human_validated' : 'missing',
      evidence:
        realizedValueUsd > 0
          ? 'tower.value_claim has accepted claim rows with calculated_value for this contract/vendor/application scope.'
          : 'Tower has not cleared a finance-confirmed claimable value row for this contract context.',
      nextAction:
        realizedValueUsd > 0
          ? 'Review Tower provenance before using the amount externally.'
          : 'After agreement, register measurement owner, cadence, baseline, actuals, and finance attestation in Tower.',
      sourceRefs: ['tower.value_claim.claim_state', 'tower.value_claim.calculated_value'],
      lineageFields: realizedValueUsd > 0 ? HUMAN_VALIDATION_LINEAGE_FIELDS : MISSING_LINEAGE_FIELDS,
    },
  ];

  const quantifiedLeakageUsd = sum(
    lines
      .filter((line) => line.kind === 'recoverable_leakage' && line.state === 'quantified')
      .map((line) => finiteOrZero(line.amountUsd)),
  );
  const evidenceReadyCount = lines.filter((line) => line.state === 'quantified' || line.state === 'workflow_required').length;
  const evidenceGapCount = lines.filter(isEvidenceGap).length;

  return {
    lines,
    quantifiedLeakageUsd,
    realizedValueUsd,
    evidenceReadyCount,
    evidenceGapCount,
    headline:
      quantifiedLeakageUsd > 0
        ? `${formatUsd(quantifiedLeakageUsd)} recoverable leakage is visible before Door 1 approval.`
        : 'No recoverable leakage is quantified yet; Door 1 must collect the missing evidence before sizing value.',
    decisionRecord: buildDecisionRecord({
      c,
      lines,
      quantifiedLeakageUsd,
      realizedValueUsd,
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
    avoided_cost: null,
    negotiated_improvement: null,
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
