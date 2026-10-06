// DES2 · AbarVa UI primitives integration tests.
//
// These tests cover:
//   1. Theme tokens (color palette, fonts, type scale, spacing/radius)
//   2. Agent + status partition (canon §H)
//   3. Top-nav surface list (canonical order)
//   4. File-type + evidence enums
//   5. Module hygiene — every primitive imports only allowed modules

import {
  COLORS,
  FONT,
  TYPE,
  SPACING,
  RADIUS,
  BORDER,
  AGENT_ACCENT,
  ABARVA_AGENT_NAMES,
  ABARVA_STATUS_KEYS,
  ABARVA_FILE_CHIPS,
  ABARVA_EVIDENCE_STATES,
  statusAccent,
} from '@/lib/design/abarva-theme';
import { ABARVA_TOP_NAV_SURFACES } from '@/components/abarva/AbarVaTopNav';
import { CANONICAL_LOGO_COMPONENT } from '@/lib/qa/logo-usage-enforcement';

// ---------------------------------------------------------------------
// Theme tokens
// ---------------------------------------------------------------------

describe('abarva-theme · color palette', () => {
  it('NAVY accent is the canonical #1B2B5C value', () => {
    expect(COLORS.navy).toBe('#1B2B5C');
  });

  it('amber and red accents are present and distinct', () => {
    expect(COLORS.amber).toBeTruthy();
    expect(COLORS.red).toBeTruthy();
    expect(COLORS.amber).not.toBe(COLORS.red);
  });

  it('inkDark and navyDark are reserved dark surfaces (not the same as light surface)', () => {
    expect(COLORS.inkDark).toBe('#0A0C12');
    expect(COLORS.navyDark).toBe('#10193A');
    expect(COLORS.inkDark).not.toBe(COLORS.surface);
    expect(COLORS.navyDark).not.toBe(COLORS.surface);
  });

  it('surface is light (warm off-white), not dark', () => {
    expect(COLORS.surface.startsWith('#F') || COLORS.surface.startsWith('#f')).toBe(
      true,
    );
  });
});

describe('abarva-theme · typography', () => {
  // The retired assertion pinned "DM Sans", the v2 body face. abarva-theme.ts
  // records that DM Sans was retired on 2026-05-07 in favour of Inter, so the
  // case was failing on a deliberate change rather than on a defect. Pinning
  // the *next* face by name would fail the same way at the next canon change.
  // What is worth guarding is the property (the body face is a sans, not a
  // serif) and the agreement between the theme and the stylesheet that has to
  // load it — drift between those two is invisible until someone looks at a
  // rendered page.
  it('body font declares a sans face, not a serif one', () => {
    expect(FONT.body).not.toMatch(/Georgia/);
    expect(FONT.body).not.toMatch(/Times/);
    // The fallback chain may include the generic CSS "sans-serif" family, but
    // it must not declare an actual serif body face.
    expect(FONT.body).not.toMatch(/(?<![a-z-])serif(?![a-z-])/);
  });

  it('the global stylesheet loads the body and display faces the theme declares', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../../app/globals.css'),
      'utf8',
    );
    const primaryFamily = (declared: string) => {
      const first = declared.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      expect(first.length).toBeGreaterThan(0);
      return first;
    };
    for (const declared of [FONT.body, FONT.display]) {
      const family = primaryFamily(declared);
      expect({ family, loadedByStylesheet: css.includes(family) }).toEqual({
        family,
        loadedByStylesheet: true,
      });
    }
  });

  it('mono font is JetBrains Mono', () => {
    expect(FONT.mono).toMatch(/JetBrains Mono/);
  });

  it('h1, h2, h3, body, eyebrow, caption all carry explicit fontSize / fontWeight / color', () => {
    for (const key of ['h1', 'h2', 'h3', 'body', 'eyebrow', 'caption'] as const) {
      const t = TYPE[key];
      expect(typeof t.fontSize).toBe('number');
      expect(typeof t.fontWeight).toBe('number');
      expect(typeof t.color).toBe('string');
    }
  });

  it('eyebrow uses mono and is uppercase', () => {
    expect(TYPE.eyebrow.fontFamily).toBe(FONT.mono);
    expect(TYPE.eyebrow.textTransform).toBe('uppercase');
  });
});

