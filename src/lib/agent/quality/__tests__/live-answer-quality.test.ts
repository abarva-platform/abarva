import { runPipeline } from '@/lib/nexus/orchestrator';
import { runSentinelTurn } from '@/lib/sentinel/orchestrator';
import { buildSourceAnswerEngine } from '@/lib/source/source-answer-engine';
import { buildStewardBriefing } from '@/lib/source/multi-agent-briefing';
import {
  evaluateLiveAgentAnswerQuality,
  LIVE_AGENT_ANSWER_QUALITY_WIRING_TARGETS,
} from '../live-answer-quality';

describe('live agent answer quality wrapper', () => {
  it('stays import-compatible with the current live answer composition paths', () => {
    expect(typeof runPipeline).toBe('function');
    expect(typeof runSentinelTurn).toBe('function');
    expect(typeof buildSourceAnswerEngine).toBe('function');
    expect(typeof buildStewardBriefing).toBe('function');
    expect(LIVE_AGENT_ANSWER_QUALITY_WIRING_TARGETS.map((target) => target.agent)).toEqual([
      'nexus',
      'sentinel',
      'source',
      'steward',
    ]);
  });

  it('blocks rendering when readiness is insufficient or comprehension fails', () => {
    const result = evaluateLiveAgentAnswerQuality({
      tenantKey: 'apex-retail',
      answerText:
        'Open signal:39901c16-2e8b-4c8c-80aa-8a0182f26754 and source_event_id before the QBRG owner signs off.',
      evidenceLedger: {
        owner: 'Source data steward',
        dataMissing: [
          {
            requiredFor: 'trust answer',
            gapDescription: 'Complaint baseline is not loaded.',
            nextLoadStep: 'Load complaint baseline for the active client.',
          },
        ],
      },
      readiness: {
        questionId: 'trust-1',
        questionKind: 'trust_question',
        presentDimensions: ['customer_kpis'],
      },
    });

    expect(result.evidenceLedgerCheck.passed).toBe(true);
    expect(result.readiness.readinessVerdict).toBe('insufficient');
    expect(result.comprehension.blocked).toBe(true);
    expect(result.renderable).toBe(false);
    expect(result.blocks.map((block) => block.gate)).toEqual([
      'readiness-score',
      'comprehension-gate',
    ]);
    expect(result.answerText).toContain('I am missing complaint_baseline, regulatory_context');
    expect(result.answerText).toContain('portfolio signal');
    expect(result.answerText).toContain('source event id');
  });

  it('returns a renderable answer when ledger, readiness, and comprehension pass', () => {
    const result = evaluateLiveAgentAnswerQuality({
      tenantKey: 'apex-retail',
      answerText:
        'Next step: approve the Source event with the CXO owner after validating supplier responses and approval chain.',
      evidenceLedger: {
        now: new Date('2026-05-31T00:00:00Z'),
        owner: 'Source data steward',
        dataUsed: [
          {
            substrateId: 'source-event-apx-001',
            label: 'Apex Source event',
            sourceTable: 'source_events',
            rowCount: 1,
            asOf: '2026-05-30T00:00:00Z',
          },
        ],
      },
      readiness: {
        questionId: 'source-1',
        questionKind: 'source_question',
        presentDimensions: ['source_event', 'supplier_responses', 'approval_chain'],
      },
    });

    expect(result.renderable).toBe(true);
    expect(result.blocks).toEqual([]);
    expect(result.evidenceLedger.freshness).toBe('fresh');
    expect(result.readinessPrefix).toBeNull();
    expect(result.answerText).toBe(
      'Next step: approve the Source event with the CXO owner after validating supplier responses and approval chain.',
    );
  });
});
