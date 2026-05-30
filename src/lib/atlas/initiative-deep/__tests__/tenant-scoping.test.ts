// P0 invariant — getInitiativeDeepView NEVER returns cross-tenant data.
//
// Same shape as the Atlas synthesis-route Fix A invariant: construct a
// Meridian initiative AND an Apex initiative, call getInitiativeDeepView
// with the Meridian id + Meridian tenancy, and assert that zero Apex data
// appears in the result. Then reverse the pair — Apex id + Apex tenancy
// must not surface Meridian content either.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getInitiativeDeepView } from '../retrieve';
import { mockClient } from '../_test-mock-client';

const MERIDIAN = { clientId: 'client-meridian', userId: null };
const APEX = { clientId: 'client-apex', userId: null };

function twoTenantFixtures() {
  return {
    ai_initiatives: [
      {
        initiative_id: 'MR-01',
        client_id: 'client-meridian',
        display_id: 'MR-01',
        name: 'Ambient Clinical Documentation (Abridge)',
        description: 'Meridian-only — clinical documentation',
        primary_category_id: 'CAT-07',
        stage: 'pilot',
        owner_name: 'Dr Alex Chen',
        owner_title: 'CMIO',
        committed_annual_usd: 4_000_000,
        committed_total_usd: null,
        measured_value_usd: 1_200_000,
        confidence_level: 'HIGH',
        status_summary: 'Abridge rollout to 8 hospitals.',
      },
      {
        initiative_id: 'AR-02',
        client_id: 'client-apex',
        display_id: 'AR-02',
        name: 'Copilot for Retail Associates',
        description: 'Apex-only — retail associate copilot',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'Carlos Rivera',
        owner_title: 'CIO',
        committed_annual_usd: 1_000_000,
        committed_total_usd: null,
        measured_value_usd: 250_000,
        confidence_level: 'HIGH',
        status_summary: 'Pilot in 40 retail locations.',
      },
    ],
    ai_initiative_kpis: [
      {
        initiative_id: 'MR-01',
        kpi_name: 'Note-completion time saved',
        kpi_unit: 'minutes per encounter',
        quarter: '2026-Q1',
        kpi_value: 4.2,
        target_value: 5,
      },
      {
        initiative_id: 'AR-02',
        kpi_name: 'Associate task completion',
        kpi_unit: 'percent',
        quarter: '2026-Q1',
        kpi_value: 88,
        target_value: 92,
      },
    ],
    clients: [
      { id: 'client-meridian', industry_code: 'HEALTHCARE' },
      { id: 'client-apex', industry_code: 'RETAIL' },
    ],
    engagements: [],
    signal_firings: [],
    tower_ai_tool_usage: [],
    tower_dora_metrics: [],
    phase_approvals: [],
    engagement_phases: [],
  } as Record<string, Record<string, unknown>[]>;
}

function rendered(view: unknown): string {
  return JSON.stringify(view ?? {});
}

describe('tenant scoping — P0 invariant', () => {
  it('Meridian tenancy returns Meridian data only — no Apex content leaks', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('MR-01', MERIDIAN, client);
    expect(view).not.toBeNull();
    const blob = rendered(view);
    expect(blob).toContain('Abridge');
    // Apex-only tokens must not appear anywhere in the result.
    expect(blob).not.toContain('Copilot for Retail Associates');
    expect(blob).not.toContain('Carlos Rivera');
    expect(blob).not.toContain('AR-02');
    expect(blob).not.toContain('Associate task completion');
  });

  it('Apex tenancy returns Apex data only — no Meridian content leaks', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    const blob = rendered(view);
    expect(blob).toContain('Copilot for Retail Associates');
    expect(blob).not.toContain('Abridge');
    expect(blob).not.toContain('Dr Alex Chen');
    expect(blob).not.toContain('MR-01');
    expect(blob).not.toContain('Note-completion time saved');
  });

  it('Meridian tenancy passed an Apex initiative id returns null — no row crossing', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('AR-02', MERIDIAN, client);
    expect(view).toBeNull();
  });

  it('Apex tenancy passed a Meridian initiative id returns null — no row crossing', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('MR-01', APEX, client);
    expect(view).toBeNull();
  });

  it('portfolio percentile uses ONLY the caller-tenant initiatives', async () => {
    const fx = twoTenantFixtures();
    // Add Apex peers AND Meridian peers to confirm cross-tenant rows do not
    // contaminate the percentile distribution.
    fx.ai_initiatives.push(
      {
        initiative_id: 'AR-99',
        client_id: 'client-apex',
        display_id: 'AR-99',
        name: 'Apex peer A',
        description: '',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 500_000,
        committed_total_usd: null,
        measured_value_usd: 50_000, // attainment 0.1
        confidence_level: 'MED',
        status_summary: null,
      },
      {
        initiative_id: 'AR-98',
        client_id: 'client-apex',
        display_id: 'AR-98',
        name: 'Apex peer B',
        description: '',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 1_000_000,
        committed_total_usd: null,
        measured_value_usd: 150_000, // attainment 0.15
        confidence_level: 'MED',
        status_summary: null,
      },
      // Meridian initiative with an absurdly high attainment — if the percentile
      // computation leaks across tenants this WILL change Apex's result.
      {
        initiative_id: 'MR-99',
        client_id: 'client-meridian',
        display_id: 'MR-99',
        name: 'Meridian high attainment',
        description: '',
        primary_category_id: 'CAT-07',
        stage: 'scaled',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 100_000,
        committed_total_usd: null,
        measured_value_usd: 9_999_999, // attainment ≫ 1; would dominate
        confidence_level: 'HIGH',
        status_summary: null,
      },
    );
    const client = mockClient(fx);
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    // AR-02 attainment = 0.25; Apex peers AR-99 (0.1) and AR-98 (0.15) both lower.
    // If Meridian's MR-99 (attainment 99.99) leaked in, this would be ~33, not 66/67.
    expect(view!.portfolioPosition.valueAttainmentPercentileInTenant).toBe(67);
  });

  it('grep invariant — no hardcoded tenant key in src/lib/atlas/initiative-deep/', () => {
    const root = resolve(__dirname, '..');
    const filesToScan = [
      'types.ts',
      'retrieve.ts',
      'joins/ai-initiatives.ts',
      'joins/tower-metrics.ts',
      'joins/value-attestation.ts',
      'joins/business-case.ts',
      'joins/gates.ts',
      'joins/signals.ts',
      'joins/portfolio-position.ts',
    ];
    const FORBIDDEN = ["'apexretail'", "'meridian'", "'arcturus'", '"apexretail"', '"meridian"', '"arcturus"'];
    for (const rel of filesToScan) {
      const text = readFileSync(resolve(root, rel), 'utf8');
      for (const token of FORBIDDEN) {
        expect({ file: rel, token, found: text.includes(token) }).toEqual({
          file: rel,
          token,
          found: false,
        });
      }
    }
  });
});
