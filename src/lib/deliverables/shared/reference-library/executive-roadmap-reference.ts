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

export interface RoadmapReference {
  purpose: string;
  audience: string;
  whenToUse: { phase: 4; required: true };
  story: ExecutiveStoryContract;
  horizons: readonly [
    "Mobilize",
    "Establish Foundation",
    "Deliver Priority Outcomes",
    "Scale and Optimize",
  ];
  maxHorizons: number;
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
  ];
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
  horizons: [
    "Mobilize",
    "Establish Foundation",
    "Deliver Priority Outcomes",
    "Scale and Optimize",
  ],
  maxHorizons: 4,
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
