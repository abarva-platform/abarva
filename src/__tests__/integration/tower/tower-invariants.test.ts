import { existsSync, readFileSync } from 'node:fs';

import { ALL_CLIENTS } from '@/lib/client-config';
import { TOWER_V2_CLIENT_PACKS, resolveTowerV2ClientPack } from '@/lib/tower-v2/v4-data';

const TOWER_PAGE = 'src/app/(maestro)/tower/page.tsx';
const TOWER_FRAME_ROUTE = 'src/app/api/tower/v2-frame/route.ts';
const TOWER_DATA_ROUTE = 'src/app/api/tower/v2-data/route.ts';
const TOWER_V4_DATA = 'src/lib/tower-v2/v4-data.ts';
const TOWER_V2_HTML = 'public/tower-v2/index.html';
const TOWER_V2_DATA = 'public/tower-v2/default-data.js';
const TOWER_V2_APP = 'public/tower-v2/app.js';

describe('IT Investment Tower v2 invariants', () => {
  const pageSource = readFileSync(TOWER_PAGE, 'utf8');
  const towerHtml = readFileSync(TOWER_V2_HTML, 'utf8');
  const towerData = readFileSync(TOWER_V2_DATA, 'utf8');
  const towerApp = readFileSync(TOWER_V2_APP, 'utf8');
  const frameRoute = readFileSync(TOWER_FRAME_ROUTE, 'utf8');
  const dataRoute = readFileSync(TOWER_DATA_ROUTE, 'utf8');
  const v4DataSource = readFileSync(TOWER_V4_DATA, 'utf8');

  it('mounts the approved standalone v2 Tower surface on /tower', () => {
    expect(pageSource).toContain('/api/tower/v2-frame?client=');
    expect(pageSource).toContain('<AppShell');
    expect(pageSource).toContain('surface="tower"');
    expect(pageSource).toContain('src={frameSrc}');
    expect(pageSource).toContain('title="AbarVa IT Investment Tower"');
    expect(pageSource).not.toContain('AiControlTowerPage');
  });

  it('binds the authenticated Tower frame to the active client only', () => {
    expect(pageSource).toContain('getActiveClientRow()');
    expect(frameRoute).toContain('request.nextUrl.searchParams.get');
    expect(dataRoute).toContain('request.nextUrl.searchParams.get');
    expect(frameRoute).toContain('getActiveClientRow(requestedClient)');
    expect(dataRoute).toContain('getActiveClientRow(requestedClient)');
    expect(frameRoute).not.toContain('catch(() => null)');
    expect(dataRoute).not.toContain('catch(() => null)');
    expect(frameRoute).toContain('buildTowerV2V4DataScript');
    expect(dataRoute).toContain('buildTowerV2V4DataScript');
    expect(frameRoute).toContain('rewriteTenantShell');
    expect(frameRoute).toContain('<span class="tb-tenant">${tenantName}</span>');
    expect(frameRoute).toContain('<title>AbarVa · IT Investment Tower · ${tenantName}</title>');
  });

  it('maps every configured client to an explicit Tower data pack', () => {
    expect(ALL_CLIENTS.map((client) => client.id).sort()).toEqual([
      'apexretail',
      'arcturus',
      'lakeshore',
      'meridian',
      'northstar',
      'skyharbor',
    ]);
    expect(TOWER_V2_CLIENT_PACKS.map((pack) => pack.datasetDir).sort()).toEqual([
      'apex-retail-synthetic-v4',
      'first-capital-financial-synthetic-v4',
      'lakeshore-industries-synthetic-v4',
      'meridian-health-synthetic-v4',
      'northstar-clinical-tech-synthetic-v1',
      'skyharbor-air-synthetic-v4',
    ]);

    for (const client of ALL_CLIENTS) {
      const pack = resolveTowerV2ClientPack(client.id, client.name);
      expect(existsSync(`datasets/${pack.datasetDir}`)).toBe(true);
      expect(pack.keys).toEqual(expect.arrayContaining([client.id]));
    }
  });

  it('keeps the v2 offline assets in place', () => {
    expect(existsSync(TOWER_V2_HTML)).toBe(true);
    expect(existsSync(TOWER_V2_DATA)).toBe(true);
    expect(existsSync(TOWER_V2_APP)).toBe(true);
    expect(towerHtml).toContain('/tower-v2/default-data.js');
    expect(towerHtml).toContain('/tower-v2/app.js');
    expect(frameRoute).toContain('rewriteRelativeTowerAssets');
    expect(frameRoute).toContain('/tower-v2/');
    expect(frameRoute).toContain('abarva-option2-hq-nav-dark-standard.svg');
  });

  it('preserves the approved v2 KPI anchor and lens set', () => {
    for (const label of ['Home', 'Intelligence', 'Moves', 'Source', 'Tower']) {
      expect(towerHtml).toContain(label);
    }
    expect(towerHtml).toContain('Where is the IT money going, and what is it producing?');
    expect(towerApp).toContain("Programs");
    expect(towerApp).toContain("Spend");
    expect(towerApp).toContain("Vendors");
    expect(towerApp).toContain("By Function");
    expect(towerApp).toContain("Actions");
    for (const slice of ['CapEx vs OpEx', 'Software / HW / Services / Cloud', 'Run vs Change', 'AI vs non-AI']) {
      expect(towerApp).toContain(slice);
    }
  });

  it('keeps the live binding mapped to the v4 private data-plane packs', () => {
    expect(v4DataSource).toContain('family-4-financial-commercial/F12_it-budget-financials.csv');
    expect(v4DataSource).toContain('family-4-financial-commercial/F11_vendors-contracts-licenses.csv');
    expect(v4DataSource).toContain('ai-control-tower/T01_initiative-registry.csv');
    expect(v4DataSource).toContain('ai-control-tower/T07_benefit-realization.csv');
    expect(v4DataSource).toContain('ai-control-tower/T08_spend-contracts.csv');
    expect(v4DataSource).toContain('ai-control-tower/T12_derived-actions.csv');
    expect(v4DataSource).toContain('northstar-clinical-tech-synthetic-v1');
    expect(v4DataSource).toContain('10-initiatives/initiatives-active.csv');
    expect(v4DataSource).toContain('annual_contract_value_usd');
    expect(v4DataSource).toContain('annual_run_rate_usd');
  });

  it('preserves the approved synthetic First Capital investment model', () => {
    expect(towerData).toContain('$342M FY26 IT budget');
    expect(towerData).toContain("budget: 84");
    expect(towerData).toContain("name: 'Core Banking Platform'");
    expect(towerData).toContain("name: 'DXC'");
    expect(towerData).toContain("title: 'Kill three AI initiatives with no verified value.'");
  });

  it('retains the required interaction affordances', () => {
    expect(towerApp).toContain('toggleViewBtn');
    expect(towerApp).toContain('progDrawer');
    expect(towerApp).toContain('vendorDrawer');
    expect(towerApp).toContain('actionDrawer');
    expect(towerApp).toContain('Approve & route');
    expect(towerApp).toContain('Ask Nexus');
    expect(towerApp).toContain('localStorage.setItem');
  });

  it('hides standalone Tower chrome when embedded under AppShell', () => {
    expect(frameRoute).toContain('abarva-tower-v2-embed-css');
    expect(frameRoute).toContain('.topbar { display: none !important; }');
  });

  it('removes legacy Tower route files that can show retired views', () => {
    const removedRoutes = [
      'src/app/(maestro)/tower/activity/page.tsx',
      'src/app/(maestro)/tower/lens/page.tsx',
      'src/app/(maestro)/tower/onboard/page.tsx',
      'src/app/(maestro)/tower/onboard/[dimension]/page.tsx',
      'src/app/(maestro)/tower/outcomes/page.tsx',
      'src/app/(maestro)/tower/portfolio/page.tsx',
      'src/app/(maestro)/tower/portfolio-dag/page.tsx',
      'src/app/(maestro)/tower/pressures/page.tsx',
      'src/app/(maestro)/tower/pressures/[pressureId]/page.tsx',
      'src/app/(maestro)/tower/preview/page.tsx',
      'src/app/(maestro)/tower/programs/page.tsx',
      'src/app/(maestro)/tower/programs/[programId]/page.tsx',
      'src/app/(maestro)/tower/programs/[programId]/value/page.tsx',
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
