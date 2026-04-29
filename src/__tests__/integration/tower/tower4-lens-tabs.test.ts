// TOWER4 · Tower Lens Tabs — view-model unit tests.
//
// Pure deterministic coverage of tower-lens-tabs-view.ts.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
  type TowerTabKey,
} from '@/lib/tower/tower-lens-tabs-view';

// ─────────────────────────────────────────────────────────────────────────────
// Tab set
// ─────────────────────────────────────────────────────────────────────────────

describe('TOWER_TABS', () => {
  it('declares exactly nine canonical tabs (TOWER1 + TOWER2 + TOWER3 added source_commercial + decisions + value_at_risk; TOWER8 added programme_gates; TOWER9 added reasoning_activity)', () => {
    expect(TOWER_TABS).toHaveLength(9);
  });

  it('contains portfolio, scorecards, pressure, source_commercial, decisions, value_at_risk, executive_brief, programme_gates, reasoning_activity in that order', () => {
    expect(TOWER_TABS.map((t) => t.key)).toEqual([
      'portfolio',
      'scorecards',
      'pressure',
      'source_commercial',
      'decisions',
      'value_at_risk',
      'executive_brief',
      'programme_gates',
      'reasoning_activity',
    ]);
  });

  it('every tab has a non-empty label and description', () => {
    for (const tab of TOWER_TABS) {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.description.length).toBeGreaterThan(0);
    }
  });

  it('all tabs are marked hasApexRetailContent', () => {
    for (const tab of TOWER_TABS) {
      expect(tab.hasApexRetailContent).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveTowerTab
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveTowerTab', () => {
  it('returns "portfolio" for undefined', () => {
    expect(resolveTowerTab(undefined)).toBe('portfolio');
  });

  it('returns "portfolio" for null', () => {
    expect(resolveTowerTab(null)).toBe('portfolio');
  });

  it('returns "portfolio" for empty string', () => {
    expect(resolveTowerTab('')).toBe('portfolio');
  });

  it('returns "portfolio" for unknown key', () => {
    expect(resolveTowerTab('enterprise')).toBe('portfolio');
    expect(resolveTowerTab('not_a_tab')).toBe('portfolio');
  });

  const VALID: TowerTabKey[] = ['portfolio', 'scorecards', 'pressure', 'source_commercial', 'decisions', 'value_at_risk', 'executive_brief', 'programme_gates', 'reasoning_activity'];
  for (const key of VALID) {
    it(`accepts valid key "${key}"`, () => {
      expect(resolveTowerTab(key)).toBe(key);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// buildTowerLensTabsView
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerLensTabsView', () => {
  it('returns deterministicSeed: true', () => {
    const view = buildTowerLensTabsView('portfolio');
    expect(view.deterministicSeed).toBe(true);
  });

  it('echoes the active tab', () => {
    const tabs: TowerTabKey[] = ['portfolio', 'scorecards', 'pressure', 'source_commercial', 'decisions', 'value_at_risk', 'executive_brief', 'programme_gates', 'reasoning_activity'];
    for (const tab of tabs) {
      expect(buildTowerLensTabsView(tab).activeTab).toBe(tab);
    }
  });

  it('always includes all nine tabs', () => {
    const view = buildTowerLensTabsView('pressure');
    expect(view.tabs).toHaveLength(9);
    expect(view.tabs.map((t) => t.key)).toContain('portfolio');
    expect(view.tabs.map((t) => t.key)).toContain('scorecards');
    expect(view.tabs.map((t) => t.key)).toContain('pressure');
    expect(view.tabs.map((t) => t.key)).toContain('source_commercial');
    expect(view.tabs.map((t) => t.key)).toContain('decisions');
    expect(view.tabs.map((t) => t.key)).toContain('value_at_risk');
    expect(view.tabs.map((t) => t.key)).toContain('executive_brief');
    expect(view.tabs.map((t) => t.key)).toContain('programme_gates');
    expect(view.tabs.map((t) => t.key)).toContain('reasoning_activity');
  });

  it('is pure — same input yields identical output', () => {
    const a = buildTowerLensTabsView('scorecards');
    const b = buildTowerLensTabsView('scorecards');
    expect(a).toEqual(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe — TOWER4 component file must exist
// ─────────────────────────────────────────────────────────────────────────────

describe('TOWER4 component file probe', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/tower/TowerLensTabs.tsx',
  );

  it('TowerLensTabs.tsx file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('exports TowerLensTabs', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/export function TowerLensTabs/);
  });

  it('references all nine tab keys in the component source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    for (const key of ['portfolio', 'scorecards', 'pressure', 'source_commercial', 'decisions', 'value_at_risk', 'executive_brief', 'programme_gates', 'reasoning_activity']) {
      expect(src).toContain(key);
    }
  });

  it('does not import from src/lib/source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toMatch(/@\/lib\/source/);
  });

  it('does not call fetch or Date.now', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
  });
});
