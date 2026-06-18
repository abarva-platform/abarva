import { existsSync, readFileSync } from 'node:fs';

describe('Context & Corpus Explorer route wiring', () => {
  const intelligencePageSource = readFileSync('src/app/intelligence/page.tsx', 'utf8');
  const explorerSource = readFileSync(
    'src/components/intelligence-v4/ContextCorpusExplorerPage.tsx',
    'utf8',
  );

  it('renders the explorer from the live /intelligence route', () => {
    expect(intelligencePageSource).toContain('AppShell');
    expect(intelligencePageSource).toContain('surface="intelligence"');
    expect(intelligencePageSource).toContain('ContextCorpusExplorerPage');
    expect(intelligencePageSource).toContain('getEnterpriseContextOverviewForTenant');
    expect(intelligencePageSource).toContain('getAiControlTowerReadModel');
    expect(intelligencePageSource).toContain('towerModel={towerModel}');
    expect(intelligencePageSource).toContain('enterpriseContextTenantKey');
    expect(intelligencePageSource).toContain("return 'first-capital'");
    expect(intelligencePageSource).toContain("return 'meridian-health'");
    expect(intelligencePageSource).toContain("return 'apex-retail'");
    expect(intelligencePageSource).not.toContain('IntelligenceV3Page');
    expect(intelligencePageSource).not.toContain('buildIntelligenceV3PageData');
  });

  it('does not create a duplicate route-group page for /intelligence', () => {
    expect(existsSync('src/app/intelligence/page.tsx')).toBe(true);
    expect(existsSync('src/app/(maestro)/intelligence/page.tsx')).toBe(false);
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
