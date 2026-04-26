// DES7 · App-shell navigation canon tests.
//
// Pure type/source assertions. No jsdom, no rendering — we verify the
// exported shape of AbarVaShellNav + AbarvaWordmark, and we scan the
// component source to enforce the AbarVa visual canon (no rejected
// teal, no Sanskrit symbols, no AI sparkle).

import * as fs from 'fs';
import * as path from 'path';

import { AbarvaWordmark } from '../../../components/abarva/AbarVaWordmark';
import {
  AbarVaShellNav,
  ABARVA_SHELL_SURFACES,
} from '../../../components/abarva/AbarVaShellNav';

const repoRoot = path.resolve(__dirname, '../../../../');
const shellNavPath = path.join(
  repoRoot,
  'src/components/abarva/AbarVaShellNav.tsx',
);

function readShellNavSource(): string {
  return fs.readFileSync(shellNavPath, 'utf8');
}

describe('DES7 · AbarVaWordmark export', () => {
  it('exports AbarvaWordmark as a function', () => {
    expect(typeof AbarvaWordmark).toBe('function');
  });
});

describe('DES7 · AbarVaShellNav export', () => {
  it('exports AbarVaShellNav as a function', () => {
    expect(typeof AbarVaShellNav).toBe('function');
  });
});

describe('DES7 · ABARVA_SHELL_SURFACES manifest', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(ABARVA_SHELL_SURFACES)).toBe(true);
    expect(ABARVA_SHELL_SURFACES.length).toBeGreaterThan(0);
  });

  it('contains at least 5 canonical surfaces', () => {
    expect(ABARVA_SHELL_SURFACES.length).toBeGreaterThanOrEqual(5);
  });

  it('every surface declares key, label, and href', () => {
    for (const s of ABARVA_SHELL_SURFACES) {
      expect(typeof s.key).toBe('string');
      expect(s.key.length).toBeGreaterThan(0);
      expect(typeof s.label).toBe('string');
      expect(s.label.length).toBeGreaterThan(0);
      expect(typeof s.href).toBe('string');
      expect(s.href.startsWith('/')).toBe(true);
    }
  });

  it('most surfaces include a workflowQuestion (>= 4)', () => {
    const withQuestion = ABARVA_SHELL_SURFACES.filter(
      (s) => typeof s.workflowQuestion === 'string' && s.workflowQuestion.length > 0,
    );
    expect(withQuestion.length).toBeGreaterThanOrEqual(4);
  });

  it('surface keys include the canonical core set', () => {
    const keys = ABARVA_SHELL_SURFACES.map((s) => s.key);
    expect(keys).toEqual(expect.arrayContaining([
      'home',
      'programs',
      'source',
      'intelligence',
      'admin',
    ]));
  });
});

describe('DES7 · AbarVaShellNav source canon', () => {
  it('does NOT contain the rejected teal hex #14B8A6', () => {
    const content = readShellNavSource();
    expect(content).not.toMatch(/#14B8A6/i);
  });

  it('does NOT contain Sanskrit-block characters', () => {
    const content = readShellNavSource();
    expect(content).not.toMatch(/[ऀ-ॿ]/);
  });

  it('does NOT contain a sparkle glyph or the word "sparkle"', () => {
    const content = readShellNavSource();
    expect(content).not.toMatch(/✨/); // ✨
    expect(content.toLowerCase()).not.toContain('sparkle');
  });

  it('contains the canonical NAVY accent #1B2B5C', () => {
    const content = readShellNavSource();
    expect(content).toContain('#1B2B5C');
  });

  it('contains the canonical warm off-white surface #FBFAF7', () => {
    const content = readShellNavSource();
    expect(content).toContain('#FBFAF7');
  });

  it('uses canonical AbarVa values — either via theme import or inline hex', () => {
    const content = readShellNavSource();
    const importsTheme = /from\s+['"]@\/lib\/design\/abarva-theme['"]/.test(
      content,
    );
    const inlinesNavy = content.includes('#1B2B5C');
    const inlinesSurface = content.includes('#FBFAF7');
    expect(importsTheme || (inlinesNavy && inlinesSurface)).toBe(true);
  });
});
