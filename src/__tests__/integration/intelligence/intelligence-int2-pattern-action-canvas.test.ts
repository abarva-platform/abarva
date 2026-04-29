// INT2 · Pattern Detail Action Canvas — integration tests.
//
// Verifies structural invariants added in INT2:
//   1. pattern-action-canvas-view lib is deterministic and contract-correct
//   2. IntelligencePatternDetailPage renders ActionCanvasSection with correct testids
//   3. Honest disclaimer is literal (not interpolated)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildPatternActionCanvasView,
} from '@/lib/intelligence/pattern-action-canvas-view';

const PAGE_PATH = join(
  process.cwd(),
  'src/components/intelligence/IntelligencePatternDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/intelligence/pattern-action-canvas-view.ts',
);

const pageSrc = readFileSync(PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── pattern-action-canvas-view · source audit ────────────────────────────────

describe('INT2 · pattern-action-canvas-view · source audit', () => {
  it('buildPatternActionCanvasView is exported', () => {
    expect(libSrc).toContain('export function buildPatternActionCanvasView');
  });

  it('PatternActionCanvasView interface is exported', () => {
    expect(libSrc).toContain('export interface PatternActionCanvasView');
  });

  it('PatternAction interface is exported', () => {
    expect(libSrc).toContain('export interface PatternAction');
  });

  it('ActionPriority type is exported', () => {
    expect(libSrc).toContain('export type ActionPriority');
  });

  it('ActionStatus type is exported', () => {
    expect(libSrc).toContain('export type ActionStatus');
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

  it('has entries for T3-H01, T3-H03, and T1-F02', () => {
    expect(libSrc).toContain("'T3-H01'");
    expect(libSrc).toContain("'T3-H03'");
    expect(libSrc).toContain("'T1-F02'");
  });
});

// ─── IntelligencePatternDetailPage · ActionCanvasSection probe ────────────────

describe('INT2 · IntelligencePatternDetailPage · ActionCanvasSection', () => {
  it('imports buildPatternActionCanvasView from the lib', () => {
    expect(pageSrc).toContain("from '@/lib/intelligence/pattern-action-canvas-view'");
  });

  it('defines ActionCanvasSection function', () => {
    expect(pageSrc).toContain('function ActionCanvasSection(');
  });

  it('renders ActionCanvasSection for pattern detail page', () => {
    expect(pageSrc).toContain('<ActionCanvasSection');
  });

  it('passes patternId and patternName to ActionCanvasSection', () => {
    expect(pageSrc).toContain('patternId={view.patternKey}');
    expect(pageSrc).toContain('patternName={view.patternName}');
  });

  it('has data-testid="intelligence-action-canvas"', () => {
    expect(pageSrc).toContain('data-testid="intelligence-action-canvas"');
  });

  it('has intelligence-action-canvas-item- testid prefix for action items', () => {
    expect(pageSrc).toContain('intelligence-action-canvas-item-');
  });

  it('has data-testid="intelligence-action-canvas-disclaimer"', () => {
    expect(pageSrc).toContain('data-testid="intelligence-action-canvas-disclaimer"');
  });

  it('has data-honest-disclaimer="intelligence-action-canvas"', () => {
    expect(pageSrc).toContain('data-honest-disclaimer="intelligence-action-canvas"');
  });

  it('honest disclaimer contains literal Deterministic seed', () => {
    const idx = pageSrc.indexOf('data-honest-disclaimer="intelligence-action-canvas"');
    expect(idx).toBeGreaterThan(0);
    const snippet = pageSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });

  it('does not import from src/lib/source', () => {
    expect(pageSrc).not.toMatch(/@\/lib\/source/);
  });

  it('does not call fetch or Date.now', () => {
    expect(pageSrc).not.toMatch(/\bfetch\s*\(/);
    expect(pageSrc).not.toMatch(/Date\.now\s*\(/);
  });
});

// ─── pattern-action-canvas-view · runtime contract ───────────────────────────

describe('INT2 · buildPatternActionCanvasView · runtime contract', () => {
  it('is deterministic across calls', () => {
    const a = buildPatternActionCanvasView('T3-H01', 'Ambient AI in Retail');
    const b = buildPatternActionCanvasView('T3-H01', 'Ambient AI in Retail');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('deterministicSeed is true', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    expect(view.deterministicSeed).toBe(true);
  });

  it('echoes patternId and patternName', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'Ambient AI in Retail');
    expect(view.patternId).toBe('T3-H01');
    expect(view.patternName).toBe('Ambient AI in Retail');
  });

  it('T3-H01 has actions and 3 action items', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    expect(view.hasActions).toBe(true);
    expect(view.actions).toHaveLength(3);
  });

  it('T3-H03 has actions and 3 action items', () => {
    const view = buildPatternActionCanvasView('T3-H03', 'x');
    expect(view.hasActions).toBe(true);
    expect(view.actions).toHaveLength(3);
  });

  it('T1-F02 has actions and 2 action items', () => {
    const view = buildPatternActionCanvasView('T1-F02', 'x');
    expect(view.hasActions).toBe(true);
    expect(view.actions).toHaveLength(2);
  });

  it('unknown pattern returns hasActions=false and empty actions array', () => {
    const view = buildPatternActionCanvasView('UNKNOWN-999', 'Unknown');
    expect(view.hasActions).toBe(false);
    expect(view.actions).toHaveLength(0);
  });

  it('each action has non-empty required string fields', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    for (const action of view.actions) {
      expect(action.actionId.trim().length).toBeGreaterThan(0);
      expect(action.title.trim().length).toBeGreaterThan(0);
      expect(action.description.trim().length).toBeGreaterThan(0);
      expect(action.owner.trim().length).toBeGreaterThan(0);
      expect(action.deadline.trim().length).toBeGreaterThan(0);
    }
  });

  it('each action has a valid priority', () => {
    const validPriorities = ['immediate', 'this_week', 'this_month', 'backlog'];
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    for (const action of view.actions) {
      expect(validPriorities).toContain(action.priority);
    }
  });

  it('each action has a valid status', () => {
    const validStatuses = ['open', 'in_progress', 'blocked', 'done'];
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    for (const action of view.actions) {
      expect(validStatuses).toContain(action.status);
    }
  });

  it('T3-H03 first action is blocked with a non-null blockerNote', () => {
    const view = buildPatternActionCanvasView('T3-H03', 'x');
    const blocked = view.actions.find((a) => a.status === 'blocked');
    expect(blocked).toBeDefined();
    expect(blocked!.blockerNote).not.toBeNull();
    expect(blocked!.blockerNote!.trim().length).toBeGreaterThan(0);
  });

  it('non-blocked actions have null blockerNote', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    for (const action of view.actions.filter((a) => a.status !== 'blocked')) {
      expect(action.blockerNote).toBeNull();
    }
  });

  it('T3-H03 has atlas synthesis text', () => {
    const view = buildPatternActionCanvasView('T3-H03', 'x');
    expect(view.atlasSynthesis.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('T3-H01 action ah01-a2 has this_month priority', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    const action = view.actions.find((a) => a.actionId === 'ah01-a2');
    expect(action).toBeDefined();
    expect(action!.priority).toBe('this_month');
  });

  it('T3-H01 action ah01-a3 has backlog priority', () => {
    const view = buildPatternActionCanvasView('T3-H01', 'x');
    const action = view.actions.find((a) => a.actionId === 'ah01-a3');
    expect(action).toBeDefined();
    expect(action!.priority).toBe('backlog');
  });

  it('T1-F02 first action links to AMS BAFO context', () => {
    const view = buildPatternActionCanvasView('T1-F02', 'x');
    const action = view.actions.find((a) => a.actionId === 'f02-a1');
    expect(action).toBeDefined();
    expect(action!.contextLink).not.toBeNull();
    expect(action!.contextLink).toMatch(/AMS/i);
  });
});
