/**
 * I1 — Intelligence route shell retirement, and what replaced it.
 *
 * Deterministic filesystem checks (no jsdom, no network).
 *
 * This suite used to assert that the tenant-scoped Intelligence route renders
 * `IntelligenceLensTabs` directly, having shed its shell wrapper. Both halves
 * of that sentence are now false: the legacy surface sunset at 0c6a86c51
 * deleted the route AND the tab strip, and `IntelligenceLensTabs` survives
 * nowhere in the product — every remaining mention of the name is in a test.
 *
 * Two things were wrong with how it failed. It read the route in `beforeAll`,
 * so the read threw before any case ran and even the one assertion that is
 * still true — that the shell component is gone — was reported as a failure.
 * And the shape it described had no owner: ten red cases named a wiring that
 * nobody intends to restore.
 *
 * The retirement is now declared through the register the QA verifiers share,
 * so the loss stays visible and is checked rather than narrated, and the
 * suite's live half is pointed at the surface that actually serves
 * Intelligence today.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  resolvePathStatus,
  SHARED_PATH_DISPOSITIONS,
} from '@/lib/qa/path-disposition';

const ROOT = path.resolve(__dirname, '../../../../');
const REGISTER_NAME = 'SHARED_PATH_DISPOSITIONS in src/lib/qa/path-disposition.ts';

/** Paths this suite was written against, all removed by the same commit. */
const RETIRED = [
  'src/components/intelligence/IntelligenceRouteShell.tsx',
  'src/components/intelligence/IntelligenceLensTabs.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
] as const;

/** The Intelligence route that exists. */
const LIVE_ROUTE = 'src/app/(maestro)/intelligence/page.tsx';

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('I1 — IntelligenceRouteShell retirement', () => {
  describe('the shape this suite was written against is gone, on the record', () => {
    it.each(RETIRED)('%s is absent and the register says which commit took it', (rel) => {
      expect(exists(rel)).toBe(false);

      const resolved = resolvePathStatus(rel, false, SHARED_PATH_DISPOSITIONS, REGISTER_NAME);
      expect(resolved.status).toBe('removed');
      expect(resolved.detail).toContain('0c6a86c51');
    });

    it('does not report a deletion as work that is still coming', () => {
      for (const rel of RETIRED) {
        const resolved = resolvePathStatus(rel, false, SHARED_PATH_DISPOSITIONS, REGISTER_NAME);
        expect(resolved.status).not.toBe('deferred');
        expect(resolved.detail.toLowerCase()).not.toContain('not yet');
      }
    });

    it('fails if one of them comes back without the register being updated', () => {
      // The other direction, which is what keeps the entries honest. A file
      // restored while the register still calls it retired is a `fail`, so
      // the register cannot go stale in the direction nobody watches.
      for (const rel of RETIRED) {
        const asIfRestored = resolvePathStatus(
          rel, true, SHARED_PATH_DISPOSITIONS, REGISTER_NAME,
        );
        expect(asIfRestored.status).toBe('fail');
      }
    });

    it('does not accept an absence nobody declared', () => {
      // The negative control. Every path above is declared, so without this
      // the cases would pass against a register that waved everything through.
      const resolved = resolvePathStatus(
        'src/components/intelligence/NeverExisted.tsx',
        false,
        SHARED_PATH_DISPOSITIONS,
        REGISTER_NAME,
      );
      expect(resolved.status).toBe('fail');
    });

    it('IntelligenceLensTabs survives nowhere in the product', () => {
      // The reason the wiring cases were not rewritten against another route:
      // there is no component left to wire. Asserted over app and component
      // source so a reintroduction is a deliberate act, not a silent one.
      const productDirs = [path.join(ROOT, 'src/app'), path.join(ROOT, 'src/components')];
      const hits: string[] = [];

      const walk = (dir: string): void => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            walk(full);
          } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
            if (fs.readFileSync(full, 'utf8').includes('IntelligenceLensTabs')) {
              hits.push(path.relative(ROOT, full));
            }
          }
        }
      };

      productDirs.forEach(walk);
      expect(hits).toEqual([]);
    });
  });

  describe('the Intelligence surface that does exist', () => {
    it('is served by a route, not by a retired shell wrapper', () => {
      expect(exists(LIVE_ROUTE)).toBe(true);
      const source = read(LIVE_ROUTE);
      expect(source).not.toContain('IntelligenceRouteShell');
      expect(source).not.toContain('IntelligenceLensTabs');
    });

    it('renders AdvisoryIntelligencePage', () => {
      // What replaced the tab strip. Named here so the replacement is checked
      // rather than only described in the register's `replacement` field.
      expect(read(LIVE_ROUTE)).toContain('AdvisoryIntelligencePage');
    });
  });
});
