import "server-only";

// REF_EXECUTIVE_ROADMAP — pilot Visual & Artifact Reference Contract (2026-07-25).
//
// Why this exists: word/token budgets (artifact-contracts.ts) fix HOW MUCH an
// artifact says; this fixes WHAT IT SHOWS and WHY IT'S THERE. Before this, the
// P4 roadmap had no dedicated prompt at all (golden-bar fell through to one
// generic P4 sentence), no expectedExhibits entry, and no SVG renderer case —
// it rendered as a generic timeline/flow diagram indistinguishable from any
// other exhibit. This is the single source both pipelines' prompts, the
// renderer, and the quality gate all read from, so "what a roadmap looks
// like" can never silently diverge the way word budgets did before the
// Charter/P3-P4 reconciliation (PRs #5593, #5594).
//
// This is a PILOT — one complete reference, chosen because it had the least
// existing infrastructure and the user specified it in the most detail. The
// ~19 other references (current-state overview, root-cause tree, target
// architecture, business case, etc.) follow this same shape once proven.

/** The narrative-arc layer, sitting ABOVE the visual/section contract per the
 * user's explicit hierarchy: Executive Story Contract → Artifact Contract →
 * Section Contract → Visual Reference Contract → Rendering Specification.
 * A right-sized version for this one pilot artifact — not a separate,
 * artifact-agnostic system (that's real follow-up scope, not built here). */
export interface ExecutiveStoryContract {
  /** The single question a CIO/sponsor is actually asking when they open this artifact. */
  executiveQuestion: string;
  /** The one sentence this artifact must leave the reader believing, stated as a conclusion. */
  coreMessage: string;
  /** What decision or action this artifact asks the sponsor to make. */
  decisionRequired: string;
  /** What the audience should be able to say back after reading it. */
  audienceTakeaway: string;
  /** The section arc every roadmap must follow, in order — same shape as the
   * user's "context → tension → evidence → implication → decision" spine. */
  narrativeArc: readonly [
    "context",
    "tension",
    "evidence",
    "implication",
    "decision",
  ];
}

/** Per-item evidence label — the roadmap must never make an uncertain
 * sequence look committed. Every item's timing/dependency claim must be
 * traceable to one of these. */
export type RoadmapEvidenceStatus =
  | "approved"
  | "recommended"
  | "illustrative"
  | "client_decision_required"
  | "evidence_required";

export interface RoadmapReference {
  purpose: string;
  audience: string;
  whenToUse: { phase: 4; required: true };
  story: ExecutiveStoryContract;
  /** The title itself must be the executive conclusion, not a category
   * label — "Execution Roadmap" alone fails this contract. */
  titleRule: {
    requiresMessageLedTitle: true;
    minTitleWords: number;
    genericTitleForbiddenPatterns: readonly RegExp[];
    example: string;
  };
  horizons: readonly [
    "Mobilize",
    "Establish Foundation",
    "Deliver Priority Outcomes",
    "Scale and Optimize",
  ];
  maxHorizons: number;
  /** The state achieved in each horizon, stated outcome-first — activities
   * may appear beneath these but must never lead the horizon. */
  horizonOutcomes: Readonly<Record<string, string>>;
  workstreams: readonly [
    "Business & Process",
    "Technology",
    "Data",
    "AI / Automation",
    "Governance & Controls",
    "Change & Adoption",
  ];
  maxWorkstreams: number;
  maxActivitiesPerCell: number;
  /** Every roadmap line item must be traceable to these fields — a bare
   * activity name with no owner/dependency/decision is not acceptable. */
  requiredItemFields: readonly [
    "outcome",
    "majorActivity",
    "dependency",
    "decisionOrGate",
    "ownerRole",
    "timing",
    "successMeasure",
    "evidenceStatus",
  ];
  /** Canonical named gate decisions between horizons — a roadmap without
   * these reads as a colorful Gantt chart, not an executive sequencing
   * argument. */
  decisionGates: readonly string[];
  /** Milestones proving realized value, not just technical completion. */
  valueMilestones: readonly string[];
  /** Patterns that turn an executive roadmap into an implementation schedule
   * — matched case-insensitively against generated content. */
  forbiddenPatterns: readonly RegExp[];
  gateShape: "diamond";
  dependencyStyle: "dashed-connector";
  svg: {
    canvas: { width: number; height: number };
    /** Reuses the existing SVG_TOKEN_HEX palette already declared in
     * renderers.tsx — this contract does not define a second color system. */
    colorSemantics: {
      current: "muted";
      proposed: "fresh";
      risk: "attention";
      approved: "fresh";
      outOfScope: "muted";
    };
  };
}

