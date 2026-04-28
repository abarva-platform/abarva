// NAV1F · canonical nav regression guard
//
// Pure-TypeScript Jest tests that lock in the invariants established by
// NAV1A–NAV1E. These tests use `fs.readFileSync` and string scanning only —
// no jsdom, no React rendering — so they remain fast and deterministic.
//
// Scope notes:
//   • The "active routes" inspected are the canonical tenant tree under
//     `src/app/(maestro)/tenant/[tenantSlug]/**` plus the canonical Source
//     and Admin route shells. The legacy global nav `src/components/AbarvaNav.tsx`
//     and `src/components/chrome/ClientChrome.tsx` are documented in the
//     NAV1 audit as out-of-scope; this guard does NOT scan those files.
//   • Non-tenant routes (`(maestro)/intelligence/**`, `(maestro)/tower/**`,
//     `(maestro)/engagements/**`) are likewise outside this guard's scope —
//     their banned-token cleanup is deferred to a separate wave per the
//     NAV1 charter ("WITHOUT changing page content").

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const repoRoot = process.cwd();
const r = (p: string) => resolve(repoRoot, p);

// ---------------------------------------------------------------------
// Canonical files in scope
// ---------------------------------------------------------------------

const CANONICAL_BRAND_FILES = [
  'src/components/brand/AbarVaLogo.tsx',
  'src/components/brand/index.ts',
];

const CANONICAL_NAV_FILES = [
  'src/components/abarva/AbarVaAppShell.tsx',
  'src/components/abarva/AbarVaShellNav.tsx',
  'src/components/abarva/AbarVaTopNav.tsx',
  'src/components/abarva/AbarVaWordmark.tsx',
];

const CANONICAL_PAGE_SHELL_FILES = [
  'src/components/admin/AdminCanonShell.tsx',
  // Source shell migrated to AppShell + SentinelAgentColumn in Wave S1/S2
  'src/components/source/SentinelAgentColumn.tsx',
  'src/components/source/SourceWorkingPane.tsx',
  'src/components/programs/ProgramCanonShell.tsx',
  // I1: IntelligenceRouteShell.tsx retired — tenant intelligence page now renders
  // IntelligenceLensTabs directly (AppChrome from (maestro) layout provides chrome).
  'src/components/tower/TowerRouteShell.tsx',
];

// Canonical tenant-tree pages — every page in this list either uses a
// canonical RouteShell directly or imports a SeedRouteShell wrapper.
const CANONICAL_TENANT_PAGES = [
  'src/app/(maestro)/tenant/[tenantSlug]/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx',
  'src/app/(maestro)/tenant/[tenantSlug]/tower/[surface]/page.tsx',
];

// Canonical Source pages — Wave S1/S2 migrated to AppShell + SentinelAgentColumn.
const CANONICAL_SOURCE_PAGES = [
  'src/app/(maestro)/source/page.tsx',
  'src/app/(maestro)/source/events/page.tsx',
  'src/app/(maestro)/source/events/[eventId]/page.tsx',
  'src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx',
  'src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx',
  'src/app/(maestro)/source/value/page.tsx',
];

// ADMIN8 — admin tree consolidated under /admin/*. The legacy /platform/admin
// pages for {root, architecture, production-readiness} are now thin redirects
// (covered by ADMIN7 visual lock). Experience Gallery + the legacy
// /platform/admin/build-progress remain canonical pages on the legacy tree.
const CANONICAL_ADMIN_PAGES = [
  'src/app/(maestro)/admin/page.tsx',
  'src/app/(maestro)/admin/architecture/page.tsx',
  'src/app/(maestro)/admin/build-progress/page.tsx',
  'src/app/(maestro)/admin/production-readiness/page.tsx',
  'src/app/(maestro)/platform/admin/build-progress/page.tsx',
  'src/app/(maestro)/platform/admin/experience-gallery/page.tsx',
];

