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

import type { TenancyCtx } from '@/lib/programs/types.db';
import { getOpenDraft } from '@/lib/programs/origination-drafts';

export interface OriginateFirstMessage {
  role: 'assistant';
  agentName: 'Nexus';
  text: string;
  id: string;
}

/** Context passed when the user arrives at /strategic-moves/new via the
 *  "Shape into a Move →" CTA on an AI Initiative detail page.
 *  Triggers variant 2D which pre-loads the initiative as the Move seed. */
export interface FromInitiativeCtx {
  displayId: string;   // e.g. "MH-06"
  name: string;        // e.g. "Joule (SAP) Pilot for Finance"
  statusFlag: string;  // e.g. "VALUE_LAG"
  gapUsd: number | null; // abs(committed - measured), in USD
  ownerName: string;   // sponsor candidate name
  goalName: string;    // primary business goal name
}

// Step label and one-line description per Layer 5 §2B table.
const SCAFFOLD_STEP_DESCRIPTIONS: Record<
  number,
  { name: string; description: string }
> = {
  1: { name: "What's the bet / hypothesis", description: 'Capturing the core business hypothesis for this Move' },
  2: { name: 'Archetype classification', description: 'Classifying this Move into the right AbarVa archetype' },
  3: { name: 'Sponsor candidate', description: "Identifying who should sponsor this Move" },
  4: { name: 'Scope / boundary', description: 'Defining what is in and out of scope for this Move' },
  5: { name: 'Evidence family selection', description: 'Choosing which evidence types to gather in P2' },
  6: { name: 'Value hypothesis seed', description: 'Drafting a preliminary value hypothesis' },
  7: { name: 'Foundation readiness', description: 'Checking the four foundation readiness criteria (F1–F4)' },
};

function detectLastCompletedStep(brief: {
  problemStatement: string | null;
  classification: string | null;
  sponsor: string | null;
  timeline: string | null;
  targetOutcome: string | null;
} | null): number {
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

function composeFromInitiativeMessage(from: FromInitiativeCtx): OriginateFirstMessage {
  const gapLine =
    from.gapUsd !== null && from.gapUsd > 0
      ? ` with a **$${(from.gapUsd / 1_000_000).toFixed(1)}M gap** between committed and measured value`
      : '';

  const statusNote =
    from.statusFlag === 'VALUE_LAG'
      ? `This is a **Value Lag** pattern${gapLine}. That's a strong candidate for a value-recovery Move.`
      : from.statusFlag === 'HEALTHY'
        ? `This initiative is tracking healthy${gapLine} — a good candidate for an expansion or scale-up Move.`
        : from.statusFlag === 'AT_RISK'
          ? `This initiative is flagged **At Risk**${gapLine}. A corrective Move can address the root cause.`
          : `This initiative has status **${from.statusFlag}**${gapLine}.`;

  const sponsorLine = from.ownerName
    ? `**${from.ownerName}** is listed as initiative owner — are they the right sponsor for this Move, or is someone else leading the recovery?`
    : 'Who should sponsor this Move?';

  return {
    role: 'assistant',
    agentName: 'Nexus',
    text: `You're launching this Move from **${from.displayId} — ${from.name}** (goal: ${from.goalName}).

${statusNote}

To build the brief, I need four things: your read on **what's causing this**, **who should sponsor** the recovery, **what scope** makes this tractable in one Move, and a **value hypothesis** for what's recoverable.

${sponsorLine}`,
    id: `originate-open-2d-${from.displayId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  };
}

// ---------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------

export async function composeOriginateFirstMessage(
  ctx: TenancyCtx,
  fromInitiative?: FromInitiativeCtx | null,
): Promise<OriginateFirstMessage> {
  // 2D — arriving from "Shape into a Move →" on an AI Initiative page
  if (fromInitiative?.displayId) {
    return composeFromInitiativeMessage(fromInitiative);
  }

  let draft = null;
  try {
    draft = await getOpenDraft(ctx, '/strategic-moves/new');
  } catch {
    // Draft read failure is non-fatal — fall through to empty entry
  }

  const uncommitted = draft?.committed_engagement_id == null ? draft : null;
  const brief = uncommitted?.state?.brief ?? null;
  const lastCompleted = detectLastCompletedStep(brief);

  // 2B — partial draft return
  if (lastCompleted > 0) {
    const completedStep = SCAFFOLD_STEP_DESCRIPTIONS[lastCompleted];
    const nextStep = lastCompleted < 7 ? SCAFFOLD_STEP_DESCRIPTIONS[lastCompleted + 1] : null;

    const text = nextStep
      ? `Welcome back. You left off at **${completedStep.name}** (step ${lastCompleted} of 7). Your next step is **${nextStep.name}** — ${nextStep.description}. Ready to continue, or want to review what's been captured so far?`
      : `Your brief looks complete. Review the canvas sections and click Promote to P1 Charter when you're ready.`;

    return {
      role: 'assistant',
      agentName: 'Nexus',
      text,
      id: 'originate-open-2b',
    };
  }

  // 2A — empty entry (default)
  return {
    role: 'assistant',
    agentName: 'Nexus',
    text: `To start a new Strategic Move, I need four things from you: the outcome you're targeting, who cares about it, what evidence you have, and a rough sense of what value is at stake. You can type a description or paste something — a CEO note, email thread, board memo, or problem statement. Where do you want to start?`,
    id: 'originate-open-2a',
  };
}
