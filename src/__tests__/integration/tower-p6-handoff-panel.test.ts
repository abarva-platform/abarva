import { readFileSync } from 'node:fs';

describe('Tower P6 handoff panel', () => {
  it('queries live P6 programs and transitioned Source events for the active client with assignment scoping', () => {
    const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
    const componentSource = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');

    expect(pageSource).toContain(".eq('client_id', tenancy.clientId)");
    expect(pageSource).toContain(".eq('current_phase', 6)");
    expect(pageSource).toContain('loadUserProgramAccessPolicy');
    expect(pageSource).toContain("query.in('id', policy.programIdsAllowed)");
    expect(pageSource).toContain('Tower handoffs · P6 active');
    expect(pageSource).toContain('loadUserSourceAccessPolicy');
    expect(pageSource).toContain(".from('source_events')");
    expect(pageSource).toContain(".eq('client_key', activeClient.key)");
    expect(pageSource).toContain("['transition', 'value', 'contract_mobilization', 'value_realization']");
    expect(pageSource).toContain("query.in('id', policy.sourceEventIdsAllowed)");
    expect(pageSource).toContain('Source handoffs · Tower observation');
    expect(pageSource).toContain('data-testid=\"tower-source-handoff-panel\"');
    expect(componentSource).toContain('towerHandoffSlot');
  });
});
