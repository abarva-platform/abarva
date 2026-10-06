import type {
  ContractOptimizationOpportunity,
  ContractOptimizationOpportunitySet,
  OptimizationOpportunityStage,
} from "./contract-optimization-opportunity";
import type { ContractOptimizationEvidenceReadiness } from "./contract-optimization-evidence-readiness";
import type { OpportunityTraceabilitySummary } from "./contract-optimization-traceability";

export type OptimizeStepKey =
  | "select"
  | "lock_baseline"
  | "evidence"
  | "diagnose"
  | "plan"
  | "approve"
  | "prove_value";

export type OptimizeStepState = "complete" | "current" | "blocked" | "future";

export interface OptimizeWorkflowStep {
  readonly key: OptimizeStepKey;
  readonly index: number;
  readonly label: string;
  readonly state: OptimizeStepState;
}

export interface OptimizeWorkflowPosition {
  readonly steps: readonly OptimizeWorkflowStep[];
  readonly currentKey: OptimizeStepKey;
  readonly currentIndex: number;
  readonly currentLabel: string;
  /** The single action to take next. Never empty. */
  readonly primaryAction: string;
  readonly primaryActionDetail: string;
  /** What is stopping the current step, or null when it is simply the next work. */
  readonly blocker: string | null;
  /** True once every step before "prove value" is satisfied. */
  readonly readyForApproval: boolean;
}

const STEP_LABELS: Record<OptimizeStepKey, string> = {
  select: "Select contract",
  lock_baseline: "Lock baseline",
  evidence: "Read evidence",
  diagnose: "Diagnose opportunity",
  plan: "Build strategy",
  approve: "Approve and execute",
  prove_value: "Prove value",
};

const STEP_ORDER: readonly OptimizeStepKey[] = [
  "select",
  "lock_baseline",
  "evidence",
  "diagnose",
  "plan",
  "approve",
  "prove_value",
];

/**
 * Governed opportunity maturity, weakest first. A step is satisfied when at
 * least one opportunity has reached the stage that step represents.
 */
const STAGE_RANK: Record<OptimizationOpportunityStage, number> = {
  baseline_conflict: 0,
  evidence_required: 0,
  workflow_required: 0,
  signal: 1,
  quantified: 2,
  validated: 3,
  approval_required: 4,
  target_position: 5,
  agreed: 6,
  finance_confirmed: 7,
};

/**
 * Work out where an optimization case actually stands, and the one thing to do
 * next.
 *
 * Position is derived from governed state — contract selection, baseline status,
 * required-evidence readiness, amount traceability, and opportunity maturity —
 * never from a hardcoded index or from the contract's identity. A step is
 * `complete` only when its own gate is satisfied, so a case cannot appear to have
 * advanced past work it has not done.
 */
export function deriveOptimizeWorkflowPosition(input: {
  readonly hasSelectedContract: boolean;
  readonly opportunitySet: ContractOptimizationOpportunitySet | null;
  readonly readiness: ContractOptimizationEvidenceReadiness;
  readonly traceability: OpportunityTraceabilitySummary;
}): OptimizeWorkflowPosition {
  const gates = evaluateGates(input);
  const currentIndex = gates.findIndex((gate) => !gate.satisfied);
  const resolvedIndex = currentIndex === -1 ? STEP_ORDER.length - 1 : currentIndex;
  const currentGate = gates[resolvedIndex];

  const steps = STEP_ORDER.map((key, index) => ({
    key,
    index: index + 1,
    label: STEP_LABELS[key],
    state: stateFor(index, resolvedIndex, gates[index].satisfied, currentGate.blocker),
  }));

  return {
    steps,
    currentKey: STEP_ORDER[resolvedIndex],
    currentIndex: resolvedIndex + 1,
    currentLabel: STEP_LABELS[STEP_ORDER[resolvedIndex]],
    primaryAction: currentGate.primaryAction,
    primaryActionDetail: currentGate.primaryActionDetail,
    blocker: currentGate.blocker,
    readyForApproval:
      gates
        .slice(0, STEP_ORDER.indexOf("approve"))
        .every((gate) => gate.satisfied) === true,
  };
}

interface StepGate {
  readonly satisfied: boolean;
  readonly primaryAction: string;
  readonly primaryActionDetail: string;
  readonly blocker: string | null;
}

