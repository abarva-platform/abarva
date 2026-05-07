import {
  agingSeverity,
  attentionEvents,
  computePortfolioKpis,
  determinePortfolioState,
  deriveAttention,
  filterOutTestArtifacts,
  groupEventsByStageBand,
  isTestArtifactEvent,
  needsAttention,
  portfolioStatusOf,
  stageBandFor,
  stageDisplayNumber,
  tenantAbbreviationForAccount,
} from '../portfolio-filtering';
import type { SourcingEventSummary } from '../types';

function makeEvent(overrides: Partial<SourcingEventSummary> = {}): SourcingEventSummary {
  return {
    id: 'evt-1',
    code: 'SRC-APX-001',
    name: 'AMS Outsourcing 2026',
    accountName: 'Apex Retail Group',
    leadAgent: 'Sentinel',
    archetype: 'Managed Service',
    rigor: 'standard',
    status: 'active',
    statusLabel: 'Active',
    priority: 'medium',
    currentStageKey: 'evaluation',
    currentStageLabel: 'Evaluation',
    openAlerts: 0,
    owner: 'Avery Lee',
    agingDays: 1,
    blocker: null,
    nextAction: 'Run evaluation cycle',
    isAtRisk: false,
    valueAtStakeUsd: 5_000_000,
    projectedValueUsd: 5_000_000,
    realizedValueUsd: 0,
    nextDecision: 'Down-select to two finalists',
    ...overrides,
  };
}

describe('isTestArtifactEvent', () => {
  it.each([
    ['E2E-CRAWL-2026-05-02-firstcapital-SRC-11-STAGE-20260502T175236Z'],
    ['E2E-source-flow-test'],
    ['some-CRAWL-event-2026'],
    ['playwright-spec-helper-event'],
    ['event-20260507T120000Z'],
  ])('flags %s as a test artifact', (name) => {
    expect(isTestArtifactEvent(makeEvent({ name }))).toBe(true);
  });

  it('does not flag real production-style names', () => {
    expect(isTestArtifactEvent(makeEvent({ name: 'AMS Outsourcing 2026' }))).toBe(false);
    expect(isTestArtifactEvent(makeEvent({ name: 'Innovaccer Renewal' }))).toBe(false);
    expect(isTestArtifactEvent(makeEvent({ name: 'POS Systems Modernization' }))).toBe(false);
  });

  it('matches code patterns even when name is clean', () => {
    expect(
      isTestArtifactEvent(makeEvent({ name: 'Real Sounding Event', code: 'E2E-FCF-001' })),
    ).toBe(true);
  });
});

