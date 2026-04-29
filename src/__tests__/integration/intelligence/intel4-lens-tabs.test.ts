// INTEL4 · Intelligence Lens Tabs — view-model unit tests.
//
// Pure deterministic coverage of intelligence-lens-tabs-view.ts.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  INTELLIGENCE_TABS,
  buildIntelligenceLensTabsView,
  resolveIntelligenceTab,
  type IntelligenceLensTab,
} from '@/lib/intelligence/intelligence-lens-tabs-view';

// ───────────────────────━─────────────────────────────────────────────────────
// Tab set
// ─────────────────────────────────────────────────────────────────────────────

describe('INTELLIGENCE_TABS', () => {
  it('declares exactly twelve canonical tabs (INT1 pattern_plan, INT3 gap_queue, INT4 contradiction_monitor, INT5 programme_risk, INT6 gate_readiness, INT7 engagement_scorecard, INT8 milestone_tracker)', () => {
    expect(INTELLIGENCE_TABS).toHaveLength(12);
  });

  it('contains all twelve tab keys in canonical order', () => {
    expect(INTELLIGENCE_TABS.map((t) => t.key)).toEqual([
      'summary',
      'evidence',
      'programs',
      'actions',
      'signals',
      'pattern_plan',
      'gap_queue',
      'contradiction_monitor',
      'programme_risk',
      'gate_readiness',
      'engagement_scorecard',
      'milestone_tracker',
    ]);
  });

  it('every tab has a non-empty label and description', () => {
    for (const tab of INTELLIGENCE_TABS) {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.description.length).toBeGreaterThan(0);
    }
  });

  it('all tabs are marked hasApexRetailContent', () => {
    for (const tab of INTELLIGENCE_TABS) {
      expect(tab.hasApexRetailContent).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveIntelligenceTab
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveIntelligenceTab', () => {
  it('returns "summary" for undefined', () => {
    expect(resolveIntelligenceTab(undefined)).toBe('summary');
  });

  it('returns "summary" for null', () => {
    expect(resolveIntelligenceTab(null)).toBe('summary');
  });

  it('returns "summary" for empty string', () => {
    expect(resolveIntelligenceTab('')).toBe('summary');
  });

  it('returns "summary" for unknown key', () => {
    expect(resolveIntelligenceTab('signals2')).toBe('summary');
    expect(resolveIntelligenceTab('not_a_tab')).toBe('summary');
  });

  const VALID: IntelligenceLensTab[] = [
    'summary',
    'evidence',
    'programs',
    'actions',
    'signals',
    'pattern_plan',
    'gap_queue',
    'contradiction_monitor',
    'programme_risk',
    'gate_readiness',
    'engagement_scorecard',
    'milestone_tracker',
  ];
  for (const key of VALID) {
    it(`accepts valid key "${key}"`, () => {
      expect(resolveIntelligenceTab(key)).toBe(key);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// buildIntelligenceLensTabsView
// ─────────────────────────────────────────────────────────────────────────────

describe('buildIntelligenceLensTabsView', () => {
  it('returns deterministicSeed: true', () => {
    const view = buildIntelligenceLensTabsView('summary');
    expect(view.deterministicSeed).toBe(true);
  });

  it('echoes the active tab', () => {
    const tabs: IntelligenceLensTab[] = [
      'summary',
      'evidence',
      'programs',
      'actions',
      'signals',
      'pattern_plan',
      'gap_queue',
      'contradiction_monitor',
      'programme_risk',
      'gate_readiness',
      'engagement_scorecard',
      'milestone_tracker',
    ];
    for (const tab of tabs) {
      expect(buildIntelligenceLensTabsView(tab).activeTab).toBe(tab);
    }
  });

  it('always includes all twelve tabs', () => {
    const view = buildIntelligenceLensTabsView('evidence');
    expect(view.tabs).toHaveLength(12);
    expect(view.tabs.map((t) => t.key)).toContain('summary');
    expect(view.tabs.map((t) => t.key)).toContain('evidence');
    expect(view.tabs.map((t) => t.key)).toContain('programs');
    expect(view.tabs.map((t) => t.key)).toContain('actions');
    expect(view.tabs.map((t) => t.key)).toContain('signals');
    expect(view.tabs.map((t) => t.key)).toContain('pattern_plan');
    expect(view.tabs.map((t) => t.key)).toContain('gap_queue');
    expect(view.tabs.map((t) => t.key)).toContain('contradiction_monitor');
    expect(view.tabs.map((t) => t.key)).toContain('programme_risk');
    expect(view.tabs.map((t) => t.key)).toContain('gate_readiness');
    expect(view.tabs.map((t) => t.key)).toContain('engagement_scorecard');
    expect(view.tabs.map((t) => t.key)).toContain('milestone_tracker');
  });

  it('is pure — same input yields identical output', () => {
    const a = buildIntelligenceLensTabsView('actions');
    const b = buildIntelligenceLensTabsView('actions');
    expect(a).toEqual(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe — INTEL4 component file must exist
// ─────────────────────────────────────────────────────────────────────────────

describe('INTEL4 component file probe', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/intelligence/IntelligenceLensTabs.tsx',
  );

  it('IntelligenceLensTabs.tsx file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('exports IntelligenceLensTabs', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/export function IntelligenceLensTabs/);
  });

  it('references all twelve tab keys in the component source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    for (const key of [
      'summary', 'evidence', 'programs', 'actions', 'signals',
      'pattern_plan', 'gap_queue', 'contradiction_monitor',
      'programme_risk', 'gate_readiness', 'engagement_scorecard', 'milestone_tracker',
    ]) {
      expect(src).toContain(key);
    }
  });

  it('does not treat overview or patterns as canonical tab keys anymore', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toContain("tab.key === 'overview'");
    expect(src).not.toContain("activeTab === 'patterns'");
  });

  it('does not import from src/lib/source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toMatch(/@\/lib\/source/);
  });

  it('wires Programs and Actions tabs to their deterministic read models', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('buildIntelligenceProgramsModeView');
    expect(src).toContain('buildIntelligenceActionsModeView');
    expect(src).toMatch(/const view = buildIntelligenceProgramsModeView\(tenant\.routeSlug\)/);
    expect(src).toMatch(/const view = buildIntelligenceActionsModeView\(tenant\.routeSlug\)/);
  });

  it('does not derive Programs or Actions tab content from pattern cards', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toContain('buildProgramRows');
    expect(src).not.toMatch(/view\.cards\.map\(\(card, idx\) =>/);
  });

  it('does not call fetch or Date.now', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
  });
});
