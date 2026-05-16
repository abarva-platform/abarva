// Agentic suitability assessment · Wave 2, Slice 2.1.
//
// The runtime classifier the Moves surface (Nexus agent) uses to score a
// proposed Move against the agentic spectrum encoded in the Slice 0.2
// solution-archetype taxonomy. Given a Move's free-text framing and the
// tenant's readiness across the three gated dimensions (data / control /
// eval), it returns:
//
//   - the recommended archetype (the responsible target, not the demo pick),
//   - a readiness score (0–100),
//   - the specific readiness gaps the recommendation rests on,
//   - practitioner reasons a principal solution architect would give,
//   - and, when the customer's framing implies a different archetype, the
//     over-reach being corrected plus the anti-pattern it trips.
//
// Expert value: this is what stops a CXO overbuilding a full agentic
// workflow when data/control maturity is low. It says "step back to a
// human-in-the-loop agent — here are the readiness gates to close first."
//
// Pure function — no I/O, client- and server-safe. The Moves origination
// path composes it through `origination-suitability.ts`.
//
// Acceptance contract: src/lib/programs/taxonomy/archetype-fixtures.ts.
// Methodology: docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md §3–§7.

import {
  getSolutionArchetype,
  meetsReadiness,
  type MaturityLevel,
  type ReadinessDimension,
  type SolutionArchetype,
  type SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';

/** A single unmet readiness requirement against the recommended archetype. */
export interface SuitabilityGap {
  dimension: ReadinessDimension;
  /** What the tenant has today. */
  current: MaturityLevel;
  /** What the recommended archetype's gate requires. */
  required: MaturityLevel;
  /** Senior-practitioner explanation of what must close. */
  note: string;
}

/** The outcome of a suitability assessment. */
export interface SuitabilityAssessment {
  /** The archetype Moves recommends shaping the Move into. */
  recommendedArchetype: SolutionArchetypeKey;
  /** Canonical display name of the recommended archetype. */
  recommendedName: string;
  /**
   * The archetype the customer's framing implied — the demo-driven or
   * naive pick. Equals `recommendedArchetype` when the obvious pick is also
   * the expert pick.
   */
  intendedArchetype: SolutionArchetypeKey;
  /** True when the recommendation is a less ambitious archetype than intended. */
  steppedDown: boolean;
  /**
   * When the intended pick is wrong, the anti-pattern code (from the intended
   * archetype's taxonomy entry) it trips. Null when intent equals recommendation.
   */
  antiPatternCode: string | null;
  /** Readiness score 0–100 for the *recommended* archetype's gate. */
  readinessScore: number;
  /** Unmet readiness gates the recommendation rests on. */
  readinessGaps: SuitabilityGap[];
  /** Practitioner reasons behind the recommendation. */
  reasons: string[];
}

/** Ordinal ranking of maturity for score / gap maths. */
const MATURITY_RANK: Readonly<Record<MaturityLevel, number>> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
};

const DIMENSION_LABEL: Readonly<Record<ReadinessDimension, string>> = {
  data: 'data / grounding',
  control: 'control / guardrail',
  eval: 'eval / regression',
};

// ─── Intent extraction ─────────────────────────────────────────────────────

/**
 * The archetype a proposed Move's *framing* points at — before readiness is
 * weighed. This is deterministic keyword classification over the free text;
 * the Moves shaping conversation can refine it before the final assessment.
 *
 * Order is load-bearing: the most specific / most ambitious signals are
 * tested first so a Move that mentions both "automate" and "autonomous
 * end-to-end" is read as the latter.
 */
