// SolutionContext — the cumulative phase memory of a Move (the missing muscle).
//
// The loop every phase follows:
//   Inputs → Process → Human/Gate → Deliverables → SolutionContext writeback → next-phase prompt
//
// Each phase READS the full SolutionContext and WRITES a structured digest back,
// so the solution learns/improves/progresses. This replaces the old path that
// bound `[DATA GAP]` stubs + 1800-char truncated summaries.
//
// Pure data + merge here; `assembleMoveSolutionContext` (the DB/broker-backed
// retrieval) is wired in the route layer and feeds this shape.

export interface SolutionKpi {
  name: string;
  baseline?: string;
  target?: string;
  domain: "clinical" | "operational" | "financial" | "other";
}

export interface SolutionOption {
  id: string;
  name: string;
  summary: string;
  scores?: Record<string, number>; // criterion → score
  recommended?: boolean;
}

export interface SolutionDecision {
  phase: number;
  decision: string;
  rationale: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface SolutionEvidenceMetric {
  label: string;
  value: string;
  source?: string;
  caveat?: string;
}

export interface SolutionEvidenceTaxonomyItem {
  category: string;
  owner?: string;
  riskLevel?: string;
  volume?: string;
  rate?: string;
  averageResolutionDays?: string;
  manualTouchHours?: string;
}

export interface SolutionMissingInputAction {
  needed: string;
  whyItMatters: string;
  owner: string;
  howItWillBeUsed: string;
  gateImpact: string;
}

/** The cumulative knowledge object, populated phase by phase. */
export interface SolutionContext {
  moveId: string;
  tenantKey: string;
  // P0
  problemSeed?: string;
  useCaseCandidate?: string;
  evidenceNeeds?: string[];
  sponsorCandidate?: string;
  // P1
  useCase?: string;
  kpis?: SolutionKpi[];
  scope?: string;
  priority?: string;
  valueHypothesis?: string;
  killCriteria?: string[];
  // P2
  currentState?: string;
  baselineMetrics?: Record<string, string>;
  metricsThatMatter?: SolutionEvidenceMetric[];
  evidenceTaxonomy?: SolutionEvidenceTaxonomyItem[];
  gaps?: string[];
  rootCauses?: string[];
  constraints?: string[];
  evidenceMap?: Array<{ claim: string; source: string }>;
  clientActionableMissingInputs?: SolutionMissingInputAction[];
  // P3a
  approach?: string;
  options?: SolutionOption[];
  chosenOption?: string;
  tradeoffsAccepted?: string[];
  // P3b
  solutionDesign?: string;
  architecture?: string;
  patterns?: string[];
  integrationContracts?: string[];
  securityModel?: string;
  // P4
  roadmap?: string;
  businessCase?: string;
  investmentAsk?: string;
  valuePlan?: string;
  risks?: string[];
  // cumulative
  decisions: SolutionDecision[];
  humanApprovalNotes: string[];
}

/** A structured digest one phase writes back into the SolutionContext. */
export type PhaseDigest = Partial<
  Omit<SolutionContext, "moveId" | "tenantKey" | "decisions" | "humanApprovalNotes">
> & {
  decisions?: SolutionDecision[];
  humanApprovalNotes?: string[];
};

export function emptySolutionContext(
  moveId: string,
  tenantKey: string,
): SolutionContext {
  return { moveId, tenantKey, decisions: [], humanApprovalNotes: [] };
}

/** Merge a phase digest into the context (append decisions/notes, overwrite fields). */
export function applyPhaseDigest(
  ctx: SolutionContext,
  digest: PhaseDigest,
): SolutionContext {
  const { decisions, humanApprovalNotes, ...fields } = digest;
  return {
    ...ctx,
    ...fields,
    decisions: [...ctx.decisions, ...(decisions ?? [])],
    humanApprovalNotes: [...ctx.humanApprovalNotes, ...(humanApprovalNotes ?? [])],
  };
}

/** Fields a phase REQUIRES present before it may generate (gate dependency). */
export const PHASE_REQUIRED_CONTEXT: Readonly<Record<number, ReadonlyArray<keyof SolutionContext>>> = {
  1: ["useCaseCandidate"],
  2: ["useCase", "kpis"],
  3: ["currentState", "gaps"], // P3a needs the diagnosis
  // P3b (architecture) additionally needs chosenOption — enforced separately.
  4: ["architecture"],
  5: ["roadmap"],
};

export interface ContextReadiness {
  ready: boolean;
  missing: string[];
}

/** Is the SolutionContext rich enough for this phase to generate? */
export function contextReadyForPhase(
  ctx: SolutionContext,
  phase: number,
): ContextReadiness {
  const required = PHASE_REQUIRED_CONTEXT[phase] ?? [];
  const missing = required.filter((k) => {
    const v = ctx[k];
    return v === undefined || v === null || (Array.isArray(v) && v.length === 0);
  });
  return { ready: missing.length === 0, missing: missing.map(String) };
}

/** Architecture (P3b) may not proceed until the approach/option is chosen + approved. */
export function architectureMayProceed(ctx: SolutionContext): ContextReadiness {
  const missing: string[] = [];
  if (!ctx.chosenOption) missing.push("chosenOption (P3a approval required)");
  return { ready: missing.length === 0, missing };
}
