import { readFileSync, existsSync } from 'node:fs';

describe('authenticated Tower submenu wiring', () => {
  const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
  const indexSource = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');
  const detailSource = readFileSync('src/app/(maestro)/tower/programs/[programId]/page.tsx', 'utf8');

  it('passes the resolved tab into the authenticated Tower workspace', () => {
    expect(pageSource).toContain('const activeTab = resolveTowerTab');
    expect(pageSource).toContain('activeTab={activeTab}');
    expect(indexSource).toContain('activeTab?: TowerTabKey');
    expect(indexSource).toContain("activeTab = 'portfolio'");
  });

  it('loads Tower substrate from the active client row, not person-tenancy side effects', () => {
    expect(pageSource).toContain('resolveTowerClient(resolvedSearchParams.client)');
    expect(pageSource).toContain('TOWER_PILOT_CLIENT_KEYS');
    expect(pageSource).toContain('clientHasTowerSubstrate(candidate.id)');
    expect(pageSource).toContain('buildTowerInitiatives(activeClientId)');
    expect(pageSource).toContain('buildTowerVendors(activeClientId)');
    expect(pageSource).toContain('buildTowerSetupInitiativesFeed(activeClient)');
    expect(pageSource).toContain('const tenancy = await requireTenancy().catch(() => null)');
  });

  it('renders non-portfolio submenu panels from tenant-bound DB substrate', () => {
    expect(indexSource).toContain('function TowerWorkspaceTabPanel');
    expect(indexSource).toContain("activeTab === 'portfolio' ? (");
    expect(indexSource).toContain('activeLens={activeLens}');
    expect(indexSource).toContain('tabLensNarrative(activeTab, activeLens)');
    expect(indexSource).toContain('rankInitiativesForLens(initiatives, vendors, activeLens)');
    expect(indexSource).toContain('rankVendorsForLens(vendors, initiatives, activeLens)');
    expect(indexSource).toContain("activeTab === 'scorecards'");
    expect(indexSource).toContain("activeTab === 'programme_gates'");
    expect(indexSource).toContain("activeTab === 'dependencies'");
    expect(indexSource).toContain('ai_initiative_vendors');
  });

  it('opens portfolio pressure and matrix items in an inline detail canvas', () => {
    expect(indexSource).toContain('tower-pressure-detail-link');
    expect(indexSource).toContain('function TowerInlineDetailPanel');
    expect(indexSource).toContain('data-testid="tower-inline-detail-panel"');
    expect(indexSource).toContain('activeDetailId ? (');
    expect(indexSource).toContain('towerCanvasRef.current?.scrollTo');
    expect(indexSource).toContain('detailHrefFor(card.displayId, card.id)');
    expect(indexSource).toContain("params.set('detail', detail)");
    expect(indexSource).toContain("params.set('pressure', pressure)");
    expect(indexSource).toContain('Open Tower detail in this canvas');
  });

  it('exposes a real /tower/programs/[programId] drilldown (not a redirect-shell)', () => {
    // Tower audit §5.3 fix: program detail must be a real route, not a
    // redirect back to `/tower?detail=…`. The shell has been removed.
    expect(detailSource).not.toContain("redirect(`/tower?detail=");
    expect(detailSource).toContain('getProgramById');
    expect(detailSource).toContain('TowerDecisionActionRow');
    // Locked AbarVa palette: cream background on the page.
    expect(detailSource).toContain("'#F8F7F4'");
  });

  it('removes the legacy redirect-shells under /tower', () => {
    // Tower audit §5.4 + brief item 6: dead redirects deleted.
    const deletedShells = [
      'src/app/(maestro)/tower/lens/value/page.tsx',
      'src/app/(maestro)/tower/lens/cost/page.tsx',
      'src/app/(maestro)/tower/lens/risk/page.tsx',
      'src/app/(maestro)/tower/lens/adoption/page.tsx',
      'src/app/(maestro)/tower/lens/inventory/page.tsx',
      'src/app/(maestro)/tower/activity/page.tsx',
      'src/app/(maestro)/tower/outcomes/page.tsx',
      'src/app/(maestro)/tower/projects/page.tsx',
      'src/app/(maestro)/tower/staff-aug/page.tsx',
      'src/app/(maestro)/tower/tech-stack/page.tsx',
      'src/app/(maestro)/tower/volumetrics/page.tsx',
      'src/app/(maestro)/tower/preview/page.tsx',
      'src/app/(maestro)/preview/tower/page.tsx',
    ];
    for (const path of deletedShells) {
      expect(existsSync(path)).toBe(false);
    }
  });
});
