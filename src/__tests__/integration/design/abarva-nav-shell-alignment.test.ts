// NAV1F · canonical nav regression guard
//
// Pure-TypeScript Jest tests that lock in the invariants established by
// NAV1A–NAV1E. These tests use `fs` and string scanning only — no jsdom, no
// React rendering — so they remain fast and deterministic.
//
// Why this file no longer carries a hand-written page inventory
// -------------------------------------------------------------
// It used to name 21 route files as literals. Four of them had been
// deliberately retired — the two tenant Intelligence surfaces by the legacy
// surface sunset, and the two admin panels by the Setup panel removal — so the
// guard reported four defects that were not defects, and a reader seeing
// `ENOENT ... page.tsx` would reasonably conclude a route had been lost.
//
// The route tree is the inventory. Enumerating it means a retired route cannot
// produce a false defect and a *new* route is covered the day it is added,
// which the literal list never was: it named 21 of the 94 pages that exist
// under the same roots. Every enumeration below is guarded by an
// anti-vacuity case, so an enumeration that silently returns nothing fails
// rather than passing.
//
// Scope notes:
//   • The legacy global nav `src/components/AbarvaNav.tsx` and
//     `src/components/chrome/ClientChrome.tsx` are documented in the NAV1
//     audit as out-of-scope; this guard does NOT scan those files.

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';

import { CANONICAL_LOGO_ASSET, CANONICAL_LOGO_COMPONENT } from '@/lib/qa/logo-usage-enforcement';

const repoRoot = process.cwd();
const r = (p: string) => resolve(repoRoot, p);

// ---------------------------------------------------------------------
// Canonical files in scope
// ---------------------------------------------------------------------

// The canonical logo component is declared by product code, not by this test.
// `logo-usage-enforcement.ts` is the module that enforces logo usage across the
// app; reading its declaration here means a move of the canonical component
// travels into this guard instead of arriving as a false failure.
const CANONICAL_BRAND_FILES = [CANONICAL_LOGO_COMPONENT];

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

// The canonical route roots. The tree beneath each one is the page inventory.
const CANONICAL_ROUTE_ROOTS = [
  'src/app/(maestro)/tenant',
  'src/app/(maestro)/source',
  'src/app/(maestro)/admin',
];

const BANNED_TOKENS = ['#14B8A6', '#0E9F8C', 'sparkle', 'ॐ'];

// A page is under canonical chrome when some `layout.tsx` on its segment chain
// *renders* one of these. `(maestro)/layout.tsx` mounts `AppChrome` for the
// whole group, which is why a thin redirect page needs no shell import of its
// own.
//
// The match is on the JSX opening tag, not on the symbol anywhere in the file.
// A substring scan was tried first and is not a control: removing the
// `<AppChrome>` mount from the maestro layout left the import statement and a
// comment mentioning `AppShell` behind, and the scan passed on both. That is
// the same textual-check weakness recorded against the route-ownership map.
const CANONICAL_CHROME_SYMBOLS = [
  'AppChrome',
  'AdminCanonShell',
  'AbarVaAppShell',
  'AppShell',
];

function mountsChrome(layoutSource: string): boolean {
  return CANONICAL_CHROME_SYMBOLS.some((sym) =>
    new RegExp(`<${sym}(?![A-Za-z0-9_])`).test(layoutSource),
  );
}

function read(file: string): string {
  return readFileSync(r(file), 'utf8');
}

function pagesUnder(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(r(dir))) {
      if (entry === '__tests__') continue;
      const rel = join(dir, entry);
      if (statSync(r(rel)).isDirectory()) walk(rel);
      else if (entry === 'page.tsx') out.push(rel);
    }
  };
  walk(root);
  return out.sort();
}

const CANONICAL_PAGES_BY_ROOT = new Map(
  CANONICAL_ROUTE_ROOTS.map((root) => [root, pagesUnder(root)] as const),
);
const CANONICAL_PAGES = [...CANONICAL_PAGES_BY_ROOT.values()].flat();

/**
 * Walk from a page's directory up to `src/app`, returning every `layout.tsx`
 * on the segment chain. Next.js composes these around the page, so a page is
 * under canonical chrome when any one of them mounts it.
 */
