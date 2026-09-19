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
    // 2026-09-19 (T-032) - e49e6d5f2 ("hide internal provenance chips", #2653)
    // deliberately removed the visible "Context used" row. The prop survived
    // the removal and is now declared but never destructured, which is a
    // separate finding recorded in the backlog, not something to assert here.
    // What the case can still hold is that the component does not quietly grow
    // a provenance chip back without the decision being revisited.
    it('does not render an internal provenance chip', () =>
      expect(src()).not.toContain('Context used'));
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
    // 2026-09-19 (T-032) - the bar was reduced from five cells to three and
    // relabelled in the same pass that hid the provenance chips: Tenant became
    // Client, Data became Evidence source, Live status became Status, and Mode
    // and Agent were dropped as builder vocabulary on a surface a Maestro
    // reads. Both of these cases locked the retired five. The cell count and
    // the grid have to agree with each other, so that is what is asserted -
    // a fourth cell added without widening the grid fails.
    it('renders the three client-facing cells: client, evidence source, status', () => {
      expect(src()).toContain("label: 'Client'");
      expect(src()).toContain("label: 'Evidence source'");
      expect(src()).toContain("label: 'Status'");
      expect(src()).not.toContain("label: 'Mode'");
      expect(src()).not.toContain("label: 'Agent'");
    });
    it('uses a grid whose column count matches the number of cells', () =>
      expect(src()).toContain("gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'"));
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
