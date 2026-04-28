// TOWER3 · Value at Risk Portfolio Lens in Control Tower.
//
// Verifies structural invariants added in TOWER3:
//   1. tower-lens-tabs-view has value_at_risk tab key
//   2. TowerLensTabs renders ValueAtRiskPanel
//   3. ValueAtRiskPanel has correct testids and honest disclaimer
//   4. value-at-risk-portfolio-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
} from '@/lib/tower/tower-lens-tabs-view';
import { buildValueAtRiskPortfolioView } from '@/lib/tower/value-at-risk-portfolio-view';

const TABS_PAGE_PATH = join(
  process.cwd(),
  'src/components/tower/TowerLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/tower/value-at-risk-portfolio-view.ts',
);

const towerSrc = readFileSync(TABS_PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── tower-lens-tabs-view · value_at_risk tab ────────────────────────────────

describe('TOWER3 · tower-lens-tabs-view · value_at_risk tab', () => {
  it("TOWER_TABS includes 'value_at_risk' key", () => {
    const keys = TOWER_TABS.map((t) => t.key);
    expect(keys).toContain('value_at_risk');
  });

  it("resolveTowerTab accepts 'value_at_risk'", () => {
    expect(resolveTowerTab('value_at_risk')).toBe('value_at_risk');
  });

  it("buildTowerLensTabsView includes value_at_risk in tabs", () => {
    const view = buildTowerLensTabsView('value_at_risk');
    expect(view.tabs.map((t) => t.key)).toContain('value_at_risk');
  });

  it("buildTowerLensTabsView echoes value_at_risk as active tab", () => {
    const view = buildTowerLensTabsView('value_at_risk');
    expect(view.activeTab).toBe('value_at_risk');
  });

  it("value_at_risk tab has non-empty label and description", () => {
    const tab = TOWER_TABS.find((t) => t.key === 'value_at_risk');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });
});

// ─── TowerLensTabs.tsx · ValueAtRiskPanel ────────────────────────────────────

describe('TOWER3 · TowerLensTabs · ValueAtRiskPanel', () => {
  it("imports buildValueAtRiskPortfolioView from tower lib", () => {
    expect(towerSrc).toContain("from '@/lib/tower/value-at-risk-portfolio-view'");
  });

  it("defines ValueAtRiskPanel function", () => {
    expect(towerSrc).toContain('function ValueAtRiskPanel()');
  });

  it("renders ValueAtRiskPanel for value_at_risk tab", () => {
    expect(towerSrc).toContain("{activeTab === 'value_at_risk' && (");
    expect(towerSrc).toContain('<ValueAtRiskPanel />');
  });

  it('has data-testid="tower-value-at-risk-panel"', () => {
    expect(towerSrc).toContain('data-testid="tower-value-at-risk-panel"');
  });

  it('has data-testid="tower-value-at-risk-summary"', () => {
    expect(towerSrc).toContain('data-testid="tower-value-at-risk-summary"');
  });

  it('has tower-var-item- testid prefix pattern for items', () => {
    expect(towerSrc).toContain('tower-var-item-');
  });

  it('has data-testid="tower-value-at-risk-disclaimer"', () => {
    expect(towerSrc).toContain('data-testid="tower-value-at-risk-disclaimer"');
  });

  it('has data-honest-disclaimer="tower-value-at-risk"', () => {
    expect(towerSrc).toContain('data-honest-disclaimer="tower-value-at-risk"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = towerSrc.indexOf('data-honest-disclaimer="tower-value-at-risk"');
    expect(idx).toBeGreaterThan(0);
    const snippet = towerSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });

  it('does not import from src/lib/source', () => {
    expect(towerSrc).not.toMatch(/@\/lib\/source/);
  });
});

// ─── value-at-risk-portfolio-view · source audit ─────────────────────────────

describe('TOWER3 · value-at-risk-portfolio-view · source audit', () => {
  it('buildValueAtRiskPortfolioView is exported', () => {
    expect(libSrc).toContain('export function buildValueAtRiskPortfolioView');
  });

  it('ValueAtRiskPortfolioView interface is exported', () => {
    expect(libSrc).toContain('export interface ValueAtRiskPortfolioView');
  });

  it('ValueAtRiskItem interface is exported', () => {
    expect(libSrc).toContain('export interface ValueAtRiskItem');
  });

  it('PortfolioValueSummary interface is exported', () => {
    expect(libSrc).toContain('export interface PortfolioValueSummary');
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

// ─── value-at-risk-portfolio-view · runtime contract ─────────────────────────

describe('TOWER3 · value-at-risk-portfolio-view · runtime contract', () => {
  const view = buildValueAtRiskPortfolioView();

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

  it('items array is non-empty', () => {
    expect(view.items.length).toBeGreaterThan(0);
  });

  it('has at least one high-risk item', () => {
    const high = view.items.filter((i) => i.riskTier === 'high');
    expect(high.length).toBeGreaterThan(0);
  });

  it('has at least one blocked item', () => {
    const blocked = view.items.filter((i) => i.status === 'blocked');
    expect(blocked.length).toBeGreaterThan(0);
  });

  it('each item has non-empty itemId, source, label, riskNarrative, nextAction', () => {
    view.items.forEach((item) => {
      expect(item.itemId.trim().length).toBeGreaterThan(0);
      expect(item.source.trim().length).toBeGreaterThan(0);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.riskNarrative.trim().length).toBeGreaterThan(0);
      expect(item.nextAction.trim().length).toBeGreaterThan(0);
    });
  });

  it('summary highRiskItemCount matches items', () => {
    const count = view.items.filter((i) => i.riskTier === 'high').length;
    expect(view.summary.highRiskItemCount).toBe(count);
  });

  it('summary blockedItemCount matches items', () => {
    const count = view.items.filter((i) => i.status === 'blocked').length;
    expect(view.summary.blockedItemCount).toBe(count);
  });

  it('summary totalValueAtStakeUsd only counts quantified items', () => {
    const total = view.items
      .filter((i) => i.valueQuantified)
      .reduce((acc, i) => acc + i.valueAtStakeUsd, 0);
    expect(view.summary.totalValueAtStakeUsd).toBe(total);
  });

  it('summary atRiskValueUsd only counts quantified at_risk items', () => {
    const atRisk = view.items
      .filter((i) => i.status === 'at_risk' && i.valueQuantified)
      .reduce((acc, i) => acc + i.valueAtStakeUsd, 0);
    expect(view.summary.atRiskValueUsd).toBe(atRisk);
  });

  it('topPriorityGuidance is non-empty', () => {
    expect(view.topPriorityGuidance.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildValueAtRiskPortfolioView();
    const b = buildValueAtRiskPortfolioView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
