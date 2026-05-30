/**
 * Wave 3 PR-5 (SETUP_AUDIT_2026-05-30 §7) — Production Readiness consolidated to 2 tabs.
 *
 * Verdict: collapse the 4-tab pattern (Decision · Blockers · Gates · History) to
 * 2 tabs (Decision · History). Decision is one scrollable view sequenced as:
 *   gate criteria first → blockers next → readiness tiles last.
 *
 * These tests assert the consolidation contract without rendering React:
 *   - view-model surfaces exactly 2 tabs with the correct keys
 *   - default tab is Decision; ?tab=history selects History
 *   - the page source sequences gates → blockers → tiles within Decision
 *   - the sub-nav hygiene test (W1-PR-3) still passes (no SubNavStrip leakage)
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildProductionReadinessPageView,
  resolveProductionReadinessTab,
} from '@/lib/admin/production-readiness-page-view';

const root = process.cwd();
const PAGE = resolve(
  root,
  'src/app/(maestro)/admin/production-readiness/page.tsx',
);
const TABS_COMPONENT = resolve(
  root,
  'src/components/admin/production-readiness/ProductionReadinessTabs.tsx',
);

describe('Wave 3 PR-5 · 2-tab consolidation', () => {
  it('view-model exposes exactly 2 tabs', async () => {
    const view = await buildProductionReadinessPageView();
    expect(view.tabs.length).toBe(2);
  });

  it('view-model tab keys are decision · history', async () => {
    const view = await buildProductionReadinessPageView();
    const keys = view.tabs.map((t) => t.key);
    expect(keys).toEqual(['decision', 'history']);
  });

  it('default tab is decision', async () => {
    const view = await buildProductionReadinessPageView();
    expect(view.defaultTab).toBe('decision');
    expect(resolveProductionReadinessTab(undefined)).toBe('decision');
    expect(resolveProductionReadinessTab('')).toBe('decision');
  });

  it('?tab=history selects history', () => {
    expect(resolveProductionReadinessTab('history')).toBe('history');
  });

  it('legacy ?tab=blockers and ?tab=gates fall back to decision', () => {
    expect(resolveProductionReadinessTab('blockers')).toBe('decision');
    expect(resolveProductionReadinessTab('gates')).toBe('decision');
  });

  it('tab labels are "Decision" and "History"', async () => {
    const view = await buildProductionReadinessPageView();
    const labels = view.tabs.map((t) => t.label);
    expect(labels).toEqual(['Decision', 'History']);
  });
});

describe('Wave 3 PR-5 · Decision sequence (gates → blockers → tiles)', () => {
  it('page source exists', () => {
    expect(existsSync(PAGE)).toBe(true);
  });

  const src = readFileSync(PAGE, 'utf8');

  it('renders GateCriteriaMatrix inside the Decision tab branch', () => {
    expect(src).toMatch(/GateCriteriaMatrix/);
  });

  it('renders TopBlockersTable inside the Decision tab branch', () => {
    expect(src).toMatch(/TopBlockersTable/);
  });

  it('renders DemoPilotProductionTiles inside the Decision tab branch', () => {
    expect(src).toMatch(/DemoPilotProductionTiles/);
  });

  it('sequences gates first, blockers second, tiles last within Decision', () => {
    // Search the JSX render body (after the `activeTab === 'decision'` guard),
    // not the import statements at the top of the file.
    const decisionStart = src.indexOf("activeTab === 'decision'");
    expect(decisionStart).toBeGreaterThan(-1);
    const body = src.slice(decisionStart);
    const idxGates = body.indexOf('<GateCriteriaMatrix');
    const idxBlockers = body.indexOf('<TopBlockersTable');
    const idxTiles = body.indexOf('<DemoPilotProductionTiles');
    expect(idxGates).toBeGreaterThan(-1);
    expect(idxBlockers).toBeGreaterThan(-1);
    expect(idxTiles).toBeGreaterThan(-1);
    expect(idxGates).toBeLessThan(idxBlockers);
    expect(idxBlockers).toBeLessThan(idxTiles);
  });

  it('exposes anchor ids for in-page navigation (gates / blockers / tiles)', () => {
    expect(src).toMatch(/id="gates"/);
    expect(src).toMatch(/id="blockers"/);
    expect(src).toMatch(/id="tiles"/);
  });

  it('Decision branch is the default render path', () => {
    expect(src).toMatch(/activeTab === 'decision'/);
  });

  it('History tab still renders the ReadinessHistoryStrip', () => {
    expect(src).toMatch(/activeTab === 'history'/);
    expect(src).toMatch(/ReadinessHistoryStrip/);
  });

  it('removes the standalone Blockers and Gates tab branches', () => {
    // Pre-Wave-3 the page had `activeTab === 'blockers'` and
    // `activeTab === 'gates'` branches. Consolidation drops them.
    expect(src).not.toMatch(/activeTab === 'blockers'/);
    expect(src).not.toMatch(/activeTab === 'gates'/);
  });
});

describe('Wave 3 PR-5 · canonical tab-strip pattern preserved', () => {
  it('ProductionReadinessTabs is a server component (no "use client")', () => {
    const src = readFileSync(TABS_COMPONENT, 'utf8');
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('ProductionReadinessTabs imports canonical design tokens', () => {
    const src = readFileSync(TABS_COMPONENT, 'utf8');
    expect(src).toMatch(/@\/lib\/design\/design-tokens/);
  });

  it('ProductionReadinessTabs uses href-based switching (no client state)', () => {
    const src = readFileSync(TABS_COMPONENT, 'utf8');
    expect(src).toMatch(/baseUrl/);
    expect(src).toMatch(/\?tab=/);
    expect(src).not.toMatch(/useState/);
  });
});
