'use client';

// Sentinel rail for tenant pattern detail pages · File 04 Z4-A
//
// Sentinel's companion to NexusProgramRail. Mounts on every tenant-
// scoped pattern page so Sentinel can take a pattern-anchored query
// with the tenant-overlay context preloaded.
//
// Guided-choice prompts mirror File 08 §5.2 Sentinel voice contract —
// evidence-forward, honest-when-thin, drill-down closers.

import { useCallback, useMemo, useState } from 'react';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { AgentRail, AGENTS } from '@/components/agent-rail/AgentRail';
import type { AgentTurn } from '@/components/agent-rail/AgentRail';

interface Props {
  tenant: TenantSeedPlan;
  patternSlug: string;
  patternName: string;
  evidenceCount: number;
  applicableProgramCount: number;
}

export function SentinelPatternRail({ tenant, patternSlug, patternName, evidenceCount, applicableProgramCount }: Props) {
  const [conversation, setConversation] = useState<AgentTurn[]>(() => {
    const openerConfidence = evidenceCount >= 3 ? 'MEDIUM' : 'LOW';
    const evidenceLine = evidenceCount === 0
      ? 'Evidence on this pattern is thin — zero formal sources on file.'
      : `${evidenceCount} authored source${evidenceCount === 1 ? '' : 's'} on file.`;
    const programsLine = applicableProgramCount === 0
      ? `${tenant.displayName} has no active program on this pattern.`
      : `${applicableProgramCount} ${tenant.displayName} program${applicableProgramCount === 1 ? '' : 's'} cite${applicableProgramCount === 1 ? 's' : ''} this pattern.`;
    return [
      {
        id: 'sentinel-opener',
        speaker: 'agent',
        text: `${patternName}. ${evidenceLine} ${programsLine} Confidence ${openerConfidence}. What do you want to walk?`,
      },
    ];
  });

  const handleChoice = useCallback((choiceId: string) => {
    const you: AgentTurn = {
      id: `you-${Date.now()}`,
      speaker: 'you',
      text: labelFor(choiceId),
    };
    const agentReply: AgentTurn = {
      id: `sentinel-${Date.now()}`,
      speaker: 'agent',
      text: replyFor(choiceId, patternName, tenant.displayName, evidenceCount, applicableProgramCount),
    };
    setConversation((prev) => [...prev, you, agentReply]);
  }, [patternName, tenant.displayName, evidenceCount, applicableProgramCount]);

  const handleEscape = useCallback((text: string) => {
    const you: AgentTurn = { id: `you-${Date.now()}`, speaker: 'you', text };
    const agentReply: AgentTurn = {
      id: `sentinel-${Date.now()}`,
      speaker: 'agent',
      text: `Heard. Free-text against ${patternName} routes through the Sentinel ask endpoint. Evidence on this pattern is ${evidenceCount === 0 ? 'thin — treat whatever follows as reasoned framing, not measured outcomes' : 'authored but not measured from deployed customers; composite tag applies'}.`,
    };
    setConversation((prev) => [...prev, you, agentReply]);
  }, [patternName, evidenceCount]);

  const guidedChoice = useMemo(() => ({
    prompt: `What do you want Sentinel to surface on ${patternName}?`,
    options: [
      { id: 'thesis', label: 'Walk the thesis', sub: 'Why this matters + core structural claim' },
      { id: 'detection', label: 'Detection signals', sub: 'What surfaces this pattern in a tenant' },
      { id: 'interventions', label: 'Interventions menu', sub: 'What has worked · with qualifiers' },
      { id: 'evidence-strength', label: 'How strong is the evidence?', sub: evidenceCount === 0 ? 'Honest: zero on file' : `${evidenceCount} sources · named` },
      { id: 'tenant-overlay', label: `Apply to ${tenant.displayName}`, sub: applicableProgramCount === 0 ? 'Not yet active here' : `${applicableProgramCount} program${applicableProgramCount === 1 ? '' : 's'}` },
    ],
  }), [patternName, evidenceCount, applicableProgramCount, tenant.displayName]);

  return (
    <AgentRail
      agent={AGENTS.sentinel}
      conversation={conversation}
      guidedChoice={guidedChoice}
      onChoice={handleChoice}
      onEscape={handleEscape}
      contextBadge={`${tenant.displayName} \u00b7 ${patternSlug}`}
    />
  );
}

function labelFor(choiceId: string): string {
  switch (choiceId) {
    case 'thesis': return 'Walk me through the thesis.';
    case 'detection': return 'What detection signals surface this pattern?';
    case 'interventions': return 'Show me the interventions menu.';
    case 'evidence-strength': return 'How strong is the evidence on this pattern?';
    case 'tenant-overlay': return 'How does this apply to this tenant?';
    default: return choiceId;
  }
}

function replyFor(choiceId: string, pattern: string, tenant: string, evidenceCount: number, programs: number): string {
  switch (choiceId) {
    case 'thesis':
      return `The ${pattern} thesis sits on the pattern detail page body. The load-bearing claim is usually in the first paragraph under "Why this matters" or "Pattern thesis". Open that section, then come back with the specific claim you want pressure-tested.`;
    case 'detection':
      return `Detection signals are the observable markers that say "this pattern is live here." They're listed on the pattern page. For a tenant-specific read, compare those signals against ${tenant}\u2019s actual telemetry — pattern matches without telemetry support are working hypotheses, not diagnoses.`;
    case 'interventions':
      return `The interventions list carries effectiveness qualifiers. Honest note: ${evidenceCount === 0 ? 'these are authored from industry knowledge, not measured from deployed customers — composite tag on every observation.' : `${evidenceCount} sources back the authored claims; outcomes from deployed customers are still composite-tagged.`} Pick the one closest to your current program phase and I'll walk the caveat.`;
    case 'evidence-strength':
      return evidenceCount === 0
        ? `Evidence on ${pattern} is thin — zero formal sources on file. The pattern's claims are authored framing, not measured outcomes. Treat as a hypothesis until ${tenant} or another tenant contributes a Phase 5 outcome.`
        : `${pattern} has ${evidenceCount} authored source${evidenceCount === 1 ? '' : 's'}. Open the Source list on the pattern page to see publisher, license class, and where each section was authored from. I don't conflate industry-authored content with measured customer outcomes.`;
    case 'tenant-overlay':
      return programs === 0
        ? `${tenant} has no active program on ${pattern} today. The pattern is still reference material — applying it requires a sponsor to charter a program that explicitly names this pattern. If you want, I can name the prerequisites a charter would need to clear.`
        : `${tenant} has ${programs} program${programs === 1 ? '' : 's'} citing ${pattern}. The highest active phase across those programs is listed on the tenant overlay panel. That tells you where the pattern is actually being exercised — and where the next evidence contribution to this pattern will come from.`;
    default:
      return `Sentinel noted the request. Give me a more specific prompt against ${pattern} and I\u2019ll respond against the tenant context.`;
  }
}
