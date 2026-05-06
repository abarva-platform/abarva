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

export async function composeOriginateFirstMessage(
  ctx: TenancyCtx,
): Promise<OriginateFirstMessage> {
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
