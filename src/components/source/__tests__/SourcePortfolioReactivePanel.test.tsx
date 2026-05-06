import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourcePortfolioReactivePanel } from '@/components/source/SourcePortfolioReactivePanel';
import type { SourcingEventSummary } from '@/lib/source/types';

const EVENT: SourcingEventSummary = {
  id: 'src-test-001',
  code: 'SRC-TST-001',
  name: 'AMS Consolidation Test',
  accountName: 'Apex Retail',
  leadAgent: 'Sentinel',
  archetype: 'Managed Services / Outsourcing',
  rigor: 'strategic',
  status: 'active',
  statusLabel: 'Active',
  priority: 'high',
  currentStageKey: 'strategy',
  currentStageLabel: 'Strategy',
  openAlerts: 1,
  owner: 'IT Procurement',
  agingDays: 2,
  blocker: null,
  nextAction: 'Confirm sourcing strategy',
  isAtRisk: false,
  valueAtStakeUsd: 3500000,
  projectedValueUsd: 3500000,
  realizedValueUsd: 0,
  nextDecision: 'Approve sourcing strategy',
};

describe('SourcePortfolioReactivePanel', () => {
  it('uses Nexus labels for portfolio reasoning cards', () => {
    const html = renderToStaticMarkup(
      createElement(SourcePortfolioReactivePanel, {
        events: [EVENT],
        activeStage: null,
        activeStatus: null,
        artifacts: [],
      }),
    );

    expect(html).toContain('Nexus - Operating model');
    expect(html).toContain('Nexus - Portfolio posture');
    expect(html).toContain('Nexus - Top mission signal');
    expect(html).not.toContain('Sentinel -');
  });
});
