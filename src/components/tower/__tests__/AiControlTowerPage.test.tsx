/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AiControlTowerPage } from '../AiControlTowerPage';
import type { AiControlTowerReadModel } from '@/lib/ai-control-tower/read-model';

const MODEL: AiControlTowerReadModel = {
  clientId: 'client-firstcapital',
  clientKey: 'firstcapital',
  tenantName: 'First Capital Financial',
  source: 'ai_control_data_plane',
  sourceDisclosure: 'Read from committed AI Control Tower data-plane tables.',
  refreshRunId: 'refresh-1',
  refreshRunKey: 'first-capital-v2',
  reportingPeriodEnd: '2026-05-31',
  rowCounts: {
    refreshRuns: 1,
    sources: 4,
    initiatives: 2,
    usage: 1,
    productivity: 1,
    dora: 0,
    agents: 1,
    benefits: 2,
    spend: 1,
    risks: 1,
    actions: 1,
    evidence: 1,
    facts: 2,
  },
  kpis: [
    { key: 'initiatives', label: 'Observed initiatives', value: '2', note: '1 governance / evidence pressures', tone: 'blue' },
    { key: 'value', label: 'Measured value', value: '$1.2M', note: '60% of promised value', tone: 'green' },
    { key: 'spend', label: 'AI spend exposure', value: '$2.4M', note: '1 committed spend rows', tone: 'amber' },
    { key: 'adoption', label: 'Active adoption', value: '80%', note: '80 active of 100 seats', tone: 'green' },
    { key: 'evidence', label: 'Evidence posture', value: '1', note: '1 evidence rows tracked', tone: 'green' },
  ],
  functions: [
    {
      name: 'Finance & Accounting',
      initiatives: 1,
      activeUsers: 80,
      seats: 100,
      adoptionPct: 80,
      spendUsd: 2_400_000,
      realizedUsd: 1_200_000,
      promisedUsd: 2_000_000,
      risks: 1,
      actions: 1,
      status: 'red',
      driver: 'Finance Copilot Rollout',
      blocker: 'DLP review required',
    },
  ],
  initiatives: [
    {
      id: 'FCF-INIT-001',
      title: 'Finance Copilot Rollout',
      functionName: 'Finance & Accounting',
      category: 'Copilot',
      stage: 'Scale',
      posture: 'continue',
      owner: 'CFO delegate',
      sponsor: 'CFO',
      vendor: 'Microsoft',
      system: 'M365 Copilot',
      personas: ['Financial analysts'],
      promisedBenefit: 'Close cycle compression and analyst productivity uplift.',
      metric: 'close_cycle_hours',
      baseline: 12,
      target: 8,
      committedUsd: 900_000,
      spendUsd: 2_400_000,
      promisedUsd: 2_000_000,
      realizedUsd: 1_200_000,
      realizedPct: 60,
      confidence: 'high',
      evidenceState: 'committed',
      status: 'healthy',
      notes: 'Measured in finance analyst workflow.',
      risks: ['DLP review required'],
      citations: ['EVID-001'],
    },
    {
      id: 'FCF-INIT-002',
      title: 'AML Case Triage Automation',
      functionName: 'Risk & Compliance',
      category: 'Agent',
      stage: 'Pilot',
      posture: 'hold',
      owner: 'Chief Model Risk Officer',
      sponsor: 'CRO',
      vendor: 'ServiceNow',
      system: 'ServiceNow AI Agent',
      personas: ['AML analysts'],
      promisedBenefit: 'Reduce false-positive review time.',
      metric: 'case_review_minutes',
      baseline: 42,
      target: 25,
      committedUsd: 1_400_000,
      spendUsd: 0,
      promisedUsd: 4_000_000,
      realizedUsd: 0,
      realizedPct: 0,
      confidence: 'medium',
      evidenceState: 'review_required',
      status: 'blocked',
      notes: 'SR 11-7 review required.',
      risks: ['Model risk validation overdue'],
      citations: ['EVID-002'],
    },
  ],
  usage: [
    {
      id: 'usage-1',
      functionName: 'Finance & Accounting',
      toolName: 'M365 Copilot',
      vendor: 'Microsoft',
      persona: 'Financial analyst',
      seats: 100,
      activeUsers: 80,
      adoptionPct: 80,
      monthlySpendUsd: 200_000,
      timeSavingsHours: 6,
      estimatedBenefitUsd: 1_200_000,
      blocker: 'DLP review required',
      evidenceState: 'committed',
    },
  ],
  productivity: [
    {
      id: 'prod-1',
      functionName: 'Finance & Accounting',
      persona: 'Financial analyst',
      workflow: 'Monthly close analysis',
      metric: 'cycle_time_hours',
      baseline: 12,
      current: 9,
      target: 8,
      unit: 'hours',
      initiativeId: 'FCF-INIT-001',
      confidence: 'high',
      evidenceState: 'committed',
    },
  ],
  agents: [
    {
      id: 'agent-1',
      functionName: 'Finance & Accounting',
      vendor: 'ServiceNow',
      module: 'ITSM',
      name: 'Finance Access Agent',
      persona: 'Financial analyst',
      workflow: 'Software access request',
      eligibleVolume: 1000,
      touchedVolume: 600,
      autoResolvedVolume: 380,
      deflectionPct: 60,
      autoResolvePct: 38,
      cycleTimeBefore: 8,
      cycleTimeAfter: 2,
      monthlySpendUsd: 0,
      valueUsd: 140_000,
      governance: 'assessed',
      notes: 'Auto-approval for standard requests.',
      evidenceState: 'committed',
    },
  ],
  spend: [
    {
      id: 'spend-1',
      initiativeId: 'FCF-INIT-001',
      functionName: 'Finance & Accounting',
      vendor: 'Microsoft',
      product: 'M365 Copilot',
      spendType: 'license',
      monthlySpendUsd: 200_000,
      annualizedSpendUsd: 2_400_000,
      renewalDate: '2026-12-31',
      unitMetric: 'cost_per_active_user',
      unitValue: 250,
      evidenceState: 'committed',
      notes: 'Finance seats included.',
    },
  ],
  risks: [
    {
      id: 'risk-1',
      initiativeId: 'FCF-INIT-002',
      functionName: 'Risk & Compliance',
      name: 'SR 11-7 model validation overdue',
      dimension: 'model_risk',
      severity: 'critical',
      status: 'open',
      description: 'AML case triage cannot scale before validation.',
      owner: 'Chief Model Risk Officer',
      requiredAction: 'Schedule validation sprint.',
      gate: 'fail',
      evidenceState: 'review_required',
    },
  ],
  actions: [
    {
      id: 'action-1',
      relatedType: 'initiative',
      relatedKey: 'FCF-INIT-002',
      posture: 'hold',
      title: 'Hold AML triage scale decision',
      rationale: 'Model validation is overdue.',
      owner: 'Chief Model Risk Officer',
      dueDate: '2026-06-30',
      status: 'proposed',
      evidenceState: 'review_required',
    },
  ],
  evidence: [
    {
      id: 'EVID-001',
      recordType: 'initiative',
      recordKey: 'FCF-INIT-001',
      evidenceType: 'csv_row',
      citationLabel: 'Finance Copilot evidence row',
      pointer: 'T03 row 3',
      evidenceState: 'committed',
      confidence: 0.91,
    },
  ],
  facts: [
    {
      factId: 'fact-1',
      clientId: 'client-firstcapital',
      refreshRunId: 'refresh-1',
      recordType: 'benefit_realization',
      recordKey: 'FCF-INIT-001',
      factKey: 'benefit_realization_usd',
      factType: 'money',
      factText: 'Finance Copilot Rollout has $1.2M realized value with committed evidence.',
      confidence: 0.9,
      evidenceStatus: 'committed',
      evidenceIds: ['EVID-001'],
    },
    {
      factId: 'fact-2',
      clientId: 'client-firstcapital',
      refreshRunId: 'refresh-1',
      recordType: 'risk_governance',
      recordKey: 'FCF-INIT-002',
      factKey: 'review_required_count',
      factType: 'risk',
      factText: 'AML case triage requires SR 11-7 validation before scale.',
      confidence: 0.76,
      evidenceStatus: 'review_required',
      evidenceIds: ['EVID-002'],
    },
  ],
};

