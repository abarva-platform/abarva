/**
 * DES9 · App Shell Brand Lock integration tests.
 *
 * Pure TypeScript + fs scanning — no jsdom, no React rendering.
 * Validates that AbarVaAppShell is wired to the canonical AbarVaLogo, and
 * that no banned tokens are present in the shell.
 *
 * The canonical component is read from src/lib/qa/logo-usage-enforcement.ts,
 * the module that enforces logo usage across the app, rather than pinned as a
 * literal here. That matters: this suite used to assert the component at
 * src/components/brand/AbarVaLogo.tsx, which product code does not declare
 * canonical and which no product module imports.
 */

import * as fs from 'fs';
import * as path from 'path';

import { CANONICAL_LOGO_COMPONENT } from '@/lib/qa/logo-usage-enforcement';

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

  it('AbarVaAppShell.tsx imports the canonical AbarVaLogo module', () => {
    const canonicalImport = CANONICAL_LOGO_COMPONENT
      .replace(/^src\//, '@/')
      .replace(/\.tsx$/, '');
    expect({ canonicalImport, imported: content.includes(canonicalImport) }).toEqual({
      canonicalImport,
      imported: true,
    });
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

// The retired describe here asserted three things about the stub that the
// BRAND1 lane left behind: that src/components/brand/AbarVaLogo.tsx exists,
// that it still carries the literal string "BRAND1" in a comment, and that its
// barrel re-exports it. Only the comment assertion failed, because the file was
// rewritten into a real implementation and the ticket annotation went with the
// stub. The other two were worse than the failing one: they passed while
// covering a module no product code imports.
//
// What replaces them asserts the same intent — the canonical logo component is
// present and exports its component — against the module product code declares
// canonical. A ticket id in a comment is not a property of the product; whether
// the orphan copy under components/brand is retired is an owner decision and is
// recorded rather than taken here.
describe('DES9 · canonical logo component presence', () => {
  it('the canonical logo component declared by product code exists', () => {
    expect(fs.existsSync(path.join(ROOT, CANONICAL_LOGO_COMPONENT))).toBe(true);
  });

  it('the canonical logo component exports AbarVaLogo', () => {
    const content = fs.readFileSync(path.join(ROOT, CANONICAL_LOGO_COMPONENT), 'utf8');
    expect(content).toMatch(/export\s+(function|const)\s+AbarVaLogo/);
  });

  it('the canonical logo component draws its colours from the design tokens', () => {
    const content = fs.readFileSync(path.join(ROOT, CANONICAL_LOGO_COMPONENT), 'utf8');
    expect(content).toContain("from '@/lib/design/design-tokens'");
  });
});
