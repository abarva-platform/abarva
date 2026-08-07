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

export interface ContractOptimizationLedgerLine {
  readonly id: string;
  readonly kind: ContractOptimizationLedgerKind;
  readonly label: string;
  readonly amountUsd: number | null;
  readonly state: ContractOptimizationLedgerState;
  readonly evidence: string;
  readonly nextAction: string;
  readonly sourceRefs: readonly string[];
}

export interface ContractOptimizationLedgerSummary {
  readonly lines: readonly ContractOptimizationLedgerLine[];
  readonly quantifiedLeakageUsd: number;
  readonly realizedValueUsd: number;
  readonly evidenceReadyCount: number;
  readonly evidenceGapCount: number;
  readonly headline: string;
}

export function buildContractOptimizationLedger(input: {
  readonly view: Contract360View | null;
  readonly contract?: SourceContract360Row | null;
  readonly leverage: ContractLeverageEntry | null;
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
    },
    {
      id: 'recoverable:invoice-rate-card',
      kind: 'recoverable_leakage',
      label: 'Invoice, duplicate, off-contract, and rate-card variance',
      amountUsd: null,
      state: 'needs_evidence',
      evidence: 'Invoice-line, PO, rate-card, and active-contract matching rows are not part of this Contract 360 read yet.',
      nextAction: 'Load AP invoice lines, PO lines, rate-card schedule, and active contract periods for the selected contract.',
      sourceRefs: ['invoice_po_reconciliation', 'rate_card_schedule', 'contract_document_inventory'],
    },
    {
      id: 'avoided:renewal-uplift',
      kind: 'avoided_cost',
      label: 'Renewal uplift avoided / shelfware removed / scope rationalized',
      amountUsd: null,
      state: annualVariance != null ? 'workflow_required' : 'needs_evidence',
      evidence:
        annualVariance != null
          ? `Contracted-to-actual annual variance is visible (${formatUsd(annualVariance)}), but cause is not classified as value.`
          : 'No annual-value versus actual-spend comparison is available for this contract.',
      nextAction: 'Classify the variance with usage, entitlement, renewal quote, and scope evidence before treating any amount as avoided cost.',
      sourceRefs: ['source.contract_360.annual_value', 'source.contract_360.actual_annual_spend'],
    },
    {
      id: 'negotiated:commercial-levers',
      kind: 'negotiated_improvement',
      label: 'Price, term, index cap, volume tier, and termination leverage',
      amountUsd: null,
      state: hasNegotiationEvidence ? 'workflow_required' : 'needs_evidence',
      evidence:
        hasNegotiationEvidence
          ? `${weakLeverageCount} weak leverage signal(s) and commercial term fields are visible, but no signed concession exists yet.`
          : 'No benchmark, alternatives, renewal owner, or negotiation concession evidence is established.',
      nextAction: 'Run Door 1 to convert leverage signals into an evidence-backed negotiation plan and executive approval packet.',
      sourceRefs: ['source.contract_360.benchmarking_clause', 'source.contract_360.alternatives_available', 'computeContractLeverageSignals(source.contract_360)'],
    },
    {
      id: 'realized:tower-finance-proof',
      kind: 'realized_value',
      label: 'Finance-confirmed realized value',
      amountUsd: realizedValueUsd > 0 ? realizedValueUsd : null,
      state: realizedValueUsd > 0 ? 'quantified' : 'not_established',
      evidence:
        realizedValueUsd > 0
          ? 'tower.value_claim has accepted claim rows with calculated_value for this contract/vendor/application scope.'
          : 'Tower has not cleared a finance-confirmed claimable value row for this contract context.',
      nextAction:
        realizedValueUsd > 0
          ? 'Review Tower provenance before using the amount externally.'
          : 'After agreement, register measurement owner, cadence, baseline, actuals, and finance attestation in Tower.',
      sourceRefs: ['tower.value_claim.claim_state', 'tower.value_claim.calculated_value'],
    },
  ];

  const quantifiedLeakageUsd = sum(
    lines
      .filter((line) => line.kind === 'recoverable_leakage' && line.state === 'quantified')
      .map((line) => finiteOrZero(line.amountUsd)),
  );
  const evidenceReadyCount = lines.filter((line) => line.state === 'quantified' || line.state === 'workflow_required').length;
  const evidenceGapCount = lines.filter((line) => line.state === 'needs_evidence').length;

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
  };
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
