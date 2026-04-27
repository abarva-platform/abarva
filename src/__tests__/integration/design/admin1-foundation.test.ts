import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ADMIN_LAYOUT,
  BANNED_TOKENS,
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '@/lib/design/design-tokens';

describe('ADMIN1 — Foundation: Logo + Tokens', () => {
  describe('design tokens', () => {
    it('exports canonical color palette', () => {
      expect(COLORS.ink).toBe('#070707');
      expect(COLORS.navy).toBe('#0b4a91');
      expect(COLORS.cream).toBe('#FBFAF7');
    });

    it('exports soft status fills', () => {
      expect(COLORS.mintSoft).toBeDefined();
      expect(COLORS.amberSoft).toBeDefined();
      expect(COLORS.coralSoft).toBeDefined();
    });

    it('serif typography stack starts with Cormorant Garamond', () => {
      expect(TYPOGRAPHY.serif).toContain('Cormorant Garamond');
      expect(TYPOGRAPHY.serif).toContain('Georgia');
    });

    it('sans typography stack includes DM Sans', () => {
      expect(TYPOGRAPHY.sans).toContain('DM Sans');
    });

    it('admin layout dimensions are defined', () => {
      expect(ADMIN_LAYOUT.sidebarWidth).toBe('280px');
      expect(ADMIN_LAYOUT.agentRailWidth).toBe('320px');
      expect(ADMIN_LAYOUT.collapseBreakpoint).toBe('1280px');
    });

    it('banned tokens include teal', () => {
      expect(BANNED_TOKENS).toContain('#14B8A6');
    });

    it('banned tokens include purple drift colors', () => {
      expect(BANNED_TOKENS).toContain('#7C3AED');
    });

    it('banned tokens include magenta drift colors', () => {
      expect(BANNED_TOKENS).toContain('#D946EF');
    });

    it('spacing scale is defined', () => {
      expect(SPACING.md).toBe('16px');
      expect(SPACING.xl).toBe('32px');
    });

    it('radius scale includes pill', () => {
      expect(RADIUS.pill).toBe('999px');
    });
  });

  describe('logo asset', () => {
    it('lockup-v2 SVG exists at canonical path', () => {
      const path = resolve(process.cwd(), 'public/brand/abarva-logo-lockup-v2.svg');
      expect(existsSync(path)).toBe(true);
    });

    it('lockup-v2 SVG contains the orbital symbol', () => {
      const path = resolve(process.cwd(), 'public/brand/abarva-logo-lockup-v2.svg');
      const content = readFileSync(path, 'utf8');
      expect(content).toContain('abarva-symbol');
      expect(content).toContain('abarva-wordmark');
    });

    it('lockup-v2 SVG uses canonical ink and navy hexes', () => {
      const path = resolve(process.cwd(), 'public/brand/abarva-logo-lockup-v2.svg');
      const content = readFileSync(path, 'utf8');
      expect(content.toLowerCase()).toContain('#070707');
      expect(content.toLowerCase()).toContain('#0b4a91');
    });
  });

  describe('AbarVaLogo component', () => {
    it('source file imports design tokens', () => {
      const path = resolve(process.cwd(), 'src/components/brand/AbarVaLogo.tsx');
      const content = readFileSync(path, 'utf8');
      expect(content).toContain("from '@/lib/design/design-tokens'");
    });

    it('source file declares variant prop with wordmark and lockup', () => {
      const path = resolve(process.cwd(), 'src/components/brand/AbarVaLogo.tsx');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/variant.*['"]wordmark['"]/);
      expect(content).toMatch(/variant.*['"]lockup['"]/);
    });

    it('does not hand-code banned hex tokens', () => {
      const path = resolve(process.cwd(), 'src/components/brand/AbarVaLogo.tsx');
      const content = readFileSync(path, 'utf8').toLowerCase();
      expect(content).not.toContain('#14b8a6');
      expect(content).not.toContain('#7c3aed');
    });
  });

  describe('layout font integration', () => {
    it('app layout imports Cormorant_Garamond from next/font/google', () => {
      const path = resolve(process.cwd(), 'src/app/layout.tsx');
      const content = readFileSync(path, 'utf8');
      expect(content).toContain('Cormorant_Garamond');
      expect(content).toContain("from 'next/font/google'");
    });
  });
});