export const EXECUTIVE_ROADMAP_REFERENCE: RoadmapReference = {
  purpose:
    "Show how the Move moves from mandate to realized value across a small number of decision-gated horizons — not a project schedule, a sequencing argument.",
  audience: "CIO, sponsor, steering committee",
  whenToUse: { phase: 4, required: true },
  story: {
    executiveQuestion:
      "Why this sequence, and what do we need to decide to keep it moving?",
    coreMessage:
      'State the one-sentence thesis for why this order de-risks the Move (e.g. "A four-stage transition establishes trusted data first, proves value in one function, then scales safely") — never just "Roadmap."',
    decisionRequired:
      "Name the specific gate decision(s) the sponsor must make to unlock the next horizon.",
    audienceTakeaway:
      "The sponsor can repeat back why the sequence is ordered this way, and what they're being asked to approve now.",
    narrativeArc: ["context", "tension", "evidence", "implication", "decision"],
  },
  titleRule: {
    requiresMessageLedTitle: true,
    minTitleWords: 8,
    genericTitleForbiddenPatterns: [
      /^execution roadmap$/i,
      /^executive roadmap$/i,
      /^p4 roadmap$/i,
      /^roadmap$/i,
      /^transition roadmap$/i,
    ],
    example:
      "A four-stage transition builds the foundation first, proves priority value, and scales only after controls are established",
  },
  horizons: [
    "Mobilize",
    "Establish Foundation",
    "Deliver Priority Outcomes",
    "Scale and Optimize",
  ],
  maxHorizons: 4,
  horizonOutcomes: {
    Mobilize: "Sponsorship, funding and decision rights established.",
    "Establish Foundation":
      "Trusted data, governance and delivery foundation operational.",
    "Deliver Priority Outcomes":
      "Priority outcome proven with measurable business value.",
    "Scale and Optimize":
      "Repeatable operating model extends value across the portfolio.",
  },
  workstreams: [
    "Business & Process",
    "Technology",
    "Data",
    "AI / Automation",
    "Governance & Controls",
    "Change & Adoption",
  ],
  maxWorkstreams: 6,
  maxActivitiesPerCell: 3,
  requiredItemFields: [
    "outcome",
    "majorActivity",
    "dependency",
    "decisionOrGate",
    "ownerRole",
    "timing",
    "successMeasure",
    "evidenceStatus",
  ],
  decisionGates: [
    "Funding authorized",
    "Foundation readiness confirmed",
    "Pilot value validated",
    "Controls approved",
    "Scale decision made",
  ],
  valueMilestones: [
    "Baseline approved",
    "First measurable result demonstrated",
    "Adoption threshold achieved",
    "Control effectiveness validated",
    "Benefits accepted by Finance",
  ],
  forbiddenPatterns: [
    /\bsprint\s?\d*/i,
    /\bgantt\b/i,
    /\bday\s?\d+\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+20\d{2}\b/i,
    /\bweek\s?\d+\b/i,
  ],
  gateShape: "diamond",
  dependencyStyle: "dashed-connector",
  svg: {
    canvas: { width: 1600, height: 900 },
    colorSemantics: {
      current: "muted",
      proposed: "fresh",
      risk: "attention",
      approved: "fresh",
      outOfScope: "muted",
    },
  },
};
