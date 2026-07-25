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
  /**
   * Hard floor — below this, the artifact is too thin to be credible.
   * Corrected 2026-07-25: this must equal targetWords.min, not a looser
   * historical value carried over from one pipeline's prior implementation.
   * A floor below the target's own minimum risks a thin Charter once tables
   * are included — the new phase contract is the source of truth, not
   * whichever pipeline's number happened to already exist.
   */
  minWords: number;
  /** The range to aim for when evidence/context is rich. */
  targetWords: { min: number; max: number };
  /**
   * Target ceiling — crossing it is a discipline signal for the prompt and an
   * advisory in the quality gate, not by itself an export block. See
   * `advisoryMaxWords` for where blocking actually starts.
   */
  hardMaxWords: number;
  /**
   * True hard ceiling. 2026-07-25: per live-generation review, two independent
   * real runs both landed 170-200 words past `hardMaxWords` (1471, 1505) with
   * strong narrative quality — aggressively compressing to force compliance
   * with a number the section-budget math doesn't yet reliably hit would trade
   * quality for a target that's still being empirically tuned. Reads
   * 900-1,100 as ideal, 1,101-hardMaxWords as pass, hardMaxWords-this value as
   * pass-with-advisory, and only above this value as a block. Revisit once a
   * meaningful sample of real Charters shows where quality actually holds.
   */
  advisoryMaxWords: number;
}

export interface ArtifactSectionContract {
  key: string;
  title: string;
  intent: string;
  /** Per-section word cap. The sum of all sections' maxWords must stay under hardMaxWords. */
  maxWords: number;
}

export const CHARTER_PLACEHOLDER_LABELS = {
  clientDecisionRequired: "Client Decision Required",
  toValidateDuringDiscovery: "To Validate During Discovery",
  evidenceRequiredForP2: "Evidence Required for P2",
} as const;

export interface ArtifactContract {
  deliverableType: string;
  wordBudget: ArtifactWordBudget;
  /** Single canonical output-token ceiling both pipelines derive their own budget from. */
  maxOutputTokens: number;
  estimatedRenderedPages: string;
  sections: ArtifactSectionContract[];
  forbiddenTopics: string[];
  presentationElements: string[];
  /** Verbatim boundary statement the artifact must include near its beginning. */
  boundaryStatement: string;
  /** Upper bound on substantive tables (not counting the decision box). */
  maxSubstantiveTables: number;
  /**
   * Runtime policy flags every generation entry point should honor, stated
   * explicitly rather than left to be inferred from a missing field. See
   * docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md and the reconciliation
   * note in this artifact's release record for what each of these actually
   * evaluates to in shipped code today vs. what's still a gap.
   */
  policy: {
    qualityContractRequired: boolean;
    visualRendererRequired: boolean;
    evidenceCitationRequired: boolean;
    phaseBoundaryValidationRequired: boolean;
    structuredRenderingRequired: boolean;
  };
}

export const CHARTER_CONTRACT: ArtifactContract = {
  deliverableType: "charter",
  wordBudget: {
    minWords: 900,
    targetWords: { min: 900, max: 1_100 },
    hardMaxWords: 1_300,
    advisoryMaxWords: 1_500,
  },
  /**
   * Single canonical output-token ceiling for generating this artifact.
   * Both pipelines derive their own token budget from this value — see
   * strategic-moves-artifact-standard.ts's DEPTH_BY_ARTIFACT.charter.maxTokens
   * and document-generation-policy.ts's charter-specific per-pass override.
   * 4,000 is generous enough for structured content/tables well above the
   * 1,300-word hard ceiling, without being unbounded (which raises latency,
   * cost, and the odds of over-generation followed by truncation/rejection).
   */
  maxOutputTokens: 4_000,
  estimatedRenderedPages: "2-3",
  // Redesigned 2026-07-25: 9 sections replacing the earlier 7. The prior
  // design folded "discovery questions" and "evidence requested for P2" as
  // bullets inside a generic "recommendation" section — thinner than the
  // presentation contract's own promise of a dedicated table for that
  // content. This design gives Discovery its own first-class section
  // (discovery_preparation) with two real tables, so the Charter ends by
  // transitioning cleanly into P2 instead of compressing it into an
  // afterthought. It also splits "intended outcomes" (what Discovery should
  // evaluate) from "success measures" (how success will be judged) — these
  // were previously merged into one "success_criteria" section.
  sections: [
    {
      key: "charter_decision",
      title: "Charter Decision",
      intent:
        "State one of: Authorize Discovery / Authorize Discovery with Conditions / Do Not Authorize Discovery, plus a concise executive decision summary.",
      maxWords: 100,
    },
    {
      key: "opportunity_context",
      title: "Opportunity & Business Context",
      intent:
        "Why this Move is being considered, why it matters now, the business opportunity or challenge, and expected business value direction. Only approved P0 capture, sponsor input, and approved enterprise context.",
      maxWords: 150,
    },
    {
      key: "intended_outcomes",
      title: "Intended Outcomes",
      intent:
        "The business outcomes Discovery is intended to evaluate — objectives, not commitments or validated findings.",
      maxWords: 120,
    },
    {
      key: "scope",
      title: "Scope & Out of Scope",
      intent: "A simple two-column table: In Scope / Out of Scope. Concise.",
      maxWords: 150,
    },
    {
      key: "success_measures",
      title: "Success Measures",
      intent:
        "How the organization will determine whether Discovery was successful. Do not invent current-state baselines, target metrics, or financial benefits.",
      maxWords: 120,
    },
    {
      key: "sponsorship_governance",
      title: "Sponsorship & Governance",
      intent:
        "Executive sponsor, decision authority, working team, governance cadence (if known). Unknown items labeled Client Decision Required.",
      maxWords: 140,
    },
    {
      key: "known_constraints_dependencies",
      title: "Known Constraints & Dependencies",
      intent:
        "Only constraints and dependencies already supported by approved evidence — do not infer risks. Unknown items labeled To Validate During Discovery.",
      maxWords: 120,
    },
    {
      key: "discovery_preparation",
      title: "Discovery Preparation",
      intent:
        "Sets expectations for the Discovery phase — not the assessment itself. An executive table (Area / What to Expect / What We Need From You / Priority) across Business Process, People & Governance, Technology, Data, Performance, Risk & Controls; a second table of typical Discovery activities and durations; and a short closing paragraph noting that a detailed Discovery Guidebook, tailored to this Move, will be generated after Charter approval — do not embed that detail here.",
      maxWords: 250,
    },
    {
      key: "authorization_next_steps",
      title: "Authorization & Immediate Next Steps",
      intent:
        "Charter decision, immediate actions, conditions (if any), and the expected transition into P2.",
      maxWords: 120,
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
    "An executive Charter Decision box at the beginning.",
    "A two-column Scope / Out of Scope table.",
    "A Discovery Preparation table (Area / What to Expect / What We Need From You / Priority).",
    "A Discovery Activities table (typical activity / typical duration).",
  ],
  boundaryStatement:
    "This Charter authorizes and bounds the Discovery phase. It does not present a completed diagnosis, recommend a solution, define architecture, establish a future operating model, provide an implementation roadmap, or commit implementation funding.",
  maxSubstantiveTables: 4,
  policy: {
    qualityContractRequired: true,
    visualRendererRequired: false,
    evidenceCitationRequired: true,
    phaseBoundaryValidationRequired: true,
    structuredRenderingRequired: true,
  },
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