function evaluateGates(input: {
  readonly hasSelectedContract: boolean;
  readonly opportunitySet: ContractOptimizationOpportunitySet | null;
  readonly readiness: ContractOptimizationEvidenceReadiness;
  readonly traceability: OpportunityTraceabilitySummary;
}): readonly StepGate[] {
  const { hasSelectedContract, opportunitySet, readiness, traceability } = input;
  const opportunities = opportunitySet?.opportunities ?? [];
  const approvalRequests = (opportunitySet?.approvalRequests ?? []).filter(
    (request) => request.approvalType === "vendor_outreach_strategy",
  );
  const financeRequests = (opportunitySet?.approvalRequests ?? []).filter(
    (request) => request.approvalType === "finance_value_confirmation",
  );
  const negotiatedOutcomes = opportunitySet?.negotiatedOutcomes ?? [];
  const baselineStatus = opportunitySet?.baseline.status ?? null;
  const topStage = highestStageRank(opportunities);
  const hasApprovalRequest = approvalRequests.length > 0;
  const hasApprovedRequest = approvalRequests.some(
    (request) =>
      request.approvalState === "approved" ||
      request.decisions.some((decision) => decision.decision === "approved"),
  );
  const hasPendingApprovalRequest = approvalRequests.some(
    (request) => request.approvalState === "pending",
  );
  const hasSentBackApprovalRequest = approvalRequests.some(
    (request) =>
      request.approvalState === "sent_back" ||
      request.decisions.some((decision) => decision.decision === "sent_back"),
  );
  const hasAgreedOutcome = negotiatedOutcomes.some(
    (outcome) => outcome.outcomeState === "agreed",
  );
  const hasFinanceRequest = financeRequests.length > 0;
  const hasApprovedFinanceRequest = financeRequests.some(
    (request) =>
      request.approvalState === "approved" ||
      request.decisions.some((decision) => decision.decision === "approved"),
  );

  const financeConfirmed =
    (opportunitySet?.financeConfirmedUsd ?? 0) > 0 ||
    (opportunitySet?.financeRealizations.length ?? 0) > 0;
  const valueProofComplete = financeConfirmed && hasApprovedFinanceRequest;

  return [
    {
      satisfied: hasSelectedContract,
      primaryAction: "Pick a contract from the ranked list below",
      primaryActionDetail:
        "Optimize Contract starts from one governed contract, not a blank brief.",
      blocker: hasSelectedContract ? null : "No contract is selected.",
    },
    {
      satisfied: baselineStatus === "ready",
      primaryAction:
        baselineStatus === "conflict"
          ? "Resolve the baseline conflict"
          : "Lock the commercial baseline",
      primaryActionDetail:
        baselineStatus === "conflict"
          ? "Pricing-schedule value and stated annual value disagree. No amount may be sized or approved until they reconcile."
          : "Load the contract, pricing, and actual-spend inputs so every later number has one agreed starting point.",
      blocker:
        baselineStatus === "ready"
          ? null
          : baselineStatus === "conflict"
            ? "Baseline inputs conflict."
            : "No governed commercial baseline yet.",
    },
    /*
     * Read evidence.
     *
     * The evidence-readiness model carries template packs for a subset of
     * contract shapes. Where none matches, it falls back to a generic required
     * list, so on a contract type it does not model it reported every family as
     * missing — and the rail then declared the contract unsizable on the same
     * page that showed sized, calculation-backed levers. Two statements about
     * one contract, drawn from two different populations.
     *
     * A traced opportunity is itself proof that evidence was read: the amount
     * reproduces from a calculation run. So this step is satisfied when the
     * readiness model is content OR when governed evidence already backs an
     * opportunity, and the wording says which of the two it is.
     */
    (() => {
      const tracedOpportunities = traceability.tracedCount;
      /*
       * Only bypass the block when the required list is not archetype-governed.
       *
       * Where a template pack matches the contract, a missing required family
       * is a real gate and must hold the case — even with traced opportunities,
       * because a traced amount can still rest on incomplete evidence. Where no
       * pack matches, the list is a generic default built for other contract
       * shapes, and blocking on it told the reader this contract could not be
       * sized on the same page that showed it sized.
       */
      const requiredListIsGoverned = readiness.archetypeKey != null;
      const evidenceBackedSizing =
        !requiredListIsGoverned && tracedOpportunities > 0;
      const missingFamilies =
        readiness.requiredTotal - readiness.requiredEvidenced;
      return {
        satisfied: !readiness.sizingBlocked || evidenceBackedSizing,
        primaryAction: evidenceBackedSizing
          ? "Diagnose the sized opportunities"
          : `Collect ${missingFamilies} missing evidence famil${
              missingFamilies === 1 ? "y" : "ies"
            }`,
        primaryActionDetail: evidenceBackedSizing
          ? `${tracedOpportunities} opportunit${
              tracedOpportunities === 1 ? "y reproduces" : "ies reproduce"
            } from a calculation run. ${readiness.summary}`
          : readiness.summary,
        blocker:
          readiness.sizingBlocked && !evidenceBackedSizing
            ? `${readiness.blockingFamilies.length} required evidence famil${
                readiness.blockingFamilies.length === 1 ? "y has" : "ies have"
              } no governed evidence.`
            : null,
      };
    })(),
    {
      satisfied:
        opportunities.length > 0 &&
        topStage >= STAGE_RANK.validated &&
        !traceability.hasUntracedAmounts,
      primaryAction:
        opportunities.length === 0
          ? "Diagnose the opportunity rows"
          : traceability.hasUntracedAmounts
            ? "Attach a calculation run to every stated amount"
            : "Validate the diagnosed opportunities",
      primaryActionDetail:
        opportunities.length === 0
          ? "No opportunity rows are loaded, so there is nothing to size yet."
          : traceability.summary,
      blocker: traceability.hasUntracedAmounts
        ? "Some stated amounts cannot be reproduced from a calculation run."
        : opportunities.length === 0
          ? "No opportunity rows are loaded."
          : topStage < STAGE_RANK.validated
            ? "No opportunity has been validated yet."
            : null,
    },
    {
      satisfied:
        topStage >= STAGE_RANK.target_position && hasApprovalRequest,
      primaryAction:
        topStage >= STAGE_RANK.target_position
          ? hasApprovalRequest
            ? "Review the strategy approval request"
            : "Create the strategy approval request"
          : "Build the negotiation strategy",
      primaryActionDetail:
        topStage >= STAGE_RANK.target_position
          ? "A target position is visible, but Source needs a governed approval request before vendor outreach or commercial commitment."
          : "Turn validated opportunities into a target, fallback, walk-away, and vendor ask list before any outreach.",
      blocker:
        topStage < STAGE_RANK.target_position
          ? "No negotiation target position is set."
          : hasApprovalRequest
            ? null
            : "No governed strategy or vendor-outreach approval request is recorded.",
    },
    {
      satisfied: hasApprovedRequest && hasAgreedOutcome,
      primaryAction: hasApprovedRequest
        ? "Record the negotiated outcome"
        : hasSentBackApprovalRequest
          ? "Revise and resubmit the approval request"
          : hasPendingApprovalRequest
            ? "Approve or send back the strategy request"
            : "Open approval gate",
      primaryActionDetail:
        hasApprovedRequest
          ? "An approval exists. Record the vendor agreement, rejection, or superseded outcome before moving to value proof."
          : "A named approver must authorize the position before any vendor outreach or commercial commitment.",
      blocker: !hasApprovedRequest
        ? hasSentBackApprovalRequest
          ? "The strategy approval request was sent back."
          : hasPendingApprovalRequest
            ? "The strategy approval request is pending."
            : "No approved position is recorded."
        : hasAgreedOutcome
          ? null
          : "No negotiated vendor outcome is recorded.",
    },
    {
      satisfied: valueProofComplete,
      primaryAction: financeConfirmed
        ? hasApprovedFinanceRequest
          ? "Value proof is finance-confirmed"
          : hasFinanceRequest
            ? "Wait for Finance/Tower confirmation"
          : "Record the Finance/Tower handoff"
        : "Confirm realized value with Finance",
      primaryActionDetail:
        financeConfirmed
          ? hasApprovedFinanceRequest
            ? "Finance-confirmed value exists, and the Finance/Tower confirmation request is recorded."
            : hasFinanceRequest
              ? "Finance evidence is loaded, but value proof stays blocked until Finance/Tower approves the confirmation request."
            : "Finance evidence is loaded, but the workflow still needs the Finance/Tower handoff request for the audit trail."
          : "Only finance-confirmed value counts as realized. Estimates and vendor agreement do not.",
      blocker: valueProofComplete
        ? null
        : financeConfirmed
          ? hasFinanceRequest
            ? "Finance/Tower confirmation request is pending approval."
            : "Finance evidence is loaded, but no Finance/Tower handoff request is recorded."
          : "No finance-confirmed value yet.",
    },
  ];
}

function stateFor(
  index: number,
  currentIndex: number,
  satisfied: boolean,
  currentBlocker: string | null,
): OptimizeStepState {
  if (index < currentIndex) return "complete";
  if (index > currentIndex) return "future";
  if (satisfied) return "complete";
  return currentBlocker ? "blocked" : "current";
}

function highestStageRank(
  opportunities: readonly ContractOptimizationOpportunity[],
): number {
  return opportunities.reduce(
    (highest, opportunity) =>
      Math.max(highest, STAGE_RANK[opportunity.stage] ?? 0),
    -1,
  );
}
