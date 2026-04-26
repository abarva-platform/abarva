/**
 * QA24: Wave-17 Design + Workflow Canon Regression Tests
 *
 * Suite A: Static manifest (always pass in any worktree).
 * Suite B: Banned token scan across Wave-17 component files (graceful skip).
 * Suite C: Required canon presence across Wave-17 component files (graceful skip).
 * Suite D: Target page existence — Wave-15/16 routes must always exist.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import {
  BANNED_TOKENS,
  REQUIRED_CANON,
  WORKFLOW_CONTRACT,
  TARGET_PAGES,
  buildDesignWorkflowCanonReport,
} from '../../../lib/qa/design-workflow-canon-regression';

const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '../../../../');

const wave17Files = [
  'src/components/abarva/AbarVaShellNav.tsx',
  'src/components/admin/AdminCanonShell.tsx',
  'src/components/admin/ArchitectureCanvas.tsx',
  'src/components/admin/ProductionReadinessDecisionFlow.tsx',
  'src/components/source/SourceCommercialWorkflowCanvas.tsx',
];

const criticalBannedHexes = [
  '#14B8A6',
  '#0E9F8C',
  '#0D9488',
  '#39FF14',
  '#00FFFF',
];

describe('QA24 — Design + Workflow Canon Regression — Suite A: static manifest', () => {
  it('BANNED_TOKENS has at least 10 entries', () => {
    expect(BANNED_TOKENS.length).toBeGreaterThanOrEqual(10);
  });

  it('all banned tokens have unique ruleId', () => {
    const ids = BANNED_TOKENS.map((t) => t.ruleId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("REQUIRED_CANON includes navy accent '#1B2B5C'", () => {
    const navy = REQUIRED_CANON.find((r) => r.pattern === '#1B2B5C');
    expect(navy).toBeDefined();
  });

  it("REQUIRED_CANON includes warm off-white '#FBFAF7'", () => {
    const offwhite = REQUIRED_CANON.find((r) => r.pattern === '#FBFAF7');
    expect(offwhite).toBeDefined();
  });

  it('WORKFLOW_CONTRACT has at least 8 entries', () => {
    expect(WORKFLOW_CONTRACT.length).toBeGreaterThanOrEqual(8);
  });

  it('TARGET_PAGES has exactly 4 items', () => {
    expect(TARGET_PAGES).toHaveLength(4);
  });

  it("all target pages have primaryAgent in ['nexus','sentinel','atlas','steward']", () => {
    const valid = ['nexus', 'sentinel', 'atlas', 'steward'];
    for (const page of TARGET_PAGES) {
      expect(valid).toContain(page.primaryAgent);
    }
  });

  it("buildDesignWorkflowCanonReport() returns generatedAt === '2026-04-26'", () => {
    const report = buildDesignWorkflowCanonReport();
    expect(report.generatedAt).toBe('2026-04-26');
  });

  it('report.bannedTokens.length matches BANNED_TOKENS.length', () => {
    const report = buildDesignWorkflowCanonReport();
    expect(report.bannedTokens.length).toBe(BANNED_TOKENS.length);
  });

  it('report.targetPages.length === 4', () => {
    const report = buildDesignWorkflowCanonReport();
    expect(report.targetPages).toHaveLength(4);
  });

  it("BANNED_TOKENS includes a sparkle rule ('sparkle' or '✨')", () => {
    const found = BANNED_TOKENS.some(
      (t) =>
        (typeof t.pattern === 'string' &&
          (t.pattern === '✨' || t.pattern.toLowerCase().includes('sparkle'))) ||
        (t.pattern instanceof RegExp &&
          (t.pattern.source.includes('sparkle') ||
            t.pattern.source.includes('✨')))
    );
    expect(found).toBe(true);
  });

  it('BANNED_TOKENS includes the Sanskrit Unicode block rule', () => {
    const found = BANNED_TOKENS.some(
      (t) => t.pattern instanceof RegExp && t.pattern.test('क')
    );
    expect(found).toBe(true);
  });

  it("WORKFLOW_CONTRACT includes a 'deterministic' caveat rule", () => {
    const found = WORKFLOW_CONTRACT.some(
      (w) => w.requiredKeyword === 'deterministic'
    );
    expect(found).toBe(true);
  });
});

describe('QA24 — Suite B: Wave-17 banned-token scan (graceful skip)', () => {
  wave17Files.forEach((filePath) => {
    it(`${filePath} contains no critical banned tokens`, () => {
      const fullPath = path.join(repoRoot, filePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[QA24] Skip ${filePath} (run in integration branch)`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      criticalBannedHexes.forEach((hex) => {
        expect(content).not.toContain(hex);
      });
    });
  });
});

describe('QA24 — Suite C: Wave-17 required canon presence (graceful skip)', () => {
  wave17Files.forEach((filePath) => {
    it(`${filePath} references navy accent or abarva-theme`, () => {
      const fullPath = path.join(repoRoot, filePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[QA24] Skip ${filePath} (run in integration branch)`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasNavy = content.includes('#1B2B5C');
      const hasTheme = content.includes('abarva-theme');
      expect(hasNavy || hasTheme).toBe(true);
    });

    it(`${filePath} references warm off-white surface or abarva-theme`, () => {
      const fullPath = path.join(repoRoot, filePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[QA24] Skip ${filePath} (run in integration branch)`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasOffWhite = content.includes('#FBFAF7');
      const hasTheme = content.includes('abarva-theme');
      expect(hasOffWhite || hasTheme).toBe(true);
    });
  });
});

describe('QA24 — Suite D: target page existence (Wave-15/16 routes)', () => {
  TARGET_PAGES.forEach((page) => {
    it(`Target page exists: ${page.routePath}`, () => {
      const fullPath = path.join(repoRoot, page.filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});
