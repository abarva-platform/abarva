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

// ───────────────────────���─────────────────────────────────────────────────────
// Tab set
// ─────────────────────────────────────────────────────────────────────────────

describe('INTELLIGENCE_TABS', () => {
  it('declares exactly four canonical tabs', () => {
    expect(INTELLIGENCE_TABS).toHaveLength(4);
  });

  it('contains overview, patterns, evidence, signals in that order', () => {
    expect(INTELLIGENCE_TABS.map((t) => t.key)).toEqual([
      'overview',
      'patterns',
      'evidence',
      'signals',
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
  it('returns "overview" for undefined', () => {
    expect(resolveIntelligenceTab(undefined)).toBe('overview');
  });

  it('returns "overview" for null', () => {
    expect(resolveIntelligenceTab(null)).toBe('overview');
  });

  it('returns "overview" for empty string', () => {
    expect(resolveIntelligenceTab('')).toBe('overview');
  });

  it('returns "overview" for unknown key', () => {
    expect(resolveIntelligenceTab('signals2')).toBe('overview');
    expect(resolveIntelligenceTab('not_a_tab')).toBe('overview');
  });

  const VALID: IntelligenceLensTab[] = ['overview', 'patterns', 'evidence', 'signals'];
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
    const view = buildIntelligenceLensTabsView('overview');
    expect(view.deterministicSeed).toBe(true);
  });

  it('echoes the active tab', () => {
    const tabs: IntelligenceLensTab[] = ['overview', 'patterns', 'evidence', 'signals'];
    for (const tab of tabs) {
      expect(buildIntelligenceLensTabsView(tab).activeTab).toBe(tab);
    }
  });

  it('always includes all four tabs', () => {
    const view = buildIntelligenceLensTabsView('evidence');
    expect(view.tabs).toHaveLength(4);
    expect(view.tabs.map((t) => t.key)).toContain('overview');
    expect(view.tabs.map((t) => t.key)).toContain('patterns');
    expect(view.tabs.map((t) => t.key)).toContain('evidence');
    expect(view.tabs.map((t) => t.key)).toContain('signals');
  });

  it('is pure — same input yields identical output', () => {
    const a = buildIntelligenceLensTabsView('patterns');
    const b = buildIntelligenceLensTabsView('patterns');
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

  it('references all four tab keys in the component source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    for (const key of ['overview', 'patterns', 'evidence', 'signals']) {
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
