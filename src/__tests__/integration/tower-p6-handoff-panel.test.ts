import { readFileSync } from 'node:fs';

describe('Tower P6 handoff panel', () => {
  it('queries live P6 programs for the active client with assignment scoping', () => {
    const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
    const componentSource = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');

    expect(pageSource).toContain(".eq('client_id', tenancy.clientId)");
    expect(pageSource).toContain(".eq('current_phase', 6)");
    expect(pageSource).toContain('loadUserProgramAccessPolicy');
    expect(pageSource).toContain("query.in('id', policy.programIdsAllowed)");
    expect(pageSource).toContain('Tower handoffs · P6 active');
    expect(componentSource).toContain('towerHandoffSlot');
  });
});
