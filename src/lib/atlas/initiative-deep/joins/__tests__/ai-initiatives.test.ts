// HI-2 fix coverage — `loadInitiativeRow` accepts either the database PK
// (`initiative_id`) OR the user-facing `display_id` (e.g. `AR-01`,
// `MH-01`, `FCF-01`). The composition layer extracts display_ids from CIO
// prompts, so the row lookup must tolerate them.
//
// P0 invariant: tenant scope (`client_id`) is applied BEFORE the
// id-or-display-id match. A Meridian display_id with an Apex tenancy must
// still return null — never cross-tenant data.

import { loadInitiativeRow } from '../ai-initiatives';
import { mockClient } from '../../_test-mock-client';

const APEX = { clientId: 'client-apex', userId: null };
const MERIDIAN = { clientId: 'client-meridian', userId: null };

function fixtures() {
  return {
    ai_initiatives: [
      {
        // Real-world shape: PK is a slugged uuid, display_id is the
        // human-facing code surfaced by intent extraction.
        initiative_id: 'apex-llm-copilot-2025',
        client_id: 'client-apex',
        display_id: 'AR-01',
        name: 'Store Associate Copilot',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'Carlos Rivera',
        owner_title: 'CIO',
        committed_annual_usd: 1_000_000,
        committed_total_usd: null,
        measured_value_usd: 250_000,
        confidence_level: 'HIGH',
        status_summary: 'Pilot expanding.',
      },
      {
        initiative_id: 'meridian-abridge-2025',
        client_id: 'client-meridian',
        display_id: 'MH-01',
        name: 'Ambient Clinical Documentation',
        primary_category_id: 'CAT-07',
        stage: 'pilot',
        owner_name: 'Dr Alex Chen',
        owner_title: 'CMIO',
        committed_annual_usd: 4_000_000,
        committed_total_usd: null,
        measured_value_usd: 1_200_000,
        confidence_level: 'HIGH',
        status_summary: 'Rollout to 8 hospitals.',
      },
    ],
  } as Record<string, Record<string, unknown>[]>;
}

describe('loadInitiativeRow — display_id-or-PK lookup (HI-2 fix)', () => {
  it('back-compat: looking up by the database PK still returns the row', async () => {
    const client = mockClient(fixtures());
    const row = await loadInitiativeRow(client, 'apex-llm-copilot-2025', APEX);
    expect(row).not.toBeNull();
    expect(row!.initiative_id).toBe('apex-llm-copilot-2025');
    expect(row!.display_id).toBe('AR-01');
    expect(row!.name).toBe('Store Associate Copilot');
  });

  it('THE FIX: looking up by display_id returns the same row', async () => {
    const client = mockClient(fixtures());
    const row = await loadInitiativeRow(client, 'AR-01', APEX);
    expect(row).not.toBeNull();
    // Critical: this returns the row whose display_id matches AR-01 even
    // though the database PK is `apex-llm-copilot-2025`.
    expect(row!.initiative_id).toBe('apex-llm-copilot-2025');
    expect(row!.display_id).toBe('AR-01');
    expect(row!.name).toBe('Store Associate Copilot');
  });

  it('P0 invariant: cross-tenant lookup by display_id returns null', async () => {
    const client = mockClient(fixtures());
    // Apex tenancy asking for Meridian display_id MH-01 must NOT receive
    // the Meridian row. Tenant scope is applied before the id match.
    const row = await loadInitiativeRow(client, 'MH-01', APEX);
    expect(row).toBeNull();
  });

  it('P0 invariant: cross-tenant lookup by display_id (reverse) returns null', async () => {
    const client = mockClient(fixtures());
    const row = await loadInitiativeRow(client, 'AR-01', MERIDIAN);
    expect(row).toBeNull();
  });

  it('nonexistent id returns null', async () => {
    const client = mockClient(fixtures());
    const row = await loadInitiativeRow(client, 'AR-99999', APEX);
    expect(row).toBeNull();
  });

  it('nonexistent PK returns null', async () => {
    const client = mockClient(fixtures());
    const row = await loadInitiativeRow(client, 'does-not-exist', APEX);
    expect(row).toBeNull();
  });
});
