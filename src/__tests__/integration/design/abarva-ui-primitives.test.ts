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
  it('body font is DM Sans (no serif body)', () => {
    expect(FONT.body).toMatch(/DM Sans/);
    expect(FONT.body).not.toMatch(/Georgia/);
    expect(FONT.body).not.toMatch(/Times/);
    // The fallback chain may include the generic CSS "sans-serif" family, but
    // it must not declare an actual serif body face.
    expect(FONT.body).not.toMatch(/(?<![a-z-])serif(?![a-z-])/);
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
  it('exposes exactly four canonical agents', () => {
    expect([...ABARVA_AGENT_NAMES]).toEqual([
      'nexus',
      'sentinel',
      'atlas',
      'steward',
    ]);
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
  it('exposes 5 canonical surfaces', () => {
    expect(ABARVA_TOP_NAV_SURFACES.length).toBe(5);
  });

  it('is in canonical order: programs, tower, intelligence, source, admin', () => {
    expect(ABARVA_TOP_NAV_SURFACES.map((s) => s.key)).toEqual([
      'programs',
      'tower',
      'intelligence',
      'source',
      'admin',
    ]);
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
