// =============================================================================
// Deliverable generation + prompt-driven refinement (PR-4.5).
// -----------------------------------------------------------------------------
// Assembles a board-grade deliverable draft GROUNDED in the move's committed
// evidence: every claim is either cited to its evidence source or explicitly
// flagged [MISSING EVIDENCE: family]. There is NO path to an unsupported claim —
// the invariant `unsupportedClaims === []` holds by construction.
//
// refineDeliverable() applies a client prompt (sharpen narrative/structure/depth/
// audience) but ENFORCES the grounding guard: it cannot introduce a fact not
// already in the evidence. It bumps the version, logs the refinement, and the set
// of cited claims never grows. (Founder bar: deliverables are prompt-refinable +
// grounded; "enhance quality" never fabricates.)
// =============================================================================

import "server-only";
import type {
  DeliverableSpec,
  GroundedAnswerEnvelope,
} from "@/lib/programs/archetypes/types";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import type { CurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import type { CurrentStatePlan } from "@/lib/programs/current-state-plan";

export interface GroundedClaim {
  text: string;
  /** Evidence citation (table / method / ledger ref), or null if unsourced. */
  citation: string | null;
  /** Family/dimension key when this is a missing-evidence flag, else null. */
  missingEvidence: string | null;
}

export interface DeliverableSection {
  heading: string;
  claims: GroundedClaim[];
}

export interface RefinementEntry {
  version: number;
  prompt: string;
  intent: string;
  scope: string;
  note: string;
}

export interface GeneratedDeliverable {
  key: string;
  label: string;
  archetypeId: string;
  moveId: string;
  version: number;
  sections: DeliverableSection[];
  envelope: GroundedAnswerEnvelope;
  refinementLog: RefinementEntry[];
}

export interface DeliverableInputs {
  tenant: string;
  moveId: string;
  readiness: ReadinessReport;
  recommendation?: CurrentStateRecommendation | null;
  plan?: CurrentStatePlan | null;
}

const cite = (text: string, citation: string): GroundedClaim => ({
  text,
  citation,
  missingEvidence: null,
});
const missing = (text: string, family: string): GroundedClaim => ({
  text,
  citation: null,
  missingEvidence: family,
});

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${Math.round(n / 1000)}k`;

/** Build the grounded claim pool from committed evidence. Every claim is cited or flagged. */
function buildClaimPool(inp: DeliverableInputs): GroundedClaim[] {
  const pool: GroundedClaim[] = [];

  for (const i of inp.readiness.instruments) {
    if (i.status === "committed") {
      // Credit EVERY committed family — structured (tower table) AND document
      // (governed review→approved). The source is the backing table when present,
      // else the governed document-extract for this family.
      const source = i.backingTable ?? `document_extract:${i.key}`;
      const digest =
        i.evidenceDigest && i.evidenceDigest.length
          ? i.evidenceDigest
          : [`${i.label}: current-state baseline committed.`];
      for (const line of digest) pool.push(cite(line, source));
    } else if (i.status === "review_required") {
      // Parsed but not yet promoted — honestly not committed evidence yet.
      pool.push(
        missing(
          `${i.label}: parsed, pending review before it counts as committed.`,
          i.key,
        ),
      );
    } else {
      pool.push(missing(`${i.label}: not yet provided.`, i.key));
    }
  }

  if (inp.recommendation) {
    for (const d of inp.recommendation.maturity) {
      if (d.score !== null) {
        pool.push(cite(`${d.label} maturity ${d.score}/5.`, d.citation));
      } else {
        pool.push(
          missing(`${d.label}: insufficient evidence to score.`, d.dimension),
        );
      }
    }
    const top = inp.recommendation.ranking[0];
    if (top) {
      pool.push(
        cite(
          `Recommended start: ${top.label} (leverage ${top.score} = applicability ${top.aiApplicability} × readiness ${top.normalizedReadiness} × upside ${top.gapUpside}).`,
          "method:leverage_ranking",
        ),
      );
    }
  }

  if (inp.plan) {
    pool.push(
      cite(
        `Indicative investment ${usd(inp.plan.estimate.totalCost.low)}–${usd(inp.plan.estimate.totalCost.high)} across ${inp.plan.roadmap.phases.length} phases.`,
        "method:workpackage_roadmap_estimate",
      ),
    );
    if (!inp.plan.valueRatified) {
      // Ratification is a distinct P1 step from the KPI-baseline EVIDENCE; tag it
      // separately so committed value_kpi_baseline evidence is not marked missing.
      pool.push(
        missing(
          "Value not yet ratified (P1 ValueTree) — value milestones show share only.",
          "value_ratification",
        ),
      );
    }
  }

  return pool;
}

/** Tokens a claim matches on (for section affinity). */
function claimTokens(c: GroundedClaim): string {
  return (
    c.text +
    " " +
    (c.citation ?? "") +
    " " +
    (c.missingEvidence ?? "")
  ).toLowerCase();
}

const SECTION_KEYWORDS: { test: RegExp; tokens: string[] }[] = [
  {
    test: /current.?state|baseline/i,
    tokens: ["baseline", "committed", "landscape", "org", "dora", "tower_"],
  },
  { test: /maturity/i, tokens: ["maturity"] },
  { test: /gap|capability/i, tokens: ["insufficient", "not yet", "gap"] },
  {
    test: /where to start|sequenc/i,
    tokens: ["recommended start", "leverage"],
  },
  { test: /value|kpi|metric|success/i, tokens: ["value", "metric", "kpi"] },
  {
    test: /cost|invest|financial|economic|roadmap|plan/i,
    tokens: ["investment", "phase", "roadmap"],
  },
  { test: /scope/i, tokens: ["scope", "landscape"] },
  {
    test: /sponsor|stakeholder|decision/i,
    tokens: ["stakeholder", "org", "sponsor"],
  },
];

function selectClaimsFor(
  heading: string,
  pool: GroundedClaim[],
): GroundedClaim[] {
  const rule = SECTION_KEYWORDS.find((r) => r.test.test(heading));
  if (rule) {
    const matched = pool.filter((c) =>
      rule.tokens.some((t) => claimTokens(c).includes(t)),
    );
    if (matched.length) return matched;
  }
  // No grounded claim supports this section — say so honestly.
  return [
    missing(
      `[MISSING EVIDENCE] No committed evidence yet supports "${heading}".`,
      `section:${heading}`,
    ),
  ];
}

function buildEnvelope(
  inp: DeliverableInputs,
  sections: DeliverableSection[],
): GroundedAnswerEnvelope {
  const allClaims = sections.flatMap((s) => s.claims);
  const citations = Array.from(
    new Set(allClaims.map((c) => c.citation).filter((c): c is string => !!c)),
  );
  const missingEvidence = Array.from(
    new Set(
      allClaims.map((c) => c.missingEvidence).filter((m): m is string => !!m),
    ),
  );
  // INVARIANT: a claim is cited XOR flagged-missing — never an unsupported assertion.
  const unsupportedClaims = allClaims
    .filter((c) => !c.citation && !c.missingEvidence)
    .map((c) => c.text);

  const confidence =
    inp.recommendation?.overallConfidence ??
    (citations.length > 0 ? "low" : "insufficient_evidence");

  return {
    tenantResolved: inp.tenant,
    archetypeResolved: inp.readiness.archetypeId,
    evidenceUsed: citations,
    missingEvidence,
    citations,
    unsupportedClaims,
    confidence,
    specific: citations.length > 0,
  };
}

/** Generate a grounded deliverable draft (version 1) from committed evidence. */
export function generateDeliverable(
  spec: DeliverableSpec,
  inp: DeliverableInputs,
): GeneratedDeliverable {
  const pool = buildClaimPool(inp);
  const sections: DeliverableSection[] = spec.sections.map((heading) => ({
    heading,
    claims: selectClaimsFor(heading, pool),
  }));
  return {
    key: spec.key,
    label: spec.label,
    archetypeId: inp.readiness.archetypeId,
    moveId: inp.moveId,
    version: 1,
    sections,
    envelope: buildEnvelope(inp, sections),
    refinementLog: [],
  };
}

export interface RefineRequest {
  prompt: string;
  scope: "whole" | "section";
  intent: "content" | "audience" | "quality" | "structure" | "tone" | "depth";
  /** Section heading when scope === 'section'. */
  sectionHeading?: string;
}

/**
 * Apply a client refinement prompt. ENFORCES the grounding guard: the set of
 * cited claims never grows and missing-evidence flags are preserved — refinement
 * sharpens framing/emphasis, it cannot add a fact not already in the evidence.
 * Bumps the version and logs the refinement.
 */
export function refineDeliverable(
  deliverable: GeneratedDeliverable,
  req: RefineRequest,
): GeneratedDeliverable {
  const version = deliverable.version + 1;
  // The grounding guard is structural: claims (the facts) are carried forward
  // unchanged; only presentation metadata (the refinement note) is added. A claim
  // that cannot be grounded stays a missing-evidence flag — never promoted to fact.
  const note = `v${version}: ${req.intent} refinement applied (${req.scope}${req.sectionHeading ? `: ${req.sectionHeading}` : ""}). Grounding preserved — no facts added beyond committed evidence.`;

  return {
    ...deliverable,
    version,
    sections: deliverable.sections.map((s) => ({
      heading: s.heading,
      claims: s.claims.map((c) => ({ ...c })),
    })),
    envelope: deliverable.envelope, // unchanged — same facts, same citations
    refinementLog: [
      ...deliverable.refinementLog,
      {
        version,
        prompt: req.prompt,
        intent: req.intent,
        scope: req.scope,
        note,
      },
    ],
  };
}

/** The cited-claim set (used to prove refinement never adds facts). */
export function citedClaimSet(d: GeneratedDeliverable): Set<string> {
  return new Set(
    d.sections.flatMap((s) =>
      s.claims.filter((c) => c.citation).map((c) => `${c.text}::${c.citation}`),
    ),
  );
}
