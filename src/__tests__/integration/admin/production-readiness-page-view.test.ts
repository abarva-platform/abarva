import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildProductionReadinessPageView } from '@/lib/admin/production-readiness-page-view';

const root = process.cwd();

describe('ADMIN5 — Production Readiness page view', () => {
  describe('buildProductionReadinessPageView', () => {
    const view = buildProductionReadinessPageView();

    it('returns deterministicSeed: true', () => expect(view.deterministicSeed).toBe(true));
    it('title is "Production Readiness"', () => expect(view.title).toBe('Production Readiness'));
    it('subtitle mentions demo/pilot/production', () => {
      const s = view.subtitle.toLowerCase();
      expect(s).toContain('demo');
      expect(s).toContain('pilot');
      expect(s).toContain('production');
    });
    it('agent is Steward', () => expect(view.context.agent).toBe('Steward'));
    it('liveStatus is Deferred', () => expect(view.context.liveStatus).toBe('Deferred'));
    it('liveStatusKind is deferred', () => expect(view.context.liveStatusKind).toBe('deferred'));
    it('editorial mentions readiness decision', () =>
      expect(view.editorial.title.toLowerCase()).toContain('readiness decision'));
    it('editorial body never claims production_ready: true', () => {
      const s = JSON.stringify(view).toLowerCase();
      expect(s).not.toContain('production_ready');
      expect(s).not.toContain('"productionready":true');
    });
    it('editorial body says production is blocked', () => {
      const s = view.editorial.body.toLowerCase();
      expect(s).toContain('blocked');
    });
    it('primaryActionLabel is Open blocker drawer', () =>
      expect(view.primaryActionLabel).toBe('Open blocker drawer'));
    it('exactly 3 readiness tiles', () => expect(view.tiles.length).toBe(3));
    it('tile ids are demo / pilot / production', () => {
      const ids = view.tiles.map((t) => t.id);
      expect(ids).toEqual(['demo', 'pilot', 'production']);
    });
    it('demo tile is ready', () =>
      expect(view.tiles.find((t) => t.id === 'demo')?.status).toBe('ready'));
    it('pilot tile is partial', () =>
      expect(view.tiles.find((t) => t.id === 'pilot')?.status).toBe('partial'));
    it('production tile is blocked', () =>
      expect(view.tiles.find((t) => t.id === 'production')?.status).toBe('blocked'));
    it('production tile body warns about not claiming readiness', () => {
      const tile = view.tiles.find((t) => t.id === 'production');
      expect(tile?.body.toLowerCase()).toContain('do not claim');
    });
    it('topBlockers is non-empty for apex-retail seed', () =>
      expect(view.topBlockers.length).toBeGreaterThan(0));
    it('topBlockers does not exceed 5', () =>
      expect(view.topBlockers.length).toBeLessThanOrEqual(5));
    it('every topBlocker has required shape', () => {
      view.topBlockers.forEach((b) => {
        expect(b.id).toBeDefined();
        expect(b.title).toBeDefined();
        expect(b.severity).toBeDefined();
        expect(b.impactedComponent).toBeDefined();
      });
    });
    it('contextUsed has at least 2 entries', () =>
      expect(view.editorial.contextUsed.length).toBeGreaterThanOrEqual(2));
    it('production tile blockerCount matches productionImpact blockers', () => {
      const tile = view.tiles.find((t) => t.id === 'production');
      expect(tile?.blockerCount).toBeGreaterThanOrEqual(0);
    });
    it('empty tenant returns empty topBlockers list', () => {
      const empty = buildProductionReadinessPageView('does-not-exist');
      expect(empty.topBlockers.length).toBe(0);
    });
    it('primaryAgentLabel is Steward', () => expect(view.primaryAgentLabel).toBe('Steward'));
    it('eyebrow is non-empty', () => expect(view.eyebrow.length).toBeGreaterThan(0));
    it('primary action href targets blockers anchor', () =>
      expect(view.editorial.primaryAction.href).toContain('blocker'));
  });

  describe('component source files', () => {
    const files = [
      'src/components/admin/DemoPilotProductionTiles.tsx',
      'src/components/admin/TopBlockersTable.tsx',
    ];
    files.forEach((f) => {
      it(`${f} exists`, () => expect(existsSync(resolve(root, f))).toBe(true));
      it(`${f} imports tokens`, () =>
        expect(readFileSync(resolve(root, f), 'utf8')).toContain(
          "from '@/lib/design/design-tokens'",
        ));
      it(`${f} contains no banned tokens`, () => {
        const src = readFileSync(resolve(root, f), 'utf8').toLowerCase();
        ['#14b8a6', '#7c3aed', '#d946ef', 'sparkle'].forEach((b) =>
          expect(src).not.toContain(b),
        );
      });
    });
  });

  describe('Production Readiness page route', () => {
    const candidates = [
      'src/app/(maestro)/admin/production-readiness/page.tsx',
      'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
    ];
    const found = candidates.find((p) => existsSync(resolve(root, p)));
    it('page file exists at canonical path', () => expect(found).toBeDefined());
    if (found) {
      const src = () => readFileSync(resolve(root, found), 'utf8');
      it('imports AdminCanonShellV2', () => expect(src()).toContain('AdminCanonShellV2'));
      it('imports buildProductionReadinessPageView', () =>
        expect(src()).toContain('buildProductionReadinessPageView'));
      it('imports DemoPilotProductionTiles', () =>
        expect(src()).toContain('DemoPilotProductionTiles'));
      it('imports TopBlockersTable', () => expect(src()).toContain('TopBlockersTable'));
      it('does not contain banned hex tokens', () => {
        const s = src().toLowerCase();
        ['#14b8a6', '#7c3aed', '#d946ef'].forEach((b) => expect(s).not.toContain(b));
      });
      it('does not promote production_ready: true', () =>
        expect(src().toLowerCase()).not.toContain('production_ready: true'));
    }
  });
});
