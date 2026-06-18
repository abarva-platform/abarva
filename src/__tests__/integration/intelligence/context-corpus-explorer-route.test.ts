import { existsSync, readFileSync } from 'node:fs';

describe('Context & Corpus Explorer route wiring', () => {
  const maestroPageSource = readFileSync('src/app/(maestro)/intelligence/page.tsx', 'utf8');
  const explorerSource = readFileSync(
    'src/components/intelligence-v4/ContextCorpusExplorerPage.tsx',
    'utf8',
  );

  it('renders the explorer from the maestro shell route, not a raw root page', () => {
    expect(maestroPageSource).toContain('AppShell');
    expect(maestroPageSource).toContain('surface="intelligence"');
    expect(maestroPageSource).toContain('ContextCorpusExplorerPage');
    expect(maestroPageSource).toContain('getEnterpriseContextOverviewForTenant');
    expect(maestroPageSource).toContain('getAiControlTowerReadModel');
    expect(maestroPageSource).toContain('towerModel={towerModel}');
    expect(maestroPageSource).toContain('enterpriseContextTenantKey');
    expect(maestroPageSource).toContain("return 'first-capital'");
    expect(maestroPageSource).toContain("return 'meridian-health'");
    expect(maestroPageSource).toContain("return 'apex-retail'");
    expect(maestroPageSource).not.toContain('IntelligenceV3Page');
    expect(maestroPageSource).not.toContain('buildIntelligenceV3PageData');
  });

  it('does not create a duplicate route-group page for /intelligence', () => {
    expect(existsSync('src/app/(maestro)/intelligence/page.tsx')).toBe(true);
    expect(existsSync('src/app/intelligence/page.tsx')).toBe(false);
  });

  it('renders the redesigned Intelligence and Sentinel shell from live context rows', () => {
    expect(explorerSource).toContain('CONTEXT INTELLIGENCE');
    expect(explorerSource).not.toContain('IntelligenceV3TopNav');
    expect(explorerSource).toContain('What your context is telling us');
    expect(explorerSource).toContain('contextInsights');
    expect(explorerSource).toContain('Risk, controls & evidence');
    expect(explorerSource).toContain('Corpus');
    expect(explorerSource).toContain('Sentinel');
    expect(explorerSource).toContain('Which AI initiatives should we kill, and why?');
    expect(explorerSource).toContain('AI initiatives & adoption');
  });
});
