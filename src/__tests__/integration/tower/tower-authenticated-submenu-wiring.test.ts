import { existsSync, readFileSync } from 'node:fs';

describe('AI Control Tower route wiring', () => {
  const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
  const aiTowerSource = readFileSync('src/components/tower/AiControlTowerPage.tsx', 'utf8');

  it('renders the redesigned AI Control Tower inside the standard AppShell navigation', () => {
    expect(pageSource).toContain('AppShell');
    expect(pageSource).toContain('surface="tower"');
    expect(pageSource).toContain('AI Control Tower ·');
    expect(pageSource).toContain('<AiControlTowerPage');
  });

  it('loads Tower substrate from the active client row', () => {
    expect(pageSource).toContain('resolveTowerClient(resolvedSearchParams.client)');
    expect(pageSource).toContain('TOWER_PILOT_CLIENT_KEYS');
    expect(pageSource).toContain('clientHasTowerSubstrate(candidate.id)');
    expect(pageSource).toContain('buildTowerInitiatives(activeClientId)');
    expect(pageSource).toContain('buildTowerVendors(activeClientId)');
    expect(pageSource).toContain('buildTowerSetupInitiativesFeed(activeClient)');
  });

  it('keeps the seven AI Control Tower lenses in one canvas', () => {
    for (const label of [
      'Value and adoption',
      'Productivity',
      'Agents',
      'Spend',
      'Risk',
      'Evidence',
      'Actions',
    ]) {
      expect(aiTowerSource).toContain(label);
    }
    expect(aiTowerSource).toContain('messages={atlasMessages}');
    expect(aiTowerSource).toContain('atlasReplyForLens');
  });

  it('removes legacy Tower subroutes so the old portfolio board cannot reappear by URL', () => {
    const removedRoutes = [
      'src/app/(maestro)/tower/activity/page.tsx',
      'src/app/(maestro)/tower/lens/page.tsx',
      'src/app/(maestro)/tower/onboard/page.tsx',
      'src/app/(maestro)/tower/outcomes/page.tsx',
      'src/app/(maestro)/tower/portfolio/page.tsx',
      'src/app/(maestro)/tower/portfolio-dag/page.tsx',
      'src/app/(maestro)/tower/pressures/page.tsx',
      'src/app/(maestro)/tower/preview/page.tsx',
      'src/app/(maestro)/tower/programs/page.tsx',
      'src/app/(maestro)/tower/projects/page.tsx',
      'src/app/(maestro)/tower/source-portfolio-value/page.tsx',
      'src/app/(maestro)/tower/staff-aug/page.tsx',
      'src/app/(maestro)/tower/tech-stack/page.tsx',
      'src/app/(maestro)/tower/volumetrics/page.tsx',
    ];
    for (const route of removedRoutes) {
      expect(existsSync(route)).toBe(false);
    }
  });
});
