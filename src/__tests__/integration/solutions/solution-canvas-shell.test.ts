// SOL10 - Solution Canvas Shell - integration tests.
//
// Pure deterministic coverage. No network. No live model. No DOM.
// Tests assert that:
// - buildSolutionCanvasShellView returns a fully populated view with
//   correct tabs, breadcrumbs, metadata, empty state, and load state.
// - Tab strip has exactly 5 tabs with correct labels and hrefs.
// - Only the 'canvas' tab is enabled; others are disabled with a reason.
// - isSubtabActive is false when activeTab is 'canvas'.
// - getActiveTabItem returns the correct tab for any activeTab value.
// - getEnabledTabs returns only the 'canvas' tab.
// - buildCanvasShellBreadcrumbs returns 2 breadcrumbs, last isCurrent.
// - buildCanvasEmptyState CTA links to /solutions/new (or basePath/new).
// - describeCanvasShell produces a deterministic single-line string.
// - Module hygiene: no Date.now / Math.random / new Date( / fetch(.

import {
  buildCanvasEmptyState,
  buildCanvasShellBreadcrumbs,
  buildCanvasShellTabs,
  buildSolutionCanvasShellView,
  describeCanvasShell,
  getActiveTabItem,
  getEnabledTabs,
  type CanvasShellTab,
  type SolutionCanvasShellView,
} from '@/lib/solutions/solution-canvas-shell-view';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildView(
  overrides: {
    activeTab?: CanvasShellTab;
    loadState?: SolutionCanvasShellView['loadState'];
  } = {},
): SolutionCanvasShellView {
  return buildSolutionCanvasShellView(
    'CDP Initiative',
    'apx-cdp-2026',
    overrides.activeTab ?? 'canvas',
    overrides.loadState ?? 'loaded',
    {
      solutionTypeLabel: 'AI-Led PDLC',
      archetypeKey: 'cdp-v1',
      archetypeLabel: 'Customer Data Platform',
      ownerLabel: 'Apex Retail',
      shortTitle: 'CDP',
    },
  );
}

// ─── Shape ────────────────────────────────────────────────────────────────────

