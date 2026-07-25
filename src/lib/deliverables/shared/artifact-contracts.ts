import "server-only";

// Shared source-of-truth artifact contracts, consumed by BOTH Moves
// generation pipelines (golden-bar: solution-prompt-factory.ts /
// strategic-moves-artifact-standard.ts; orchestrator: prompt-builder.ts /
// deliverable-structures.ts / quality-bar-registry.ts).
//
// Why this exists: the P1 Charter word/token standard shipped on 2026-07-25
// (release records 2026-07-25-p0-p1-scope-outcomes-discovery-split,
// 2026-07-25-charter-generous-tokens-firm-words) had to be corrected twice
// because each pipeline hardcoded its own copy of the same numbers
// (900-1,100/1,300 target/hard-max words, 7 required sections, forbidden
// topics, placeholder labels) — see docs/architecture/
// MOVES_DUAL_PIPELINE_AUDIT.md. "The same P0/P1/P2 action must not produce
// different artifact content based on which button invoked it" requires one
// definition both pipelines read, not two definitions kept manually in sync.
//
// Scope of this first module: the numeric/policy CONTRACT for an artifact
// type (word budget, required sections + their word caps, forbidden topics,
// placeholder labels) — the part that must never silently diverge between
// pipelines. It does NOT unify the two pipelines' prompt PROSE (golden-bar's
// single-pass narrative brief vs. orchestrator's six-pass section-by-section
// construction remain architecturally different) or their token-budget
// mechanics (fundamentally different generation shapes — see
// document-generation-policy.ts for the orchestrator's per-pass budgets).
// Only Charter is migrated to this module today; migrating the other
// deliverable types is follow-up work, not done here.

export interface ArtifactWordBudget {
  /** Hard floor — below this, the artifact is too thin to be credible. */
  minWords: number;
  /** The range to aim for when evidence/context is rich. */
  targetWords: { min: number; max: number };
  /** Hard ceiling — a real quality-gate blocker, not the target range's own upper bound. */
  hardMaxWords: number;
}

export interface ArtifactSectionContract {
  key: string;
  title: string;
  intent: string;
  /** Per-section word cap. The sum of all sections' maxWords must stay under hardMaxWords. */
  maxWords: number;
}

export const CHARTER_PLACEHOLDER_LABELS = {
  clientDecisionRequired: "Client decision required",
  hypothesisToTestInP2: "Hypothesis to test in P2",
  evidenceRequiredForP2: "Evidence required for P2",
} as const;

export interface ArtifactContract {
  deliverableType: string;
  wordBudget: ArtifactWordBudget;
  sections: ArtifactSectionContract[];
  forbiddenTopics: string[];
  presentationElements: string[];
}

export const CHARTER_CONTRACT: ArtifactContract = {
  deliverableType: "charter",
  wordBudget: {
    minWords: 700,
    targetWords: { min: 900, max: 1_100 },
    hardMaxWords: 1_300,
  },
  sections: [
    {
      key: "exec_summary",
      title: "Executive Summary & Decision Ask",
      intent:
        "The problem, why it matters now, the preliminary value hypothesis (labelled PRELIMINARY), and the approval requested. Framing only.",
      maxWords: 125,
    },
    {
      key: "problem_opportunity",
      title: "Problem / Opportunity Being Chartered",
      intent:
        "The business problem or opportunity in plain English — trigger, affected business area, consequence of doing nothing. Hypothesis framing, not P2 findings.",
      maxWords: 150,
    },
    {
      key: "sponsor_commitment",
      title: "Sponsor, Decision Rights & Change Commitment",
      intent:
        "Accountable role/title, operating owners, decision rights, review cadence, and the commitment to drive business-process change and measurement.",
      maxWords: 175,
    },
    {
      key: "scope",
      title: "Scope & Out-of-Scope",
      intent:
        "Explicit in-scope / out-of-scope boundary — business process, user cohort, capability, system/data domain, decision boundary.",
      maxWords: 175,
    },
    {
      key: "success_criteria",
      title: "Success Criteria & Value Hypothesis",
      intent:
        "Business outcomes, key metrics, post-deployment measurement approach, and the business-process changes required.",
      maxWords: 200,
    },
    {
      key: "kill_criterion",
      title: "Risks, Dependencies & Kill Criteria",
      intent:
        "Top risks, issues, dependencies, and a specific observable condition that would stop or redirect the Move.",
      maxWords: 175,
    },
    {
      key: "recommendation",
      title: "Recommendation & P2 Handoff",
      intent:
        "The recommendation (approve/approve with caveats/hold), immediate next actions, evidence families, workshops, and owner roles P2 must complete.",
      maxWords: 175,
    },
  ],
  forbiddenTopics: [
    "current state",
    "current-state",
    "as-is",
    "as is assessment",
    "baseline assessment",
    "target state",
    "target-state",
    "future state",
    "future-state",
    "to-be",
    "gap analysis",
    "solution design",
    "solution architecture",
    "reference architecture",
    "technical architecture",
    "detailed design",
    "implementation plan",
  ],
  presentationElements: [
    "A prominent Charter Decision box at the beginning.",
    "A two-column Scope / Out of Scope table.",
    "A structured Discovery Questions and Evidence Required table.",
    "A short Authorization and Immediate Next Steps section at the end.",
  ],
};

const CONTRACTS_BY_TYPE: Readonly<Record<string, ArtifactContract>> = {
  charter: CHARTER_CONTRACT,
};

export function getArtifactContract(
  deliverableType: string,
): ArtifactContract | null {
  return CONTRACTS_BY_TYPE[deliverableType] ?? null;
}

/** Sum of every section's maxWords — must stay under wordBudget.hardMaxWords. */
export function sectionWordCapTotal(contract: ArtifactContract): number {
  return contract.sections.reduce((sum, s) => sum + s.maxWords, 0);
}
