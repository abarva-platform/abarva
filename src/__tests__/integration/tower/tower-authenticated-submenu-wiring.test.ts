import { existsSync, readFileSync } from 'node:fs';

describe('IT Investment Tower v2 route wiring', () => {
  const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
  const frameRoute = readFileSync('src/app/api/tower/v2-frame/route.ts', 'utf8');
  const towerHtml = readFileSync('public/tower-v2/index.html', 'utf8');
  const towerApp = readFileSync('public/tower-v2/app.js', 'utf8');

  it('renders the approved standalone v2 Tower in the authenticated /tower route', () => {
    expect(pageSource).toContain('<iframe');
    expect(pageSource).toContain('/api/tower/v2-frame?client=');
    expect(pageSource).toContain('AbarVa IT Investment Tower');
    expect(pageSource).not.toContain('<AiControlTowerPage');
  });

  it('threads the server-resolved tenant into the Tower frame without bypassing locked-session enforcement', () => {
    expect(pageSource).toContain('getActiveClientRow()');
    expect(frameRoute).toContain('request.nextUrl.searchParams.get');
    expect(frameRoute).toContain('getActiveClientRow(requestedClient)');
    expect(frameRoute).not.toContain('hasLockedTenantSession');
    expect(frameRoute).not.toContain('catch(() => null)');
  });

  it('keeps product navigation inside the v2 Tower shell', () => {
    for (const label of ['Home', 'Intelligence', 'Moves', 'Source', 'Tower']) {
      expect(towerHtml).toContain(label);
    }
    expect(towerHtml).toContain('First Capital Financial');
    expect(towerHtml).toContain('tb-nav');
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
