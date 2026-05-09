import { readFileSync } from 'node:fs';

describe('Tower DB-only surface guard', () => {
  const towerPage = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
  const towerIndex = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');
  const visibleTowerSource = `${towerPage}\n${towerIndex}`;

  it('does not wire visible Tower content to fixture or route-slug fallbacks', () => {
    expect(towerPage).not.toContain('getSetupAiInitiatives');
    expect(towerPage).not.toContain('fixture_fallback');
    expect(towerPage).not.toContain('findTenantByRouteSlug');
    expect(towerPage).not.toContain("findTenantByRouteSlug('apexretail')");
  });

  it('does not render legacy Apex demo values when DB substrate is empty', () => {
    expect(visibleTowerSource).not.toContain('LEGACY_');
    expect(visibleTowerSource).not.toContain('JOULE');
    expect(visibleTowerSource).not.toContain('M365-CORE');
    expect(visibleTowerSource).not.toContain('NOW-ASSIST');
    expect(visibleTowerSource).not.toContain('Portfolio ROI is at 2.8');
    expect(visibleTowerSource).not.toContain('Microsoft EA renewal closes in 47 days');
    expect(visibleTowerSource).not.toContain("Today's pressures · 7 active");
  });
});
