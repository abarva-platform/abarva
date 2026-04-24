'use client';

// Nexus chat rail for tenant program detail pages · C2-05
//
// Dr. L: "I could not find a standalone Nexus chat surface — /preview/
// programs redirects to the programs list with no chat affordance.
// 'Nexus' appears only as a handoff target from Atlas."
//
// Fix: mount the shared AgentRail primitive on every tenant program
// detail page with Nexus profile pre-loaded and the program as the
// context badge. Collapsed by default (persistent-narrow-rail per the
// canonical geometry); expands on click into a 380px side panel with
// guided-choice prompts shaped by program phase.
//
// This is a discoverability fix. The rail doesn't add new reasoning —
// it exposes the existing agent surface on a page where sponsors are
// actually doing work.

import { useCallback, useMemo, useState } from 'react';
import type { ProgramSeedPlan, TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { AgentRail, AGENTS } from '@/components/agent-rail/AgentRail';
import type { AgentTurn } from '@/components/agent-rail/AgentRail';

interface NexusProgramRailProps {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
}

export function NexusProgramRail({ tenant, program }: NexusProgramRailProps) {
  const [conversation, setConversation] = useState<AgentTurn[]>(() => [
    {
      id: 'nexus-opener',
      speaker: 'agent',
      text: `${program.name}. Phase ${program.currentPhaseSpec}. I can walk the charter, pressure-test the business case, or surface contradictions. What\u2019s on your mind?`,
    },
  ]);

  const handleChoice = useCallback(
    (choiceId: string) => {
      const you: AgentTurn = {
        id: `you-${Date.now()}`,
        speaker: 'you',
        text: choiceLabelFor(choiceId),
      };
      const agentReply: AgentTurn = {
        id: `nexus-${Date.now()}`,
        speaker: 'agent',
        text: replyFor(choiceId, program),
      };
      setConversation((prev) => [...prev, you, agentReply]);
    },
    [program],
  );

  const handleEscape = useCallback(
    (text: string) => {
      const you: AgentTurn = {
        id: `you-${Date.now()}`,
        speaker: 'you',
        text,
      };
      const agentReply: AgentTurn = {
        id: `nexus-${Date.now()}`,
        speaker: 'agent',
        text: `Heard. Free-text reasoning runs through the Programs/Nexus runtime — it resolves against the pattern library and this program\u2019s evidence. For Phase ${program.currentPhaseSpec} on ${program.name}, the defensible next step is to open the deliverable the question is about and inspect the evidence chain directly.`,
      };
      setConversation((prev) => [...prev, you, agentReply]);
    },
    [program],
  );

  const guidedChoice = useMemo(
    () => ({
      prompt: 'What do you want to do with Nexus on this program?',
      options: [
        { id: 'walk-charter', label: 'Walk me through the charter', sub: 'Scope, target state, success metrics' },
        { id: 'pressure-test', label: 'Pressure-test the business case', sub: 'What assumptions might not hold?' },
        { id: 'surface-contradictions', label: 'Surface the top contradictions', sub: 'Blockers to value or trust' },
        { id: 'phase-readiness', label: 'Am I ready to advance this phase?', sub: `Gate conditions for P${program.currentPhaseSpec}` },
        { id: 'next-step', label: 'What\u2019s the next step I should take?', sub: 'Concrete decision or action' },
      ],
    }),
    [program.currentPhaseSpec],
  );

  return (
    <AgentRail
      agent={AGENTS.nexus}
      conversation={conversation}
      guidedChoice={guidedChoice}
      onChoice={handleChoice}
      onEscape={handleEscape}
      contextBadge={`${tenant.displayName} \u00b7 ${program.code}`}
    />
  );
}

function choiceLabelFor(choiceId: string): string {
  switch (choiceId) {
    case 'walk-charter':
      return 'Walk me through the charter.';
    case 'pressure-test':
      return 'Pressure-test the business case.';
    case 'surface-contradictions':
      return 'Surface the top contradictions.';
    case 'phase-readiness':
      return 'Am I ready to advance this phase?';
    case 'next-step':
      return "What's the next step I should take?";
    default:
      return choiceId;
  }
}

function replyFor(choiceId: string, program: ProgramSeedPlan): string {
  const name = program.name;
  const phase = program.currentPhaseSpec;
  switch (choiceId) {
    case 'walk-charter':
      return `${name} charter lives in D01. The three sections that carry the weight are scope, target state, and success metrics. Open D01 and walk it top-down; flag any bullet you can\u2019t defend to the sponsor.`;
    case 'pressure-test':
      return `The business case for ${name} sits in D16 with its financial model and in D17 as the decision memo. Pressure-test order: (1) name the counterfactual, (2) verify the attribution methodology, (3) check confidence intervals on the headline numbers, (4) check whether the risk register names real financial/operational risks rather than meta-risks about the artifact itself.`;
    case 'surface-contradictions':
      return `Contradictions surface as pressure cards on the Tower. The ones that apply to ${name} show up under Active Programs. If the program is showing zero contradictions that doesn\u2019t mean zero exist \u2014 check whether the Tower has recent telemetry for this program.`;
    case 'phase-readiness':
      return `P${phase} gate conditions for ${name} are listed on the phase page. The honest answer is \u201cyou\u2019re ready when every prerequisite deliverable is at Rich tier, every evidence citation resolves, every open decision has a named owner and target date, and the disclaimer footer is dismissable\u201d \u2014 because the sponsor will check exactly that list.`;
    case 'next-step':
      return `For ${name} at P${phase}, the highest-leverage next step is almost always to close one named open decision and replace one seeded assumption with sponsor-verified evidence. Pick the deliverable carrying the most dollars and work backward from its open-decisions list.`;
    default:
      return `Noted. Give me a more specific prompt and I\u2019ll respond against ${name}\u2019s phase ${phase} context.`;
  }
}