export function intendedArchetypeFor(proposedMove: string): SolutionArchetypeKey {
  const text = proposedMove.toLowerCase();

  // Process redesign — the customer wants to automate a process "as it runs
  // today" / "exactly", or names the process as broken/convoluted.
  if (
    /\b(as it (runs|works) today|exactly as|current \d+[- ]step|as-is process)\b/.test(text) ||
    /\b(broken|convoluted|redundant|dysfunctional) process\b/.test(text)
  ) {
    return 'process_redesign';
  }

  // Vendor-led — explicit "instead of building", "adopt", "buy", "vendor".
  if (
    /\b(instead of building|rather than build|adopt (an?|a )|buy an?|vendor|off[- ]the[- ]shelf|packaged solution)\b/.test(
      text,
    )
  ) {
    return 'vendor_led_implementation';
  }

  // Full agentic workflow — explicit autonomy with no human in the loop.
  if (
    /\b(fully autonomous|no human in the loop|without a human|run .* autonomously|end[- ]to[- ]end .* autonom)\b/.test(
      text,
    )
  ) {
    return 'full_agentic_workflow';
  }

  // Human-in-the-loop agent — the Move takes consequential action but with
  // review/approval/checkpoints, or "resolve end-to-end" with approval.
  if (
    /\b(approval|approve|checkpoint|review|supervisor|sign[- ]off)\b/.test(text) &&
    /\b(resolve|issue|update|action|execute|take|process|handle)\b/.test(text)
  ) {
    return 'human_in_loop_agent';
  }

  // Retrieval copilot — grounded Q&A / cited answers over tenant facts.
  if (
    /\b(answer|ask|question|cited|copilot|look up|policy|policies|knowledge)\b/.test(text) &&
    !/\bdraft (a|the|weekly|store)/.test(text)
  ) {
    return 'retrieval_copilot';
  }

  // Assistant — drafting / summarising help for a human to review.
  if (/\b(draft|help .* (write|draft)|summari|rewrite|compose|faster)\b/.test(text)) {
    return 'assistant';
  }

  // Anything else with explicit "agent" + action verbs reads as an HITL agent;
  // a bare "automate / auto-match" reads as deterministic automation.
  if (/\bagent\b/.test(text)) {
    return 'human_in_loop_agent';
  }
  return 'automation';
}

// ─── Readiness scoring ─────────────────────────────────────────────────────

/** Build the readiness gaps between an archetype's gates and a profile. */
function gapsFor(
  archetype: SolutionArchetype,
  readiness: ReadinessProfile,
): SuitabilityGap[] {
  const gaps: SuitabilityGap[] = [];
  for (const gate of archetype.readinessGates) {
    const current = readiness[gate.dimension];
    if (!meetsReadiness(current, gate.minimum)) {
      gaps.push({
        dimension: gate.dimension,
        current,
        required: gate.minimum,
        note: gate.rationale,
      });
    }
  }
  return gaps;
}

/** A 0–100 readiness score: 100 when every gate is met. */
function scoreReadiness(
  archetype: SolutionArchetype,
  readiness: ReadinessProfile,
): number {
  const gates = archetype.readinessGates;
  if (gates.length === 0) return 100;
  let metFraction = 0;
  for (const gate of gates) {
    const have = MATURITY_RANK[readiness[gate.dimension]];
    const need = MATURITY_RANK[gate.minimum];
    metFraction += need === 0 ? 1 : Math.min(1, have / need);
  }
  return Math.round((100 * metFraction) / gates.length);
}

/**
 * Is `a` a less agentically-ambitious archetype than `b`? Used to decide
 * whether a recommendation is a genuine step-down from the customer's intent.
 */
function isLessAmbitious(a: SolutionArchetypeKey, b: SolutionArchetypeKey): boolean {
  return getSolutionArchetype(a).agenticAmbition < getSolutionArchetype(b).agenticAmbition;
}

// ─── The recommendation engine ─────────────────────────────────────────────

/**
 * Resolve the responsible archetype for an intended pick + readiness. This is
 * where the over-reach correction lives: a customer who frames a full agentic
 * workflow on low control/eval maturity is stepped down to a human-in-loop
 * agent; a copilot on an absent corpus is rerouted to data remediation.
 */
