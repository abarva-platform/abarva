/**
 * I6 — pattern-graph-shell-view integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildPatternGraphShellView() has exactly 3 tabs
 *   - 'graph' tab is active and not disabled by default
 *   - 'registry' and 'promotions' tabs are disabled with non-null disabledReason
 *   - breadcrumbs has 2 items, last isCurrent: true (for 'graph' default)
 *   - totalPatterns === 8 (from PAT1 registry)
 *   - activePatterns === 6
 *   - highDegreeCount >= 1
 *   - buildPatternGraphShellView('registry') → graph tab not active, registry tab active
 *   - getPatternGraphTabItem(view, 'graph') returns graph tab
 *   - getPatternGraphTabItem(view, 'registry') returns registry tab (disabled)
 *   - getPatternGraphTabItem(view, 'nonexistent' as PatternGraphShellTab) returns null
 *   - describePatternGraphShell includes totalPatterns and highDegreeCount
 *   - Determinism
 *   - deterministicSeed: true
 *   - Custom basePath propagates to tab hrefs
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildPatternGraphShellView,
  getPatternGraphTabItem,
  describePatternGraphShell,
  type PatternGraphShellTab,
  type PatternGraphShellView,
} from '@/lib/sentinel/pattern-graph-shell-view';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/sentinel/pattern-graph-shell-view.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

// ---------------------------------------------------------------------------
// buildPatternGraphShellView — default (graph tab, default basePath)
// ---------------------------------------------------------------------------

describe('I6 — buildPatternGraphShellView: default (graph tab)', () => {
  let view: PatternGraphShellView;

  beforeAll(() => {
    view = buildPatternGraphShellView();
  });

  it('has exactly 3 tabs', () => {
    expect(view.tabs.length).toBe(3);
  });

  it('activeTab is graph', () => {
    expect(view.activeTab).toBe('graph');
  });

  it('graph tab isActive: true', () => {
    const graphTab = view.tabs.find((t) => t.tab === 'graph');
    expect(graphTab?.isActive).toBe(true);
  });

  it('graph tab isDisabled: false', () => {
    const graphTab = view.tabs.find((t) => t.tab === 'graph');
    expect(graphTab?.isDisabled).toBe(false);
  });

  it('graph tab disabledReason is null', () => {
    const graphTab = view.tabs.find((t) => t.tab === 'graph');
    expect(graphTab?.disabledReason).toBeNull();
  });

  it('registry tab isDisabled: true', () => {
    const registryTab = view.tabs.find((t) => t.tab === 'registry');
    expect(registryTab?.isDisabled).toBe(true);
  });

  it('registry tab disabledReason is non-null', () => {
    const registryTab = view.tabs.find((t) => t.tab === 'registry');
    expect(registryTab?.disabledReason).not.toBeNull();
  });

  it('registry tab disabledReason is a non-empty string', () => {
    const registryTab = view.tabs.find((t) => t.tab === 'registry');
    expect(typeof registryTab?.disabledReason).toBe('string');
    expect((registryTab?.disabledReason as string).length).toBeGreaterThan(0);
  });

  it('promotions tab isDisabled: true', () => {
    const promoTab = view.tabs.find((t) => t.tab === 'promotions');
    expect(promoTab?.isDisabled).toBe(true);
  });

  it('promotions tab disabledReason is non-null', () => {
    const promoTab = view.tabs.find((t) => t.tab === 'promotions');
    expect(promoTab?.disabledReason).not.toBeNull();
  });

  it('title is "Pattern Graph"', () => {
    expect(view.title).toBe('Pattern Graph');
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('totalPatterns is 8', () => {
    expect(view.totalPatterns).toBe(8);
  });

  it('activePatterns is 6', () => {
    expect(view.activePatterns).toBe(6);
  });

  it('highDegreeCount is >= 1', () => {
    expect(view.highDegreeCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// breadcrumbs — default (graph) tab: 2 items, last isCurrent
// ---------------------------------------------------------------------------

describe('I6 — breadcrumbs for default graph tab', () => {
  let view: PatternGraphShellView;

  beforeAll(() => {
    view = buildPatternGraphShellView();
  });

  it('has 2 breadcrumb items for graph tab', () => {
    expect(view.breadcrumbs.length).toBe(2);
  });

  it('last breadcrumb is isCurrent: true', () => {
    const last = view.breadcrumbs[view.breadcrumbs.length - 1];
    expect(last.isCurrent).toBe(true);
  });

  it('first breadcrumb is not isCurrent', () => {
    expect(view.breadcrumbs[0].isCurrent).toBe(false);
  });

  it('first breadcrumb label is "Intelligence"', () => {
    expect(view.breadcrumbs[0].label).toBe('Intelligence');
  });

  it('second breadcrumb label is "Pattern Graph"', () => {
    expect(view.breadcrumbs[1].label).toBe('Pattern Graph');
  });
});

// ---------------------------------------------------------------------------
// buildPatternGraphShellView('registry') — registry tab active
// ---------------------------------------------------------------------------

describe('I6 — buildPatternGraphShellView: registry tab active', () => {
  let view: PatternGraphShellView;

  beforeAll(() => {
    view = buildPatternGraphShellView('registry');
  });

  it('activeTab is registry', () => {
    expect(view.activeTab).toBe('registry');
  });

  it('graph tab is not active', () => {
    const graphTab = view.tabs.find((t) => t.tab === 'graph');
    expect(graphTab?.isActive).toBe(false);
  });

  it('registry tab isActive: true', () => {
    const registryTab = view.tabs.find((t) => t.tab === 'registry');
    expect(registryTab?.isActive).toBe(true);
  });

  it('has 3 breadcrumbs when non-graph tab is active', () => {
    // 'registry' is not 'graph', so 3 crumbs: Intelligence, Pattern Graph, Registry
    expect(view.breadcrumbs.length).toBe(3);
  });

  it('last breadcrumb is isCurrent: true', () => {
    const last = view.breadcrumbs[view.breadcrumbs.length - 1];
    expect(last.isCurrent).toBe(true);
  });

  it('last breadcrumb label contains "Registry"', () => {
    const last = view.breadcrumbs[view.breadcrumbs.length - 1];
    expect(last.label).toContain('Registry');
  });
});

// ---------------------------------------------------------------------------
// getPatternGraphTabItem
// ---------------------------------------------------------------------------

describe('I6 — getPatternGraphTabItem', () => {
  let view: PatternGraphShellView;

  beforeAll(() => {
    view = buildPatternGraphShellView();
  });

  it('returns graph tab for key "graph"', () => {
    const tab = getPatternGraphTabItem(view, 'graph');
    expect(tab).not.toBeNull();
    expect(tab?.tab).toBe('graph');
  });

  it('returns registry tab for key "registry"', () => {
    const tab = getPatternGraphTabItem(view, 'registry');
    expect(tab).not.toBeNull();
    expect(tab?.tab).toBe('registry');
  });

  it('registry tab returned is disabled', () => {
    const tab = getPatternGraphTabItem(view, 'registry');
    expect(tab?.isDisabled).toBe(true);
  });

  it('returns promotions tab for key "promotions"', () => {
    const tab = getPatternGraphTabItem(view, 'promotions');
    expect(tab).not.toBeNull();
    expect(tab?.tab).toBe('promotions');
  });

  it('returns null for nonexistent tab key', () => {
    const tab = getPatternGraphTabItem(view, 'nonexistent' as PatternGraphShellTab);
    expect(tab).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describePatternGraphShell
// ---------------------------------------------------------------------------

describe('I6 — describePatternGraphShell', () => {
  let view: PatternGraphShellView;

  beforeAll(() => {
    view = buildPatternGraphShellView();
  });

  it('returns a non-empty string', () => {
    const desc = describePatternGraphShell(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('includes totalPatterns count (8)', () => {
    expect(describePatternGraphShell(view)).toContain(
      String(view.totalPatterns),
    );
  });

  it('includes highDegreeCount', () => {
    expect(describePatternGraphShell(view)).toContain(
      String(view.highDegreeCount),
    );
  });

  it('includes "patterns"', () => {
    expect(describePatternGraphShell(view)).toContain('patterns');
  });

  it('includes "high-degree"', () => {
    expect(describePatternGraphShell(view)).toContain('high-degree');
  });
});

// ---------------------------------------------------------------------------
// Custom basePath propagates to tab hrefs
// ---------------------------------------------------------------------------

describe('I6 — custom basePath propagates to tab hrefs', () => {
  const customPath = '/custom/base/path';
  let view: PatternGraphShellView;

  beforeAll(() => {
    view = buildPatternGraphShellView('graph', customPath);
  });

  it('graph tab href starts with custom basePath', () => {
    const graphTab = view.tabs.find((t) => t.tab === 'graph');
    expect(graphTab?.href).toContain(customPath);
  });

  it('registry tab href starts with custom basePath', () => {
    const registryTab = view.tabs.find((t) => t.tab === 'registry');
    expect(registryTab?.href).toContain(customPath);
  });

  it('promotions tab href starts with custom basePath', () => {
    const promoTab = view.tabs.find((t) => t.tab === 'promotions');
    expect(promoTab?.href).toContain(customPath);
  });

  it('graph tab href is customPath + /graph', () => {
    const graphTab = view.tabs.find((t) => t.tab === 'graph');
    expect(graphTab?.href).toBe(`${customPath}/graph`);
  });
});

// ---------------------------------------------------------------------------
// deterministicSeed: true
// ---------------------------------------------------------------------------

describe('I6 — deterministicSeed', () => {
  it('buildPatternGraphShellView result has deterministicSeed: true', () => {
    const view = buildPatternGraphShellView();
    expect(view.deterministicSeed).toBe(true);
  });

  it('deterministicSeed is strict boolean true', () => {
    const view = buildPatternGraphShellView();
    expect(view.deterministicSeed).toStrictEqual(true);
  });
});

// ---------------------------------------------------------------------------
// Determinism across calls
// ---------------------------------------------------------------------------

describe('I6 — determinism across calls', () => {
  it('totalPatterns is stable across calls', () => {
    const v1 = buildPatternGraphShellView();
    const v2 = buildPatternGraphShellView();
    expect(v1.totalPatterns).toBe(v2.totalPatterns);
  });

  it('activePatterns is stable across calls', () => {
    const v1 = buildPatternGraphShellView();
    const v2 = buildPatternGraphShellView();
    expect(v1.activePatterns).toBe(v2.activePatterns);
  });

  it('highDegreeCount is stable across calls', () => {
    const v1 = buildPatternGraphShellView();
    const v2 = buildPatternGraphShellView();
    expect(v1.highDegreeCount).toBe(v2.highDegreeCount);
  });

  it('tabs length is stable across calls', () => {
    const v1 = buildPatternGraphShellView();
    const v2 = buildPatternGraphShellView();
    expect(v1.tabs.length).toBe(v2.tabs.length);
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I6 — module hygiene', () => {
  let src: string;

  beforeAll(() => {
    src = readSource();
  });

  it('does not call Date.now()', () => {
    expect(src).not.toContain('Date.now(');
  });

  it('does not call Math.random()', () => {
    expect(src).not.toContain('Math.random(');
  });

  it('does not construct new Date(', () => {
    expect(src).not.toContain('new Date(');
  });

  it('does not call fetch(', () => {
    expect(src).not.toContain('fetch(');
  });

  it('does not import useState', () => {
    expect(src).not.toContain('useState');
  });

  it('does not import useEffect', () => {
    expect(src).not.toContain('useEffect');
  });

  it('does not import from supabase', () => {
    expect(src).not.toContain('@supabase/supabase-js');
  });

  it('does not import from @clerk/nextjs', () => {
    expect(src).not.toContain('@clerk/nextjs');
  });

  it('does not contain "Coming soon"', () => {
    expect(src).not.toContain('Coming soon');
  });

  it('does not contain "TBD"', () => {
    expect(src).not.toContain('TBD');
  });
});
