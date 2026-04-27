/**
 * DES9 · App Shell Brand Lock integration tests.
 *
 * Pure TypeScript + fs scanning — no jsdom, no React rendering.
 * Validates that AbarVaAppShell is wired to AbarVaLogo (BRAND1),
 * that the BRAND1 stub/barrel exists, and that no banned tokens
 * are present in the shell.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../../../');
const SRC = path.join(ROOT, 'src');

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf8');
}

function existsSrc(rel: string): boolean {
  return fs.existsSync(path.join(SRC, rel));
}

describe('DES9 · AbarVaAppShell file presence', () => {
  it('AbarVaAppShell.tsx exists', () => {
    expect(existsSrc('components/abarva/AbarVaAppShell.tsx')).toBe(true);
  });
});

describe('DES9 · AbarVaAppShell logo import', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('components/abarva/AbarVaAppShell.tsx');
  });

  it('AbarVaAppShell.tsx contains AbarVaLogo import', () => {
    expect(content).toContain('AbarVaLogo');
  });

  it('AbarVaAppShell.tsx imports from @/components/brand or /brand/AbarVaLogo', () => {
    const hasBrandImport =
      content.includes('@/components/brand/AbarVaLogo') ||
      content.includes('/brand/AbarVaLogo');
    expect(hasBrandImport).toBe(true);
  });
});

describe('DES9 · AbarVaAppShell banned token hygiene', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('components/abarva/AbarVaAppShell.tsx');
  });

  it('AbarVaAppShell.tsx does NOT contain #14B8A6', () => {
    expect(content).not.toContain('#14B8A6');
  });
});

describe('DES9 · AbarVaAppShell canonical nav surface list', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('components/abarva/AbarVaAppShell.tsx');
  });

  it('AbarVaAppShell.tsx references ABARVA_SHELL_CONFIG (which contains programs, source, etc.)', () => {
    expect(content).toContain('ABARVA_SHELL_CONFIG');
  });

  it('nav surface list includes programs via ABARVA_SHELL_CONFIG', () => {
    // Verified via abarva-shell.ts which is used in AbarVaAppShell;
    // the shell config contains all canonical surfaces.
    const shellConfig = readSrc('lib/design/abarva-shell.ts');
    expect(shellConfig).toContain("'programs'");
    expect(shellConfig).toContain("'source'");
    expect(shellConfig).toContain("'intelligence'");
    expect(shellConfig).toContain("'control_tower'");
  });
});

describe('DES9 · BRAND1 stub file presence', () => {
  it('src/components/brand/AbarVaLogo.tsx exists', () => {
    expect(existsSrc('components/brand/AbarVaLogo.tsx')).toBe(true);
  });

  it('src/components/brand/index.ts exists', () => {
    expect(existsSrc('components/brand/index.ts')).toBe(true);
  });

  it('AbarVaLogo.tsx contains BRAND1 stub annotation', () => {
    const content = readSrc('components/brand/AbarVaLogo.tsx');
    expect(content).toContain('BRAND1');
  });

  it('AbarVaLogo.tsx exports AbarVaLogo', () => {
    const content = readSrc('components/brand/AbarVaLogo.tsx');
    expect(content).toContain('export function AbarVaLogo');
  });

  it('brand/index.ts re-exports AbarVaLogo', () => {
    const content = readSrc('components/brand/index.ts');
    expect(content).toContain('AbarVaLogo');
  });
});
