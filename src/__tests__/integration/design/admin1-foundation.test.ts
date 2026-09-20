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
import { FONT } from '@/lib/design/abarva-theme';
import { CANONICAL_LOGO_COMPONENT } from '@/lib/qa/logo-usage-enforcement';

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
    it('Option 2 standard SVG exists at canonical path', () => {
      const path = resolve(process.cwd(), 'public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-standard.svg');
      expect(existsSync(path)).toBe(true);
    });

    it('canonical standard SVG contains the selected Option 2 brand identity', () => {
      const path = resolve(process.cwd(), 'public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-standard.svg');
      const content = readFileSync(path, 'utf8');
      expect(content).toContain('AbarVa logo, pronounced Abar-va');
      expect(content).toContain('#22AEEA');
      expect(content).toContain('data:image/png;base64');
    });

    it('canonical standard SVG uses the Option 2 black and blue palette', () => {
      const path = resolve(process.cwd(), 'public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-standard.svg');
      const content = readFileSync(path, 'utf8');
      expect(content.toLowerCase()).toContain('#050505');
      expect(content.toLowerCase()).toContain('#22aeea');
    });
  });

  describe('AbarVaLogo component', () => {
    it('source file imports design tokens', () => {
      const path = resolve(process.cwd(), CANONICAL_LOGO_COMPONENT);
      const content = readFileSync(path, 'utf8');
      expect(content).toContain("from '@/lib/design/design-tokens'");
    });

    it('source file declares variant prop with wordmark and lockup', () => {
      const path = resolve(process.cwd(), CANONICAL_LOGO_COMPONENT);
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/variant.*['"]wordmark['"]/);
      expect(content).toMatch(/variant.*['"]lockup['"]/);
    });

    it('does not hand-code banned hex tokens', () => {
      const path = resolve(process.cwd(), CANONICAL_LOGO_COMPONENT);
      const content = readFileSync(path, 'utf8').toLowerCase();
      expect(content).not.toContain('#14b8a6');
      expect(content).not.toContain('#7c3aed');
    });
  });

  describe('layout font integration', () => {
    // The retired assertion required src/app/layout.tsx to import
    // Cormorant_Garamond from next/font/google. Two deliberate changes moved
    // it: the v3 canon replaced Cormorant with Fraunces, and font loading
    // moved out of the layout module into CSS custom properties in
    // globals.css, which imports no next/font at all. The case was therefore
    // failing on a font that had been superseded *and* on a mechanism that no
    // longer exists. Naming the replacement face would repeat the mistake, so
    // the family is read from the theme — the module product code consults —
    // and the assertion is that the stylesheet actually declares it.
    it('the global stylesheet declares the display face the theme names', () => {
      const primaryFamily = FONT.display.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      expect(primaryFamily.length).toBeGreaterThan(0);
      const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
      expect({ primaryFamily, declared: css.includes(primaryFamily) }).toEqual({
        primaryFamily,
        declared: true,
      });
    });
  });
});
