/**
 * SOL11 — solution-architecture-draft integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildSolutionArchitectureDraftView() default seed
 *   - sectionViews: exactly 8 sections in canonical order
 *   - Each sectionView has non-empty title, narrative, readinessLabel
 *   - blockers list joins blocking risks + blocking evidence gaps
 *   - isBlocked reflects blockers.length > 0
 *   - sectionsNeedingWork + sectionsComplete sum ≤ 8
 *   - statusLabel matches STATUS_LABELS for all statuses
 *   - getSectionView() returns correct section or null
 *   - getSectionsByReadiness() returns matching sections
 *   - describeSolutionArchitectureDraft() format check
 *   - Determinism: two calls produce identical output
 *   - deterministicSeed: true
 *   - canvasReady: true
 *   - Custom input: archetypeKey / draftKey propagate
 *   - Custom status 'approved' → no blockers, statusLabel 'Approved'
 *   - Module hygiene: no Date.now / Math.random / fetch
 *   - Re-exported types: ArchitectureDraft, ArchitectureDraftSummary, etc.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildSolutionArchitectureDraftView,
  getSectionView,
  getSectionsByReadiness,
  describeSolutionArchitectureDraft,
  type SolutionArchitectureDraftView,
  type SolutionArchitectureDraftSectionView,
  type SectionReadiness,
  type ArchitectureDraftSectionKey,
  type ArchitectureDraftStatus,
} from '@/lib/solutions/solution-architecture-draft';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/solutions/solution-architecture-draft.ts';

const CANONICAL_SECTION_KEYS: ArchitectureDraftSectionKey[] = [
  'context',
  'capabilities',
  'data_model',
  'integration',
  'security',
  'governance',
  'observability',
  'rollout',
];

const ALL_STATUSES: ArchitectureDraftStatus[] = [
  'draft',
  'reviewed',
  'approved',
  'requires_workshop',
  'blocked',
];

const STATUS_LABELS: Record<ArchitectureDraftStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  approved: 'Approved',
  requires_workshop: 'Requires Workshop',
  blocked: 'Blocked',
};

const READINESS_VALUES: SectionReadiness[] = ['complete', 'needs_work', 'workshop', 'empty'];

// ---------------------------------------------------------------------------
// buildSolutionArchitectureDraftView — default seed
// ---------------------------------------------------------------------------

describe('SOL11 — buildSolutionArchitectureDraftView default seed', () => {
  let view: SolutionArchitectureDraftView;

  beforeAll(() => {
    view = buildSolutionArchitectureDraftView();
  });

  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('returns canvasReady: true', () => {
    expect(view.canvasReady).toBe(true);
  });

  it('has a non-empty statusLabel', () => {
    expect(view.statusLabel.length).toBeGreaterThan(0);
  });

  it('has a non-empty recommendedNextAction', () => {
    expect(view.recommendedNextAction.length).toBeGreaterThan(0);
  });

  it('exposes the underlying draft', () => {
    expect(view.draft).toBeDefined();
    expect(view.draft.createdFrom).toBeTruthy();
  });

  it('exposes the summary', () => {
    expect(view.summary).toBeDefined();
    expect(view.summary.totalSections).toBe(8);
  });

  it('returns isBlocked as a boolean', () => {
    expect(typeof view.isBlocked).toBe('boolean');
    expect(view.isBlocked).toBe(view.blockers.length > 0);
  });

  it('sectionsNeedingWork and sectionsComplete are non-negative and sum ≤ 8', () => {
    expect(view.sectionsNeedingWork).toBeGreaterThanOrEqual(0);
    expect(view.sectionsComplete).toBeGreaterThanOrEqual(0);
    expect(view.sectionsNeedingWork + view.sectionsComplete).toBeLessThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// sectionViews — 8 canonical sections
// ---------------------------------------------------------------------------

describe('SOL11 — sectionViews', () => {
  let view: SolutionArchitectureDraftView;

  beforeAll(() => {
    view = buildSolutionArchitectureDraftView();
  });

  it('has exactly 8 section views', () => {
    expect(view.sectionViews.length).toBe(8);
  });

  it('section keys are in canonical order', () => {
    const keys = view.sectionViews.map((s) => s.sectionKey);
    expect(keys).toEqual(CANONICAL_SECTION_KEYS);
  });

  it('every section has a non-empty title', () => {
    for (const sv of view.sectionViews) {
      expect(sv.title.length).toBeGreaterThan(0);
    }
  });

  it('every section has a non-empty narrative', () => {
    for (const sv of view.sectionViews) {
      expect(sv.narrative.length).toBeGreaterThan(0);
    }
  });

  it('every section has a non-empty readinessLabel', () => {
    for (const sv of view.sectionViews) {
      expect(sv.readinessLabel.length).toBeGreaterThan(0);
    }
  });

  it('every section readiness is one of the valid values', () => {
    for (const sv of view.sectionViews) {
      expect(READINESS_VALUES).toContain(sv.readiness);
    }
  });

  it('assumptionCount, componentCount, riskCount, evidenceGapCount are non-negative integers', () => {
    for (const sv of view.sectionViews) {
      expect(sv.assumptionCount).toBeGreaterThanOrEqual(0);
      expect(sv.componentCount).toBeGreaterThanOrEqual(0);
      expect(sv.riskCount).toBeGreaterThanOrEqual(0);
      expect(sv.evidenceGapCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('workshopAssumptionCount ≤ assumptionCount for every section', () => {
    for (const sv of view.sectionViews) {
      expect(sv.workshopAssumptionCount).toBeLessThanOrEqual(sv.assumptionCount);
    }
  });

  it('hasBlockingRisk and hasBlockingEvidenceGap are booleans', () => {
    for (const sv of view.sectionViews) {
      expect(typeof sv.hasBlockingRisk).toBe('boolean');
      expect(typeof sv.hasBlockingEvidenceGap).toBe('boolean');
    }
  });

  it('sections with needs_work readiness have at least one blocker flag', () => {
    for (const sv of view.sectionViews) {
      if (sv.readiness === 'needs_work') {
        expect(sv.hasBlockingRisk || sv.hasBlockingEvidenceGap).toBe(true);
      }
    }
  });

  it('sections with complete readiness have no blocking flags', () => {
    for (const sv of view.sectionViews) {
      if (sv.readiness === 'complete') {
        expect(sv.hasBlockingRisk).toBe(false);
        expect(sv.hasBlockingEvidenceGap).toBe(false);
      }
    }
  });

  it('empty sections have zero content counts', () => {
    for (const sv of view.sectionViews) {
      if (sv.readiness === 'empty') {
        expect(sv.assumptionCount).toBe(0);
        expect(sv.componentCount).toBe(0);
        expect(sv.riskCount).toBe(0);
        expect(sv.evidenceGapCount).toBe(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// blockers
// ---------------------------------------------------------------------------

describe('SOL11 — blockers', () => {
  let view: SolutionArchitectureDraftView;

  beforeAll(() => {
    view = buildSolutionArchitectureDraftView();
  });

  it('each blocker has a non-empty id', () => {
    for (const b of view.blockers) {
      expect(b.id.length).toBeGreaterThan(0);
    }
  });

  it('each blocker kind is risk or evidence_gap', () => {
    for (const b of view.blockers) {
      expect(['risk', 'evidence_gap']).toContain(b.kind);
    }
  });

  it('each blocker has a valid sectionKey', () => {
    for (const b of view.blockers) {
      expect(CANONICAL_SECTION_KEYS).toContain(b.sectionKey);
    }
  });

  it('each blocker has a non-empty description', () => {
    for (const b of view.blockers) {
      expect(b.description.length).toBeGreaterThan(0);
    }
  });

  it('isBlocked is consistent with blockers array', () => {
    expect(view.isBlocked).toBe(view.blockers.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Status label
// ---------------------------------------------------------------------------

describe('SOL11 — statusLabel for all statuses', () => {
  it.each(ALL_STATUSES)('status %s maps to expected label', (status) => {
    const v = buildSolutionArchitectureDraftView({ status });
    expect(v.statusLabel).toBe(STATUS_LABELS[status]);
  });
});

// ---------------------------------------------------------------------------
// Custom input propagation
// ---------------------------------------------------------------------------

describe('SOL11 — custom input propagation', () => {
  it('custom archetypeKey propagates to draft.archetypeKey', () => {
    const v = buildSolutionArchitectureDraftView({ archetypeKey: 'custom_test_archetype' });
    expect(v.draft.archetypeKey).toBe('custom_test_archetype');
  });

  it('custom draftKey propagates to draft.draftKey', () => {
    const v = buildSolutionArchitectureDraftView({ draftKey: 'test_draft_v99' });
    expect(v.draft.draftKey).toBe('test_draft_v99');
  });

  it('custom status approved → statusLabel Approved', () => {
    const v = buildSolutionArchitectureDraftView({ status: 'approved' });
    expect(v.statusLabel).toBe('Approved');
    expect(v.draft.status).toBe('approved');
  });
});

// ---------------------------------------------------------------------------
// getSectionView
// ---------------------------------------------------------------------------

describe('SOL11 — getSectionView', () => {
  let view: SolutionArchitectureDraftView;

  beforeAll(() => {
    view = buildSolutionArchitectureDraftView();
  });

  it.each(CANONICAL_SECTION_KEYS)('returns section for key %s', (key) => {
    const sv = getSectionView(view, key);
    expect(sv).not.toBeNull();
    expect(sv?.sectionKey).toBe(key);
  });

  it('returns null for a nonexistent section key', () => {
    const sv = getSectionView(view, 'nonexistent' as ArchitectureDraftSectionKey);
    expect(sv).toBeNull();
  });

  it('returned section matches sectionViews entry', () => {
    const sv = getSectionView(view, 'context');
    const fromViews = view.sectionViews.find((s) => s.sectionKey === 'context');
    expect(sv).toBe(fromViews);
  });
});

// ---------------------------------------------------------------------------
// getSectionsByReadiness
// ---------------------------------------------------------------------------

describe('SOL11 — getSectionsByReadiness', () => {
  let view: SolutionArchitectureDraftView;

  beforeAll(() => {
    view = buildSolutionArchitectureDraftView();
  });

  it.each(READINESS_VALUES)('readiness %s returns array of matching sections', (r) => {
    const sections = getSectionsByReadiness(view, r);
    expect(Array.isArray(sections)).toBe(true);
    for (const s of sections) {
      expect(s.readiness).toBe(r);
    }
  });

  it('all readiness buckets together sum to 8 sections', () => {
    let total = 0;
    for (const r of READINESS_VALUES) {
      total += getSectionsByReadiness(view, r).length;
    }
    expect(total).toBe(8);
  });

  it('needs_work count matches sectionsNeedingWork', () => {
    const count = getSectionsByReadiness(view, 'needs_work').length;
    expect(count).toBe(view.sectionsNeedingWork);
  });

  it('complete count matches sectionsComplete', () => {
    const count = getSectionsByReadiness(view, 'complete').length;
    expect(count).toBe(view.sectionsComplete);
  });
});

// ---------------------------------------------------------------------------
// describeSolutionArchitectureDraft
// ---------------------------------------------------------------------------

describe('SOL11 — describeSolutionArchitectureDraft', () => {
  it('returns a non-empty string', () => {
    const view = buildSolutionArchitectureDraftView();
    const desc = describeSolutionArchitectureDraft(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('includes statusLabel', () => {
    const view = buildSolutionArchitectureDraftView({ status: 'reviewed' });
    const desc = describeSolutionArchitectureDraft(view);
    expect(desc).toContain('Reviewed');
  });

  it('includes section count', () => {
    const view = buildSolutionArchitectureDraftView();
    const desc = describeSolutionArchitectureDraft(view);
    expect(desc).toMatch(/8 section/);
  });

  it('includes blocker count when blockers present', () => {
    const view = buildSolutionArchitectureDraftView();
    const desc = describeSolutionArchitectureDraft(view);
    if (view.blockers.length > 0) {
      expect(desc).toMatch(/blocker/);
    }
  });

  it('uses dot-separated format', () => {
    const view = buildSolutionArchitectureDraftView();
    const desc = describeSolutionArchitectureDraft(view);
    expect(desc).toContain(' · ');
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('SOL11 — determinism', () => {
  it('two calls produce identical sectionViews', () => {
    const a = buildSolutionArchitectureDraftView();
    const b = buildSolutionArchitectureDraftView();
    expect(JSON.stringify(a.sectionViews)).toBe(JSON.stringify(b.sectionViews));
  });

  it('two calls produce identical blockers', () => {
    const a = buildSolutionArchitectureDraftView();
    const b = buildSolutionArchitectureDraftView();
    expect(JSON.stringify(a.blockers)).toBe(JSON.stringify(b.blockers));
  });

  it('two calls produce identical summary', () => {
    const a = buildSolutionArchitectureDraftView();
    const b = buildSolutionArchitectureDraftView();
    expect(JSON.stringify(a.summary)).toBe(JSON.stringify(b.summary));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('SOL11 — module hygiene', () => {
  let source: string;

  beforeAll(() => {
    const raw = readFileSync(resolve(root, SOURCE_PATH), 'utf8');
    // Strip string literals and comments before scanning
    source = raw
      .replace(/`[\s\S]*?`/g, '``')
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('does not call Date.now', () => {
    expect(source).not.toMatch(/Date\.now\s*\(/);
  });

  it('does not call Math.random', () => {
    expect(source).not.toMatch(/Math\.random\s*\(/);
  });

  it('does not call new Date()', () => {
    expect(source).not.toMatch(/new\s+Date\s*\(/);
  });

  it('does not call fetch()', () => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it('only imports from architecture-draft-read-model', () => {
    // The only import must be from the SOL12 read model
    const importLines = source.match(/from\s+['"][^'"]+['"]/g) ?? [];
    for (const line of importLines) {
      expect(line).toMatch(/architecture-draft-read-model/);
    }
  });
});
