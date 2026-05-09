import { readFileSync } from 'node:fs';

describe('authenticated Tower submenu wiring', () => {
  const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
  const indexSource = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');
  const detailSource = readFileSync('src/app/(maestro)/tower/programs/[programId]/page.tsx', 'utf8');
  const projectsSource = readFileSync('src/app/(maestro)/tower/projects/page.tsx', 'utf8');
  const staffAugSource = readFileSync('src/app/(maestro)/tower/staff-aug/page.tsx', 'utf8');
  const techStackSource = readFileSync('src/app/(maestro)/tower/tech-stack/page.tsx', 'utf8');
  const volumetricsSource = readFileSync('src/app/(maestro)/tower/volumetrics/page.tsx', 'utf8');
  const summarySource = readFileSync('src/lib/tower/enterprise-summary.ts', 'utf8');

  it('passes the resolved tab into the authenticated Tower workspace', () => {
    expect(pageSource).toContain('const activeTab = resolveTowerTab');
    expect(pageSource).toContain('activeTab={activeTab}');
    expect(indexSource).toContain('activeTab?: TowerTabKey');
    expect(indexSource).toContain("activeTab = 'portfolio'");
  });

  it('renders non-portfolio submenu panels from tenant-bound DB substrate', () => {
    expect(indexSource).toContain('function TowerWorkspaceTabPanel');
    expect(indexSource).toContain("activeTab === 'portfolio' ? (");
    expect(indexSource).toContain("activeTab === 'scorecards'");
    expect(indexSource).toContain("activeTab === 'programme_gates'");
    expect(indexSource).toContain("activeTab === 'dependencies'");
    expect(indexSource).toContain('ai_initiative_vendors');
    expect(indexSource).toContain('Tower will not fall back to Apex fixture dependencies.');
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
    expect(detailSource).toContain('listInitiativesForClient(activeClient.id)');
    expect(detailSource).toContain('listVendorsForClient(activeClient.id)');
    expect(detailSource).not.toContain('ProgramScopePage');
    expect(detailSource).not.toContain('shell-tower-fixture');
  });

  it('filters Tower enterprise pages to non-demo database rows only', () => {
    for (const source of [projectsSource, staffAugSource, techStackSource, volumetricsSource, summarySource]) {
      expect(source).toContain(".eq('is_demo_data', false)");
    }
  });
});
