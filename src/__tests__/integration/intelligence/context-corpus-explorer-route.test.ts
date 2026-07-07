import { existsSync, readFileSync } from 'node:fs';

describe('Advisory Intelligence route wiring', () => {
  const maestroPageSource = readFileSync('src/app/(maestro)/intelligence/page.tsx', 'utf8');
  const advisorySource = readFileSync(
    'src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx',
    'utf8',
  );
  const tenantPageSource = readFileSync(
    'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
    'utf8',
  );

  it('renders the advisory board from the maestro shell route, not a raw root page', () => {
    expect(maestroPageSource).toContain('AppShell');
    expect(maestroPageSource).toContain('surface="intelligence"');
    expect(maestroPageSource).toContain('AdvisoryIntelligencePage');
    expect(maestroPageSource).toContain('getEnterpriseLandscapeViewModel');
    expect(maestroPageSource).toContain('enterpriseContextTenantKey');
    expect(maestroPageSource).toContain("return 'first-capital'");
    expect(maestroPageSource).toContain("return 'meridian-health'");
    expect(maestroPageSource).toContain("return 'apex-retail'");
    expect(maestroPageSource).not.toContain('IntelligenceV3Page');
    expect(maestroPageSource).not.toContain('buildIntelligenceV3PageData');
    expect(maestroPageSource).not.toContain('ContextCorpusExplorerPage');
  });

  it('does not create a duplicate route-group page for /intelligence', () => {
    expect(existsSync('src/app/(maestro)/intelligence/page.tsx')).toBe(true);
    expect(existsSync('src/app/intelligence/page.tsx')).toBe(false);
    expect(existsSync('src/components/intelligence-v4/ContextCorpusExplorerPage.tsx')).toBe(false);
  });

  it('keeps old repository/explorer language off the user-facing advisory page', () => {
    expect(advisorySource).toContain('AbarVa Intelligence');
    expect(advisorySource).toContain('Advisory board');
    expect(advisorySource).toContain('Recommendation');
    expect(advisorySource).not.toContain('What your context is telling us');
    expect(advisorySource).not.toContain('The strongest cross-context reads');
    expect(advisorySource).not.toContain('Dimensions Loaded');
    expect(advisorySource).not.toContain('Graph Edges');
    expect(advisorySource).not.toContain('Ask about loaded context');
  });

  it('redirects tenant-specific intelligence deep links to the canonical advisory page', () => {
    expect(tenantPageSource).toContain("redirect(`/intelligence?client=");
    expect(tenantPageSource).not.toContain('IntelligenceLensTabs');
    expect(tenantPageSource).not.toContain('resolveIntelligenceTab');
  });
});
