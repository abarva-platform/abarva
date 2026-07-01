// composeOriginateFirstMessage · Strategic Moves Originate Layer 5 §2
//
// Server-side helper that selects the correct Nexus opening message
// based on entry context. Three variants per the Layer 5 spec:
//   2A — empty entry (no draft, first visit)
//   2B — partial draft return (persisted draft with ≥1 confirmed field)
//   2C — not generated here; the client detects large pastes at runtime
//
// Variant 2C is detected client-side when the user's first input is
// 500+ characters; Nexus handles it inline. This helper covers 2A/2B.

import type { TenancyCtx } from "@/lib/programs/types.db";
import { getOpenDraft } from "@/lib/programs/origination-drafts";
import {
  isPatternBindable,
  requiredGroundingForText,
} from "@/lib/intelligence-v3/pattern-grounding";

export interface OriginateFirstMessage {
  role: "assistant";
  agentName: "Nexus";
  text: string;
  id: string;
}

/** Context passed when the user arrives at /strategic-moves/new via the
 *  "Shape into a Move →" CTA on an AI Initiative detail page.
 *  Triggers variant 2D which pre-loads the initiative as the Move seed. */
export interface FromInitiativeCtx {
  displayId: string; // e.g. "MH-06"
  name: string; // e.g. "Joule (SAP) Pilot for Finance"
  statusFlag: string; // e.g. "VALUE_LAG"
  gapUsd: number | null; // abs(committed - measured), in USD
  ownerName: string; // sponsor candidate name
  goalName: string; // primary business goal name
}

/** Context passed when the user arrives from Intelligence pattern evidence. */
export interface FromIntelligenceCtx {
  patternId: string;
  patternName: string;
  useCaseName: string;
  sessionId?: string | null;
  sourceTitle?: string | null;
  contradictionTitle?: string | null;
  failureRatePct?: number | null;
}

// Step label and one-line description per Layer 5 §2B table.
const SCAFFOLD_STEP_DESCRIPTIONS: Record<
  number,
  { name: string; description: string }
> = {
  1: {
    name: "What's the bet / hypothesis",
    description: "Capturing the core business hypothesis for this Move",
  },
  2: {
    name: "Archetype classification",
    description: "Classifying this Move into the right AbarVa archetype",
  },
  3: {
    name: "Sponsor candidate",
    description: "Identifying who should sponsor this Move",
  },
  4: {
    name: "Scope / boundary",
    description: "Defining what is in and out of scope for this Move",
  },
  5: {
    name: "Evidence family selection",
    description: "Choosing which evidence types to gather in P2",
  },
  6: {
    name: "Value hypothesis seed",
    description: "Drafting a preliminary value hypothesis",
  },
  7: {
    name: "Foundation readiness",
    description: "Checking the four foundation readiness criteria (F1–F4)",
  },
};

function detectLastCompletedStep(
  brief: {
    problemStatement: string | null;
    classification: string | null;
    sponsor: string | null;
    timeline: string | null;
    targetOutcome: string | null;
  } | null,
): number {
  if (!brief) return 0;
  // Map brief fields to scaffold steps in order
  const fieldChecks: Array<() => boolean> = [
    () => !!brief.problemStatement,
    () => !!brief.classification,
    () => !!brief.sponsor,
    () => !!brief.timeline,
    () => false, // evidence family — not yet in brief schema
    () => !!brief.targetOutcome,
    () => false, // foundation readiness — not yet in brief schema
  ];
  let lastComplete = 0;
  for (let i = 0; i < fieldChecks.length; i++) {
    if (fieldChecks[i]()) lastComplete = i + 1;
  }
  return lastComplete;
}

// ---------------------------------------------------------------------
// Variant 2D — arrive from "Shape into a Move →" CTA on an AI Initiative
// ---------------------------------------------------------------------

