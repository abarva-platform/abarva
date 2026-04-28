// INT1 · Apex Retail client-specific pattern plan in Intelligence surface.
//
// Verifies structural invariants added in INT1:
//   1. intelligence-lens-tabs-view has pattern_plan tab key
//   2. IntelligenceLensTabs renders PatternPlanPanel
//   3. PatternPlanPanel has correct testids and honest disclaimer
//   4. apex-retail-pattern-plan-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  INTELLIGENCE_TABS,
  buildIntelligenceLensTabsView,
  resolveIntelligenceTab,
} from '@/lib/intelligence/intelligence-lens-tabs-view';
import { buildApexRetailPatternPlanView } from '@/lib/intelligence/apex-retail-pattern-plan-view';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/intelligence/IntelligenceLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/intelligence/apex-retail-pattern-plan-view.ts',
);

const componentSrc = readFileSync(COMPONENT_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── intelligence-lens-tabs-view · pattern_plan tab ──────────────────────────

describe('INT1 · intelligence-lens-tabs-view · pattern_plan tab', () => {
  it("INTELLIGENCE_TABS includes 'pattern_plan' key", () => {
    const keys = INTELLIGENCE_TABS.map((t) => t.key);
    expect(keys).toContain('pattern_plan');
  });

  it("resolveIntelligenceTab accepts 'pattern_plan'", () => {
    expect(resolveIntelligenceTab('pattern_plan')).toBe('pattern_plan');
  });

  it("buildIntelligenceLensTabsView includes pattern_plan in tabs", () => {
    const view = buildIntelligenceLensTabsView('pattern_plan');
    expect(view.tabs.map((t) => t.key)).toContain('pattern_plan');
  });

  it("buildIntelligenceLensTabsView echoes pattern_plan as active tab", () => {
    const view = buildIntelligenceLensTabsView('pattern_plan');
    expect(view.activeTab).toBe('pattern_plan');
  });

  it("pattern_plan tab has non-empty label and description", () => {
    const tab = INTELLIGENCE_TABS.find((t) => t.key === 'pattern_plan');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });
});

// ─── IntelligenceLensTabs.tsx · PatternPlanPanel ─────────────────────────────

describe('INT1 · IntelligenceLensTabs · PatternPlanPanel', () => {
  it("imports buildApexRetailPatternPlanView from intelligence lib", () => {
    expect(componentSrc).toContain("from '@/lib/intelligence/apex-retail-pattern-plan-view'");
  });

  it("defines PatternPlanPanel function", () => {
    expect(componentSrc).toContain('function PatternPlanPanel()');
  });

  it("renders PatternPlanPanel for pattern_plan tab", () => {
    expect(componentSrc).toContain("{activeTab === 'pattern_plan' && (");
    expect(componentSrc).toContain('<PatternPlanPanel />');
  });

  it('has data-testid="intelligence-pattern-plan-panel"', () => {
    expect(componentSrc).toContain('data-testid="intelligence-pattern-plan-panel"');
  });

  it('has data-testid="intelligence-pattern-plan-summary"', () => {
    expect(componentSrc).toContain('data-testid="intelligence-pattern-plan-summary"');
  });

  it('has intelligence-pattern-plan-item- testid prefix for pattern items', () => {
    expect(componentSrc).toContain('intelligence-pattern-plan-item-');
  });

  it('has intelligence-pattern-plan-gaps- testid prefix for evidence gaps', () => {
    expect(componentSrc).toContain('intelligence-pattern-plan-gaps-');
  });

  it('has data-testid="intelligence-pattern-plan-disclaimer"', () => {
    expect(componentSrc).toContain('data-testid="intelligence-pattern-plan-disclaimer"');
  });

  it('has data-honest-disclaimer="intelligence-pattern-plan"', () => {
    expect(componentSrc).toContain('data-honest-disclaimer="intelligence-pattern-plan"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = componentSrc.indexOf('data-honest-disclaimer="intelligence-pattern-plan"');
    expect(idx).toBeGreaterThan(0);
    const snippet = componentSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });

  it('does not import from src/lib/source', () => {
    expect(componentSrc).not.toMatch(/@\/lib\/source/);
  });
});

// ─── apex-retail-pattern-plan-view · source audit ────────────────────────────

describe('INT1 · apex-retail-pattern-plan-view · source audit', () => {
  it('buildApexRetailPatternPlanView is exported', () => {
    expect(libSrc).toContain('export function buildApexRetailPatternPlanView');
  });

  it('ApexRetailPatternPlanView interface is exported', () => {
    expect(libSrc).toContain('export interface ApexRetailPatternPlanView');
  });

  it('AppliedPattern interface is exported', () => {
    expect(libSrc).toContain('export interface AppliedPattern');
  });

  it('PatternPlanSummary interface is exported', () => {
    expect(libSrc).toContain('export interface PatternPlanSummary');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('does NOT import from src/lib/source', () => {
    expect(libSrc).not.toMatch(/@\/lib\/source/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });
});

// ─── apex-retail-pattern-plan-view · runtime contract ────────────────────────

describe('INT1 · apex-retail-pattern-plan-view · runtime contract', () => {
  const view = buildApexRetailPatternPlanView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('headline is non-empty', () => {
    expect(view.headline.length).toBeGreaterThan(0);
  });

  it('contextLine is non-empty', () => {
    expect(view.contextLine.length).toBeGreaterThan(0);
  });

  it('patterns array is non-empty', () => {
    expect(view.patterns.length).toBeGreaterThan(0);
  });

  it('has at least one active pattern', () => {
    const active = view.patterns.filter((p) => p.applicationStatus === 'active');
    expect(active.length).toBeGreaterThan(0);
  });

  it('has at least one candidate pattern', () => {
    const candidate = view.patterns.filter((p) => p.applicationStatus === 'candidate');
    expect(candidate.length).toBeGreaterThan(0);
  });

  it('each pattern has non-empty patternId, title, and clientApplication', () => {
    view.patterns.forEach((p) => {
      expect(p.patternId.trim().length).toBeGreaterThan(0);
      expect(p.title.trim().length).toBeGreaterThan(0);
      expect(p.clientApplication.trim().length).toBeGreaterThan(0);
    });
  });

  it('summary activeCount matches patterns', () => {
    const count = view.patterns.filter((p) => p.applicationStatus === 'active').length;
    expect(view.summary.activeCount).toBe(count);
  });

  it('summary candidateCount matches patterns', () => {
    const count = view.patterns.filter((p) => p.applicationStatus === 'candidate').length;
    expect(view.summary.candidateCount).toBe(count);
  });

  it('summary patternsWithGapsCount matches patterns with evidence gaps', () => {
    const count = view.patterns.filter((p) => p.evidenceGaps.length > 0).length;
    expect(view.summary.patternsWithGapsCount).toBe(count);
  });

  it('priorityPatterns is non-empty and has 3 entries', () => {
    expect(view.priorityPatterns.length).toBe(3);
  });

  it('each priority pattern references an existing pattern', () => {
    const patternIds = new Set(view.patterns.map((p) => p.patternId));
    view.priorityPatterns.forEach((id) => {
      expect(patternIds.has(id)).toBe(true);
    });
  });

  it('atlasGuidance is non-empty', () => {
    expect(view.atlasGuidance.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildApexRetailPatternPlanView();
    const b = buildApexRetailPatternPlanView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