function renderTower() {
  return render(<AiControlTowerPage model={MODEL} />);
}

describe('AiControlTowerPage', () => {
  beforeEach(() => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('offline'));
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('places lens tabs below KPI dashboard and refreshes the active canvas', () => {
    renderTower();

    const evidenceTile = screen.getByText('Evidence posture');
    const agentsTab = screen.getByRole('button', { name: /agents/i });
    expect(evidenceTile.compareDocumentPosition(agentsTab) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByText('Which investments should we scale, hold, restructure, or stop?')).toBeInTheDocument();

    fireEvent.click(agentsTab);
    expect(screen.getByText('Which agents are resolving real work?')).toBeInTheDocument();
    expect(screen.getByText('Finance Access Agent')).toBeInTheDocument();

    fireEvent.click(
      screen
        .getAllByRole('button')
        .find((button) => button.textContent?.includes('Spend')) as HTMLElement,
    );
    expect(screen.getByText('Where is technology spend concentrated, exposed, or under-proven?')).toBeInTheDocument();
    expect(screen.getByText('M365 Copilot')).toBeInTheDocument();
  });

  it('answers executive questions with structured rows and moves to the relevant lens', async () => {
    renderTower();

    fireEvent.click(screen.getByRole('button', { name: /where is ai spend not backed by evidence/i }));

    const [answerHeadline] = await screen.findAllByText(/Finance Copilot Rollout has \$1.2M realized value/i);
    const atlasPanel = answerHeadline.closest('div');
    expect(atlasPanel).toBeTruthy();
    await waitFor(() => {
      expect(within(atlasPanel as HTMLElement).getByText('Metric')).toBeInTheDocument();
    });
  });
});