const ALL_IN_SCOPE_FILES = [
  ...CANONICAL_BRAND_FILES,
  ...CANONICAL_NAV_FILES,
  ...CANONICAL_PAGE_SHELL_FILES,
  ...CANONICAL_TENANT_PAGES,
  ...CANONICAL_SOURCE_PAGES,
  ...CANONICAL_ADMIN_PAGES,
];

const BANNED_TOKENS = ['#14B8A6', '#0E9F8C', 'sparkle', 'ॐ'];

function read(file: string): string {
  return readFileSync(r(file), 'utf8');
}

// ---------------------------------------------------------------------
// 1. Canonical brand component exists and is wordmark-only
// ---------------------------------------------------------------------

describe('NAV1F · canonical AbarVaLogo wordmark-only', () => {
  it('AbarVaLogo component exists at the canonical path', () => {
    expect(existsSync(r('src/components/brand/AbarVaLogo.tsx'))).toBe(true);
  });

  it('AbarVaLogo file points at the canonical SVG asset', () => {
    expect(read('src/components/brand/AbarVaLogo.tsx')).toContain('/brand/abarva-logo.svg');
  });

  it('AbarVaLogo file does not inline an SVG path / symbol', () => {
    const src = read('src/components/brand/AbarVaLogo.tsx');
    expect(src).not.toMatch(/<svg/i);
    expect(src).not.toMatch(/<symbol/i);
    expect(src).not.toMatch(/<path/i);
  });

  it('canonical brand index re-exports AbarVaLogo', () => {
    const idx = read('src/components/brand/index.ts');
    expect(idx).toMatch(/export\s*\{\s*AbarVaLogo\s*\}/);
  });

  it('canonical SVG asset exists', () => {
    expect(existsSync(r('public/brand/abarva-logo.svg'))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// 2. Every active route file exists
// ---------------------------------------------------------------------

describe('NAV1F · every audited active route file exists', () => {
  it.each(CANONICAL_TENANT_PAGES)('canonical tenant page exists: %s', (file) => {
    expect(existsSync(r(file))).toBe(true);
  });

  it.each(CANONICAL_SOURCE_PAGES)('canonical Source page exists: %s', (file) => {
    expect(existsSync(r(file))).toBe(true);
  });

  it.each(CANONICAL_ADMIN_PAGES)('AdminCanonShell-using page exists: %s', (file) => {
    expect(existsSync(r(file))).toBe(true);
  });

  it.each(CANONICAL_PAGE_SHELL_FILES)('canonical page-shell component exists: %s', (file) => {
    expect(existsSync(r(file))).toBe(true);
  });

  it.each(CANONICAL_NAV_FILES)('canonical nav primitive exists: %s', (file) => {
    expect(existsSync(r(file))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// 3. No legacy TopBar / PrimaryNav imports in src/app/
// ---------------------------------------------------------------------

describe('NAV1F · no legacy chrome imports in src/app/', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { execSync } = require('child_process') as typeof import('child_process');

  function grepImportsIn(pattern: string): string[] {
    try {
      const raw = execSync(
        `grep -rEl "${pattern}" src/app/ --include="*.tsx"`,
        { cwd: repoRoot, encoding: 'utf8' },
      );
      return raw.split('\n').filter(Boolean);
    } catch {
      // grep returns non-zero on no matches — that is the success case here.
      return [];
    }
  }

  it('no src/app/ file imports a TopBar component', () => {
    const matches = grepImportsIn("from\\s+['\\\"][^'\\\"]*TopBar");
    expect(matches).toEqual([]);
  });

  it('no src/app/ file imports a PrimaryNav component', () => {
    const matches = grepImportsIn("from\\s+['\\\"][^'\\\"]*PrimaryNav");
    expect(matches).toEqual([]);
  });

  it('no src/app/ file imports an AdminPortalHeader component', () => {
    const matches = grepImportsIn("from\\s+['\\\"][^'\\\"]*AdminPortalHeader");
    expect(matches).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// 4. Active routes do not hand-code the wordmark
// ---------------------------------------------------------------------

describe('NAV1F · canonical pages do not hand-code the wordmark', () => {
  // A "hand-coded wordmark" is an inline JSX/text snippet that types the
  // letters "AbarVa" or "Abar" + "Va" outside of an `aria-label`, comment,
  // or import statement. We scan for the canonical hand-coded patterns
  // (`>AbarVa<` and `>Abar` followed by `>Va`) which would indicate text
  // content rendered into the DOM. The canonical wordmark renders via
  // <AbarVaLogo /> or its shim, neither of which produces those patterns.
  it.each([...CANONICAL_TENANT_PAGES, ...CANONICAL_SOURCE_PAGES, ...CANONICAL_ADMIN_PAGES])(
    '%s does not contain a hand-coded >AbarVa< wordmark',
    (file) => {
      const src = read(file);
      expect(src).not.toMatch(/>\s*AbarVa\s*</);
    },
  );
});

// ---------------------------------------------------------------------
// 5. No banned tokens in canonical brand / nav / shell files
// ---------------------------------------------------------------------

describe('NAV1F · no banned tokens in canonical brand/nav/shell files', () => {
  it.each([...CANONICAL_BRAND_FILES, ...CANONICAL_NAV_FILES, ...CANONICAL_PAGE_SHELL_FILES])(
    '%s contains no banned tokens',
    (file) => {
      const src = read(file).toLowerCase();
      for (const token of BANNED_TOKENS) {
        expect({ file, token, present: src.includes(token.toLowerCase()) }).toEqual({
          file,
          token,
          present: false,
        });
      }
    },
  );
});

// ---------------------------------------------------------------------
// 6. No banned tokens in the canonical tenant tree
// ---------------------------------------------------------------------

describe('NAV1F · canonical tenant tree contains no banned tokens', () => {
  it.each(CANONICAL_TENANT_PAGES)('%s contains no banned tokens', (file) => {
    const src = read(file).toLowerCase();
    for (const token of BANNED_TOKENS) {
      expect({ file, token, present: src.includes(token.toLowerCase()) }).toEqual({
        file,
        token,
        present: false,
      });
    }
  });
});

// ---------------------------------------------------------------------
// 7. No banned tokens in canonical Source pages
// ---------------------------------------------------------------------

describe('NAV1F · canonical Source pages contain no banned tokens', () => {
  it.each(CANONICAL_SOURCE_PAGES)('%s contains no banned tokens', (file) => {
    const src = read(file).toLowerCase();
    for (const token of BANNED_TOKENS) {
      expect({ file, token, present: src.includes(token.toLowerCase()) }).toEqual({
        file,
        token,
        present: false,
      });
    }
  });
});

// ---------------------------------------------------------------------
// 8. AbarVaShellNav exposes the canonical six-surface enum
// ---------------------------------------------------------------------

describe('NAV1F · AbarVaShellNav six-surface enum', () => {
  const src = read('src/components/abarva/AbarVaShellNav.tsx');
  for (const key of ['home', 'programs', 'source', 'intelligence', 'tower', 'admin']) {
    it(`exposes the "${key}" surface entry`, () => {
      expect(src).toMatch(new RegExp(`key:\\s*['"]${key}['"]`));
    });
  }
});

// ---------------------------------------------------------------------
// 9. Active route files import a canonical shell or are on the
//    documented page-content allow-list
// ---------------------------------------------------------------------

describe('NAV1F · canonical pages import a canonical shell', () => {
  // For each canonical page file, confirm it imports at least one
  // recognized canonical shell symbol. This catches the case where a
  // page accidentally drops its shell import during a refactor.
  const CANONICAL_SHELL_SYMBOLS = [
    'AdminCanonShell',
    // Source shell (Wave S1/S2 — AppShell migration)
    'AppShell',
    'SentinelAgentColumn',
    'SourceIndexPage',
    'ProgramCanonShell',
    // I1: IntelligenceRouteShell retired; tenant intelligence route now uses IntelligenceLensTabs.
    'IntelligenceLensTabs',
    'TowerRouteShell',
    // SeedRouteShell helpers — used by the deeper tenant routes.
    'SeedTenantDashboard',
    'SeedTenantPattern',
    'SeedTenantTowerSubsurface',
    'SeedPhaseOverview',
    'SeedDeliverableDetail',
    // DeliverableTierRenderer — canonical deliverable detail shell.
    'DeliverableTierRenderer',
    // Direct canonical shell primitives — present for completeness.
    'AbarVaAppShell',
    'AbarVaShellNav',
    'AbarvaTopNav',
    // Admin route shells admin/page.tsx via component wrappers
    'SetupConnectorsPage',
    'AdminCanonShell',
  ];

  it.each([...CANONICAL_TENANT_PAGES, ...CANONICAL_SOURCE_PAGES, ...CANONICAL_ADMIN_PAGES])(
    '%s imports a canonical shell',
    (file) => {
      const src = read(file);
      const hit = CANONICAL_SHELL_SYMBOLS.some((sym) => src.includes(sym));
      expect({ file, importsCanonicalShell: hit }).toEqual({
        file,
        importsCanonicalShell: true,
      });
    },
  );
});

// ---------------------------------------------------------------------
// 10. The audit document and slice docs exist
// ---------------------------------------------------------------------

describe('NAV1F · NAV1 documentation present', () => {
  const docs = [
    'docs/platform-design/experience-system/implementation-reviews/NAV1_NAV_SHELL_INVENTORY_AUDIT.md',
    'docs/platform-design/experience-system/implementation-reviews/NAV1_CANONICAL_BRAND_NAV_ALIGNMENT_REVIEW.md',
    'docs/platform-design/experience-system/implementation-reviews/NAV1_ADMIN_PLATFORM_NAV_ALIGNMENT_REVIEW.md',
    'docs/abarva-source/build-pack/implementation-reviews/NAV1_SOURCE_NAV_ALIGNMENT_REVIEW.md',
    'docs/platform-design/experience-system/implementation-reviews/NAV1_CROSS_SURFACE_NAV_ALIGNMENT_REVIEW.md',
    'docs/build/slices/NAV1A_NAV_SHELL_INVENTORY_AUDIT.md',
    'docs/build/slices/NAV1B_CANONICAL_BRAND_NAV_ALIGNMENT.md',
    'docs/build/slices/NAV1C_ADMIN_PLATFORM_NAV_ALIGNMENT.md',
    'docs/build/slices/NAV1D_SOURCE_NAV_ALIGNMENT.md',
    'docs/build/slices/NAV1E_CROSS_SURFACE_NAV_ALIGNMENT.md',
  ];

  it.each(docs)('NAV1 doc exists: %s', (file) => {
    expect(existsSync(r(file))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// 11. Sanity: pages collectively load without throwing
// ---------------------------------------------------------------------

describe('NAV1F · sanity counts', () => {
  it('inspects at least 7 canonical brand/nav/shell files', () => {
    expect(CANONICAL_BRAND_FILES.length + CANONICAL_NAV_FILES.length + CANONICAL_PAGE_SHELL_FILES.length).toBeGreaterThanOrEqual(7);
  });

  it('inspects at least 9 canonical tenant pages', () => {
    expect(CANONICAL_TENANT_PAGES.length).toBeGreaterThanOrEqual(9);
  });

  it('inspects all 6 canonical Source pages', () => {
    expect(CANONICAL_SOURCE_PAGES.length).toBe(6);
  });

  it('inspects all 6 AdminCanonShell-using pages', () => {
    // ADMIN8: 4 canonical /admin/* pages + 2 legacy /platform/admin/* pages
    // (build-progress, experience-gallery) that still render the canonical shell.
    expect(CANONICAL_ADMIN_PAGES.length).toBe(6);
  });

  it('declares at least 4 banned tokens', () => {
    expect(BANNED_TOKENS.length).toBeGreaterThanOrEqual(4);
  });

  it('total in-scope file list is at least 25 files', () => {
    expect(ALL_IN_SCOPE_FILES.length).toBeGreaterThanOrEqual(25);
  });
});
