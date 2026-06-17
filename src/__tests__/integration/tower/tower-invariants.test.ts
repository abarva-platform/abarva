import { existsSync, readFileSync } from 'node:fs';

const TOWER_PAGE = 'src/app/(maestro)/tower/page.tsx';
const AI_TOWER_PAGE = 'src/components/tower/AiControlTowerPage.tsx';

describe('AI Control Tower invariants', () => {
  const pageSource = readFileSync(TOWER_PAGE, 'utf8');
  const aiTowerSource = readFileSync(AI_TOWER_PAGE, 'utf8');

  it('uses the standard application shell so product navigation remains visible', () => {
    expect(pageSource).toContain('AppShell');
    expect(pageSource).toContain('topBarProps');
    expect(pageSource).toContain('surface="tower"');
    expect(pageSource).toContain('hasTenantKey={Boolean(activeClientId)}');
  });

  it('opens the AI Control Tower surface instead of the older portfolio board', () => {
    expect(pageSource).toContain('AiControlTowerPage');
    expect(pageSource).not.toContain('<TowerIndexPage');
    expect(pageSource).not.toContain('TowerMainSubmenuStrip');
  });

  it('keeps lens tabs below the KPI dashboard inside the compact CXO surface', () => {
    expect(aiTowerSource.indexOf('metricGridStyle')).toBeLessThan(
      aiTowerSource.indexOf('tabBarStyle'),
    );
    for (const label of ['Value and adoption', 'Productivity', 'Agents', 'Spend', 'Risk', 'Evidence', 'Actions']) {
      expect(aiTowerSource).toContain(label);
    }
  });

  it('does not render green evidence posture when no evidence rows are committed', () => {
    expect(aiTowerSource).toContain('no committed evidence rows');
    expect(aiTowerSource).toContain('tone={evidenceRows > 0 ? "green" : "red"}');
  });

  it('shows an explicit Spend missing row when no vendor contracts are committed', () => {
    expect(aiTowerSource).toContain('0 committed rows');
    expect(aiTowerSource).toContain('load or commit Spend Contracts before CFO demo');
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