describe('filterOutTestArtifacts', () => {
  it('strips matching events while preserving order of the rest', () => {
    const a = makeEvent({ id: 'a', name: 'Real Event' });
    const b = makeEvent({ id: 'b', name: 'E2E-CRAWL-test' });
    const c = makeEvent({ id: 'c', name: 'Another Real Event' });
    const filtered = filterOutTestArtifacts([a, b, c]);
    expect(filtered.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('returns empty when only test events present', () => {
    const filtered = filterOutTestArtifacts([
      makeEvent({ id: 'b', name: 'E2E-CRAWL-test' }),
      makeEvent({ id: 'c', name: 'E2E-other' }),
    ]);
    expect(filtered).toHaveLength(0);
  });
});

describe('determinePortfolioState', () => {
  it('returns empty for zero events', () => {
    expect(determinePortfolioState(0)).toBe('empty');
  });
  it('returns partial for 1-9 events', () => {
    expect(determinePortfolioState(1)).toBe('partial');
    expect(determinePortfolioState(5)).toBe('partial');
    expect(determinePortfolioState(9)).toBe('partial');
  });
  it('returns mature at 10 or more events', () => {
    expect(determinePortfolioState(10)).toBe('mature');
    expect(determinePortfolioState(50)).toBe('mature');
  });
});

describe('deriveAttention', () => {
  it('returns null for healthy active events', () => {
    expect(deriveAttention(makeEvent())).toBeNull();
  });

  it('flags at-risk events as critical', () => {
    const result = deriveAttention(makeEvent({ isAtRisk: true, agingDays: 6 }));
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('critical');
    expect(result?.kind).toBe('blocked');
  });

  it('flags long-waiting events as stale', () => {
    const result = deriveAttention(
      makeEvent({ status: 'waiting_on_vendor', statusLabel: 'Waiting on Vendor', agingDays: 6 }),
    );
    expect(result?.kind).toBe('stale');
    expect(result?.badgeDays).toBe(6);
  });

  it('flags overdue executive decisions with critical severity at ≥5d', () => {
    const result = deriveAttention(
      makeEvent({
        status: 'waiting_on_executive_decision',
        statusLabel: 'Waiting on Executive Decision',
        agingDays: 7,
      }),
    );
    expect(result?.kind).toBe('awaiting_decision');
    expect(result?.severity).toBe('critical');
  });

  it('flags executive decision standard at 3-4 days', () => {
    const result = deriveAttention(
      makeEvent({
        status: 'waiting_on_executive_decision',
        statusLabel: 'Waiting on Executive Decision',
        agingDays: 3,
      }),
    );
    expect(result?.severity).toBe('standard');
  });

  it('flags blockers with aging >= 1 day', () => {
    const result = deriveAttention(
      makeEvent({ blocker: 'Pricing template missing', agingDays: 2 }),
    );
    expect(result?.kind).toBe('blocked');
  });

  it('does not flag short-waiting events', () => {
    expect(
      deriveAttention(
        makeEvent({ status: 'waiting_on_vendor', statusLabel: 'Waiting on Vendor', agingDays: 2 }),
      ),
    ).toBeNull();
  });

  it('flags open alerts as overdue', () => {
    const result = deriveAttention(makeEvent({ openAlerts: 2 }));
    expect(result?.kind).toBe('overdue');
  });
});

describe('needsAttention', () => {
  it('matches deriveAttention emptiness', () => {
    expect(needsAttention(makeEvent())).toBe(false);
    expect(needsAttention(makeEvent({ isAtRisk: true, agingDays: 1 }))).toBe(true);
  });
});

describe('attentionEvents sort', () => {
  it('puts critical before standard, more aged first within severity', () => {
    const banners = attentionEvents([
      makeEvent({ id: '1', isAtRisk: false, openAlerts: 1, agingDays: 2 }),
      makeEvent({ id: '2', isAtRisk: true, agingDays: 6 }),
      makeEvent({ id: '3', openAlerts: 1, agingDays: 5 }),
    ]);
    expect(banners[0].event.id).toBe('2');
    expect(banners[1].event.id).toBe('3');
    expect(banners[2].event.id).toBe('1');
  });
});

describe('portfolioStatusOf', () => {
  it('maps statuses to coarse buckets', () => {
    expect(portfolioStatusOf(makeEvent({ status: 'active' }))).toBe('active');
    expect(portfolioStatusOf(makeEvent({ status: 'completed' }))).toBe('completed');
    expect(portfolioStatusOf(makeEvent({ status: 'archived' }))).toBe('completed');
    expect(portfolioStatusOf(makeEvent({ status: 'waiting_on_vendor' }))).toBe('waiting');
    expect(portfolioStatusOf(makeEvent({ status: 'at_risk' }))).toBe('attention');
    expect(portfolioStatusOf(makeEvent({ status: 'active', isAtRisk: true }))).toBe('attention');
  });
});

describe('computePortfolioKpis', () => {
  it('counts buckets correctly and excludes completed value', () => {
    const events = [
      makeEvent({ id: 'a', status: 'active', valueAtStakeUsd: 1_000_000 }),
      makeEvent({ id: 'b', status: 'waiting_on_vendor', statusLabel: 'Waiting on Vendor', valueAtStakeUsd: 2_000_000 }),
      makeEvent({ id: 'c', status: 'completed', statusLabel: 'Completed', valueAtStakeUsd: 5_000_000 }),
      makeEvent({ id: 'd', status: 'active', isAtRisk: true, agingDays: 4, valueAtStakeUsd: 3_000_000 }),
    ];
    const kpis = computePortfolioKpis(events);
    expect(kpis.total).toBe(4);
    expect(kpis.active).toBe(1);
    expect(kpis.waiting).toBe(1);
    expect(kpis.completed).toBe(1);
    expect(kpis.attentionCount).toBe(1);
    expect(kpis.onTrack).toBe(1);
    expect(kpis.valueAtStakeUsd).toBe(6_000_000); // a + b + d, c excluded
    expect(kpis.attentionTopReason).toContain('SRC-APX-001');
  });

  it('reports no attention reason when nothing flagged', () => {
    const kpis = computePortfolioKpis([makeEvent()]);
    expect(kpis.attentionCount).toBe(0);
    expect(kpis.attentionTopReason).toBeNull();
  });
});

describe('tenantAbbreviationForAccount', () => {
  it.each([
    ['Apex Retail Group', 'APEX'],
    ['Meridian Health System', 'MER'],
    ['First Capital Financial', 'FCF'],
    ['Arcturus Financial', 'FCF'],
    ['Keystone Energy Holdings', 'KEY'],
    ['Northstar Holdings', 'NSH'],
  ])('maps %s → %s', (name, expected) => {
    expect(tenantAbbreviationForAccount(name)).toBe(expected);
  });

  it('falls back to first 4 letters of the first word for unknown accounts', () => {
    expect(tenantAbbreviationForAccount('Zenith Industries')).toBe('ZENI');
  });

  it('returns TEN for empty input', () => {
    expect(tenantAbbreviationForAccount('')).toBe('TEN');
  });
});

describe('stageBandFor', () => {
  it('classifies stages into bands', () => {
    expect(stageBandFor('strategy', 'active')).toBe('discovery');
    expect(stageBandFor('rfp', 'active')).toBe('discovery');
    expect(stageBandFor('responses', 'active')).toBe('evaluation');
    expect(stageBandFor('bafo', 'active')).toBe('evaluation');
    expect(stageBandFor('executive_decision', 'active')).toBe('decision');
    expect(stageBandFor('selection', 'active')).toBe('decision');
    expect(stageBandFor('transition', 'active')).toBe('transition');
    expect(stageBandFor('value', 'active')).toBe('transition');
  });

  it('routes completed events to the completed band regardless of stage', () => {
    expect(stageBandFor('rfp', 'completed')).toBe('completed');
    expect(stageBandFor('strategy', 'archived')).toBe('completed');
  });
});

describe('stageDisplayNumber', () => {
  it('returns 2-digit positions in canonical stage order', () => {
    expect(stageDisplayNumber('strategy')).toBe('01');
    expect(stageDisplayNumber('rfp')).toBe('03');
    expect(stageDisplayNumber('value')).toBe('11');
  });
});

describe('groupEventsByStageBand', () => {
  it('preserves event order within each bucket', () => {
    const grouped = groupEventsByStageBand([
      makeEvent({ id: '1', currentStageKey: 'strategy' }),
      makeEvent({ id: '2', currentStageKey: 'evaluation' }),
      makeEvent({ id: '3', currentStageKey: 'scope' }),
      makeEvent({ id: '4', currentStageKey: 'value', status: 'completed' }),
    ]);
    expect(grouped.get('discovery')!.map((e) => e.id)).toEqual(['1', '3']);
    expect(grouped.get('evaluation')!.map((e) => e.id)).toEqual(['2']);
    expect(grouped.get('completed')!.map((e) => e.id)).toEqual(['4']);
  });
});

describe('agingSeverity', () => {
  it.each([
    [0, 'normal'],
    [2, 'normal'],
    [3, 'warn'],
    [4, 'warn'],
    [5, 'bad'],
    [10, 'bad'],
  ])('treats %i days as %s', (days, expected) => {
    expect(agingSeverity(days)).toBe(expected);
  });
});
