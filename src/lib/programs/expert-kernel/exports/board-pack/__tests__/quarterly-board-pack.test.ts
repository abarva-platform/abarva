import type { BoardPack } from '@/lib/tower/board-pack';
import {
  buildQuarterlyBoardPack,
  renderBoardPackHtml,
  renderQuarterlyBoardPackHtml,
  type QuarterlyBoardPackInput,
} from '../index';

function towerBoardPack(clientKey: string): BoardPack {
  return {
    tenantClientKey: clientKey,
    headline:
      '2 critical decisions need leadership attention; 1 ledger entry carries no evidence.',
    topDecisions: [
      {
        id: 'bd-1',
        initiative: 'AI Store Labor',
        decision: 'Pause expansion until adoption evidence is refreshed',
        rationale: 'The move is below the verified-value gate.',
        severity: 'critical',
      },
    ],
    spendAtRisk: {
      totalCommittedAmount: 10_900_000,
      earnedVerifiedAmount: 8_100_000,
      spendAtRiskAmount: 2_800_000,
      unevidencedClaimedAmount: 450_000,
      headline:
        '$2.8M of $10.9M committed value is not yet verified and evidence-backed.',
    },
    valueChange: {
      realizationRatio: 0.743,
      severity: 'watch',
      earningSummary: 'The portfolio is earning, but the gap is still board-visible.',
      adoptionHeadline: 'Adoption telemetry is mixed across the portfolio.',
      adoptionInstrumentationGap: false,
    },
    actionsRequired: [
      {
        id: 'action-1',
        initiative: 'AI Store Labor',
        action: 'Name owner for gate evidence refresh',
        severity: 'watch',
      },
    ],
    evidenceLinks: [
      {
        initiative: 'AI Store Labor',
        entryId: 'entry-1',
        reference: 'evidence://tower/value/entry-1',
        isGap: false,
      },
      {
        initiative: 'Commerce CDP',
        entryId: 'entry-2',
        reference: 'no evidence bound',
        isGap: true,
      },
    ],
    disclaimer:
      'Deterministic composition. This board pack introduces no new figures.',
    deterministicSeed: true,
  };
}

function input(
  clientKey: string,
  clientLabel: string,
  overrides: Partial<QuarterlyBoardPackInput> = {},
): QuarterlyBoardPackInput {
  const base: QuarterlyBoardPackInput = {
    clientKey,
    clientLabel,
    quarter: 'Q2 FY26',
    generatedOn: '2026-06-01',
    towerBoardPack: towerBoardPack(clientKey),
    moves: [
      {
        name: 'AI Store Labor',
        phase: 'Mobilize',
        status: 'watch',
        owner: 'VP Stores',
        nextGate: 'Value evidence refresh',
      },
      {
        name: 'Commerce CDP',
        phase: 'Scope',
        status: 'blocked',
        owner: 'Chief Digital Officer',
        nextGate: 'Board scope reset',
      },
    ],
    blockedDecisions: [
      {
        move: 'Commerce CDP',
        decision: 'Approve scope reset before vendor expansion',
        owner: 'Chief Digital Officer',
        timeInState: '17 days',
        rationale: 'Current scope carries unverified value exposure.',
      },
    ],
    patterns: [
      {
        pattern: 'Value evidence trails adoption',
        evidence: '1 evidence gap remains open in the Tower pack.',
        action: 'Bind the ledger evidence before the next board review.',
      },
    ],
    recommendedSequence: [
      {
        sequence: '1',
        move: 'AI Store Labor',
        rationale: 'Refresh value evidence before adding stores.',
      },
    ],
    riskHorizon: [
      {
        title: 'EU AI Act readiness',
        severity: 'moderate',
        exposure: 'Customer-facing AI controls need an owner.',
        nextAction: 'Assign governance owner for the next gate.',
      },
    ],
    topQuestions: [
      {
        owner: 'CFO',
        question: 'Which committed value is safe to quote externally?',
        whyNow: 'The board pack still contains an evidence gap.',
      },
      {
        owner: 'COO',
        question: 'Which blocked decision changes the next-quarter sequence?',
        whyNow: 'Commerce CDP is blocking the sequence.',
      },
      {
        owner: 'CIO',
        question: 'Which controls are missing for customer-facing AI?',
        whyNow: 'Regulatory exposure is still open.',
      },
      {
        owner: 'CEO',
        question: 'This fourth question should be capped out.',
        whyNow: 'Only three questions belong in the board pack.',
      },
    ],
  };
  return { ...base, ...overrides };
}

describe('buildQuarterlyBoardPack', () => {
  it('builds the eight required sections in order', () => {
    const pack = buildQuarterlyBoardPack(input('apexretail', 'Apex Retail'));
    expect(pack.sections.map((section) => `${section.ordinal} ${section.title}`)).toEqual([
      '01 Portfolio executive summary',
      '02 Realized vs projected portfolio-wide',
      '03 In-flight Moves status',
      '04 Blocked decisions with named owners and time in state',
      '05 Cross-Move patterns surfaced this quarter',
      '06 Recommended Move sequence next quarter',
      '07 Risk and regulatory horizon',
      '08 Top 3 questions for board attention',
    ]);
  });

  it('caps board questions at three and preserves owner context', () => {
    const pack = buildQuarterlyBoardPack(input('apexretail', 'Apex Retail'));
    const questionRows = pack.sections[7]?.rows ?? [];
    expect(questionRows).toHaveLength(3);
    expect(questionRows.map((row) => row.label)).toEqual(['CFO', 'COO', 'CIO']);
  });

  it('surfaces blocked decision owner and time in state', () => {
    const pack = buildQuarterlyBoardPack(input('apexretail', 'Apex Retail'));
    const blocked = pack.sections[3]?.rows[0];
    expect(blocked?.detail).toContain('Owner: Chief Digital Officer');
    expect(blocked?.detail).toContain('Time in state: 17 days');
  });

  it('preserves evidence gap count from the Tower board pack', () => {
    const pack = buildQuarterlyBoardPack(input('apexretail', 'Apex Retail'));
    expect(pack.evidenceGapCount).toBe(1);
    expect(pack.sections[0]?.rows.find((row) => row.label === 'Evidence gaps')?.value).toBe(
      '1',
    );
  });

  it.each([
    ['apexretail', 'Apex Retail'],
    ['meridianhealth', 'Meridian Health'],
    ['skyharborair', 'SkyHarbor Air'],
  ])('renders a deterministic pack for %s', (clientKey, clientLabel) => {
    const fixture = input(clientKey, clientLabel);
    const pack = buildQuarterlyBoardPack(fixture);
    expect(pack.clientKey).toBe(clientKey);
    expect(JSON.stringify(pack)).toBe(JSON.stringify(buildQuarterlyBoardPack(fixture)));
  });
});

describe('quarterly board-pack HTML renderer', () => {
  it('renders self-contained HTML with the board sections', () => {
    const pack = buildQuarterlyBoardPack(input('apexretail', 'Apex Retail'));
    const html = renderBoardPackHtml(pack);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Apex Retail Q2 FY26 Board Pack');
    expect(html).toContain('Blocked decisions with named owners and time in state');
    expect(html).toContain('Evidence gaps: 1');
  });

  it('renders directly from input', () => {
    const html = renderQuarterlyBoardPackHtml(input('skyharborair', 'SkyHarbor Air'));
    expect(html).toContain('SkyHarbor Air');
    expect(html).toContain('Top 3 questions for board attention');
  });
});
