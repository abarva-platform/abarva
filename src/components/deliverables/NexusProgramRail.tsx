'use client';

// Nexus chat rail for tenant program detail pages · S9b binding.
//
// History:
// - Initially shipped (C2-05) as a guided-choice rail with hardcoded
//   reply prose. The shared <AgentRail> primitive owned the geometry;
//   this file just produced AgentTurn entries.
// - S9b binds each agent reply to a deterministic RenderedResponse with
//   honest_disclosure metadata so confidence, context-used, and missing-
//   input affordances render through <AgentResponse> (S6 wiring) rather
//   than as plain prose. No live agent / model call.
//
// Public props are unchanged: { tenant, program }. Geometry is unchanged.
// Conversation prose is more concise but the reply lattice is the same
// five canonical Programs-rail choices plus the "ask something else"
// escape hatch.

import { useCallback, useMemo, useState } from 'react';
import type { ProgramSeedPlan, TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { AgentRail, AGENTS } from '@/components/agent-rail/AgentRail';
import type { AgentTurn } from '@/components/agent-rail/AgentRail';
import {
  buildProgramNexusRailChoices,
  buildProgramNexusRenderedResponse,
  type ProgramNexusRailMode,
} from '@/lib/programs/programs-nexus-rail-view';

interface NexusProgramRailProps {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
}

const FREE_TEXT_TURN_ID = 'nexus-free-text';

export function NexusProgramRail({ tenant, program }: NexusProgramRailProps) {
  const opener = useMemo(
    () => buildProgramNexusRenderedResponse(tenant, program, 'opener'),
    [tenant, program],
  );

  const [conversation, setConversation] = useState<AgentTurn[]>(() => [
    {
      id: 'nexus-opener',
      speaker: 'agent',
      text: opener.rendered.response_text,
      rendered: opener.rendered,
    },
  ]);

  const handleChoice = useCallback(
    (choiceId: string) => {
      const mode = isProgramNexusRailMode(choiceId) ? choiceId : 'next-step';
      const turn = buildProgramNexusRenderedResponse(tenant, program, mode);
      const you: AgentTurn = {
        id: `you-${choiceId}-${conversationLength(conversation)}`,
        speaker: 'you',
        text: choiceLabelFor(choiceId),
      };
      const agentReply: AgentTurn = {
        id: `nexus-${choiceId}-${conversationLength(conversation)}`,
        speaker: 'agent',
        text: turn.rendered.response_text,
        rendered: turn.rendered,
      };
      setConversation((prev) => [...prev, you, agentReply]);
    },
    [tenant, program, conversation],
  );

  const handleEscape = useCallback(
    (text: string) => {
      // Free-text is honored as a "next-step" framing in S9b. The
      // RenderedResponse still carries S5/S6 metadata so the renderer
      // shows confidence / context-used / missing-input affordances
      // without pretending we have a live model answer.
      const turn = buildProgramNexusRenderedResponse(tenant, program, 'next-step');
      const you: AgentTurn = {
        id: `${FREE_TEXT_TURN_ID}-you-${conversationLength(conversation)}`,
        speaker: 'you',
        text,
      };
      const agentReply: AgentTurn = {
        id: `${FREE_TEXT_TURN_ID}-${conversationLength(conversation)}`,
        speaker: 'agent',
        text: turn.rendered.response_text,
        rendered: turn.rendered,
      };
      setConversation((prev) => [...prev, you, agentReply]);
    },
    [tenant, program, conversation],
  );

  const guidedChoice = useMemo(() => {
    const options = buildProgramNexusRailChoices(tenant, program);
    return {
      prompt: 'What do you want to do with Nexus on this program?',
      options,
    };
  }, [tenant, program]);

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

// --- helpers ----------------------------------------------------------

function conversationLength(turns: AgentTurn[]): number {
  return turns.length;
}

function isProgramNexusRailMode(value: string): value is ProgramNexusRailMode {
  return (
    value === 'walk-charter'
    || value === 'pressure-test'
    || value === 'surface-contradictions'
    || value === 'phase-readiness'
    || value === 'next-step'
    || value === 'opener'
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
