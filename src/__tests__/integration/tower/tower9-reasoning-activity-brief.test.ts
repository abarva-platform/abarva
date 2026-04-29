// TOWER9 · Reasoning Activity Brief Lens — integration tests.
//
// Verifies structural invariants added in TOWER9:
//   1. reasoning-activity-brief-view lib is deterministic and contract-correct
//   2. tower-lens-tabs-view has reasoning_activity tab key (9th tab)
//   3. TowerLensTabs renders ReasoningActivityBriefPanel with correct testids
//   4. Honest disclaimer is literal (not interpolated)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
} from '@/lib/tower/tower-lens-tabs-view';
import {
  buildReasoningActivityBriefView,
} from '@/lib/tower/reasoning-activity-brief-view';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/tower/TowerLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/tower/reasoning-activity-brief-view.ts',
);

const componentSrc = readFileSync(COMPONENT_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── tower-lens-tabs-view · reasoning_activity tab ───────────────────────────

describe('TOWER9 · tower-lens-tabs-view · reasoning_activity tab', () => {
  it("TOWER_TABS includes 'reasoning_activity' key", () => {
    const keys = TOWER_TABS.map((t) => t.key);
    expect(keys).toContain('reasoning_activity');
  });

  it('TOWER_TABS has exactly nine tabs', () => {
    expect(TOWER_TABS).toHaveLength(9);
  });

  it("resolveTowerTab accepts 'reasoning_activity'", () => {
    expect(resolveTowerTab('reasoning_activity')).toBe('reasoning_activity');
  });

  it("buildTowerLensTabsView includes reasoning_activity in tabs", () => {
    const view = buildTowerLensTabsView('reasoning_activity');
    expect(view.tabs.map((t) => t.key)).toContain('reasoning_activity');
  });

  it("buildTowerLensTabsView echoes reasoning_activity as active tab", () => {
    const view = buildTowerLensTabsView('reasoning_activity');
    expect(view.activeTab).toBe('reasoning_activity');
  });

  it("reasoning_activity tab has non-empty label and description", () => {
    const tab = TOWER_TABS.find((t) => t.key === 'reasoning_activity');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });

  it('reasoning_activity tab is marked hasApexRetailContent', () => {
    const tab = TOWER_TABS.find((t) => t.key === 'reasoning_activity');
    expect(tab!.hasApexRetailContent).toBe(true);
  });
});

// ─── TowerLensTabs · ReasoningActivityBriefPanel ─────────────────────────────

describe('TOWER9 · TowerLensTabs · ReasoningActivityBriefPanel', () => {
  it('imports buildReasoningActivityBriefView from reasoning-activity-brief-view', () => {
    expect(componentSrc).toContain("from '@/lib/tower/reasoning-activity-brief-view'");
  });

  it('defines ReasoningActivityBriefPanel function', () => {
    expect(componentSrc).toContain('function ReasoningActivityBriefPanel()');
  });

  it("renders ReasoningActivityBriefPanel for reasoning_activity tab", () => {
    expect(componentSrc).toContain("{activeTab === 'reasoning_activity' && (");
    expect(componentSrc).toContain('<ReasoningActivityBriefPanel />');
  });

  it('has data-testid="tower-reasoning-activity-panel"', () => {
    expect(componentSrc).toContain('data-testid="tower-reasoning-activity-panel"');
  });

  it('has data-testid="tower-reasoning-activity-summary"', () => {
    expect(componentSrc).toContain('data-testid="tower-reasoning-activity-summary"');
  });

  it('has tower-reasoning-contradiction- testid prefix for contradiction cards', () => {
    expect(componentSrc).toContain('tower-reasoning-contradiction-');
  });

  it('has data-testid="tower-reasoning-handoffs"', () => {
    expect(componentSrc).toContain('data-testid="tower-reasoning-handoffs"');
  });

  it('has data-testid="tower-reasoning-activity-disclaimer"', () => {
    expect(componentSrc).toContain('data-testid="tower-reasoning-activity-disclaimer"');
  });

  it('has data-honest-disclaimer="tower-reasoning-activity"', () => {
    expect(componentSrc).toContain('data-honest-disclaimer="tower-reasoning-activity"');
  });

  it('honest disclaimer contains literal Deterministic seed', () => {
    const idx = componentSrc.indexOf('data-honest-disclaimer="tower-reasoning-activity"');
    expect(idx).toBeGreaterThan(0);
    const snippet = componentSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });

  it('does not import from src/lib/source', () => {
    expect(componentSrc).not.toMatch(/@\/lib\/source/);
  });

  it('does not call fetch or Date.now', () => {
    expect(componentSrc).not.toMatch(/\bfetch\s*\(/);
    expect(componentSrc).not.toMatch(/Date\.now\s*\(/);
  });
});

// ─── reasoning-activity-brief-view · source audit ────────────────────────────

describe('TOWER9 · reasoning-activity-brief-view · source audit', () => {
  it('buildReasoningActivityBriefView is exported', () => {
    expect(libSrc).toContain('export function buildReasoningActivityBriefView');
  });

  it('ReasoningActivityBriefView interface is exported', () => {
    expect(libSrc).toContain('export interface ReasoningActivityBriefView');
  });

  it('ReasoningContradictionItem interface is exported', () => {
    expect(libSrc).toContain('export interface ReasoningContradictionItem');
  });

  it('ReasoningHandoffItem interface is exported', () => {
    expect(libSrc).toContain('export interface ReasoningHandoffItem');
  });

  it('ContradictionSeverity type is exported', () => {
    expect(libSrc).toContain('export type ContradictionSeverity');
  });

  it('HandoffReadiness type is exported', () => {
    expect(libSrc).toContain('export type HandoffReadiness');
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

// ─── reasoning-activity-brief-view · runtime contract ────────────────────────

describe('TOWER9 · buildReasoningActivityBriefView · runtime contract', () => {
  const view = buildReasoningActivityBriefView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('activeContradictions array is non-empty', () => {
    expect(view.activeContradictions.length).toBeGreaterThan(0);
  });

  it('summary.activeContradictions matches activeContradictions array length', () => {
    expect(view.summary.activeContradictions).toBe(view.activeContradictions.length);
  });

  it('summary.pendingHandoffs matches non-green handoffs count', () => {
    const nonGreen = view.pendingHandoffs.filter((h) => h.readinessSignal !== 'green').length;
    expect(view.summary.pendingHandoffs).toBe(nonGreen);
  });

  it('has at least one high-severity contradiction', () => {
    const high = view.activeContradictions.filter((c) => c.severity === 'high');
    expect(high.length).toBeGreaterThan(0);
  });

  it('has at least one open contradiction', () => {
    const open = view.activeContradictions.filter((c) => c.status === 'open');
    expect(open.length).toBeGreaterThan(0);
  });

  it('pendingHandoffs array has at least 2 entries', () => {
    expect(view.pendingHandoffs.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least one red handoff', () => {
    const red = view.pendingHandoffs.filter((h) => h.readinessSignal === 'red');
    expect(red.length).toBeGreaterThan(0);
  });

  it('CON-AMS-001 is open and high severity', () => {
    const item = view.activeContradictions.find((c) => c.contradictionId === 'CON-AMS-001');
    expect(item).toBeDefined();
    expect(item!.status).toBe('open');
    expect(item!.severity).toBe('high');
    expect(item!.towerFlag).not.toBeNull();
  });

  it('CON-CDP-001 is open and has a relevant gate', () => {
    const item = view.activeContradictions.find((c) => c.contradictionId === 'CON-CDP-001');
    expect(item).toBeDefined();
    expect(item!.status).toBe('open');
    expect(item!.relevantGate).not.toBeNull();
  });

  it('HO-CDP-P2-P3 handoff is red (blocked)', () => {
    const handoff = view.pendingHandoffs.find((h) => h.handoffId === 'HO-CDP-P2-P3');
    expect(handoff).toBeDefined();
    expect(handoff!.readinessSignal).toBe('red');
  });

  it('HO-DF-P2-P3 handoff is green (on track)', () => {
    const handoff = view.pendingHandoffs.find((h) => h.handoffId === 'HO-DF-P2-P3');
    expect(handoff).toBeDefined();
    expect(handoff!.readinessSignal).toBe('green');
  });

  it('each contradiction has non-empty required string fields', () => {
    for (const c of view.activeContradictions) {
      expect(c.contradictionId.trim().length).toBeGreaterThan(0);
      expect(c.label.trim().length).toBeGreaterThan(0);
      expect(c.patternId.trim().length).toBeGreaterThan(0);
    }
  });

  it('each handoff has non-empty required string fields', () => {
    for (const h of view.pendingHandoffs) {
      expect(h.handoffId.trim().length).toBeGreaterThan(0);
      expect(h.programmeId.trim().length).toBeGreaterThan(0);
      expect(h.narrativeSummary.trim().length).toBeGreaterThan(0);
    }
  });

  it('atlasSynthesis is non-empty', () => {
    expect(view.atlasSynthesis.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildReasoningActivityBriefView();
    const b = buildReasoningActivityBriefView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('all contradictionIds are unique', () => {
    const ids = view.activeContradictions.map((c) => c.contradictionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all handoffIds are unique', () => {
    const ids = view.pendingHandoffs.map((h) => h.handoffId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('summary.totalPatternsAnalyzed is positive', () => {
    expect(view.summary.totalPatternsAnalyzed).toBeGreaterThan(0);
  });

  it('lastSynthesisEvent is non-empty', () => {
    expect(view.summary.lastSynthesisEvent.trim().length).toBeGreaterThan(0);
  });
});
