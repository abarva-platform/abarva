// Tower invariant tests — Apple-grade polish guardrails.
//
// These assertions back the Tower design-system + decide-and-route +
// fixture-strip work in the "feat(tower): Apple-grade polish" slice.
// They are intentionally cheap (file-text greps) so they run on every CI
// pass without spinning up Next or the DB.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOWER_ROUTES_DIR = 'src/app/(maestro)/tower';
const TOWER_COMPONENTS_DIR = 'src/components/tower';
const TOWER_INDEX = 'src/components/tower/TowerIndexPage.tsx';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('Tower invariants — Apple-grade polish slice', () => {
  describe('design system (locked AbarVa tokens on the index)', () => {
    const indexSource = readFileSync(TOWER_INDEX, 'utf8');

    it('uses #F8F7F4 cream as the index page background, not #ffffff', () => {
      // The audit (`§5.2`) called out the white-bg divergence on `/tower`.
      // The page wrapper must use the locked cream token.
      expect(indexSource).toContain("PAGE_BG: '#F8F7F4'");
      expect(indexSource).not.toContain("PAGE_BG: '#ffffff'");
    });

    it('binds Fraunces (serif) and Inter (sans) as the headline + body fonts', () => {
      expect(indexSource).toContain('Fraunces');
      expect(indexSource).toContain('Inter');
    });
  });

  describe('fixture strip (Apex contact-centre card)', () => {
    const towerPageSource = readFileSync(`${TOWER_ROUTES_DIR}/page.tsx`, 'utf8');

    it('gates buildApexPortfolioCards behind TOWER_APEX_FIXTURE_ENABLED', () => {
      // Per the broker-boundary memory the app-tier must not directly
      // surface hardcoded fixtures without an explicit opt-in. The fixture
      // import is only safe to call when the env flag is set.
      expect(towerPageSource).toContain('TOWER_APEX_FIXTURE_ENABLED');
      expect(towerPageSource).toContain('apexFixtureEnabled');
    });

    it('does not surface a hardcoded "Apex Contact Center" string on any non-fixture Tower render-path file', () => {
      // Grep every Tower page + component file for the literal product
      // name. The single allowed exception is the fixture file itself,
      // which is *only* reached when the env flag is enabled.
      const files = [
        ...walk(TOWER_ROUTES_DIR),
        ...walk(TOWER_COMPONENTS_DIR),
      ];
      const offenders = files.filter((f) => {
        if (f.endsWith('apex-contact-center-portfolio-fixture.ts')) return false;
        const source = readFileSync(f, 'utf8');
        return /Apex Contact Center/.test(source);
      });
      expect(offenders).toEqual([]);
    });
  });

  describe('decide-and-route (Fund / Pause / Kill)', () => {
    it('ships a /api/tower/decision endpoint that audit-logs through writeProgramAuditLog', () => {
      const path = 'src/app/api/tower/decision/route.ts';
      expect(existsSync(path)).toBe(true);
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('writeProgramAuditLog');
      expect(source).toContain("'fund'");
      expect(source).toContain("'pause'");
      expect(source).toContain("'kill'");
    });

    it('renders the TowerDecisionActionRow on each portfolio card', () => {
      const path = 'src/components/tower/MovePortfolioCardPanel.tsx';
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('TowerDecisionActionRow');
    });
  });

  describe('redirect-shell cleanup (audit §5.4)', () => {
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

    it.each(deletedShells)('removes the legacy redirect-shell %s', (path) => {
      expect(existsSync(path)).toBe(false);
    });

    it('builds tower/programs/[programId] as a real route (not a redirect)', () => {
      const source = readFileSync(
        'src/app/(maestro)/tower/programs/[programId]/page.tsx',
        'utf8',
      );
      // The shell-form was `redirect(\`/tower?detail=…\`)`. The real
      // route now loads data through getProgramById and renders.
      expect(source).not.toContain("redirect(`/tower?detail=");
      expect(source).toContain('getProgramById');
      expect(source).toContain('TowerDecisionActionRow');
    });

    it('keeps Tower program detail dynamic segments aligned for Next.js 16', () => {
      expect(existsSync('src/app/(maestro)/tower/programs/[programId]/page.tsx')).toBe(true);
      expect(existsSync('src/app/(maestro)/tower/programs/[programId]/value/page.tsx')).toBe(true);
      expect(existsSync('src/app/(maestro)/tower/programs/[moveId]/value/page.tsx')).toBe(false);
    });

    it('documents the per-route decision', () => {
      const path = 'docs/pilot/TOWER-REDIRECT-SHELL-DECISIONS.md';
      expect(existsSync(path)).toBe(true);
      const md = readFileSync(path, 'utf8');
      expect(md).toContain('REMOVED');
      expect(md).toContain('BUILT');
      expect(md).toContain('KEPT (redirect)');
    });
  });
});
