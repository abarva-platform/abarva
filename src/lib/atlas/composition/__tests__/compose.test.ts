import { mockClient } from '@/lib/atlas/initiative-deep/_test-mock-client';
import { composeAtlasIacAnswer } from '../compose';

const APEX = { clientId: 'client-apex', userId: null };
const MERIDIAN = { clientId: 'client-meridian', userId: null };

function fixtures() {
  return {
    clients: [
      { id: 'client-apex', industry_code: 'RETAIL' },
      { id: 'client-meridian', industry_code: 'HEALTHCARE_IDN' },
    ],
    ai_initiatives: [
      {
        initiative_id: 'AR-02',
        client_id: 'client-apex',
        display_id: 'AR-02',
        name: 'Copilot for Retail Associates',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'Carlos Rivera',
        owner_title: 'CIO',
        committed_annual_usd: 1_000_000,
        measured_value_usd: 250_000,
        confidence_level: 'HIGH',
        status_summary: 'Pilot expanding to additional stores in Q3.',
      },
      {
        initiative_id: 'AR-01',
        client_id: 'client-apex',
        display_id: 'AR-01',
        name: 'Store Knowledge Assistant',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'A',
        owner_title: 'B',
        committed_annual_usd: 500_000,
        measured_value_usd: 50_000,
        confidence_level: 'MED',
      },
      {
        initiative_id: 'AR-03',
        client_id: 'client-apex',
        display_id: 'AR-03',
        name: 'Pricing AI',
        primary_category_id: 'CAT-05',
        stage: 'scaled',
        owner_name: 'A',
        owner_title: 'B',
        committed_annual_usd: 800_000,
        measured_value_usd: 100_000,
        confidence_level: 'MED',
      },
      {
        initiative_id: 'AR-04',
        client_id: 'client-apex',
        display_id: 'AR-04',
        name: 'Fraud Scoring',
        primary_category_id: 'CAT-05',
        stage: 'scaled',
        owner_name: 'A',
        owner_title: 'B',
        committed_annual_usd: 600_000,
        measured_value_usd: 120_000,
        confidence_level: 'MED',
      },
      {
        initiative_id: 'MH-02',
        client_id: 'client-meridian',
        display_id: 'MH-02',
        name: 'Workday Agent Intake',
        primary_category_id: 'CAT-04',
        stage: 'pilot',
        owner_name: 'Priya Nair',
        owner_title: 'VP Enterprise Apps',
        committed_annual_usd: 900_000,
        measured_value_usd: null,
        confidence_level: 'MED',
        status_summary: 'HCM and finance agent intake is in design review.',
      },
    ],
    ai_initiative_kpis: [
      {
        initiative_id: 'AR-02',
        kpi_name: 'Containment rate',
        kpi_unit: 'percent',
        quarter: '2026-Q1',
        kpi_value: 22,
        target_value: 30,
      },
      {
        initiative_id: 'MH-02',
        kpi_name: 'Cycle time reduction',
        kpi_unit: 'percent',
        quarter: '2026-Q1',
        kpi_value: 8,
        target_value: 20,
      },
    ],
    engagements: [],
    signal_firings: [],
    tower_ai_tool_usage: [],
    tower_dora_metrics: [],
    phase_approvals: [],
    engagement_phases: [],
  } as Record<string, Record<string, unknown>[]>;
}

function sections(answer: string): string[] {
  return answer.split('\n\n').map((part) => part.split('\n')[0] ?? '');
}

async function answer(prompt: string, tenancy = APEX): Promise<string> {
  const result = await composeAtlasIacAnswer({ prompt, tenancy, client: mockClient(fixtures()) });
  return result?.response ?? '';
}

describe('Atlas IAC composition', () => {
  it('renders hybrid answers with the required four sections in order', async () => {
    expect(sections(await answer('How does AR-02 compare to industry Copilot adoption?'))).toEqual([
      'Your data',
      'Industry context',
      'The gap',
      'Next move',
    ]);
  });

  it('does not leak a Meridian initiative into Apex tenancy', async () => {
    const response = await answer('How does MH-02 compare to Workday AI agents?', APEX);
    expect(response).toContain('No such initiative in your scope: MH-02');
    expect(response).not.toContain('Workday Agent Intake');
    expect(response).not.toContain('Priya Nair');
  });

  // HI-2 regression — the live failure mode was a real PK like
  // `apex-llm-copilot-2025` with display_id `AR-01`. The user types
  // `AR-01`, intent extraction surfaces `AR-01`, and `loadInitiativeRow`
  // must resolve it via display_id (not the old PK-only lookup).
  it('hybrid composition succeeds when prompt uses display_id and DB PK differs', async () => {
    const fx = fixtures();
    fx.ai_initiatives.push({
      initiative_id: 'apex-llm-copilot-2025',
      client_id: 'client-apex',
      display_id: 'AR-77',
      name: 'Store Associate Copilot',
      primary_category_id: 'CAT-01',
      stage: 'pilot',
      owner_name: 'Carlos Rivera',
      owner_title: 'CIO',
      committed_annual_usd: 1_000_000,
      measured_value_usd: 250_000,
      confidence_level: 'HIGH',
      status_summary: 'Pilot expanding.',
    });
    const result = await composeAtlasIacAnswer({
      prompt: 'Compare AR-77 to industry benchmarks',
      tenancy: APEX,
      client: mockClient(fx),
    });
    expect(result).not.toBeNull();
    // The four-section composition should fire, not the "no such initiative" fallback.
    expect(result!.response).not.toContain('No such initiative');
    expect(sections(result!.response)).toEqual([
      'Your data',
      'Industry context',
      'The gap',
      'Next move',
    ]);
    expect(result!.response).toContain('Store Associate Copilot');
  });

  it.each([
    ['apex initiative', 'tell me about AR-02', APEX],
    ['meridian initiative', 'what is the status of MH-02', MERIDIAN],
    ['apex archetype', 'what is the trend in Copilot adoption?', APEX],
    ['meridian archetype', 'how is the industry using Claude Code?', MERIDIAN],
    ['apex hybrid', 'How does AR-02 compare to industry Copilot adoption?', APEX],
    ['meridian hybrid', 'How does MH-02 compare to Workday AI agents?', MERIDIAN],
  ] as const)('golden: %s', async (_label, prompt, tenancy) => {
    expect(await answer(prompt, tenancy)).toMatchSnapshot();
  });
});