function composeFromInitiativeMessage(
  from: FromInitiativeCtx,
): OriginateFirstMessage {
  const gapLine =
    from.gapUsd !== null && from.gapUsd > 0
      ? ` with a $${(from.gapUsd / 1_000_000).toFixed(1)}M gap between committed and measured value`
      : "";

  const statusNote =
    from.statusFlag === "VALUE_LAG"
      ? `This is a Value Lag pattern${gapLine}. That's a strong candidate for a value-recovery Move.`
      : from.statusFlag === "HEALTHY"
        ? `This initiative is tracking healthy${gapLine} — a good candidate for an expansion or scale-up Move.`
        : from.statusFlag === "AT_RISK"
          ? `This initiative is flagged At Risk${gapLine}. A corrective Move can address the root cause.`
          : `This initiative has status ${from.statusFlag}${gapLine}.`;

  const sponsorLine = from.ownerName
    ? `${from.ownerName} is listed as initiative owner — are they the right sponsor for this Move, or is someone else leading the recovery?`
    : "Who should sponsor this Move?";

  return {
    role: "assistant",
    agentName: "Nexus",
    text: `You're launching this Move from ${from.displayId} — ${from.name} (goal: ${from.goalName}).

${statusNote}

To build the brief, I need seven clear inputs: what is causing this, the Move archetype, who should sponsor the recovery, what scope makes this tractable, the evidence family, the value hypothesis, and foundation readiness.

${sponsorLine}`,
    id: `originate-open-2d-${from.displayId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
  };
}

function composeFromIntelligenceMessage(
  from: FromIntelligenceCtx,
): OriginateFirstMessage {
  const sourceLine = from.sourceTitle
    ? `Evidence source: ${from.sourceTitle}.`
    : "Evidence source: use the linked Intelligence source summaries as the evidence family.";
  const contradictionLine = from.contradictionTitle
    ? `Open tension: ${from.contradictionTitle}.`
    : "Open tension: confirm the sponsor, platform, and data-readiness assumptions before chartering.";
  const failureLine =
    typeof from.failureRatePct === "number" &&
    Number.isFinite(from.failureRatePct)
      ? `The linked Genome pattern carries an estimated ${Math.round(from.failureRatePct)}% failure risk without controls.`
      : "The linked Genome pattern has a material failure risk without controls.";

  // Grounding-namespace guard (fail closed). A treasury/Kyriba Move must bind a
  // treasury pattern (LSH-TMS-*); a corpus id like PAT-LSH-D18-00479 is dropped.
  // The dropped id is NEVER echoed into the Move text — only into a diagnostic.
  const grounding = requiredGroundingForText(from.useCaseName);
  const patternBindable = isPatternBindable(from.patternId, grounding);
  if (!patternBindable) {
    console.warn(
      `[pattern-grounding] originate: dropped off-namespace pattern "${from.patternId}" ` +
        `for use case "${from.useCaseName}" (required ${grounding}); not citing it in the Move.`,
    );
  }
  const bindingLine = patternBindable
    ? `Binding pattern: ${from.patternId} — ${from.patternName}. ${failureLine}`
    : `Binding pattern: I'll bind a validated ${grounding} pattern from the registry — the inbound reference was off-namespace for this card and was dropped, so the Move will not cite it.`;
  const idSuffix = (patternBindable ? from.patternId : `${grounding}-unbound`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");

  return {
    role: "assistant",
    agentName: "Nexus",
    text: `You're shaping a Strategic Move from Intelligence: ${from.useCaseName}.

${bindingLine}

${sourceLine}
${contradictionLine}

To turn this into a Move, I need seven clear inputs: the business outcome, archetype, executive sponsor, scope boundary, evidence family, value hypothesis, and foundation readiness. My suggested first draft is a pattern-controlled Move that proves the use case only after the data and ownership contradictions are resolved.`,
    id: `originate-open-intelligence-${idSuffix}`,
  };
}

// ---------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------

export async function composeOriginateFirstMessage(
  ctx: TenancyCtx,
  fromInitiative?: FromInitiativeCtx | null,
  fromIntelligence?: FromIntelligenceCtx | null,
): Promise<OriginateFirstMessage> {
  if (fromIntelligence?.patternId) {
    return composeFromIntelligenceMessage(fromIntelligence);
  }

  // 2D — arriving from "Shape into a Move →" on an AI Initiative page
  if (fromInitiative?.displayId) {
    return composeFromInitiativeMessage(fromInitiative);
  }

  let draft = null;
  try {
    draft = await getOpenDraft(ctx, "/strategic-moves/new");
  } catch {
    // Draft read failure is non-fatal — fall through to empty entry
  }

  const uncommitted = draft?.committed_engagement_id == null ? draft : null;
  const brief = uncommitted?.state?.brief ?? null;
  const lastCompleted = detectLastCompletedStep(brief);

  // 2B — partial draft return
  if (lastCompleted > 0) {
    const completedStep = SCAFFOLD_STEP_DESCRIPTIONS[lastCompleted];
    const nextStep =
      lastCompleted < 7 ? SCAFFOLD_STEP_DESCRIPTIONS[lastCompleted + 1] : null;

    const text = nextStep
      ? `Welcome back. You left off at ${completedStep.name} (${lastCompleted} of 7). Next, we should clarify ${nextStep.name.toLowerCase()}. Ready to continue, or do you want to review what has been captured so far?`
      : `Your brief looks complete. Review the canvas sections and click Promote to P1 Charter when you're ready.`;

    return {
      role: "assistant",
      agentName: "Nexus",
      text,
      id: "originate-open-2b",
    };
  }

  // 2A — empty entry (default)
  return {
    role: "assistant",
    agentName: "Nexus",
    text: `Describe the business problem or opportunity in plain English. A note, email thread, board memo, or problem statement is enough. I will help turn it into a clear Move brief: the bet, sponsor, scope, evidence needed, value hypothesis, and readiness checks.`,
    id: "originate-open-2a",
  };
}
