import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function readSource(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('ADMIN3 — Steward Editorial Component', () => {
  describe('source files exist', () => {
    it('StewardEditorial.tsx exists', () => {
      expect(existsSync(resolve(root, 'src/components/admin/StewardEditorial.tsx'))).toBe(true);
    });
    it('ContextBar.tsx exists', () => {
      expect(existsSync(resolve(root, 'src/components/admin/ContextBar.tsx'))).toBe(true);
    });
    it('EvidenceStrengthPill.tsx exists', () => {
      expect(existsSync(resolve(root, 'src/components/admin/EvidenceStrengthPill.tsx'))).toBe(true);
    });
    it('BlockerPill.tsx exists', () => {
      expect(existsSync(resolve(root, 'src/components/admin/BlockerPill.tsx'))).toBe(true);
    });
  });

  describe('design-tokens import (no hex literals)', () => {
    const files = [
      'src/components/admin/StewardEditorial.tsx',
      'src/components/admin/ContextBar.tsx',
      'src/components/admin/EvidenceStrengthPill.tsx',
      'src/components/admin/BlockerPill.tsx',
    ];
    files.forEach((f) => {
      it(`${f} imports from design-tokens`, () => {
        expect(readSource(f)).toContain("from '@/lib/design/design-tokens'");
      });
    });
  });

  describe('no banned tokens', () => {
    const banned = ['#14B8A6', '#0E9F8C', '#7C3AED', '#A855F7', '#D946EF', 'sparkle'];
    const files = [
      'src/components/admin/StewardEditorial.tsx',
      'src/components/admin/ContextBar.tsx',
      'src/components/admin/EvidenceStrengthPill.tsx',
      'src/components/admin/BlockerPill.tsx',
    ];
    files.forEach((f) => {
      banned.forEach((token) => {
        it(`${f} does not contain ${token}`, () => {
          expect(readSource(f).toLowerCase()).not.toContain(token.toLowerCase());
        });
      });
    });
  });

  describe('StewardEditorial component', () => {
    const src = () => readSource('src/components/admin/StewardEditorial.tsx');
    it('exports StewardEditorial', () => expect(src()).toContain('export function StewardEditorial'));
    it('declares title prop', () => expect(src()).toMatch(/title:\s*string/));
    it('declares body prop', () => expect(src()).toMatch(/body:\s*string/));
    it('declares contextUsed prop as ReadonlyArray<string>', () =>
      expect(src()).toMatch(/contextUsed:\s*ReadonlyArray<string>/));
    it('declares evidenceStrength prop', () => expect(src()).toMatch(/evidenceStrength:\s*EvidenceStrength/));
    it('declares optional blocker prop', () => expect(src()).toMatch(/blocker\?:\s*string/));
    it('declares primaryAction prop', () => expect(src()).toMatch(/primaryAction:\s*{\s*label:\s*string;\s*href:\s*string\s*}/));
    it('renders Context used label', () => expect(src()).toContain('Context used'));
    it('uses EvidenceStrengthPill', () => expect(src()).toContain('<EvidenceStrengthPill'));
    it('uses BlockerPill conditionally', () => expect(src()).toContain('blocker ? <BlockerPill'));
    it('uses serif typography for title', () => expect(src()).toContain('TYPOGRAPHY.serif'));
    it('does not include any chat input', () => {
      const s = src().toLowerCase();
      expect(s).not.toContain('<input');
      expect(s).not.toContain('<textarea');
    });
  });

  describe('ContextBar component', () => {
    const src = () => readSource('src/components/admin/ContextBar.tsx');
    it('exports ContextBar', () => expect(src()).toContain('export function ContextBar'));
    it('renders 5 cells: tenant, mode, agent, data, liveStatus', () => {
      expect(src()).toContain('Tenant');
      expect(src()).toContain('Mode');
      expect(src()).toContain('Agent');
      expect(src()).toContain('Data');
      expect(src()).toContain('Live status');
    });
    it('uses 5-column grid template', () =>
      expect(src()).toContain("gridTemplateColumns: 'repeat(5, 1fr)'"));
    it('declares ContextLiveStatus type with live/partial/deferred', () => {
      const s = src();
      expect(s).toContain("'live'");
      expect(s).toContain("'partial'");
      expect(s).toContain("'deferred'");
    });
  });

  describe('EvidenceStrengthPill', () => {
    const src = () => readSource('src/components/admin/EvidenceStrengthPill.tsx');
    it('exports EvidenceStrengthPill', () =>
      expect(src()).toContain('export function EvidenceStrengthPill'));
    it('declares EvidenceStrength type', () =>
      expect(src()).toContain("export type EvidenceStrength"));
    it('supports strong/partial/thin variants', () => {
      const s = src();
      expect(s).toContain("'strong'");
      expect(s).toContain("'partial'");
      expect(s).toContain("'thin'");
    });
    it('uses mintSoft for strong', () => expect(src()).toContain('mintSoft'));
    it('uses amberSoft for partial/thin', () => expect(src()).toContain('amberSoft'));
  });

  describe('BlockerPill', () => {
    const src = () => readSource('src/components/admin/BlockerPill.tsx');
    it('exports BlockerPill', () => expect(src()).toContain('export function BlockerPill'));
    it('uses coralSoft background', () => expect(src()).toContain('coralSoft'));
    it('renders Blocker: prefix', () => expect(src()).toContain('Blocker:'));
  });
});
