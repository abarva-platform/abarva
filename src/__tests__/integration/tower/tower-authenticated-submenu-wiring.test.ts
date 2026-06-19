import { existsSync, readFileSync } from 'node:fs';

describe('IT Investment Tower v2 route wiring', () => {
  const maestroChrome = readFileSync('src/components/chrome/MaestroChrome.tsx', 'utf8');
  const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
  const frameRoute = readFileSync('src/app/api/tower/v2-frame/route.ts', 'utf8');
  const towerHtml = readFileSync('public/tower-v2/index.html', 'utf8');
  const towerApp = readFileSync('public/tower-v2/app.js', 'utf8');

  it('renders the approved standalone v2 Tower in the authenticated /tower route', () => {
    expect(pageSource).toContain('<iframe');
    expect(pageSource).toContain('src="/api/tower/v2-frame"');
    expect(pageSource).toContain('AbarVa IT Investment Tower');
    expect(pageSource).not.toContain('<AiControlTowerPage');
  });

  it('keeps the authenticated AbarVa product nav around /tower', () => {
    expect(maestroChrome).toContain("'/admin'");
    expect(maestroChrome).not.toContain("'/tower'");
    expect(pageSource).toContain("height: 'calc(100dvh - 56px)'");
  });

  it('does not allow URL-driven cross-client Tower switching', () => {
    expect(frameRoute).toContain('getActiveClientRow()');
    expect(frameRoute).not.toContain('searchParams');
    expect(frameRoute).not.toContain('requestedClient');
    expect(frameRoute).not.toContain('hasLockedTenantSession');
  });

  it('removes the standalone nav from the frame so the app toolbar is the only nav', () => {
    expect(towerHtml).toContain('tb-nav');
    expect(frameRoute).toContain('stripStandaloneNavigation');
    expect(frameRoute).toContain('<nav class="topbar">');
    expect(frameRoute).toContain("top: 56px");
  });

  it('keeps the v2 Tower lenses and Ask Nexus in one canvas', () => {
    for (const label of ['Programs', 'Spend', 'Vendors', 'By Function', 'Actions']) {
      expect(towerApp).toContain(label);
    }
    expect(towerHtml).toContain('Ask Nexus about the IT portfolio');
    expect(towerApp).toContain('answerFor(q)');
    expect(towerApp).toContain('renderDock');
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
