// Behavior tests for the response wisdom evaluation rubric (PR-3).

import { buildNexusTrace, type RawNexusSource } from '@/lib/agent-trace/build';
import { hashModelInput } from '@/lib/agent-trace/redaction';
import type { AgentContextTrace } from '@/lib/agent-trace/types';
import { evaluateAgentResponse } from '@/lib/agent-eval/rubric';
import type { InjectedJudgments } from '@/lib/agent-eval/types';

const base = {
  questionId: 'q-eval-1',
  tenantId: 'apexretail',
  tenantKey: 'apex-retail',
  surface: 'moves' as const,
  userIntent: 'research',
  modelInputHash: hashModelInput({ system: 's', user: 'u' }),
  emittedAt: '2026-06-09T00:00:00.000Z',
};

function groundedTrace(): AgentContextTrace {
  const sources: RawNexusSource[] = [
    { id: 'p1', type: 'pattern', name: 'Contact Center AI', confidence: 'high' },
    { id: 'f1', type: 'client_fact', name: 'Apex CC volume', confidence: 'high' },
    { id: 'f2', type: 'client_fact', name: 'Apex AHT baseline', confidence: 'medium' },
  ];
  return buildNexusTrace({
    ...base,
    sources,
    patternNamespace: 'retail',
    citationObjectsEmitted: ['p1', 'f1', 'f2'],
  });
}

function thinTrace(): AgentContextTrace {
  return buildNexusTrace({ ...base, sources: [], citationObjectsEmitted: [] });
}

describe('evaluateAgentResponse · deterministic dimensions', () => {
  it('rewards a well-grounded, risk-aware, cited answer', () => {
    const evaluation = evaluateAgentResponse({
      trace: groundedTrace(),
      answerText:
        'Apex should pilot contact-center AI on the highest-volume queue. The main failure mode is poor intent coverage; mitigate with a human-in-the-loop fallback and a 4-week shadow period.',
    });
    const tenant = evaluation.dimensionScores.find((d) => d.dimension === 'tenant_grounding');
    expect(tenant?.score).toBe(4);
    const risk = evaluation.dimensionScores.find((d) => d.dimension === 'risk_failure_mode_awareness');
    expect(risk?.score).toBe(4);
    const discipline = evaluation.dimensionScores.find((d) => d.dimension === 'source_discipline');
    expect(discipline?.score).toBeGreaterThanOrEqual(4);
  });

  it('penalizes a thin answer that does not flag missing context', () => {
    const evaluation = evaluateAgentResponse({
      trace: thinTrace(),
      answerText: 'Apex will save $40M annually by adopting this across all stores.',
    });
    const honesty = evaluation.dimensionScores.find((d) => d.dimension === 'missing_context_honesty');
    expect(honesty?.score).toBe(1);
    expect(evaluation.failedDimensions).toContain('missing_context_honesty');
  });

  it('rewards a thin answer that honestly flags missing context', () => {
    const evaluation = evaluateAgentResponse({
      trace: thinTrace(),
      answerText:
        'I do not have the loaded baseline to quantify this for your tenant yet — this is judgment, not benchmark data. Once the cost baseline is loaded I can size it.',
    });
    const honesty = evaluation.dimensionScores.find((d) => d.dimension === 'missing_context_honesty');
    expect(honesty?.score).toBe(5);
  });

  it('flags missing citations when backend sources existed but none were emitted', () => {
    const trace = buildNexusTrace({
      ...base,
      sources: [{ id: 'f1', type: 'client_fact', name: 'fact', confidence: 'high' }],
      citationObjectsEmitted: [],
    });
    const evaluation = evaluateAgentResponse({ trace, answerText: 'Some grounded claim.' });
    expect(evaluation.missingCitations.length).toBeGreaterThan(0);
    const discipline = evaluation.dimensionScores.find((d) => d.dimension === 'source_discipline');
    expect(discipline?.score).toBe(1);
  });
});

describe('evaluateAgentResponse · automatic-fail rules', () => {
  it('auto-fails on any tenant leakage', () => {
    const evaluation = evaluateAgentResponse({
      trace: groundedTrace(),
      answerText: 'Strong grounded answer with risk and mitigation.',
      tenantLeakage: [{ detail: 'mentioned Meridian', offendingTenantKey: 'meridian-health' }],
    });
    expect(evaluation.productionReady).toBe(false);
    expect(evaluation.autoFailReasons.join(' ')).toMatch(/leakage/);
  });

  it('auto-fails on an unsupported critical claim', () => {
    const evaluation = evaluateAgentResponse({
      trace: groundedTrace(),
      answerText: 'Grounded answer.',
      unsupportedClaims: [
        {
          claimText: '$40M savings',
          claimType: 'value_claim',
          critical: true,
          recommendedFixLane: 'answer_prompt_synthesis',
        },
      ],
    });
    expect(evaluation.productionReady).toBe(false);
    expect(evaluation.autoFailReasons.join(' ')).toMatch(/unsupported critical/);
  });

  it('auto-fails on a phantom / cross-namespace pattern citation', () => {
    const evaluation = evaluateAgentResponse({
      trace: groundedTrace(),
      answerText: 'Grounded answer with risk.',
      namespaceFindings: [
        { patternId: 'airline-xyz', citedNamespace: 'airline', allowedNamespaces: ['retail'], kind: 'cross_namespace' },
      ],
    });
    expect(evaluation.productionReady).toBe(false);
    const pattern = evaluation.dimensionScores.find((d) => d.dimension === 'pattern_grounding');
    expect(pattern?.score).toBe(1);
  });
});

describe('evaluateAgentResponse · injected judgments + gate', () => {
  it('merges injected subjective scores into the overall', () => {
    const judgments: InjectedJudgments = {
      business_judgment: { score: 4, rationale: 'sound sequencing' },
      specificity: { score: 4, rationale: 'tenant-specific' },
      actionability: { score: 4, rationale: 'clear next step' },
      no_hallucination: { score: 5, rationale: 'no invented facts' },
      executive_usefulness: { score: 4, rationale: 'board-ready' },
    };
    const evaluation = evaluateAgentResponse({
      trace: groundedTrace(),
      answerText:
        'Apex should pilot contact-center AI; failure mode is intent coverage, mitigate with HITL fallback.',
      judgments,
    });
    expect(evaluation.overallScore).not.toBeNull();
    expect(evaluation.productionReady).toBe(true);
    expect(evaluation.dimensionScores.every((d) => d.score != null)).toBe(true);
  });

  it('marks unassessed subjective dimensions and excludes them from the average', () => {
    const evaluation = evaluateAgentResponse({
      trace: groundedTrace(),
      answerText: 'Grounded, risk-aware, cited answer.',
    });
    const subj = evaluation.dimensionScores.filter((d) => d.basis === 'not_assessed');
    expect(subj.length).toBe(5);
  });
});
