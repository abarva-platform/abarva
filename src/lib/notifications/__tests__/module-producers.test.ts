import { assessSegment } from '@/lib/context-trust/freshness-model';
import type { SentinelGroundingSummary } from '@/lib/sentinel/types';
import type { ExecutiveAction } from '@/lib/tower/action-queue/executive-action-queue';
import type { ClassifiedRiskLine } from '@/lib/tower/regulatory-risk/types';
import { routeNotification, toBellItem } from '../policy';
import {
  buildContextTrustNotifications,
  buildMovesDecisionNotifications,
  buildSentinelConsistencyNotifications,
  buildSentinelGroundingNotifications,
  buildTowerExecutiveActionNotifications,
  buildTowerRegulatoryRiskNotifications,
} from '../module-producers';

const CTX = {
  tenantKey: 'first-capital',
  producedAt: '2026-05-17T12:00:00.000Z',
};

describe('cross-module notification producers', () => {
  it('turns a blocked Move gate into an urgent owner signal', () => {
    const [event] = buildMovesDecisionNotifications(CTX, [
      {
        programId: 'move-fc-mrm-agent',
        programLabel: 'MRM Evidence Agent',
        kind: 'gate_blocked',
        title: 'SR 11-7 validation evidence is incomplete',
        detail:
          'Do not move the agent to pilot until challenger-model evidence and issue-disposition workflow are complete.',
        ownerRef: 'patricia.huang@firstcapital.example.com',
        dueAt: '2026-05-24',
        evidenceRefs: ['program_deliverables:mrm-validation-pack'],
      },
    ]);

    expect(event.module).toBe('moves');
    expect(event.severity).toBe('urgent');
    expect(event.href).toBe('/strategic-moves/move-fc-mrm-agent');
    expect(event.audience[0]).toMatchObject({ kind: 'user' });
    expect(routeNotification(event).channels).toContain('email_now');
    expect(toBellItem(event).kind).toBe('moves-alert');
  });

  it('does not alert on a Moves signal without evidence', () => {
    const events = buildMovesDecisionNotifications(CTX, [
      {
        programId: 'move-without-evidence',
        programLabel: 'Unbacked Move',
        kind: 'architecture_gap',
        title: 'Architecture note has no evidence',
        detail: 'This would be noise without a backing record.',
        evidenceRefs: [],
      },
    ]);

    expect(events).toHaveLength(0);
  });

  it('promotes critical Tower executive actions to immediate interruption', () => {
    const action: ExecutiveAction = {
      id: 'eaq-value_leakage-entry-001',
      trigger: 'value_leakage',
      triggerLabel: 'Value leakage',
      entryId: 'entry-001',
      initiative: 'Contact Center AI',
      programKey: 'move-contact-center-ai',
      condition: 'Realized value is -22% against projection.',
      whyItMatters: 'The value gap compounds every quarter.',
      impliedAction: 'Commission a value-leakage review this week.',
      severity: 'critical',
      severityRank: 0,
    };

    const [event] = buildTowerExecutiveActionNotifications(CTX, [action]);

    expect(event.module).toBe('tower');
    expect(event.severity).toBe('critical');
    expect(event.sourceEventType).toBe('tower.executive_action');
    expect(event.evidenceRefs).toEqual(['entry-001']);
    expect(routeNotification(event).escalationAfterHours).toBe(4);
  });

  it('keeps Tower watch items out of the alert feed', () => {
    const action: ExecutiveAction = {
      id: 'eaq-no_action-entry-watch',
      trigger: 'no_action',
      triggerLabel: 'No action required',
      entryId: 'entry-watch',
      initiative: 'Healthy Move',
      condition: 'On track.',
      whyItMatters: 'No material risk.',
      impliedAction: 'Monitor.',
      severity: 'watch',
      severityRank: 3,
    };

    expect(buildTowerExecutiveActionNotifications(CTX, [action])).toHaveLength(0);
  });

  it('surfaces regulatory Tower risk with regime and privilege metadata', () => {
    const line: ClassifiedRiskLine = {
      id: 'risk-001',
      subjectRef: 'move-fc-mrm-agent',
      title: 'Model validation evidence missing',
      detail: 'Validation pack does not show independent challenge.',
      severity: 'high',
      kind: 'regulatory',
      regime: 'sr_11_7_model_risk',
      isRegulatory: true,
      disclosure: 'attorney_client',
      privileged: true,
      executiveReadout:
        'SR 11-7 model-risk control gap: independent validation evidence is missing.',
    };

    const [event] = buildTowerRegulatoryRiskNotifications(CTX, 'first-capital-portfolio', [line]);

    expect(event.severity).toBe('urgent');
    expect(event.metadata).toMatchObject({
      regime: 'sr_11_7_model_risk',
      privileged: true,
    });
    expect(event.subject.type).toBe('tower_move');
  });

  it('creates Sentinel grounding-gap signals from canonical gaps', () => {
    const summary: SentinelGroundingSummary = {
      source: 'canonical_pattern_index',
      status: 'ready',
      checkedPatternCount: 3,
      canonicalPatternIds: ['P-FS-MRM-001'],
      warnings: [],
      gaps: [
        {
          type: 'canonical_pattern_no_match',
          severity: 'critical',
          source: 'canonical_pattern_index',
          patternId: null,
          patternLabel: null,
          missing: ['pattern_manifest'],
          detail: 'No canonical pattern matched the Sentinel turn.',
        },
        {
          type: 'artifact_gap',
          severity: 'info',
          source: 'pattern_manifest',
          patternId: 'P-FS-MRM-001',
          patternLabel: 'MRM evidence agent',
          missing: ['evidence_packet'],
          detail: 'Evidence packet is thin but not blocking.',
        },
      ],
    };

    const [event] = buildSentinelGroundingNotifications(CTX, {
      answerId: 'answer-123',
      question: 'Which AI bet should we fund?',
      summary,
    });

    expect(event.module).toBe('intelligence');
    expect(event.severity).toBe('urgent');
    expect(event.evidenceRefs).toEqual(['pattern_manifest']);
    expect(event.href).toBe('/intelligence?answer=answer-123');
  });

  it('creates Sentinel consistency guard signals without inventing evidence', () => {
    const [event] = buildSentinelConsistencyNotifications(CTX, [
      {
        answerId: 'answer-456',
        question: 'Rank vendors by spend.',
        guardId: 'G1',
        guardLabel: 'Arithmetic ordering',
        detail: 'The answer ranked $8.8M above $13.6M.',
        severity: 'critical',
        evidenceRefs: ['answer:answer-456', 'guard:G1'],
      },
      {
        answerId: 'answer-789',
        question: 'Unbacked answer.',
        guardId: 'G2',
        guardLabel: 'Date math',
        detail: 'No evidence refs should mean no alert.',
        severity: 'warning',
        evidenceRefs: [],
      },
    ]);

    expect(event.sourceEventType).toBe('intelligence.sentinel.consistency_guard');
    expect(event.severity).toBe('urgent');
    expect(event.evidenceRefs).toEqual(['answer:answer-456', 'guard:G1']);
  });

  it('turns missing and stale context into trust signals only', () => {
    const asOf = new Date('2026-05-17T00:00:00Z');
    const missing = assessSegment(
      { segment: 'vendor_contracts', lastUpdated: null, sourceType: 'absent' },
      asOf,
    );
    const stale = assessSegment(
      { segment: 'operating_telemetry', lastUpdated: '2026-01-01', sourceType: 'sourced' },
      asOf,
    );
    const fresh = assessSegment(
      { segment: 'kpi_dictionary', lastUpdated: '2026-05-01', sourceType: 'verified' },
      asOf,
    );

    const events = buildContextTrustNotifications(CTX, [missing, stale, fresh]);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.sourceEventType)).toEqual([
      'context.trust.missing',
      'context.trust.stale',
    ]);
    expect(events[0].severity).toBe('urgent');
    expect(events[1].severity).toBe('attention');
  });
});
