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
  it('declares exactly five canonical tabs (T-2 Tower Fix Package: dropped pressure, source_commercial, decisions, value_at_risk, reasoning_activity)', () => {
    expect(TOWER_TABS).toHaveLength(5);
  });

  it('contains portfolio, scorecards, programme_gates, dependencies, executive_brief in that order', () => {
    expect(TOWER_TABS.map((t) => t.key)).toEqual([
      'portfolio',
      'scorecards',
      'programme_gates',
      'dependencies',
      'executive_brief',
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

  // Tower Fix Package T-2: 5 valid keys (down from 9). Dropped:
  // pressure, source_commercial, decisions, value_at_risk, reasoning_activity.
  const VALID: TowerTabKey[] = ['portfolio', 'scorecards', 'programme_gates', 'dependencies', 'executive_brief'];
  for (const key of VALID) {
    it(`accepts valid key "${key}"`, () => {
      expect(resolveTowerTab(key)).toBe(key);
    });
  }

  it.each(['pressure', 'source_commercial', 'decisions', 'value_at_risk', 'reasoning_activity'])(
    'falls back to "portfolio" for dropped tab "%s"',
    (key) => {
      expect(resolveTowerTab(key)).toBe('portfolio');
    },
  );
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
    const tabs: TowerTabKey[] = ['portfolio', 'scorecards', 'programme_gates', 'dependencies', 'executive_brief'];
    for (const tab of tabs) {
      expect(buildTowerLensTabsView(tab).activeTab).toBe(tab);
    }
  });

  it('always includes all five tabs (T-2 Tower Fix Package reduction)', () => {
    const view = buildTowerLensTabsView('portfolio');
    expect(view.tabs).toHaveLength(5);
    expect(view.tabs.map((t) => t.key)).toEqual([
      'portfolio',
      'scorecards',
      'programme_gates',
      'dependencies',
      'executive_brief',
    ]);
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

  it('references all five tab keys in the component source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    for (const key of ['portfolio', 'scorecards', 'programme_gates', 'dependencies', 'executive_brief']) {
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
