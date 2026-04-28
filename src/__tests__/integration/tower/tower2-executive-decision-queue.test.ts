// TOWER2 · Executive decision queue in Control Tower.
//
// Verifies structural invariants added in TOWER2:
//   1. tower-lens-tabs-view has decisions tab key
//   2. TowerLensTabs renders decisions tab
//   3. DecisionsPanel has correct testids and honest disclaimer
//   4. executive-decision-queue-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
} from '@/lib/tower/tower-lens-tabs-view';
import { buildExecutiveDecisionQueueView } from '@/lib/tower/executive-decision-queue-view';

const TABS_PAGE_PATH = join(
  process.cwd(),
  'src/components/tower/TowerLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/tower/executive-decision-queue-view.ts',
);

const towerSrc = readFileSync(TABS_PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── tower-lens-tabs-view · decisions tab ────────────────────────────────────

describe('TOWER2 · tower-lens-tabs-view · decisions tab', () => {
  it("TOWER_TABS includes 'decisions' key", () => {
    const keys = TOWER_TABS.map((t) => t.key);
    expect(keys).toContain('decisions');
  });

  it("resolveTowerTab accepts 'decisions'", () => {
    expect(resolveTowerTab('decisions')).toBe('decisions');
  });

  it("buildTowerLensTabsView includes decisions in tabs", () => {
    const view = buildTowerLensTabsView('decisions');
    expect(view.tabs.map((t) => t.key)).toContain('decisions');
  });

  it("buildTowerLensTabsView echoes decisions as active tab", () => {
    const view = buildTowerLensTabsView('decisions');
    expect(view.activeTab).toBe('decisions');
  });

  it("decisions tab has non-empty label and description", () => {
    const tab = TOWER_TABS.find((t) => t.key === 'decisions');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });
});

// ─── TowerLensTabs.tsx · DecisionsPanel ──────────────────────────────────────

describe('TOWER2 · TowerLensTabs · DecisionsPanel', () => {
  it("imports buildExecutiveDecisionQueueView from tower lib", () => {
    expect(towerSrc).toContain("from '@/lib/tower/executive-decision-queue-view'");
  });

  it("defines DecisionsPanel function", () => {
    expect(towerSrc).toContain('function DecisionsPanel()');
  });

  it("renders DecisionsPanel for decisions tab", () => {
    expect(towerSrc).toContain("{activeTab === 'decisions' && (");
    expect(towerSrc).toContain('<DecisionsPanel />');
  });

  it('has data-testid="tower-decisions-panel"', () => {
    expect(towerSrc).toContain('data-testid="tower-decisions-panel"');
  });

  it('has data-testid="tower-decisions-executive-summary"', () => {
    expect(towerSrc).toContain('data-testid="tower-decisions-executive-summary"');
  });

  it('has data-testid="tower-decisions-critical-blocker-alert"', () => {
    expect(towerSrc).toContain('data-testid="tower-decisions-critical-blocker-alert"');
  });

  it('has tower-decision-item testid pattern', () => {
    expect(towerSrc).toContain('tower-decision-item-');
  });

  it('has data-testid="tower-decisions-disclaimer"', () => {
    expect(towerSrc).toContain('data-testid="tower-decisions-disclaimer"');
  });

  it('has data-honest-disclaimer="tower-executive-decisions"', () => {
    expect(towerSrc).toContain('data-honest-disclaimer="tower-executive-decisions"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = towerSrc.indexOf('data-honest-disclaimer="tower-executive-decisions"');
    expect(idx).toBeGreaterThan(0);
    const snippet = towerSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── executive-decision-queue-view · source audit ────────────────────────────

describe('TOWER2 · executive-decision-queue-view · source audit', () => {
  it('buildExecutiveDecisionQueueView is exported', () => {
    expect(libSrc).toContain('export function buildExecutiveDecisionQueueView');
  });

  it('ExecutiveDecisionQueueView interface is exported', () => {
    expect(libSrc).toContain('export interface ExecutiveDecisionQueueView');
  });

  it('DecisionItem interface is exported', () => {
    expect(libSrc).toContain('export interface DecisionItem');
  });

  it('DecisionQueueSummary interface is exported', () => {
    expect(libSrc).toContain('export interface DecisionQueueSummary');
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

// ─── executive-decision-queue-view · runtime contract ────────────────────────

describe('TOWER2 · executive-decision-queue-view · runtime contract', () => {
  const view = buildExecutiveDecisionQueueView();

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

  it('decisions array is non-empty', () => {
    expect(view.decisions.length).toBeGreaterThan(0);
  });

  it('has at least one immediate urgency decision', () => {
    const immediate = view.decisions.filter((d) => d.urgency === 'immediate');
    expect(immediate.length).toBeGreaterThan(0);
  });

  it('each decision has non-empty title, context, decisionQuestion, recommendedAction', () => {
    view.decisions.forEach((d) => {
      expect(d.title.trim().length).toBeGreaterThan(0);
      expect(d.context.trim().length).toBeGreaterThan(0);
      expect(d.decisionQuestion.trim().length).toBeGreaterThan(0);
      expect(d.recommendedAction.trim().length).toBeGreaterThan(0);
    });
  });

  it('each decision has knownContext and owner and deadline', () => {
    view.decisions.forEach((d) => {
      expect(d.knownContext.length).toBeGreaterThan(0);
      expect(d.owner.trim().length).toBeGreaterThan(0);
      expect(d.deadline.trim().length).toBeGreaterThan(0);
    });
  });

  it('summary immediateCount matches decisions', () => {
    const count = view.decisions.filter((d) => d.urgency === 'immediate').length;
    expect(view.summary.immediateCount).toBe(count);
  });

  it('summary blockedCount matches decisions', () => {
    const count = view.decisions.filter((d) => d.status === 'blocked').length;
    expect(view.summary.blockedCount).toBe(count);
  });

  it('criticalBlockerActive is true (there are immediate+blocked decisions)', () => {
    expect(view.summary.criticalBlockerActive).toBe(true);
  });

  it('executiveSummary is non-empty', () => {
    expect(view.executiveSummary.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildExecutiveDecisionQueueView();
    const b = buildExecutiveDecisionQueueView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