function resolveRecommendation(
  intended: SolutionArchetypeKey,
  readiness: ReadinessProfile,
): { recommended: SolutionArchetypeKey; antiPattern: string | null } {
  // A grounding-dependent agentic archetype with no usable corpus is not an
  // agentic project yet — it is a data-remediation project. `low` or `none`
  // data readiness against a `high` data gate is the §6 grounding gap.
  const groundingDependent: ReadonlySet<SolutionArchetypeKey> = new Set([
    'retrieval_copilot',
    'human_in_loop_agent',
    'full_agentic_workflow',
  ]);
  if (
    groundingDependent.has(intended) &&
    MATURITY_RANK[readiness.data] <= MATURITY_RANK.low
  ) {
    return { recommended: 'data_remediation', antiPattern: 'copilot_on_stale_corpus' };
  }

  // Full agentic workflow is the canonical over-reach. If control or eval
  // maturity is below the `high` bar it demands, step down one tier to a
  // human-in-the-loop agent — the safe predecessor stage.
  if (intended === 'full_agentic_workflow') {
    const full = getSolutionArchetype('full_agentic_workflow');
    if (gapsFor(full, readiness).length > 0) {
      return {
        recommended: 'human_in_loop_agent',
        antiPattern: 'full_agentic_on_low_data_readiness',
      };
    }
  }

  // Otherwise the intended archetype is the recommendation; readiness gaps,
  // if any, are reported in place rather than abandoning the capability.
  return { recommended: intended, antiPattern: null };
}

/** Assemble practitioner reasons for a recommendation. */
function buildReasons(
  recommended: SolutionArchetype,
  gaps: SuitabilityGap[],
  steppedDown: boolean,
  intended: SolutionArchetypeKey,
): string[] {
  const reasons: string[] = [];

  if (steppedDown) {
    const intendedName = getSolutionArchetype(intended).name;
    if (recommended.key === 'data_remediation') {
      reasons.push(
        `The ${intendedName.toLowerCase()} the customer wants depends on a grounding corpus that is missing or stale.`,
      );
      reasons.push(
        'The §6 data-readiness assessment finds the context this use case needs is not available or fresh.',
      );
      reasons.push('The honest sequencing is a data project first, agentic project second.');
      return reasons;
    }
    reasons.push(
      `${intendedName} is over-reach: control and eval maturity are below the high bar it requires.`,
    );
    reasons.push('There is no prior human-in-loop stage proving the workflow steps.');
    reasons.push(
      'The expert shape is a human-in-the-loop agent first, closing data, control, and eval gaps.',
    );
    return reasons;
  }

  // Not stepped down — explain why this archetype fits, lead with its own
  // first fit condition (principal-architect voice, from the taxonomy).
  reasons.push(recommended.whenItFits[0]);
  if (recommended.whenItFits[1]) reasons.push(recommended.whenItFits[1]);

  if (gaps.length > 0) {
    const dims = gaps.map((g) => DIMENSION_LABEL[g.dimension]).join(', ');
    reasons.push(
      `Close ${gaps.length} readiness gate${gaps.length > 1 ? 's' : ''} first — ${dims} — before committing the build.`,
    );
  } else {
    reasons.push('The tenant clears every readiness gate for this archetype — the bet is ready to shape.');
  }
  return reasons;
}

/**
 * Assess a proposed Move's agentic suitability. The single entry point the
 * Moves surface composes — pure, deterministic, no I/O.
 */
export function assessAgenticSuitability(
  proposedMove: string,
  readiness: ReadinessProfile,
): SuitabilityAssessment {
  const intended = intendedArchetypeFor(proposedMove);
  const { recommended: recommendedKey, antiPattern } = resolveRecommendation(
    intended,
    readiness,
  );
  const recommended = getSolutionArchetype(recommendedKey);
  const steppedDown = recommendedKey !== intended;

  // A precondition archetype (data_remediation / process_redesign) reports the
  // readiness the *downstream* blocked use case needs, not its own permissive
  // gate — so the CXO sees the size of the lift. Other archetypes report
  // their own unmet gates.
  let gaps: SuitabilityGap[];
  if (steppedDown && recommendedKey === 'data_remediation') {
    gaps = gapsFor(getSolutionArchetype('retrieval_copilot'), readiness).filter(
      (g) => g.dimension === 'data',
    );
  } else {
    gaps = gapsFor(recommended, readiness);
  }

  return {
    recommendedArchetype: recommendedKey,
    recommendedName: recommended.name,
    intendedArchetype: intended,
    steppedDown: steppedDown && isLessAmbitious(recommendedKey, intended),
    antiPatternCode: antiPattern,
    readinessScore: scoreReadiness(recommended, readiness),
    readinessGaps: gaps,
    reasons: buildReasons(recommended, gaps, steppedDown, intended),
  };
}
