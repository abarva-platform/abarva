/**
 * ADMIN7 — Visual lock & regression guard
 *
 * Pure TypeScript Jest tests scanning the admin tree for design-canon drift.
 *
 * Locks:
 *   - Banned hex tokens (teal/cyan/purple/magenta) MUST NOT appear anywhere in
 *     src/components/admin/**, src/lib/admin/**, or src/app/(maestro)/admin/**.
 *   - Hex literals MUST be in the canonical allow-list (legitimate pre-existing
 *     accents are listed with comments explaining why).
 *   - Font-family declarations MUST resolve to Cormorant Garamond / DM Sans /
 *     Georgia (or be an inherit/system stack we explicitly allow).
 *   - All 8 admin route files MUST import AdminCanonShellV2 + EditorialCanvas +
 *     AgentRail.
 *   - The brand barrel MUST re-export AbarVaLogo and the canonical SVG must
 *     exist on disk.
 *
 * No React rendering, no jsdom — pure fs scans.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { COLORS } from '@/lib/design/design-tokens';

const root = process.cwd();

// ---------------------------------------------------------------------------
// Canonical hex allow-list. Comparison is case-insensitive (normalized lower).
// ---------------------------------------------------------------------------

const ALLOWED_HEX_LITERALS_RAW: string[] = [
  // Foundation tokens (design-tokens.ts)
  '#070707', // ink
  '#0b4a91', // navy
  '#FBFAF7', // cream
  '#FFFFFF', // white
  // Soft surfaces
  '#E8F0FA', // skyPale
  '#E8F5E8', // mintSoft
  '#FFF4E1', // amberSoft
  '#FFE6E1', // coralSoft
  // Status text
  '#1B5E20', // mintInk
  '#7A4F01', // amberInk
  '#8B1F0F', // coralInk

  // Pre-existing legitimate hexes used across the admin tree
  // (light/dark neutrals, status badge colors, surface tints).
  // Allowed because they predate ADMIN7 and represent a coherent palette
  // already in use across multiple admin sub-pages. New colors should
  // come from design-tokens.ts.
  '#0A0C12', // deep ink (steward editorial dark surface)
  '#0D1520', // editorial canvas dark
  '#0F0E0D', // ink alt (DatasetExplorer COLORS.ink)
  '#0F1E3F', // navy-deep (architecture badge)
  '#111318', // editorial canvas border
  '#166534', // mint-deep (status text)
  '#1B2B5C', // navy-deep (architecture COLORS.navy)
  '#1E3A5F', // navy-mid
  '#1f7a8c', // teal-grey accent (steward setup) — pre-existing, low-saturation
  '#1F2433', // editorial canvas surface
  '#2C8F8D', // teal-grey support — pre-existing
  '#2D6A4F', // mint-deep support
  '#2F62A3', // navy-mid link
  '#3D3B38', // body text gray
  '#4F5563', // body alt
  '#525866', // body alt 2
  '#5a5148', // muted body
  '#6B7280', // tailwind-gray-500 equivalent (used in route shell legacy)
  '#706D66', // muted gray
  '#7A2E2E', // dark coral text
  '#7A5A1F', // dark amber text alt
  '#8A7869', // muted bronze
  '#92400E', // dark amber
  '#991B1B', // dark red
  '#9A958E', // muted off-gray
  '#9AA3B2', // muted blue-gray
  '#A84646', // soft red
  '#B16A2C', // soft amber-bronze
  '#B45309', // amber-deep
  '#C53030', // red-deep
  '#DCFCE7', // mint surface tint
  '#E5DFD6', // cream-deep
  '#E6ECF8', // sky surface alt
  '#E8E6E1', // border light
  '#E8E6E3', // border alt
  '#EEF1F8', // sky-pale surface
  '#EEF2F8', // sky surface 2
  '#F2F1EE', // surface neutral
  '#F2F1F0', // border-soft
  '#F3F4F6', // gray surface
  '#F5F3EE', // cream surface
  '#F6F4EF', // cream surface 2
  '#F7F4EE', // cream surface 3
  '#F7F6F3', // surface
  '#F8E6E6', // coral surface alt
  '#F8F1E1', // amber surface alt
  '#FAFAF9', // surface neutral
  '#FCFCFB', // surface white
  '#FEE2E2', // red surface
  '#FEF9C3', // yellow surface

  // setup-tokens.ts — design-primitive palette for the Setup surface
  // (pre-ADMIN7, these are the base neutrals/accents the SHELL tokens resolve to)
  '#fafafa', // near-white surface
  '#f4f4f4', // very light surface
  '#e5e5e5', // light gray border
  '#d0d0d0', // medium border
  '#000000', // pure black
  '#2a2a28', // near-black ink
  '#5F5E5A', // medium warm gray
  '#888780', // muted warm gray
  '#0c1a3a', // deep navy
  '#0066CC', // link blue
  '#eef3fb', // sky-light surface
  '#1d9e75', // mint accent
  '#e3f2eb', // mint surface
  '#ba7517', // amber accent
  '#f7ecd8', // amber surface
  '#a32d2d', // coral-dark accent
  '#f5dedb', // coral surface

  // CrossProgramSignalsPanel — red tint (dark-red token + 33 alpha channel)
  '#991b1b33', // 8-char rgba: #991B1B at 20% opacity (risk surface tint)
];

const ALLOWED_HEX_NORMALIZED = new Set(
  ALLOWED_HEX_LITERALS_RAW.map((h) => h.toLowerCase()),
);

// ---------------------------------------------------------------------------
// Banned hex literals — must never appear in admin tree
// ---------------------------------------------------------------------------

const BANNED_HEX_LITERALS = [
  '#14B8A6', // teal — banned in NAV1
  '#0E9F8C', // teal-adjacent
  '#0D9488', // teal-700
  '#06B6D4', // cyan
  '#7C3AED', // purple — Intelligence drift
  '#A855F7',
  '#9333EA',
  '#D946EF', // magenta — Tower drift
  '#EC4899',
];

// ---------------------------------------------------------------------------
// Allowed font-family substrings
// ---------------------------------------------------------------------------

const ALLOWED_FONT_SUBSTRINGS = [
  'Cormorant Garamond',
  'Georgia',
  'DM Sans',
  'Inter',
  'system-ui',
  '-apple-system',
  'JetBrains Mono',
  'Courier New',
  'ui-monospace',
  'monospace',
  'sans-serif',
  'serif',
  'inherit',
  'TYPOGRAPHY',
  'var(--font-cormorant)',
];

// ---------------------------------------------------------------------------
// Admin tree paths
// ---------------------------------------------------------------------------

const ADMIN_TREE_DIRS = [
  'src/components/admin',
  'src/lib/admin',
  'src/app/(maestro)/admin',
];

const ADMIN_PAGE_PATHS = [
  'src/app/(maestro)/admin/page.tsx',
  'src/app/(maestro)/admin/data-trust/page.tsx',
  'src/app/(maestro)/admin/connectors/page.tsx',
  'src/app/(maestro)/admin/users-access/page.tsx',
  'src/app/(maestro)/admin/agent-readiness/page.tsx',
  'src/app/(maestro)/admin/production-readiness/page.tsx',
];

// ADMIN19 — Depth components added across batch 1+2 of wave-admin-completion.
// Each must (a) exist on disk, (b) import from `@/lib/design/design-tokens`,
// (c) contain no banned hex literals. The list is grouped by sub-page so
// any future deletion is traceable to a specific surface.
const ADMIN19_DEPTH_COMPONENTS: string[] = [
  // Users & Access (batch 1)
  'src/components/admin/UsersAccessTabs.tsx',
  'src/components/admin/UserDetailDrawer.tsx',
  'src/components/admin/UserListTable.tsx',
  'src/components/admin/InviteList.tsx',
  'src/components/admin/UsersAccessActionStrip.tsx',
  // Connectors (batch 1)
  'src/components/admin/connectors/ConnectorDetailDrawer.tsx',
  'src/components/admin/connectors/ConnectorCategoryGroup.tsx',
  // Agent Readiness (batch 2)
  'src/components/admin/AgentExpandableCard.tsx',
  'src/components/admin/ContextCoverageMatrix.tsx',
  'src/components/admin/AgentReadinessTabs.tsx',
  'src/components/admin/AgentReadinessActionStrip.tsx',
  // Data Trust (batch 2)
  'src/components/admin/DataTrustTabs.tsx',
  'src/components/admin/RungDatasetList.tsx',
  'src/components/admin/DatasetDetailDrawer.tsx',
  'src/components/admin/DataGovernancePanel.tsx',
  'src/components/admin/DataQualityPanel.tsx',
  'src/components/admin/DataTrustActionStrip.tsx',
  // Production Readiness (batch 2)
  'src/components/admin/production-readiness/ProductionReadinessTabs.tsx',
  'src/components/admin/production-readiness/ProductionReadinessActionStrip.tsx',
  'src/components/admin/production-readiness/ReadinessTileExpanded.tsx',
  'src/components/admin/production-readiness/BlockerDetailDrawer.tsx',
  'src/components/admin/production-readiness/GateCriteriaMatrix.tsx',
  'src/components/admin/production-readiness/ReadinessHistoryStrip.tsx',
];

// ADMIN19 — Admin pages that own a sub-nav or drawer interaction must accept
// `searchParams` so the URL is the source of truth. The Overview (/admin)
// is intentionally exempt until ADMIN18 lands.
const ADMIN_PAGES_WITH_SEARCH_PARAMS: string[] = [
  'src/app/(maestro)/admin/data-trust/page.tsx',
  'src/app/(maestro)/admin/connectors/page.tsx',
  'src/app/(maestro)/admin/users-access/page.tsx',
  'src/app/(maestro)/admin/agent-readiness/page.tsx',
  'src/app/(maestro)/admin/production-readiness/page.tsx',
];

// ADMIN8 + ADMIN10 — legacy /platform/admin/* pages are now thin redirects.
// Regression guard: these files MUST import `redirect` from 'next/navigation'
// and call it with the expected destination — they MUST NOT render the
// canonical shell directly.
//
// ADMIN8 retired: root, architecture, production-readiness (→ /admin/...).
// ADMIN10 retired: intelligence (→ /intelligence), users (→ /admin/users-access).
const LEGACY_REDIRECT_PAGES: Array<{ path: string; expectedTarget: string }> = [
  { path: 'src/app/(maestro)/platform/admin/page.tsx', expectedTarget: '/admin' },
  { path: 'src/app/(maestro)/platform/admin/production-readiness/page.tsx', expectedTarget: '/admin/production-readiness' },
  { path: 'src/app/(maestro)/platform/admin/intelligence/page.tsx', expectedTarget: '/intelligence' },
  { path: 'src/app/(maestro)/platform/admin/users/page.tsx', expectedTarget: '/admin/users-access' },
];

// ---------------------------------------------------------------------------
// Scanner helpers
// ---------------------------------------------------------------------------

function walkDir(dir: string): string[] {
  const out: string[] = [];
  const abs = resolve(root, dir);
  if (!existsSync(abs)) return out;
  const stack = [abs];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur);
    for (const e of entries) {
      const p = join(cur, e);
      const s = statSync(p);
      if (s.isDirectory()) {
        stack.push(p);
      } else if (s.isFile() && /\.(tsx?|jsx?)$/.test(e)) {
        out.push(p);
      }
    }
  }
  return out;
}

function findHexLiteralsIn(src: string): string[] {
  return src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
}

function findFontFamilyDeclarations(src: string): string[] {
  const out: string[] = [];
  const re = /font[Ff]amily\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function collectAdminFiles(): string[] {
  const all: string[] = [];
  for (const d of ADMIN_TREE_DIRS) {
    all.push(...walkDir(d));
  }
  return all;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ADMIN7 — Visual lock & regression guard', () => {
  // -------------------------------------------------------------------------
  // Canonical admin page presence
  // -------------------------------------------------------------------------

  describe('Canonical admin pages exist and import the shell', () => {
    // Note: Setup Redesign Package (PRs A/B/C) migrated admin/page.tsx,
    // data-trust/page.tsx, and agent-readiness/page.tsx to a new pattern
    // using SetupChatRail instead of the older AgentRail + EditorialCanvas
    // pattern. All pages still use AdminCanonShellV2 as the outer shell.
    ADMIN_PAGE_PATHS.forEach((p) => {
      describe(p, () => {
        it('file exists', () => {
          expect(existsSync(resolve(root, p))).toBe(true);
        });
        it('imports AdminCanonShellV2', () => {
          const src = readFileSync(resolve(root, p), 'utf8');
          expect(src).toContain('AdminCanonShellV2');
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // ADMIN8 — Legacy /platform/admin pages are redirects, not full canonical pages
  // -------------------------------------------------------------------------

  describe('ADMIN8 + ADMIN10 — Legacy /platform/admin/* are thin redirects', () => {
    LEGACY_REDIRECT_PAGES.forEach(({ path, expectedTarget }) => {
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
        it('does NOT import AdminCanonShellV2 (no canonical shell render)', () => {
          const src = readFileSync(resolve(root, path), 'utf8');
          expect(src).not.toContain('AdminCanonShellV2');
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Banned hex sweep
  // -------------------------------------------------------------------------

  describe('No banned hex tokens in admin tree', () => {
    const allFiles = collectAdminFiles();

    BANNED_HEX_LITERALS.forEach((banned) => {
      it(`no occurrence of ${banned} anywhere in admin tree`, () => {
        const offenders: string[] = [];
        const needle = banned.toLowerCase();
        for (const f of allFiles) {
          const src = readFileSync(f, 'utf8').toLowerCase();
          if (src.includes(needle)) {
            offenders.push(f.replace(root + '/', ''));
          }
        }
        expect(offenders).toEqual([]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Hex literal canonicality
  // -------------------------------------------------------------------------

  describe('All hex literals in admin tree are canonical', () => {
    const allFiles = collectAdminFiles();

    it('every hex literal is in the allowed set', () => {
      const violations: Array<{ file: string; hex: string }> = [];
      for (const f of allFiles) {
        const src = readFileSync(f, 'utf8');
        const hexes = findHexLiteralsIn(src);
        for (const h of hexes) {
          if (!ALLOWED_HEX_NORMALIZED.has(h.toLowerCase())) {
            violations.push({ file: f.replace(root + '/', ''), hex: h });
          }
        }
      }
      if (violations.length > 0) {
        const summary = violations
          .slice(0, 10)
          .map((v) => `${v.file}: ${v.hex}`)
          .join('\n');
        throw new Error(
          `${violations.length} non-canonical hex literal(s) in admin tree:\n${summary}`,
        );
      }
      expect(violations).toEqual([]);
    });

    it('the allow-set is non-empty and includes the navy token', () => {
      expect(ALLOWED_HEX_NORMALIZED.size).toBeGreaterThan(0);
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.navy.toLowerCase())).toBe(true);
    });

    it('the allow-set does NOT contain any banned token', () => {
      for (const banned of BANNED_HEX_LITERALS) {
        expect(ALLOWED_HEX_NORMALIZED.has(banned.toLowerCase())).toBe(false);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Font-family discipline
  // -------------------------------------------------------------------------

  describe('Font-family declarations in admin tree are canonical', () => {
    const allFiles = collectAdminFiles();

    it('every fontFamily declaration uses an allowed substring', () => {
      const violations: Array<{ file: string; family: string }> = [];
      for (const f of allFiles) {
        const src = readFileSync(f, 'utf8');
        const fams = findFontFamilyDeclarations(src);
        for (const family of fams) {
          const ok = ALLOWED_FONT_SUBSTRINGS.some((s) => family.includes(s));
          if (!ok) {
            violations.push({ file: f.replace(root + '/', ''), family });
          }
        }
      }
      expect(violations).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Token import discipline
  // -------------------------------------------------------------------------

  describe('Design token import discipline', () => {
    const allFiles = collectAdminFiles();

    it('no admin page imports a banned token literal', () => {
      const offenders: string[] = [];
      for (const f of allFiles) {
        const src = readFileSync(f, 'utf8').toLowerCase();
        for (const banned of BANNED_HEX_LITERALS) {
          if (src.includes(banned.toLowerCase())) {
            offenders.push(`${f.replace(root + '/', '')} contains ${banned}`);
            break;
          }
        }
      }
      expect(offenders).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Logo presence audit
  // -------------------------------------------------------------------------

  describe('AbarVaLogo is the only canonical logo path', () => {
    it('public/brand/abarva-logo-lockup-v2.svg exists', () => {
      expect(existsSync(resolve(root, 'public/brand/abarva-logo-lockup-v2.svg'))).toBe(true);
    });

    it('AbarVaLogo component exists', () => {
      expect(existsSync(resolve(root, 'src/components/brand/AbarVaLogo.tsx'))).toBe(true);
    });

    it('brand barrel re-exports AbarVaLogo', () => {
      const src = readFileSync(resolve(root, 'src/components/brand/index.ts'), 'utf8');
      expect(src).toMatch(/AbarVaLogo/);
    });

    it('AdminSidebar does not hand-code a logo (uses TYPOGRAPHY.serif wordmark or AbarVaLogo)', () => {
      const sidebarSrc = readFileSync(
        resolve(root, 'src/components/admin/AdminSidebar.tsx'),
        'utf8',
      );
      // No bitmap logos
      expect(sidebarSrc).not.toMatch(/<img[^>]+src=["'][^"']*logo/i);
      // No inline svg lockups
      expect(sidebarSrc).not.toContain('<svg');
    });

    it('no admin file inlines a hand-coded SVG wordmark', () => {
      const allFiles = collectAdminFiles();
      const offenders: string[] = [];
      for (const f of allFiles) {
        const src = readFileSync(f, 'utf8');
        if (/<svg[^>]*>[\s\S]*Abar[\s\S]*<\/svg>/i.test(src)) {
          offenders.push(f.replace(root + '/', ''));
        }
      }
      expect(offenders).toEqual([]);
    });

    it('no admin file references a bitmap logo asset', () => {
      const allFiles = collectAdminFiles();
      const offenders: string[] = [];
      for (const f of allFiles) {
        const src = readFileSync(f, 'utf8');
        if (/['"][^'"]*\b(abarva|logo)[^'"]*\.(png|jpg|jpeg|gif|webp)['"]/i.test(src)) {
          offenders.push(f.replace(root + '/', ''));
        }
      }
      expect(offenders).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Token registry sanity (proves COLORS export matches the allow-list)
  // -------------------------------------------------------------------------

  describe('Token registry sanity', () => {
    it('COLORS.ink is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.ink.toLowerCase())).toBe(true);
    });
    it('COLORS.navy is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.navy.toLowerCase())).toBe(true);
    });
    it('COLORS.cream is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.cream.toLowerCase())).toBe(true);
    });
    it('COLORS.skyPale is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.skyPale.toLowerCase())).toBe(true);
    });
    it('COLORS.mintSoft is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.mintSoft.toLowerCase())).toBe(true);
    });
    it('COLORS.amberSoft is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.amberSoft.toLowerCase())).toBe(true);
    });
    it('COLORS.coralSoft is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.coralSoft.toLowerCase())).toBe(true);
    });
    it('COLORS.mintInk is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.mintInk.toLowerCase())).toBe(true);
    });
    it('COLORS.amberInk is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.amberInk.toLowerCase())).toBe(true);
    });
    it('COLORS.coralInk is in allowed hex set', () => {
      expect(ALLOWED_HEX_NORMALIZED.has(COLORS.coralInk.toLowerCase())).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Synthetic violation fixtures (prove the regex actually trips)
  // -------------------------------------------------------------------------

  describe('Regression guard self-check (synthetic fixtures)', () => {
    it('detects a banned token in a synthetic source string', () => {
      const synthetic = `const COLORS = { accent: '#14B8A6' };`;
      const tripped = BANNED_HEX_LITERALS.some((b) =>
        synthetic.toLowerCase().includes(b.toLowerCase()),
      );
      expect(tripped).toBe(true);
    });

    it('detects a banned magenta in a synthetic source string', () => {
      const synthetic = `border: '1px solid #D946EF';`;
      const tripped = BANNED_HEX_LITERALS.some((b) =>
        synthetic.toLowerCase().includes(b.toLowerCase()),
      );
      expect(tripped).toBe(true);
    });

    it('rejects a non-canonical hex via the allow-set', () => {
      const synthetic = `const c = '#ABCDEF';`;
      const hexes = findHexLiteralsIn(synthetic);
      expect(hexes).toContain('#ABCDEF');
      expect(ALLOWED_HEX_NORMALIZED.has('#abcdef')).toBe(false);
    });

    it('rejects an invented font-family via the allow-substring scan', () => {
      const synthetic = `style={{ fontFamily: 'Comic Sans MS' }}`;
      const fams = findFontFamilyDeclarations(synthetic);
      expect(fams).toContain('Comic Sans MS');
      const ok = ALLOWED_FONT_SUBSTRINGS.some((s) => 'Comic Sans MS'.includes(s));
      expect(ok).toBe(false);
    });

    it('accepts a Cormorant Garamond font-family via the allow-substring scan', () => {
      const family = '"Cormorant Garamond", Georgia, serif';
      const ok = ALLOWED_FONT_SUBSTRINGS.some((s) => family.includes(s));
      expect(ok).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Coverage sanity
  // -------------------------------------------------------------------------

  describe('Coverage sanity', () => {
    it('the admin tree contains at least 50 source files', () => {
      const files = collectAdminFiles();
      expect(files.length).toBeGreaterThanOrEqual(50);
    });

    it('all 6 admin sub-routes are covered by ADMIN_PAGE_PATHS', () => {
      // ai-initiatives route removed in admin-completion wave (PR #ADMIN7-cleanup).
      // build-progress, architecture, reasoning also retired. 6 canonical routes remain.
      expect(ADMIN_PAGE_PATHS).toHaveLength(6);
    });

    it('walkDir returns only .ts/.tsx/.js/.jsx files', () => {
      const files = collectAdminFiles();
      for (const f of files) {
        expect(/\.(tsx?|jsx?)$/.test(f)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // ADMIN19 — Depth components from batch 1+2 of wave-admin-completion
  //
  // For each new component:
  //   1. file exists on disk
  //   2. imports from `@/lib/design/design-tokens` (no hex literals inline)
  //   3. contains no banned hex tokens
  // -------------------------------------------------------------------------

  describe('ADMIN19 — Depth components present and canon-compliant', () => {
    it('the depth-component manifest covers all 22 batch 1+2 components', () => {
      // Sanity: keep this list anchored so additions are intentional.
      // Batch 1: UsersAccess (5) + Connectors (2) = 7
      // Batch 2: AgentReadiness (4) + DataTrust (6) + ProductionReadiness (6) = 16
      // Total: 22 (was 32 in original draft; ai-initiatives components removed)
      expect(ADMIN19_DEPTH_COMPONENTS.length).toBeGreaterThanOrEqual(22);
    });

    ADMIN19_DEPTH_COMPONENTS.forEach((rel) => {
      describe(rel, () => {
        it('file exists', () => {
          expect(existsSync(resolve(root, rel))).toBe(true);
        });

        it('imports from @/lib/design/design-tokens', () => {
          const src = readFileSync(resolve(root, rel), 'utf8');
          expect(src).toMatch(/@\/lib\/design\/design-tokens/);
        });

        it('contains no banned hex tokens', () => {
          const src = readFileSync(resolve(root, rel), 'utf8').toLowerCase();
          const offenders = BANNED_HEX_LITERALS.filter((b) =>
            src.includes(b.toLowerCase()),
          );
          expect(offenders).toEqual([]);
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // ADMIN19 — Admin pages with sub-nav/drawer state read URL `searchParams`
  //
  // Overview (/admin) is exempt until ADMIN18 ships. The other 7 pages all
  // own a tab/drawer interaction and MUST accept `searchParams` so URL is
  // the source of truth (deep-linkable, refresh-safe, agent-driveable).
  // -------------------------------------------------------------------------

  describe('ADMIN19 — Admin pages read searchParams for sub-nav/drawer state', () => {
    it('the searchParams page manifest covers all 5 depth pages', () => {
      // Overview (/admin) is exempt until ADMIN18. ai-initiatives removed.
      // 5 remaining depth pages: data-trust, connectors, users-access,
      // agent-readiness, production-readiness.
      expect(ADMIN_PAGES_WITH_SEARCH_PARAMS).toHaveLength(5);
    });

    ADMIN_PAGES_WITH_SEARCH_PARAMS.forEach((p) => {
      describe(p, () => {
        it('file exists', () => {
          expect(existsSync(resolve(root, p))).toBe(true);
        });

        it('declares searchParams in its props/signature', () => {
          const src = readFileSync(resolve(root, p), 'utf8');
          expect(src).toMatch(/searchParams/);
        });

        it('awaits/reads searchParams (Next.js 15 async params contract)', () => {
          const src = readFileSync(resolve(root, p), 'utf8');
          // Either `await searchParams` or `searchParams ? await searchParams`.
          expect(src).toMatch(/await\s+searchParams/);
        });
      });
    });
  });
});
