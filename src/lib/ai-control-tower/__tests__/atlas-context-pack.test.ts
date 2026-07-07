import {
  buildAiControlTowerContextPack,
  buildStructuredAnswerFromContextPack,
} from '../atlas-context-pack';
import type { AiControlTowerContextFact } from '../contracts';

const FACTS: AiControlTowerContextFact[] = [
  {
    factId: 'fc-fact-1',
    clientId: 'first-capital-client-id',
    refreshRunId: 'run-2026-05',
    recordType: 'tool_usage',
    recordKey: 'servicenow-now-assist',
    factKey: 'agent_deflection_rate',
    factType: 'metric_snapshot',
    factText: 'ServiceNow Now Assist auto-resolved 22% of eligible incidents in May 2026.',
    confidence: 0.74,
    evidenceStatus: 'committed',
    evidenceIds: ['EV-SN-001'],
  },
  {
    factId: 'fc-fact-2',
    clientId: 'first-capital-client-id',
    refreshRunId: 'run-2026-05',
    recordType: 'benefit_claim',
    recordKey: 'oracle-finance-agent',
    factKey: 'benefit_realization_usd',
    factType: 'benefit',
    factText: 'Oracle finance-agent realized benefit is review-required until controller evidence is approved.',
    confidence: 0.42,
    evidenceStatus: 'review_required',
    evidenceIds: ['EV-ORCL-009'],
  },
  {
    factId: 'meridian-fact-1',
    clientId: 'meridian-client-id',
    refreshRunId: 'run-2026-05',
    recordType: 'tool_usage',
    recordKey: 'ambient-doc-agent',
    factKey: 'agent_deflection_rate',
    factType: 'metric_snapshot',
    factText: 'Meridian ambient documentation agent reduced note time for pilot clinicians.',
    confidence: 0.81,
    evidenceStatus: 'committed',
    evidenceIds: ['EV-MER-001'],
  },
  {
    factId: 'fc-derived-read-1',
    clientId: 'first-capital-client-id',
    refreshRunId: 'run-2026-05',
    recordType: 'derived_enterprise_read',
    recordKey: 'enterprise-read-first-capital',
    factKey: 'enterprise_context_read',
    factType: 'derived_read',
    factText: 'First Capital enterprise read says AI value is gated by core modernization and model risk evidence.',
    confidence: 0.9,
    evidenceStatus: 'committed',
    evidenceIds: ['datasets/first-capital-financial-synthetic-v4/derived-intelligence/enterprise-reads.json'],
  },
];

describe('AI Control Tower Atlas context pack', () => {
  it('filters facts by client and refresh run before building Atlas context', () => {
    const pack = buildAiControlTowerContextPack({
      clientId: 'first-capital-client-id',
      question: 'Which agents are reducing work versus adding cost?',
      refreshRunId: 'run-2026-05',
      facts: FACTS,
    });

    expect(pack.activeLens).toBe('agents');
    expect(pack.intent).toBe('agent_outcome');
    expect(pack.facts.map((fact) => fact.factId)).toEqual(['fc-fact-1', 'fc-derived-read-1']);
    expect(pack.facts.some((fact) => fact.clientId === 'meridian-client-id')).toBe(false);
  });

  it('keeps derived enterprise read facts available for Atlas even when they are not metric dictionary facts', () => {
    const pack = buildAiControlTowerContextPack({
      clientId: 'first-capital-client-id',
      question: 'What is the enterprise context telling me about AI value?',
      refreshRunId: 'run-2026-05',
      facts: FACTS,
    });

    expect(pack.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factId: 'fc-derived-read-1',
          factKey: 'enterprise_context_read',
        }),
      ]),
    );
  });

  it('keeps evidence guardrails when realized value is review-required', () => {
    const pack = buildAiControlTowerContextPack({
      clientId: 'first-capital-client-id',
      question: 'Which benefits are defensible?',
      refreshRunId: 'run-2026-05',
      surfaceContext: {
        activeLens: 'value_adoption',
        selectedMetricIds: ['benefit_realization_usd'],
      },
      facts: FACTS,
    });

    expect(pack.intent).toBe('evidence_check');
    expect(pack.guardrails.canClaimRealizedValue).toBe(false);
    expect(pack.guardrails.reviewRequiredFactIds).toEqual(['fc-fact-2']);
  });

  it('creates a structured answer with choices and dashboard patch', () => {
    const pack = buildAiControlTowerContextPack({
      clientId: 'first-capital-client-id',
      question: 'Which actions should go to steering?',
      refreshRunId: 'run-2026-05',
      facts: FACTS,
    });
    const answer = buildStructuredAnswerFromContextPack(pack);

    expect(answer.answerVersion).toBe('ai-control-tower-v1');
    expect(answer.activeLens).toBe('actions');
    expect(answer.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'set_lens', target: 'spend' }),
        expect.objectContaining({ action: 'set_lens', target: 'evidence' }),
      ]),
    );
    expect(answer.dashboardPatch?.setLens).toBe('actions');
  });
});