describe('buildSolutionCanvasShellView - shape', () => {
  it('returns deterministicSeed: true', () => {
    expect(buildView().deterministicSeed).toBe(true);
  });

  it('sets title correctly', () => {
    expect(buildView().title).toBe('CDP Initiative');
  });

  it('sets loadState correctly', () => {
    expect(buildView({ loadState: 'empty' }).loadState).toBe('empty');
    expect(buildView({ loadState: 'error' }).loadState).toBe('error');
    expect(buildView({ loadState: 'loaded' }).loadState).toBe('loaded');
  });

  it('sets activeTab correctly', () => {
    expect(buildView({ activeTab: 'canvas' }).activeTab).toBe('canvas');
    expect(buildView({ activeTab: 'workshops' }).activeTab).toBe('workshops');
  });

  it('isSubtabActive is false when activeTab is canvas', () => {
    expect(buildView({ activeTab: 'canvas' }).isSubtabActive).toBe(false);
  });

  it('isSubtabActive is true for all non-canvas tabs', () => {
    const subTabs: CanvasShellTab[] = ['workshops', 'deliverables', 'evidence', 'team'];
    for (const tab of subTabs) {
      expect(buildView({ activeTab: tab }).isSubtabActive).toBe(true);
    }
  });
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

describe('buildSolutionCanvasShellView - tabs', () => {
  let view: SolutionCanvasShellView;

  beforeEach(() => {
    view = buildView();
  });

  it('has exactly 5 tabs', () => {
    expect(view.tabs.length).toBe(5);
  });

  it('tab keys are canvas, workshops, deliverables, evidence, team', () => {
    const keys = view.tabs.map((t) => t.tab);
    expect(keys).toEqual(['canvas', 'workshops', 'deliverables', 'evidence', 'team']);
  });

  it('canvas tab is active and not disabled', () => {
    const canvasTab = view.tabs.find((t) => t.tab === 'canvas');
    expect(canvasTab?.isActive).toBe(true);
    expect(canvasTab?.isDisabled).toBe(false);
    expect(canvasTab?.disabledReason).toBeNull();
  });

  it('non-canvas tabs are disabled with a reason', () => {
    const nonCanvas = view.tabs.filter((t) => t.tab !== 'canvas');
    for (const tab of nonCanvas) {
      expect(tab.isDisabled).toBe(true);
      expect(typeof tab.disabledReason).toBe('string');
      expect((tab.disabledReason ?? '').length).toBeGreaterThan(0);
    }
  });

  it('tab hrefs include the solution slug', () => {
    for (const tab of view.tabs) {
      expect(tab.href).toMatch(/apx-cdp-2026/);
    }
  });

  it('canvas tab href is basePath/solutionSlug', () => {
    const canvasTab = view.tabs.find((t) => t.tab === 'canvas');
    expect(canvasTab?.href).toBe('/solutions/apx-cdp-2026');
  });

  it('non-canvas tab hrefs include the tab key', () => {
    const workshopsTab = view.tabs.find((t) => t.tab === 'workshops');
    expect(workshopsTab?.href).toMatch(/\/workshops$/);
  });

  it('only one tab is active', () => {
    const activeTabs = view.tabs.filter((t) => t.isActive);
    expect(activeTabs.length).toBe(1);
  });

  it('active tab matches activeTab input', () => {
    const workshopsView = buildView({ activeTab: 'workshops' });
    const activeTab = workshopsView.tabs.find((t) => t.isActive);
    expect(activeTab?.tab).toBe('workshops');
  });

  it('all tabs have non-empty labels', () => {
    for (const tab of view.tabs) {
      expect(tab.label.length).toBeGreaterThan(0);
    }
  });
});

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

describe('buildSolutionCanvasShellView - breadcrumbs', () => {
  it('has exactly 2 breadcrumbs', () => {
    expect(buildView().breadcrumbs.length).toBe(2);
  });

  it('first breadcrumb is Solutions with a href', () => {
    const first = buildView().breadcrumbs[0];
    expect(first.label).toBe('Solutions');
    expect(typeof first.href).toBe('string');
    expect(first.isCurrent).toBe(false);
  });

  it('last breadcrumb is the solution title and isCurrent', () => {
    const last = buildView().breadcrumbs[1];
    expect(last.label).toBe('CDP Initiative');
    expect(last.isCurrent).toBe(true);
    expect(last.href).toBeNull();
  });

  it('respects custom basePath', () => {
    const crumbs = buildCanvasShellBreadcrumbs('My Solution', '/intelligence/solutions');
    expect(crumbs[0].href).toBe('/intelligence/solutions');
  });
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

describe('buildSolutionCanvasShellView - metadata', () => {
  it('propagates solutionTypeLabel', () => {
    expect(buildView().metadata.solutionTypeLabel).toBe('AI-Led PDLC');
  });

  it('propagates archetypeKey and archetypeLabel', () => {
    expect(buildView().metadata.archetypeKey).toBe('cdp-v1');
    expect(buildView().metadata.archetypeLabel).toBe('Customer Data Platform');
  });

  it('propagates ownerLabel', () => {
    expect(buildView().metadata.ownerLabel).toBe('Apex Retail');
  });

  it('defaults ownerLabel to Unassigned when not provided', () => {
    const view = buildSolutionCanvasShellView('T', 's');
    expect(view.metadata.ownerLabel).toBe('Unassigned');
  });

  it('defaults solutionTypeLabel to Solution when not provided', () => {
    const view = buildSolutionCanvasShellView('T', 's');
    expect(view.metadata.solutionTypeLabel).toBe('Solution');
  });

  it('defaults archetypeKey to null when not provided', () => {
    const view = buildSolutionCanvasShellView('T', 's');
    expect(view.metadata.archetypeKey).toBeNull();
    expect(view.metadata.archetypeLabel).toBeNull();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('buildSolutionCanvasShellView - empty state', () => {
  it('has a non-empty headline', () => {
    expect(buildView().emptyState.headline.length).toBeGreaterThan(0);
  });

  it('CTA href points to /solutions/new', () => {
    expect(buildView().emptyState.ctaHref).toBe('/solutions/new');
  });

  it('CTA href respects custom basePath', () => {
    const emptyState = buildCanvasEmptyState('/intelligence/solutions');
    expect(emptyState.ctaHref).toBe('/intelligence/solutions/new');
  });

  it('has a non-empty ctaLabel', () => {
    expect(buildView().emptyState.ctaLabel.length).toBeGreaterThan(0);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

describe('getActiveTabItem', () => {
  it('returns the active tab item', () => {
    const view = buildView({ activeTab: 'canvas' });
    const active = getActiveTabItem(view);
    expect(active?.tab).toBe('canvas');
  });

  it('returns workshops when activeTab is workshops', () => {
    const view = buildView({ activeTab: 'workshops' });
    const active = getActiveTabItem(view);
    expect(active?.tab).toBe('workshops');
  });
});

describe('getEnabledTabs', () => {
  it('returns only the canvas tab (the only non-disabled tab)', () => {
    const view = buildView();
    const enabled = getEnabledTabs(view);
    expect(enabled.length).toBe(1);
    expect(enabled[0].tab).toBe('canvas');
  });
});

describe('buildCanvasShellTabs', () => {
  it('marks the correct tab as active', () => {
    const tabs = buildCanvasShellTabs('apx-cdp-2026', 'evidence');
    const active = tabs.find((t) => t.isActive);
    expect(active?.tab).toBe('evidence');
  });

  it('all tabs have valid hrefs', () => {
    const tabs = buildCanvasShellTabs('my-solution');
    for (const tab of tabs) {
      expect(tab.href).toMatch(/^\/solutions\//);
    }
  });
});

describe('describeCanvasShell', () => {
  it('returns a deterministic summary string', () => {
    const view = buildView();
    const summary = describeCanvasShell(view);
    expect(summary).toMatch(/AI-Led PDLC/);
    expect(summary).toMatch(/canvas/);
    expect(summary).toMatch(/loaded/);
  });

  it('is deterministic across calls', () => {
    const view = buildView();
    expect(describeCanvasShell(view)).toBe(describeCanvasShell(view));
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('buildSolutionCanvasShellView - determinism', () => {
  it('produces byte-equal output for identical input', () => {
    const a = buildView();
    const b = buildView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── Module hygiene ───────────────────────────────────────────────────────────

describe('module hygiene - solution-canvas-shell-view.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/solution-canvas-shell-view.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  function stripStringLiterals(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
  }

  const codeOnly = stripStringLiterals(source);

  it('does not call Date.now(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
  });

  it('does not call Math.random(', () => {
    expect(codeOnly).not.toMatch(/Math\.random\(/);
  });

  it('does not call new Date(', () => {
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch(', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/supabase/);
  });

  it('does not contain placeholder copy', () => {
    expect(codeOnly).not.toMatch(/Coming soon/);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/);
  });
});
