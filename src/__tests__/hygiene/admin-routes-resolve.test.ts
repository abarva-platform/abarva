/**
 * Admin route hygiene — Setup/Admin consolidation guard.
 *
 * Asserts that route references coming out of the admin shell and the
 * home overview composition don't point at routes that the Setup audit
 * cleanup waves deleted or relocated. The current deleted/relocated set:
 *
 *   /admin/users         → DELETED  (canonical is /admin/users-access)         · PR-2
 *   /admin/invite        → DEMOTED  (modal off /admin/users-access)            · PR-2
 *   /admin/agents/atlas  → DELETED  (workflow-named successor:
 *                                    /admin/cross-program-signals)             · PR-2
 *   /admin/atlas/traces  → RELOCATED to /engineering/traces                    · PR-2
 *   /admin/tenant        → DEMOTED  (tab inside /admin?tab=tenant)             · PR-3
 *
 * Per docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md §5.5. If a panel
 * card, sidebar entry, or any composed reference reintroduces one of
 * these URLs, this test fails — the source-of-truth lives in
 * src/proxy.ts adminRouteConsolidationMap (which 301-redirects them).
 *
 * The first describe block also asserts every sidebar entry points
 * at a path that has an actual route file under src/app/(maestro)/.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { ADMIN_SUB_SECTIONS } from '@/lib/admin/admin-shell-config';
import { composeHomeV2Extras } from '@/lib/admin/home-overview-v2';

const APP_ROOT = join(process.cwd(), 'src', 'app', '(maestro)');
const MAESTRO_GROUP = '(maestro)';

const DEAD_ADMIN_ROUTES = new Set([
  '/admin/users',
  '/admin/invite',
  '/admin/agents/atlas',
  '/admin/atlas/traces',
  '/admin/tenant',
]);

function routeFileExists(pathname: string): boolean {
  // Strip query/hash, leading slash.
  const cleaned = pathname.split('?')[0].split('#')[0];
  if (!cleaned.startsWith('/')) return false;
  const segments = cleaned.slice(1).split('/').filter(Boolean);

  // Walk the (maestro) tree first; fall back to the top-level src/app/.
  const candidates = [
    join(APP_ROOT, ...segments),
    join(process.cwd(), 'src', 'app', ...segments),
  ];
  for (const dir of candidates) {
    const pageVariants = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      for (const variant of pageVariants) {
        if (existsSync(join(dir, variant))) return true;
      }
    }
  }
  return false;
}

describe('ADMIN_SUB_SECTIONS sidebar entries point at live routes', () => {
  for (const section of ADMIN_SUB_SECTIONS) {
    test(`sidebar entry "${section.label}" (${section.href}) is not a deleted route`, () => {
      expect(DEAD_ADMIN_ROUTES.has(section.href)).toBe(false);
    });

    test(`sidebar entry "${section.label}" (${section.href}) resolves to a route file`, () => {
      // External anchors and hash-only links are allowed to skip the
      // filesystem check (e.g. "#" placeholders before a feature ships).
      if (!section.href.startsWith('/') || section.href === '#') return;
      const resolved = routeFileExists(section.href);
      if (!resolved) {
        throw new Error(
          `Sidebar entry "${section.label}" points at ${section.href} ` +
            `but no page.tsx exists under src/app/${MAESTRO_GROUP}${section.href}/ ` +
            `or src/app${section.href}/. Either the route was deleted ` +
            `without updating the sidebar, or this entry needs to point at ` +
            `the new canonical URL.`,
        );
      }
    });
  }
});

describe('home-overview-v2 panel hrefs do not reintroduce deleted admin routes', () => {
  // Build a representative overview model. We don't care about the
  // exact data — only the static hrefs that live in the panels +
  // readiness arrays.
  const overview = composeHomeV2Extras({
    segments: [],
    programsCount: 4,
    programsP6Count: 0,
    sourceEventsCount: 0,
    sourceEventsAtRiskCount: 0,
    initiativesCount: 4,
    initiativesAtRiskCount: 0,
    lastIngestedAt: '2026-05-30T00:00:00Z',
  });

  for (const panel of overview.panels) {
    test(`panel "${panel.name}" (${panel.href}) is not a deleted admin route`, () => {
      expect(DEAD_ADMIN_ROUTES.has(panel.href)).toBe(false);
    });
  }

  for (const card of overview.readiness) {
    test(`readiness card "${card.name}" (${card.href}) is not a deleted admin route`, () => {
      expect(DEAD_ADMIN_ROUTES.has(card.href)).toBe(false);
    });
  }
});

describe('proxy adminRouteConsolidationMap covers every deleted admin route', () => {
  const proxyContent = readFileSync(
    join(process.cwd(), 'src', 'proxy.ts'),
    'utf-8',
  );

  for (const deletedRoute of DEAD_ADMIN_ROUTES) {
    test(`proxy declares a redirect for ${deletedRoute}`, () => {
      // Be permissive about quote style; just ensure the path string
      // is present inside the map body. The functional behavior is
      // exercised by the broader integration tests; this assertion
      // catches the case where someone deletes a route but forgets to
      // add the redirect (or removes it later).
      const presentInMap = proxyContent.includes(`'${deletedRoute}':`)
        || proxyContent.includes(`"${deletedRoute}":`);
      if (!presentInMap) {
        throw new Error(
          `Deleted route ${deletedRoute} has no entry in the proxy ` +
            `consolidation map. Add it to adminRouteConsolidationMap ` +
            `in src/proxy.ts so legacy links 301-redirect to the ` +
            `canonical replacement.`,
        );
      }
    });
  }
});
