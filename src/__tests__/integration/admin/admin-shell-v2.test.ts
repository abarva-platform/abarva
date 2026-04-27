/**
 * ADMIN2 — Admin Shell 3-Zone canonical layout
 *
 * Source-content tests guard the canonical structure: 3-zone grid, 8 sub-sections,
 * 4 agent cards, no banned tokens, no inline hex literals outside design-tokens.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', '..', '..');

const FILES = {
  shell: 'src/components/admin/AdminCanonShellV2.tsx',
  sidebar: 'src/components/admin/AdminSidebar.tsx',
  canvas: 'src/components/admin/EditorialCanvas.tsx',
  rail: 'src/components/admin/AgentRail.tsx',
  config: 'src/lib/admin/admin-shell-config.ts',
  tokens: 'src/lib/design/design-tokens.ts',
} as const;

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

import {
  ADMIN_SUB_SECTIONS,
  DEFAULT_AGENT_CARDS,
  LIVE_CAVEAT_TEXT,
  ADMIN_LAYOUT_DIMS,
  SHELL_COLORS,
} from '@/lib/admin/admin-shell-config';

describe('ADMIN2 — Admin Shell 3-Zone canonical layout', () => {
  describe('file existence', () => {
    it('AdminCanonShellV2.tsx exists', () => {
      expect(existsSync(resolve(ROOT, FILES.shell))).toBe(true);
    });

    it('AdminSidebar.tsx exists', () => {
      expect(existsSync(resolve(ROOT, FILES.sidebar))).toBe(true);
    });

    it('EditorialCanvas.tsx exists', () => {
      expect(existsSync(resolve(ROOT, FILES.canvas))).toBe(true);
    });

    it('AgentRail.tsx exists', () => {
      expect(existsSync(resolve(ROOT, FILES.rail))).toBe(true);
    });

    it('admin-shell-config.ts exists', () => {
      expect(existsSync(resolve(ROOT, FILES.config))).toBe(true);
    });

    it('design-tokens.ts exists', () => {
      expect(existsSync(resolve(ROOT, FILES.tokens))).toBe(true);
    });
  });

  describe('design-tokens.ts foundation', () => {
    const src = read(FILES.tokens);

    it('exports COLORS with ink, navy, cream', () => {
      expect(src).toContain('ink:');
      expect(src).toContain('navy:');
      expect(src).toContain('cream:');
    });

    it('exports TYPOGRAPHY with serif and sans', () => {
      expect(src).toMatch(/serif:\s*'"Cormorant Garamond"/);
      expect(src).toMatch(/sans:\s*'"DM Sans"/);
    });

    it('exports SPACING scale', () => {
      expect(src).toContain('SPACING');
      expect(src).toMatch(/xs:\s*'4px'/);
      expect(src).toMatch(/xxl:\s*'48px'/);
    });

    it('exports ADMIN_LAYOUT with canonical 280/320 widths', () => {
      expect(src).toMatch(/sidebarWidth:\s*'280px'/);
      expect(src).toMatch(/agentRailWidth:\s*'320px'/);
    });

    it('declares BANNED_TOKENS list', () => {
      expect(src).toContain('BANNED_TOKENS');
      expect(src).toContain('#14B8A6');
      expect(src).toContain('#7C3AED');
    });
  });

  describe('admin-shell-config.ts read-model', () => {
    it('ADMIN_SUB_SECTIONS has exactly 8 entries', () => {
      expect(ADMIN_SUB_SECTIONS).toHaveLength(8);
    });

    it('ADMIN_SUB_SECTIONS lists canonical ids in order', () => {
      expect(ADMIN_SUB_SECTIONS.map((s) => s.id)).toEqual([
        'overview',
        'data-trust',
        'connectors',
        'users-access',
        'agent-readiness',
        'production-readiness',
        'build-progress',
        'architecture',
      ]);
    });

    it('every sub-section has label, subtitle, href', () => {
      for (const s of ADMIN_SUB_SECTIONS) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.subtitle.length).toBeGreaterThan(0);
        expect(s.href.startsWith('/admin')).toBe(true);
      }
    });

    it('Overview href is /admin (root)', () => {
      const overview = ADMIN_SUB_SECTIONS.find((s) => s.id === 'overview');
      expect(overview?.href).toBe('/admin');
    });

    it('LIVE_CAVEAT_TEXT references Repository manifest and deterministic', () => {
      expect(LIVE_CAVEAT_TEXT).toContain('Repository manifest');
      expect(LIVE_CAVEAT_TEXT).toContain('deterministic');
    });

    it('DEFAULT_AGENT_CARDS lists Steward, Nexus, Sentinel, Atlas', () => {
      expect(DEFAULT_AGENT_CARDS.map((a) => a.id)).toEqual([
        'steward',
        'nexus',
        'sentinel',
        'atlas',
      ]);
    });

    it('every agent card has a posture', () => {
      const valid = ['BLOCKED', 'PARTIAL', 'THIN', 'READY'];
      for (const a of DEFAULT_AGENT_CARDS) {
        expect(valid).toContain(a.posture);
      }
    });

    it('ADMIN_LAYOUT_DIMS has 280px sidebar and 320px rail', () => {
      expect(ADMIN_LAYOUT_DIMS.sidebarWidth).toBe('280px');
      expect(ADMIN_LAYOUT_DIMS.agentRailWidth).toBe('320px');
    });

    it('ADMIN_LAYOUT_DIMS exposes 1280px collapse breakpoint', () => {
      expect(ADMIN_LAYOUT_DIMS.collapseBreakpoint).toBe('1280px');
    });

    it('SHELL_COLORS re-export includes ink, navy, cream', () => {
      expect(SHELL_COLORS.ink).toBeDefined();
      expect(SHELL_COLORS.navy).toBeDefined();
      expect(SHELL_COLORS.cream).toBeDefined();
    });
  });

  describe('AdminCanonShellV2 — 3-zone grid', () => {
    const src = read(FILES.shell);

    it('uses CSS grid', () => {
      expect(src).toContain("display: 'grid'");
    });

    it('grid template columns is 280px / 1fr / 320px', () => {
      expect(src).toContain("gridTemplateColumns: '280px 1fr 320px'");
    });

    it('marks itself with data-admin-shell=canon-v2', () => {
      expect(src).toContain('data-admin-shell="canon-v2"');
    });

    it('renders AdminSidebar', () => {
      expect(src).toContain('<AdminSidebar />');
    });

    it('imports COLORS from design-tokens', () => {
      expect(src).toContain("from '@/lib/design/design-tokens'");
    });

    it('accepts agentRail prop slot', () => {
      expect(src).toContain('agentRail');
    });
  });

  describe('AdminSidebar — 8 items + caveat', () => {
    const src = read(FILES.sidebar);

    it("declares 'use client' for usePathname", () => {
      expect(src.startsWith("'use client'")).toBe(true);
    });

    it('imports usePathname from next/navigation', () => {
      expect(src).toContain("from 'next/navigation'");
      expect(src).toContain('usePathname');
    });

    it('uses next/link Link component', () => {
      expect(src).toContain("from 'next/link'");
    });

    it('renders ADMIN_SUB_SECTIONS map', () => {
      expect(src).toContain('ADMIN_SUB_SECTIONS.map');
    });

    it('uses LIVE_CAVEAT_TEXT for the caveat pill', () => {
      expect(src).toContain('LIVE_CAVEAT_TEXT');
    });

    it('contains Live caveat wording', () => {
      expect(src).toContain('Live caveat');
    });

    it('sets aria-current=page for active route', () => {
      expect(src).toContain("aria-current={isActive ? 'page' : undefined}");
    });
  });

  describe('EditorialCanvas — eyebrow / title / subtitle / children', () => {
    const src = read(FILES.canvas);

    it('exports EditorialCanvasProps with eyebrow', () => {
      expect(src).toContain('eyebrow: string');
    });

    it('exports EditorialCanvasProps with title', () => {
      expect(src).toContain('title: string');
    });

    it('exports EditorialCanvasProps with optional subtitle', () => {
      expect(src).toContain('subtitle?: string');
    });

    it('accepts children: ReactNode', () => {
      expect(src).toContain('children: ReactNode');
    });

    it('renders title with serif typography token', () => {
      expect(src).toContain('TYPOGRAPHY.serif');
    });

    it('renders eyebrow with navy color token', () => {
      expect(src).toContain('COLORS.navy');
    });
  });

  describe('AgentRail — primary + 4 cards + choices', () => {
    const src = read(FILES.rail);

    it('declares primaryAgentLabel prop', () => {
      expect(src).toContain('primaryAgentLabel');
    });

    it('declares primaryActionLabel prop', () => {
      expect(src).toContain('primaryActionLabel');
    });

    it('declares primaryActionHref prop', () => {
      expect(src).toContain('primaryActionHref');
    });

    it('defaults agents to DEFAULT_AGENT_CARDS', () => {
      expect(src).toContain('DEFAULT_AGENT_CARDS');
    });

    it('maps posture → coral / amber / mint soft', () => {
      expect(src).toContain('coralSoft');
      expect(src).toContain('amberSoft');
      expect(src).toContain('mintSoft');
    });

    it('renders choices as pill buttons', () => {
      expect(src).toContain('choices.length');
    });

    it('uses navy as primary action background', () => {
      expect(src).toMatch(/background:\s*COLORS\.navy/);
    });
  });

  describe('Token discipline — no banned literals', () => {
    const checked = [FILES.shell, FILES.sidebar, FILES.canvas, FILES.rail, FILES.config];

    it('no teal/cyan banned hex in shell sources', () => {
      for (const f of checked) {
        const src = read(f);
        expect(src).not.toMatch(/#14B8A6/i);
        expect(src).not.toMatch(/#0E9F8C/i);
        expect(src).not.toMatch(/#0D9488/i);
        expect(src).not.toMatch(/#06B6D4/i);
      }
    });

    it('no purple/magenta banned hex in shell sources', () => {
      for (const f of checked) {
        const src = read(f);
        expect(src).not.toMatch(/#7C3AED/i);
        expect(src).not.toMatch(/#A855F7/i);
        expect(src).not.toMatch(/#9333EA/i);
        expect(src).not.toMatch(/#D946EF/i);
        expect(src).not.toMatch(/#EC4899/i);
      }
    });

    it('no sparkle / Sanskrit / Om motifs in shell sources', () => {
      for (const f of checked) {
        const src = read(f);
        expect(src).not.toContain('sparkle');
        expect(src).not.toContain('✨');
        expect(src).not.toContain('ॐ');
        expect(src).not.toContain('Sanskrit');
      }
    });

    it('shell components import only token-driven colors (no inline hex)', () => {
      // hex literals only allowed in design-tokens.ts
      const componentFiles = [FILES.shell, FILES.sidebar, FILES.canvas, FILES.rail];
      const hexRegex = /#[0-9A-Fa-f]{3,8}\b/;
      for (const f of componentFiles) {
        const src = read(f);
        expect(src).not.toMatch(hexRegex);
      }
    });

    it('shell config does not introduce inline hex outside token re-exports', () => {
      const src = read(FILES.config);
      const hexRegex = /#[0-9A-Fa-f]{3,8}\b/;
      expect(src).not.toMatch(hexRegex);
    });

    it('every component imports from design-tokens path', () => {
      const componentFiles = [FILES.shell, FILES.sidebar, FILES.canvas, FILES.rail];
      for (const f of componentFiles) {
        const src = read(f);
        expect(src).toContain("@/lib/design/design-tokens");
      }
    });
  });
});