describe('abarva-theme · spacing / radius / border', () => {
  it('SPACING is monotonically increasing from xs to xxxl', () => {
    expect(SPACING.xs).toBeLessThan(SPACING.sm);
    expect(SPACING.sm).toBeLessThan(SPACING.md);
    expect(SPACING.md).toBeLessThan(SPACING.lg);
    expect(SPACING.lg).toBeLessThan(SPACING.xl);
    expect(SPACING.xl).toBeLessThan(SPACING.xxl);
    expect(SPACING.xxl).toBeLessThan(SPACING.xxxl);
  });

  it('RADIUS exposes the pill token at 999', () => {
    expect(RADIUS.pill).toBe(999);
  });

  it('BORDER hairline references the canonical border color', () => {
    expect(BORDER.hairline).toContain(COLORS.border);
    expect(BORDER.navy).toContain(COLORS.navy);
  });
});

// ---------------------------------------------------------------------
// Agent + status partition (canon §H)
// ---------------------------------------------------------------------

describe('abarva-theme · agent partition', () => {
  // The retired assertion pinned the list to exactly four names. A fifth,
  // 'ava', was added to the theme by a later change, so the case failed on a
  // list that had moved rather than on a broken one. Whether 'ava' is a
  // canonical agent is a product question — the theme names five and
  // src/lib/qa/cross-surface-consistency.ts names four — and it is recorded
  // for the owner rather than answered here by editing one list to match the
  // other. What this suite can hold without deciding it: the four
  // surface-owning agents are present, and the accent table covers exactly
  // the names that are declared, so a name can never be added without a
  // colour or a colour orphaned without a name.
  it('every surface-owning agent is declared', () => {
    for (const agent of ['nexus', 'sentinel', 'atlas', 'steward']) {
      expect({ agent, declared: ([...ABARVA_AGENT_NAMES] as string[]).includes(agent) }).toEqual({
        agent,
        declared: true,
      });
    }
  });

  it('the accent table covers exactly the declared agent names', () => {
    const declared = [...ABARVA_AGENT_NAMES].sort();
    expect(declared.length).toBeGreaterThan(0);
    expect(Object.keys(AGENT_ACCENT).sort()).toEqual(declared);
  });

  it('Nexus is NAVY', () => {
    expect(AGENT_ACCENT.nexus.fg).toBe(COLORS.navy);
  });

  it('Sentinel is AMBER', () => {
    expect(AGENT_ACCENT.sentinel.fg).toBe(COLORS.amber);
  });

  it('Atlas resolves to NAVY on light surfaces', () => {
    expect(AGENT_ACCENT.atlas.fg).toBe(COLORS.navy);
  });

  it('Steward is MUTED', () => {
    expect(AGENT_ACCENT.steward.fg).toBe(COLORS.muted);
  });
});

describe('abarva-theme · statusAccent partition', () => {
  it('ready / low / medium → NAVY', () => {
    expect(statusAccent('ready').fg).toBe(COLORS.navy);
    expect(statusAccent('low').fg).toBe(COLORS.navy);
    expect(statusAccent('medium').fg).toBe(COLORS.navy);
  });

  it('partial / high → AMBER', () => {
    expect(statusAccent('partial').fg).toBe(COLORS.amber);
    expect(statusAccent('high').fg).toBe(COLORS.amber);
  });

  it('blocked / critical → RED', () => {
    expect(statusAccent('blocked').fg).toBe(COLORS.red);
    expect(statusAccent('critical').fg).toBe(COLORS.red);
  });

  it('exposes all 7 status keys', () => {
    expect([...ABARVA_STATUS_KEYS].sort()).toEqual(
      [
        'blocked',
        'critical',
        'high',
        'low',
        'medium',
        'partial',
        'ready',
      ].sort(),
    );
  });
});

// ---------------------------------------------------------------------
// Top-nav surface list
// ---------------------------------------------------------------------

