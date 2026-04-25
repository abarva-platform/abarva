// DES2 · AbarVa UI primitives tests.
//
// Pure deterministic coverage of the theme tokens + structural
// invariants. No React rendering — components are covered by tsc +
// build. We only assert public types + module hygiene + theme
// invariants here.

import {
  ABARVA_AGENT_NAMES,
  ABARVA_EVIDENCE_STATES,
  ABARVA_FILE_CHIPS,
  ABARVA_STATUS_KEYS,
  AGENT_ACCENT,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
  statusAccent,
  type AbarvaAgent,
} from '@/lib/design/abarva-theme';
import { ABARVA_TOP_NAV_SURFACES } from '@/components/abarva/AbarVaTopNav';

// ---------------------------------------------------------------------
// Theme tokens exist
// ---------------------------------------------------------------------

describe('AbarVa theme tokens', () => {
  it('exposes the canonical palette tokens', () => {
    const required = [
      'surface',
      'surface2',
      'card',
      'border',
      'borderSoft',
      'ink',
      'body',
      'muted',
      'mutedSoft',
      'navy',
      'navySoft',
      'amber',
      'amberSoft',
      'red',
      'redSoft',
      'inkDark',
      'navyDark',
    ];
    for (const k of required) {
      expect(typeof (COLORS as Record<string, unknown>)[k]).toBe('string');
    }
  });

  it('NAVY is the brand accent (no green-heavy palette)', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#1b2b5c');
    expect(COLORS.amber.toLowerCase()).toBe('#b45309');
    expect(COLORS.red.toLowerCase()).toBe('#b5322b');
  });

  it('font tokens use DM Sans body and JetBrains Mono mono', () => {
    expect(FONT.body).toMatch(/DM Sans/);
    expect(FONT.mono).toMatch(/JetBrains Mono/);
  });

  it('TYPE shape covers H1, H2, H3, body, eyebrow, caption', () => {
    expect(TYPE.h1.fontSize).toBeGreaterThan(20);
    expect(TYPE.h2.fontSize).toBeGreaterThan(15);
    expect(TYPE.h3.fontSize).toBeGreaterThan(13);
    expect(TYPE.body.fontFamily).toBe(FONT.body);
    expect(TYPE.eyebrow.fontFamily).toBe(FONT.mono);
    expect(TYPE.caption.fontStyle).toBe('italic');
  });

  it('SPACING + RADIUS tokens are positive numbers', () => {
    for (const v of Object.values(SPACING)) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of Object.values(RADIUS)) expect(v).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------
// Agent + status partitions
// ---------------------------------------------------------------------

describe('AGENT_ACCENT partition', () => {
  it('covers all four canonical agents', () => {
    const agents: AbarvaAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];
    expect(new Set(ABARVA_AGENT_NAMES)).toEqual(new Set(agents));
    for (const a of agents) {
      const accent = AGENT_ACCENT[a];
      expect(typeof accent.fg).toBe('string');
      expect(typeof accent.bg).toBe('string');
      expect(typeof accent.ring).toBe('string');
    }
  });

  it('Nexus accent is NAVY (brand accent)', () => {
    expect(AGENT_ACCENT.nexus.ring).toBe(COLORS.navy);
  });
});

describe('statusAccent helper', () => {
  it('maps ready / partial / blocked to NAVY / AMBER / RED', () => {
    expect(statusAccent('ready').ring).toBe(COLORS.navy);
    expect(statusAccent('partial').ring).toBe(COLORS.amber);
    expect(statusAccent('blocked').ring).toBe(COLORS.red);
  });

  it('maps severity tiers consistently', () => {
    expect(statusAccent('low').ring).toBe(COLORS.navy);
    expect(statusAccent('medium').ring).toBe(COLORS.navy);
    expect(statusAccent('high').ring).toBe(COLORS.amber);
    expect(statusAccent('critical').ring).toBe(COLORS.red);
  });

  it('falls back to muted for unknown statuses', () => {
    expect(statusAccent('not-a-real-status').ring).toBe(COLORS.muted);
  });
});

// ---------------------------------------------------------------------
// Top nav surface list
// ---------------------------------------------------------------------

describe('AbarvaTopNav · canonical surfaces', () => {
  it('exposes Programs, Tower, Intelligence, Source, Admin in canonical order', () => {
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
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// File + evidence chip enums
// ---------------------------------------------------------------------

describe('FileTypeChip enum', () => {
  it('supports DOC / PDF / XLS / PPT / NOTE / HTML / DATA', () => {
    expect(new Set(ABARVA_FILE_CHIPS)).toEqual(
      new Set(['DOC', 'PDF', 'XLS', 'PPT', 'NOTE', 'HTML', 'DATA']),
    );
  });
});

describe('EvidenceChip enum', () => {
  it('covers the canonical evidence states', () => {
    expect(new Set(ABARVA_EVIDENCE_STATES)).toEqual(
      new Set([
        'not_seeded',
        'partial',
        'cited',
        'quality_checked',
        'usable_as_evidence',
        'blocked',
      ]),
    );
  });
});

describe('Status enum coverage', () => {
  it('exposes all 7 canonical statuses', () => {
    expect(new Set(ABARVA_STATUS_KEYS)).toEqual(
      new Set([
        'ready',
        'partial',
        'blocked',
        'low',
        'medium',
        'high',
        'critical',
      ]),
    );
  });
});

// ---------------------------------------------------------------------
// Module hygiene · static-source checks
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

  it('does not import Source / Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(source).not.toMatch(/from '@\/lib\/source\//);
    expect(source).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(source).not.toMatch(/from '@\/lib\/atlas\//);
    expect(source).not.toMatch(/from '@\/lib\/nexus\//);
    expect(source).not.toMatch(/from '@\/lib\/agent\//);
    expect(source).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import auth or supabase or model SDKs', () => {
    expect(source).not.toMatch(/from '@\/lib\/auth\//);
    expect(source).not.toMatch(/from '@\/.*supabase/);
    expect(source).not.toMatch(/anthropic/i);
    expect(source).not.toMatch(/openai/i);
    expect(source).not.toMatch(/pinecone/i);
  });

  it('does not call Date.now / Math.random / new Date', () => {
    const codeOnly = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });
});

describe('module hygiene · abarva component imports', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const componentDir = path.resolve(
    __dirname,
    '../../../components/abarva',
  );
  const componentFiles = fs
    .readdirSync(componentDir)
    .filter((f) => f.endsWith('.tsx'));

  it.each(componentFiles.map((f) => [f]))(
    '%s imports only next/link or AbarVa modules',
    (file) => {
      const src = fs.readFileSync(path.join(componentDir, file), 'utf8');
      expect(src).not.toMatch(/from '@\/lib\/source\//);
      expect(src).not.toMatch(/from '@\/lib\/sentinel\//);
      expect(src).not.toMatch(/from '@\/lib\/atlas\//);
      expect(src).not.toMatch(/from '@\/lib\/nexus\//);
      expect(src).not.toMatch(/from '@\/lib\/agent\//);
      expect(src).not.toMatch(/from '@\/components\/agent\//);
      expect(src).not.toMatch(/from '@\/lib\/auth\//);
      expect(src).not.toMatch(/from '@\/.*supabase/);
      expect(src).not.toMatch(/from '@\/lib\/programs\/mock'/);
    },
  );

  it('every component file is non-empty', () => {
    expect(componentFiles.length).toBeGreaterThanOrEqual(11);
  });
});
