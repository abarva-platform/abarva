/**
 * ADMIN10 — Legacy /platform/admin/* disposition guard
 *
 * Pure TypeScript Jest tests asserting:
 *   - 6 DEPRECATE routes do NOT exist on disk
 *   - 2 REDIRECT routes are thin server-side redirects (no canonical shell render)
 *   - AbarvaNav admin link target is /admin (no /platform/admin redirect hop)
 *   - 4 KEEP routes carry the "LEGACY · being migrated" banner comment
 *
 * No React rendering, no jsdom — pure fs scans.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

// ---------------------------------------------------------------------------
// DEPRECATE routes — must NOT exist on disk
// ---------------------------------------------------------------------------

const DEPRECATE_ROUTES = [
  'src/app/(maestro)/platform/admin/brief',
  'src/app/(maestro)/platform/admin/context',
  'src/app/(maestro)/platform/admin/data-guide',
  'src/app/(maestro)/platform/admin/outcomes',
  'src/app/(maestro)/platform/admin/playbook',
  'src/app/(maestro)/platform/admin/revenue',
];

// ---------------------------------------------------------------------------
// REDIRECT routes — must be thin server-side redirects
// ---------------------------------------------------------------------------

const REDIRECT_ROUTES: Array<{ path: string; expectedTarget: string }> = [
  {
    path: 'src/app/(maestro)/platform/admin/intelligence/page.tsx',
    expectedTarget: '/intelligence',
  },
  {
    path: 'src/app/(maestro)/platform/admin/users/page.tsx',
    expectedTarget: '/admin/users-access',
  },
];

// ---------------------------------------------------------------------------
// KEEP routes — must carry the "LEGACY · being migrated" banner
// ---------------------------------------------------------------------------

const KEEP_ROUTES = [
  'src/app/(maestro)/platform/admin/approvals/page.tsx',
  'src/app/(maestro)/platform/admin/audit/page.tsx',
  'src/app/(maestro)/platform/admin/experience-gallery/page.tsx',
  'src/app/(maestro)/platform/admin/new-client/page.tsx',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ADMIN10 — Legacy /platform/admin/* disposition', () => {
  describe('DEPRECATE — 6 routes deleted from disk', () => {
    DEPRECATE_ROUTES.forEach((dir) => {
      it(`${dir} does NOT exist`, () => {
        expect(existsSync(resolve(root, dir))).toBe(false);
      });
      it(`${dir}/page.tsx does NOT exist`, () => {
        expect(existsSync(resolve(root, dir, 'page.tsx'))).toBe(false);
      });
    });

    it('exactly 6 routes are listed for deprecation', () => {
      expect(DEPRECATE_ROUTES).toHaveLength(6);
    });
  });

  describe('REDIRECT — 2 routes are thin server-side redirects', () => {
    REDIRECT_ROUTES.forEach(({ path, expectedTarget }) => {
      describe(path, () => {
        it('file exists', () => {
          expect(existsSync(resolve(root, path))).toBe(true);
        });
        it("imports `redirect` from 'next/navigation'", () => {
          const src = readFileSync(resolve(root, path), 'utf8');
          expect(src).toMatch(/from\s+['"]next\/navigation['"]/);
          expect(src).toContain('redirect');
        });
        it(`calls redirect('${expectedTarget}')`, () => {
          const src = readFileSync(resolve(root, path), 'utf8');
          expect(src).toContain(`redirect('${expectedTarget}')`);
        });
        it('does NOT render the canonical AdminCanonShellV2', () => {
          const src = readFileSync(resolve(root, path), 'utf8');
          expect(src).not.toContain('AdminCanonShellV2');
        });
        it('does NOT use a client-side redirect (window.location)', () => {
          const src = readFileSync(resolve(root, path), 'utf8');
          expect(src).not.toContain('window.location');
        });
        it("does NOT carry the legacy 'use client' directive", () => {
          const src = readFileSync(resolve(root, path), 'utf8');
          expect(src).not.toMatch(/^['"]use client['"]/);
        });
      });
    });

    it('exactly 2 routes are listed for redirect', () => {
      expect(REDIRECT_ROUTES).toHaveLength(2);
    });
  });

  describe('KEEP — 4 routes carry the LEGACY banner comment', () => {
    KEEP_ROUTES.forEach((path) => {
      it(`${path} carries the LEGACY banner comment`, () => {
        const src = readFileSync(resolve(root, path), 'utf8');
        expect(src).toMatch(/LEGACY · being migrated to \/admin\/[a-z-]+ in a follow-up wave/);
      });
    });

    it('exactly 4 routes are listed as KEEP', () => {
      expect(KEEP_ROUTES).toHaveLength(4);
    });
  });

  describe('Navigation retarget — AbarvaNav admin link points to /admin', () => {
    const navPath = 'src/components/AbarvaNav.tsx';

    it('AbarvaNav.tsx exists', () => {
      expect(existsSync(resolve(root, navPath))).toBe(true);
    });

    it('admin nav link href targets /admin (not /platform/admin)', () => {
      const src = readFileSync(resolve(root, navPath), 'utf8');
      // The admin nav item href should resolve to '/admin' — no longer the
      // legacy '/platform/admin' redirect hop.
      expect(src).toContain("href={isAdmin ? '/admin' : undefined}");
      expect(src).not.toContain("href={isAdmin ? '/platform/admin' : undefined}");
    });
  });

  describe('Synthetic fixtures (regression-self-check)', () => {
    it('a synthetic page string with redirect() trips the assertion', () => {
      const synthetic = `import { redirect } from 'next/navigation';\nexport default function P() { redirect('/intelligence'); }`;
      expect(synthetic).toMatch(/from\s+['"]next\/navigation['"]/);
      expect(synthetic).toContain("redirect('/intelligence')");
    });

    it('a synthetic page string WITHOUT redirect() fails the assertion', () => {
      const synthetic = `export default function P() { return null; }`;
      expect(synthetic).not.toContain('redirect');
    });
  });
});
