// Source · d22 BAFO Question Pack payload binder
//
// Strategy:
//   1. Pull vendors from d12 shortlist; default to placeholder list
//   2. Pull trap-driven questions from d20 trap log: every open P0/P1
//      becomes one question. When d20 isn't authored, generate baseline
//      trap questions from the archetype defaults.
//   3. Pull value-uplift questions from a curated archetype catalog —
//      these don't depend on substrate, they're "things every BAFO
//      should ask in this category" boilerplate.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  BafoQuestion,
  BafoQuestionPackPayload,
} from '../renderers/bafo-question-pack';
import { buildTrapLogPayloadFromContext } from './trap-log-payload';

export function buildBafoQuestionPackPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): BafoQuestionPackPayload {
  const d12 = ctx.artifactStates.find((a) => a.artifactCode === 'd12_vendor_shortlist');
  const vendors = d12?.body
    ? extractVendorsFromShortlist(d12.body)
    : defaultVendors();

  // Re-use the trap-log binder so trap questions stay in sync with what
  // the trap log itself shows. Convert open P0/P1 traps → questions.
  const trapPayload = buildTrapLogPayloadFromContext(ctx, generatedAt);
  const trapQuestions = trapPayload.rows
    .filter((r) => r.severity === 'P0' || r.severity === 'P1')
    .map((trap) => trapToQuestion(trap));

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    roundLabel: 'BAFO Round 1',
    vendors,
    trapQuestions,
    valueQuestions: defaultValueQuestionsForArchetype(ctx.event.archetype),
  };
}

function trapToQuestion(trap: {
  id: string;
  severity: 'P0' | 'P1' | 'P2';
  category: string;
  description: string;
}): BafoQuestion {
  return {
    id: `TQ-${trap.id.replace(/^T-/, '')}`,
    source: trap.id,
    severity: trap.severity,
    question: `Re ${trap.category}: ${trap.description} — provide your final position with redline against our locked assumption set, and any commercial accommodation.`,
    responseFormat:
      trap.severity === 'P0'
        ? 'Yes/no + redline + revised pricing impact ($)'
        : 'Yes/no + redline OR documented accommodation',
  };
}

function extractVendorsFromShortlist(md: string): string[] {
  const out: string[] = [];
  for (const line of md.split('\n')) {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bullet || !bullet[1]) continue;
    const head = bullet[1].split(/—|–|-{2}|:|\(/)[0]?.trim() ?? '';
    if (head.length === 0 || head.length > 60) continue;
    if (/disqualified|excluded|removed/i.test(bullet[1])) continue;
    out.push(head);
  }
  return out.length > 0 ? out : defaultVendors();
}

function defaultVendors(): string[] {
  // Match the d16 scorecard default to keep cross-artifact references
  // consistent when the buyer hasn't authored a real shortlist.
  return ['Vendor A', 'Vendor B', 'Vendor C'];
}

function defaultValueQuestionsForArchetype(
  archetype: string | null,
): BafoQuestion[] {
  const family = (archetype ?? '').toLowerCase();
  const base: BafoQuestion[] = [
    {
      id: 'VQ-INNOV-01',
      source: 'Innovation roadmap',
      severity: 'n/a',
      question:
        'Beyond the in-scope deliverables, what platform / tooling investments will your firm make over the contract term that this engagement will inherit at no additional cost?',
      responseFormat: 'Roadmap milestones + investment ($) + inheritance terms',
    },
    {
      id: 'VQ-AI-01',
      source: 'AI / automation',
      severity: 'n/a',
      question:
        'Quantify the productivity uplift your AI / automation tooling will deliver against the proposed operating model. State the baseline you measure against and the measurement cadence.',
      responseFormat: 'Quantified % uplift + baseline + measurement cadence',
    },
    {
      id: 'VQ-SHARED-01',
      source: 'Shared-risk pricing',
      severity: 'n/a',
      question:
        'Propose an alternative shared-risk or outcome-based pricing model. Describe the risk boundaries, measurement, and what happens if the boundary is breached.',
      responseFormat: 'Model description + boundary + remedy',
    },
    {
      id: 'VQ-EXIT-01',
      source: 'Exit posture',
      severity: 'n/a',
      question:
        'Describe your exit posture: what we get free at contract end (runbooks, automation IP, knowledge transfer), what carries cost, and what carries a license.',
      responseFormat: 'Inclusion list + cost list + license list',
    },
  ];
  if (family.includes('cloud') || family.includes('infrastructure')) {
    base.push({
      id: 'VQ-CLOUD-01',
      source: 'Migration credits',
      severity: 'n/a',
      question:
        'List any platform credits, partner-program incentives, or migration-fund commitments your firm will pass through. State which require buyer marketing co-investment.',
      responseFormat: '$ list + conditions + co-investment expectations',
    });
  }
  if (family.includes('ams') || family.includes('managed')) {
    base.push({
      id: 'VQ-AMS-01',
      source: 'Continuous improvement',
      severity: 'n/a',
      question:
        'Commit to a year-over-year unit-cost reduction target driven by your automation roadmap. State the % and the measurement basis.',
      responseFormat: 'Annual % reduction commitment + measurement basis',
    });
  }
  return base;
}