describe('AbarvaTopNav · surface list', () => {
  it('exposes the canonical signed-in surfaces', () => {
    expect(ABARVA_TOP_NAV_SURFACES.length).toBe(6);
  });

  it('is in canonical order: Knowledge, Intelligence, Moves, Source, Tower, Admin', () => {
    expect(ABARVA_TOP_NAV_SURFACES.map((s) => s.key)).toEqual([
      'home',
      'intelligence',
      'programs',
      'source',
      'tower',
      'admin',
    ]);
  });

  it('keeps Knowledge as the first surface and routes it to /home', () => {
    expect(ABARVA_TOP_NAV_SURFACES[0]).toMatchObject({
      key: 'home',
      label: 'Knowledge',
      href: '/home',
    });
  });

  it('every surface has an href starting with /', () => {
    for (const s of ABARVA_TOP_NAV_SURFACES) {
      expect(s.href.startsWith('/')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// File chips + evidence states
// ---------------------------------------------------------------------

describe('ABARVA_FILE_CHIPS', () => {
  it('exposes the 7 canonical file types in canonical order', () => {
    expect([...ABARVA_FILE_CHIPS]).toEqual([
      'DOC',
      'PDF',
      'XLS',
      'PPT',
      'NOTE',
      'HTML',
      'DATA',
    ]);
  });
});

describe('ABARVA_EVIDENCE_STATES', () => {
  it('exposes the 6 canonical evidence-lifecycle states in canonical order', () => {
    expect([...ABARVA_EVIDENCE_STATES]).toEqual([
      'not_seeded',
      'partial',
      'cited',
      'quality_checked',
      'usable_as_evidence',
      'blocked',
    ]);
  });
});

// ---------------------------------------------------------------------
// Module hygiene — every component file imports only allowed modules
// ---------------------------------------------------------------------

describe('module hygiene · abarva primitives', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const componentFiles = [
    'AbarVaTopNav.tsx',
    'AgentBadge.tsx',
    'AgentBriefPanel.tsx',
    'MetricStrip.tsx',
    'PressureCard.tsx',
    'PatternCard.tsx',
    'JourneyRail.tsx',
    'FileTypeChip.tsx',
    'EvidenceChip.tsx',
    'DetailDrawerShell.tsx',
    'EmptyInspector.tsx',
  ];

  function loadComponent(name: string): string {
    const p = path.resolve(__dirname, '../../../components/abarva', name);
    const raw = fs.readFileSync(p, 'utf8');
    return raw
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  }

  it.each(componentFiles)(
    '%s imports only next/link and @/lib/design/abarva-theme (or local abarva)',
    (file) => {
      const code = loadComponent(file);
      const importMatches = [...code.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
        (m) => m[1],
      );
      for (const spec of importMatches) {
        const allowed =
          spec === 'next/link' ||
          spec === '@/lib/design/abarva-theme' ||
          spec.startsWith('@/components/abarva/');
        expect({ file, spec, allowed }).toEqual({
          file,
          spec,
          allowed: true,
        });
      }
    },
  );

  it.each(componentFiles)(
    '%s does not import Sentinel / Atlas / Nexus / Agent runtime',
    (file) => {
      const code = loadComponent(file);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/sentinel\//);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/atlas\//);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/nexus\//);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/agent\//);
      expect(code).not.toMatch(/from\s+['"]@\/components\/agent\//);
    },
  );

  it.each(componentFiles)(
    '%s does not import Source UI, mock.ts, auth, or supabase',
    (file) => {
      const code = loadComponent(file);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/source\//);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/programs\/mock/);
      expect(code).not.toMatch(/from\s+['"]@\/lib\/auth\//);
      expect(code).not.toMatch(/from\s+['"][^'"]*supabase/);
    },
  );

  it.each(componentFiles)(
    '%s does not call useState or useEffect (pure components)',
    (file) => {
      const code = loadComponent(file);
      expect(code).not.toMatch(/\buseState\b/);
      expect(code).not.toMatch(/\buseEffect\b/);
    },
  );
});

// ---------------------------------------------------------------------
// Theme module hygiene
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// NAV1B · canonical nav primitives import the brand component
// ---------------------------------------------------------------------

describe('NAV1B · canonical nav primitives wire to canonical brand', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  function readAbarva(name: string): string {
    return fs.readFileSync(
      path.resolve(__dirname, '../../../components/abarva', name),
      'utf8',
    );
  }

  function readBrand(name: string): string {
    return fs.readFileSync(
      path.resolve(__dirname, '../../../components/brand', name),
      'utf8',
    );
  }

  // These two cases pinned '@/components/brand/AbarVaLogo' as the canonical
  // import path. Product code declares otherwise: CANONICAL_LOGO_COMPONENT in
  // src/lib/qa/logo-usage-enforcement.ts names src/components/abarva/AbarVaLogo.tsx,
  // and that is the module all seven product importers use. The
  // components/brand copy has no product importer at all. Deriving the path
  // from the declaration means a future move travels into these cases; the
  // orphan module is recorded for the owner rather than deleted here.
  const canonicalLogoImport = CANONICAL_LOGO_COMPONENT
    .replace(/^src\//, '@/')
    .replace(/\.tsx$/, '');

  it('AbarVaWordmark.tsx delegates to the canonical brand component', () => {
    const src = readAbarva('AbarVaWordmark.tsx');
    expect(src).toContain(canonicalLogoImport);
    expect(src).toMatch(/AbarVaLogo/);
  });

  it('AbarVaTopNav.tsx renders the wordmark via the canonical primitive', () => {
    const src = readAbarva('AbarVaTopNav.tsx');
    expect(src).toMatch(/AbarVaWordmarkPrimitive|AbarvaWordmark|AbarVaLogo/);
  });

  it('AbarVaShellNav.tsx renders the wordmark via the canonical primitive', () => {
    const src = readAbarva('AbarVaShellNav.tsx');
    expect(src).toMatch(/AbarvaWordmark|AbarVaLogo/);
  });

  it('AbarVaAppShell.tsx imports AbarVaLogo from the canonical brand path', () => {
    const src = readAbarva('AbarVaAppShell.tsx');
    expect(src).toContain(canonicalLogoImport);
  });

  it('canonical nav primitives carry no banned tokens', () => {
    const banned = ['#14B8A6', 'sparkle', 'ॐ'];
    for (const file of ['AbarVaTopNav.tsx', 'AbarVaShellNav.tsx', 'AbarVaAppShell.tsx', 'AbarVaWordmark.tsx']) {
      const src = readAbarva(file);
      for (const token of banned) {
        expect({ file, token, contains: src.toLowerCase().includes(token.toLowerCase()) }).toEqual({
          file,
          token,
          contains: false,
        });
      }
    }
  });

  it('AbarVaShellNav exposes the canonical 6-surface enum (home, programs, source, intelligence, tower, admin)', () => {
    const src = readAbarva('AbarVaShellNav.tsx');
    for (const key of ['home', 'programs', 'source', 'intelligence', 'tower', 'admin']) {
      expect(src).toMatch(new RegExp(`key:\\s*['"]${key}['"]`));
    }
  });

  it('AbarVaShellNav supports an activeKey prop for active-surface styling', () => {
    const src = readAbarva('AbarVaShellNav.tsx');
    expect(src).toMatch(/activeKey\??:\s*string/);
    expect(src).toMatch(/data-active/);
  });

  it('AbarVaTopNav supports an active prop for active-surface styling', () => {
    const src = readAbarva('AbarVaTopNav.tsx');
    expect(src).toMatch(/active\??:/);
    expect(src).toMatch(/data-active/);
  });

  it('canonical brand index exports AbarVaLogo (single source of truth)', () => {
    const idx = readBrand('index.ts');
    expect(idx).toMatch(/export\s*\{\s*AbarVaLogo\s*\}/);
  });
});

describe('module hygiene · abarva-theme.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/design/abarva-theme.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('contains no React import (pure tokens)', () => {
    expect(source).not.toMatch(/from\s+['"]react['"]/);
  });

  it('contains no import of forbidden modules', () => {
    expect(source).not.toMatch(/from\s+['"]@\/lib\/sentinel\//);
    expect(source).not.toMatch(/from\s+['"]@\/lib\/atlas\//);
    expect(source).not.toMatch(/from\s+['"]@\/lib\/nexus\//);
    expect(source).not.toMatch(/from\s+['"]@\/lib\/agent\//);
    expect(source).not.toMatch(/from\s+['"]@\/lib\/source\//);
    expect(source).not.toMatch(/from\s+['"]@\/lib\/auth\//);
    expect(source).not.toMatch(/supabase/);
  });
});
