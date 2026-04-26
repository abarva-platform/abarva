/**
 * SHELL1 · Canonical AbarVa App Shell integration tests.
 *
 * Pure TypeScript + fs scanning — no jsdom, no React rendering.
 * Validates that the canonical shell configuration values and file
 * shapes are correct and contain no banned design tokens.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ABARVA_SHELL_CONFIG, getNavItemsForRole } from '../../../lib/design/abarva-shell';

const ROOT = path.resolve(__dirname, '../../../../');
const SRC = path.join(ROOT, 'src');

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf8');
}

describe('ABARVA_SHELL_CONFIG values', () => {
  it('wordmarkBoldPart is Abar', () => {
    expect(ABARVA_SHELL_CONFIG.wordmarkBoldPart).toBe('Abar');
  });

  it('wordmarkAccentPart is Va', () => {
    expect(ABARVA_SHELL_CONFIG.wordmarkAccentPart).toBe('Va');
  });

  it('accentColor is #1B2B5C', () => {
    expect(ABARVA_SHELL_CONFIG.accentColor).toBe('#1B2B5C');
  });

  it('navItems includes programs surface', () => {
    const surfaces = ABARVA_SHELL_CONFIG.navItems.map(i => i.surface);
    expect(surfaces).toContain('programs');
  });

  it('navItems includes source surface', () => {
    const surfaces = ABARVA_SHELL_CONFIG.navItems.map(i => i.surface);
    expect(surfaces).toContain('source');
  });

  it('navItems includes intelligence surface', () => {
    const surfaces = ABARVA_SHELL_CONFIG.navItems.map(i => i.surface);
    expect(surfaces).toContain('intelligence');
  });

  it('navItems includes control_tower surface', () => {
    const surfaces = ABARVA_SHELL_CONFIG.navItems.map(i => i.surface);
    expect(surfaces).toContain('control_tower');
  });

  it('bannedTokens includes #14B8A6', () => {
    expect(ABARVA_SHELL_CONFIG.bannedTokens).toContain('#14B8A6');
  });

  it('bannedTokens includes teal', () => {
    expect(ABARVA_SHELL_CONFIG.bannedTokens).toContain('teal');
  });
});

describe('getNavItemsForRole', () => {
  it('non-admin role does not include admin-only items', () => {
    const items = getNavItemsForRole(false);
    const adminOnly = ABARVA_SHELL_CONFIG.navItems
      .filter(i => i.isAdminOnly)
      .map(i => i.surface);
    const returnedSurfaces = items.map(i => i.surface);
    for (const surface of adminOnly) {
      expect(returnedSurfaces).not.toContain(surface);
    }
  });

  it('admin role includes all items', () => {
    const items = getNavItemsForRole(true);
    expect(items.length).toBe(ABARVA_SHELL_CONFIG.navItems.length);
  });
});

describe('SHELL1 file existence', () => {
  it('AbarVaAppShell.tsx exists', () => {
    const exists = fs.existsSync(path.join(SRC, 'components/abarva/AbarVaAppShell.tsx'));
    expect(exists).toBe(true);
  });

  it('AbarVaTenantBadge.tsx exists', () => {
    const exists = fs.existsSync(path.join(SRC, 'components/abarva/AbarVaTenantBadge.tsx'));
    expect(exists).toBe(true);
  });

  it('AbarVaWordmark.tsx exists', () => {
    const exists = fs.existsSync(path.join(SRC, 'components/abarva/AbarVaWordmark.tsx'));
    expect(exists).toBe(true);
  });

  it('abarva-shell.ts contains ABARVA_SHELL_CONFIG', () => {
    const content = readSrc('lib/design/abarva-shell.ts');
    expect(content).toContain('ABARVA_SHELL_CONFIG');
  });
});

describe('SHELL1 banned token hygiene in AbarVaAppShell.tsx', () => {
  let appShellContent: string;

  beforeAll(() => {
    appShellContent = readSrc('components/abarva/AbarVaAppShell.tsx');
  });

  it('AbarVaAppShell.tsx does NOT contain #14B8A6', () => {
    expect(appShellContent).not.toContain('#14B8A6');
  });

  it('AbarVaAppShell.tsx does NOT contain teal', () => {
    expect(appShellContent.toLowerCase()).not.toContain('teal');
  });
});