function layoutChainFor(pageFile: string): string[] {
  const chain: string[] = [];
  let dir = dirname(pageFile);
  for (;;) {
    const layout = join(dir, 'layout.tsx');
    if (existsSync(r(layout))) chain.push(layout);
    if (dir === 'src/app' || !dir.startsWith('src/app')) break;
    dir = dirname(dir);
  }
  return chain;
}

// ---------------------------------------------------------------------
// 0. The enumerations are not empty
//
// Every `it.each` below draws from one of these lists. A resolver bug that
// returned nothing would make all of them pass while asserting nothing, which
// is the failure mode this guard is least able to notice on its own.
// ---------------------------------------------------------------------

describe('NAV1F · the guard has something to guard', () => {
  it.each(CANONICAL_ROUTE_ROOTS)('canonical route root %s resolves at least one page', (root) => {
    expect((CANONICAL_PAGES_BY_ROOT.get(root) ?? []).length).toBeGreaterThan(0);
  });

  it('enumerates more pages than the retired hand-written inventory named', () => {
    // The literal list this file replaced named 21 files. If enumeration ever
    // returns fewer, it has stopped resolving the tree rather than the tree
    // having shrunk by three quarters.
    expect(CANONICAL_PAGES.length).toBeGreaterThan(21);
  });

  it('every enumerated page file is readable', () => {
    const unreadable = CANONICAL_PAGES.filter((p) => !existsSync(r(p)));
    expect(unreadable).toEqual([]);
  });

  it('declares at least 4 banned tokens', () => {
    expect(BANNED_TOKENS.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------
// 1. Canonical brand component exists and uses the Option 2 asset
// ---------------------------------------------------------------------

describe('NAV1F · canonical AbarVaLogo Option 2', () => {
  it('the canonical logo component declared by product code exists', () => {
    expect(existsSync(r(CANONICAL_LOGO_COMPONENT))).toBe(true);
  });

  it('the canonical logo component points at the canonical SVG asset', () => {
    const assetHref = CANONICAL_LOGO_ASSET.replace(/^public/, '');
    expect(read(CANONICAL_LOGO_COMPONENT)).toContain(assetHref);
  });

  it('the canonical logo component does not inline SVG markup', () => {
    const src = read(CANONICAL_LOGO_COMPONENT);
    expect(src).not.toMatch(/<svg/i);
    expect(src).not.toMatch(/<symbol/i);
    expect(src).not.toMatch(/<path/i);
  });

  it('canonical SVG asset exists', () => {
    expect(existsSync(r(CANONICAL_LOGO_ASSET))).toBe(true);
  });

  // Every other case in this describe is satisfied by either of the two
  // near-identical AbarVaLogo modules in the tree, so none of them can tell
  // which one is real. This one can: a module declared canonical that no
  // product code imports is a declaration about nothing. Repointing
  // CANONICAL_LOGO_COMPONENT at the components/brand copy — which has zero
  // product importers — fails here and nowhere else in this file.
  it('the canonical logo component is imported by product code', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process') as typeof import('child_process');
    const modulePath = CANONICAL_LOGO_COMPONENT.replace(/^src\//, '@/').replace(/\.tsx$/, '');
    let importers: string[] = [];
    try {
      importers = execSync(
        `grep -rl "${modulePath}" src --include="*.ts" --include="*.tsx"`,
        { cwd: repoRoot, encoding: 'utf8' },
      )
        .split('\n')
        .filter(Boolean)
        .filter((f) => !f.includes('__tests__') && f !== CANONICAL_LOGO_COMPONENT);
    } catch {
      importers = [];
    }
    expect({ modulePath, productImporters: importers.length }).toEqual({
      modulePath,
      productImporters: expect.any(Number),
    });
    expect(importers.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// 2. Every destination the canonical nav offers resolves to a page
//
// This replaces the retired "every file in a hand-written list exists" check.
// That check could only ever restate its own literals; this one reads the
// hrefs the shell nav actually renders and fails when one of them is a dead
// destination — the class of defect a nav guard exists to catch.
// ---------------------------------------------------------------------

const NAV_SOURCE = read('src/components/abarva/AbarVaShellNav.tsx');

function declaredNavHrefs(): string[] {
  return [...NAV_SOURCE.matchAll(/href:\s*['"](\/[^'"]*)['"]/g)].map((m) => m[1]);
}

function routeResolves(href: string): boolean {
  const segments = href.replace(/^\//, '').split('/').filter(Boolean);
  const candidates = [
    join('src/app/(maestro)', ...segments, 'page.tsx'),
    join('src/app', ...segments, 'page.tsx'),
  ];
  return candidates.some((c) => existsSync(r(c)));
}

describe('NAV1F · canonical nav destinations resolve', () => {
  it('the shell nav declares hrefs to check', () => {
    expect(declaredNavHrefs().length).toBeGreaterThanOrEqual(6);
  });

  it.each(declaredNavHrefs())('nav destination %s resolves to a page', (href) => {
    expect({ href, resolves: routeResolves(href) }).toEqual({ href, resolves: true });
  });
});

// ---------------------------------------------------------------------
// 3. Canonical nav and page-shell components exist
// ---------------------------------------------------------------------

describe('NAV1F · canonical components exist', () => {
  it.each([...CANONICAL_BRAND_FILES, ...CANONICAL_NAV_FILES, ...CANONICAL_PAGE_SHELL_FILES])(
    'canonical component exists: %s',
    (file) => {
      expect(existsSync(r(file))).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------
// 4. No legacy TopBar / PrimaryNav imports in src/app/
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
// 5. Canonical pages do not hand-code the wordmark
//
// A "hand-coded wordmark" is an inline JSX/text snippet that types the letters
// "AbarVa" as rendered DOM text. The canonical wordmark renders via
// <AbarVaLogo /> or its shim, neither of which produces that pattern.
// ---------------------------------------------------------------------

describe('NAV1F · canonical pages do not hand-code the wordmark', () => {
  it.each(CANONICAL_PAGES)('%s does not contain a hand-coded >AbarVa< wordmark', (file) => {
    expect(read(file)).not.toMatch(/>\s*AbarVa\s*</);
  });
});

// ---------------------------------------------------------------------
// 6. No banned tokens in canonical brand / nav / shell files or in any
//    canonical page
// ---------------------------------------------------------------------

describe('NAV1F · no banned tokens in canonical brand/nav/shell files', () => {
  it.each([
    ...CANONICAL_BRAND_FILES,
    ...CANONICAL_NAV_FILES,
    ...CANONICAL_PAGE_SHELL_FILES,
    ...CANONICAL_PAGES,
  ])('%s contains no banned tokens', (file) => {
    const src = read(file).toLowerCase();
    const present = BANNED_TOKENS.filter((t) => src.includes(t.toLowerCase()));
    expect({ file, present }).toEqual({ file, present: [] });
  });
});

// ---------------------------------------------------------------------
// 7. AbarVaShellNav exposes the canonical six-surface enum
// ---------------------------------------------------------------------

describe('NAV1F · AbarVaShellNav six-surface enum', () => {
  for (const key of ['home', 'programs', 'source', 'intelligence', 'tower', 'admin']) {
    it(`exposes the "${key}" surface entry`, () => {
      expect(NAV_SOURCE).toMatch(new RegExp(`key:\\s*['"]${key}['"]`));
    });
  }
});

// ---------------------------------------------------------------------
// 8. Every canonical page sits under canonical chrome
//
// This replaces "every canonical page imports a canonical shell symbol",
// which stopped being true of the product rather than of the pages. Chrome is
// mounted by `(maestro)/layout.tsx`, so a page that is a thin `redirect()` or
// a re-export has no shell import and correctly should not need one — the old
// check failed 10 such pages. What still matters, and is what NAV1 was
// protecting, is that no canonical page escapes the chrome-bearing layout
// chain. That is asserted here against the segment chain Next.js actually
// composes.
// ---------------------------------------------------------------------

describe('NAV1F · canonical pages sit under canonical chrome', () => {
  it.each(CANONICAL_PAGES)('%s is under a chrome-bearing layout', (file) => {
    const chain = layoutChainFor(file);
    const bearer = chain.find((layout) => mountsChrome(read(layout)));
    expect({ file, chromeLayout: bearer ?? null }).toEqual({
      file,
      chromeLayout: expect.any(String),
    });
  });
});

// ---------------------------------------------------------------------
// 9. The audit document and slice docs exist
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
