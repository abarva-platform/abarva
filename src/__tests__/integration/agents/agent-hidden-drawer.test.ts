/**
 * ACT3 — agent-hidden-drawer integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildAgentHiddenDrawerView() default seed
 *   - agentSummaries: 4 canonical agents in order
 *   - totalMissions matches panelView.missions.length
 *   - activeAgents subset of canonical agents
 *   - priorityCounts reconciles with panelView missions
 *   - triggerLabel format check
 *   - portfolioContext: totalInventory, activeUseCases, evaluatingUseCases
 *   - highestPriorityLabel is string or null
 *   - honestDisclaimer is non-empty
 *   - drawerState === 'collapsed'
 *   - deterministicSeed: true
 *   - Determinism: two calls produce identical output
 *   - getDrawerTriggerLabel returns view.triggerLabel
 *   - getActivePriorityLabel returns string
 *   - describeAgentHiddenDrawer format check
 *   - AgentHiddenDrawer RENDERED, not read: attributes, copy, badges, prop view
 *   - AgentHiddenDrawer is a server component: callable with no React dispatcher
 *   - View determinism under a moved clock, varied Math.random, and no network
 *   - View derivation: panel is the AG11 hidden_drawer seed, portfolio counts
 *     are the ACT2 inventory stage counts
 *
 * T-495: this suite used to read AgentHiddenDrawer.tsx and
 * agent-hidden-drawer-view.ts as TEXT and grep them. Those 15 cases asserted
 * what the files say, not what they do, and are replaced below by cases that
 * render the component and run the builder. Rationale and mutation record:
 * docs/architecture/t495-agent-hidden-drawer-triage.json.
 */

import { createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  buildAgentHiddenDrawerView,
  getDrawerTriggerLabel,
  getActivePriorityLabel,
  describeAgentHiddenDrawer,
  type AgentHiddenDrawerView,
  type AgentMissionPanelAgent,
} from '@/lib/agent/agent-hidden-drawer-view';
import { buildAgentMissionPanelSeedView } from '@/lib/agent/agent-mission-view';
import {
  buildAiPortfolioInventory,
  summarizeAiPortfolioInventory,
} from '@/lib/tower/ai-portfolio-inventory';
import { AgentHiddenDrawer } from '@/components/agents/AgentHiddenDrawer';

const CANONICAL_AGENTS: AgentMissionPanelAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];

// ---------------------------------------------------------------------------
// buildAgentHiddenDrawerView — default seed
// ---------------------------------------------------------------------------

describe('ACT3 — buildAgentHiddenDrawerView default seed', () => {
  let view: AgentHiddenDrawerView;

  beforeAll(() => {
    view = buildAgentHiddenDrawerView();
  });

  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('drawerState is collapsed', () => {
    expect(view.drawerState).toBe('collapsed');
  });

  it('panelView has variant hidden_drawer', () => {
    expect(view.panelView.variant).toBe('hidden_drawer');
  });

  it('totalMissions matches panelView.missions.length', () => {
    expect(view.totalMissions).toBe(view.panelView.missions.length);
  });

  it('totalMissions is a positive integer', () => {
    expect(view.totalMissions).toBeGreaterThan(0);
  });

  it('honestDisclaimer is non-empty', () => {
    expect(view.honestDisclaimer.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer matches the AG11 canonical disclaimer', () => {
    expect(view.honestDisclaimer).toContain('deterministic seed');
  });

  it('triggerLabel is non-empty', () => {
    expect(view.triggerLabel.length).toBeGreaterThan(0);
  });

  it('triggerLabel contains mission count', () => {
    expect(view.triggerLabel).toMatch(/\d+ mission/);
  });

  it('triggerLabel contains agent active count', () => {
    expect(view.triggerLabel).toMatch(/\d+ agent/);
  });
});

// ---------------------------------------------------------------------------
// agentSummaries
// ---------------------------------------------------------------------------

describe('ACT3 — agentSummaries', () => {
  let view: AgentHiddenDrawerView;

  beforeAll(() => {
    view = buildAgentHiddenDrawerView();
  });

  it('has exactly 4 agent summaries', () => {
    expect(view.agentSummaries.length).toBe(4);
  });

  it('agent summaries are in canonical order', () => {
    const keys = view.agentSummaries.map((s) => s.agent);
    expect(keys).toEqual(CANONICAL_AGENTS);
  });

  it('each summary has a non-empty displayLabel', () => {
    for (const s of view.agentSummaries) {
      expect(s.displayLabel.length).toBeGreaterThan(0);
    }
  });

  it('each summary missionCount is non-negative', () => {
    for (const s of view.agentSummaries) {
      expect(s.missionCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('sum of missionCounts equals totalMissions', () => {
    const total = view.agentSummaries.reduce((acc, s) => acc + s.missionCount, 0);
    expect(total).toBe(view.totalMissions);
  });

  it('isActive is boolean for each summary', () => {
    for (const s of view.agentSummaries) {
      expect(typeof s.isActive).toBe('boolean');
    }
  });

  it('activeAgents contains only canonical agents', () => {
    for (const agent of view.activeAgents) {
      expect(CANONICAL_AGENTS).toContain(agent);
    }
  });

  it('activeAgents matches agentSummaries.isActive', () => {
    const expected = view.agentSummaries.filter((s) => s.isActive).map((s) => s.agent);
    expect([...view.activeAgents]).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// priorityCounts
// ---------------------------------------------------------------------------

describe('ACT3 — priorityCounts', () => {
  let view: AgentHiddenDrawerView;

  beforeAll(() => {
    view = buildAgentHiddenDrawerView();
  });

  it('sum of priorityCounts equals totalMissions', () => {
    const sum =
      view.priorityCounts.critical +
      view.priorityCounts.high +
      view.priorityCounts.medium +
      view.priorityCounts.low;
    expect(sum).toBe(view.totalMissions);
  });

  it('all priority counts are non-negative', () => {
    expect(view.priorityCounts.critical).toBeGreaterThanOrEqual(0);
    expect(view.priorityCounts.high).toBeGreaterThanOrEqual(0);
    expect(view.priorityCounts.medium).toBeGreaterThanOrEqual(0);
    expect(view.priorityCounts.low).toBeGreaterThanOrEqual(0);
  });

  it('highestPriorityLabel is string or null', () => {
    expect(view.highestPriorityLabel === null || typeof view.highestPriorityLabel === 'string').toBe(
      true,
    );
  });

  it('highestPriorityLabel is set when any priority bucket is non-zero', () => {
    const hasAny =
      view.priorityCounts.critical > 0 ||
      view.priorityCounts.high > 0 ||
      view.priorityCounts.medium > 0 ||
      view.priorityCounts.low > 0;
    if (hasAny) {
      expect(view.highestPriorityLabel).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// portfolioContext
// ---------------------------------------------------------------------------

describe('ACT3 — portfolioContext', () => {
  let view: AgentHiddenDrawerView;

  beforeAll(() => {
    view = buildAgentHiddenDrawerView();
  });

  it('totalInventory is a positive integer', () => {
    expect(view.portfolioContext.totalInventory).toBeGreaterThan(0);
  });

  it('activeUseCases is non-negative', () => {
    expect(view.portfolioContext.activeUseCases).toBeGreaterThanOrEqual(0);
  });

  it('evaluatingUseCases is non-negative', () => {
    expect(view.portfolioContext.evaluatingUseCases).toBeGreaterThanOrEqual(0);
  });

  it('activeUseCases ≤ totalInventory', () => {
    expect(view.portfolioContext.activeUseCases).toBeLessThanOrEqual(
      view.portfolioContext.totalInventory,
    );
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('ACT3 — helpers', () => {
  let view: AgentHiddenDrawerView;

  beforeAll(() => {
    view = buildAgentHiddenDrawerView();
  });

  it('getDrawerTriggerLabel returns view.triggerLabel', () => {
    expect(getDrawerTriggerLabel(view)).toBe(view.triggerLabel);
  });

  it('getActivePriorityLabel returns a non-empty string', () => {
    const label = getActivePriorityLabel(view);
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it('getActivePriorityLabel returns "No missions" when totalMissions is 0 (edge case guard)', () => {
    // Build a fake view with empty missions to exercise the null path
    const emptyView = {
      ...view,
      totalMissions: 0,
      highestPriorityLabel: null,
    } as AgentHiddenDrawerView;
    expect(getActivePriorityLabel(emptyView)).toBe('No missions');
  });

  it('describeAgentHiddenDrawer returns a non-empty string', () => {
    const desc = describeAgentHiddenDrawer(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('describeAgentHiddenDrawer starts with "Hidden drawer"', () => {
    const desc = describeAgentHiddenDrawer(view);
    expect(desc).toMatch(/^Hidden drawer/);
  });

  it('describeAgentHiddenDrawer uses dot-separator format', () => {
    const desc = describeAgentHiddenDrawer(view);
    expect(desc).toContain(' · ');
  });

  it('describeAgentHiddenDrawer includes mission count', () => {
    const desc = describeAgentHiddenDrawer(view);
    expect(desc).toMatch(/\d+ mission/);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('ACT3 — determinism', () => {
  it('two calls produce identical JSON output', () => {
    const a = buildAgentHiddenDrawerView();
    const b = buildAgentHiddenDrawerView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('portfolioContext is byte-equal across calls', () => {
    const a = buildAgentHiddenDrawerView();
    const b = buildAgentHiddenDrawerView();
    expect(JSON.stringify(a.portfolioContext)).toBe(JSON.stringify(b.portfolioContext));
  });

  it('agentSummaries are byte-equal across calls', () => {
    const a = buildAgentHiddenDrawerView();
    const b = buildAgentHiddenDrawerView();
    expect(JSON.stringify(a.agentSummaries)).toBe(JSON.stringify(b.agentSummaries));
  });
});

// ---------------------------------------------------------------------------
// AgentHiddenDrawer — rendered
// ---------------------------------------------------------------------------

function renderDrawer(view?: AgentHiddenDrawerView): string {
  return renderToStaticMarkup(createElement(AgentHiddenDrawer, view ? { view } : {}));
}

/** The opening tag of the drawer's root element, attributes in source order. */
function rootTag(html: string): string {
  const match = html.match(/^<section\b[^>]*>/);
  if (!match) throw new Error(`drawer did not render a <section> root: ${html.slice(0, 120)}`);
  return match[0];
}

/** Every data-agent value rendered by an AgentBadge, in document order. */
function renderedBadgeAgents(html: string): string[] {
  return [...html.matchAll(/data-agent="([a-z]+)"/g)].map((m) => m[1]);
}

/** A view that differs from the seed on every field the component renders. */
function variantView(seed: AgentHiddenDrawerView): AgentHiddenDrawerView {
  return {
    ...seed,
    triggerLabel: '1 mission · 1 agent active',
    highestPriorityLabel: 'P4 · Low',
    agentSummaries: seed.agentSummaries.map((s) => ({ ...s, isActive: s.agent === 'steward' })),
    activeAgents: ['steward'],
    portfolioContext: { totalInventory: 7, activeUseCases: 3, evaluatingUseCases: 1 },
    honestDisclaimer: 'variant disclaimer for the prop case',
  };
}

describe('ACT3 — AgentHiddenDrawer renders the view it is given', () => {
  let view: AgentHiddenDrawerView;
  let html: string;

  beforeAll(() => {
    view = buildAgentHiddenDrawerView();
    html = renderDrawer();
  });

  it('root is a <section> carrying the act3 marker, the collapsed drawer state and an aria-label', () => {
    const tag = rootTag(html);
    expect(tag).toContain('data-agent-hidden-drawer="act3"');
    expect(tag).toContain(`data-drawer-state="${view.drawerState}"`);
    expect(tag).toContain('data-drawer-state="collapsed"');
    expect(tag).toContain('aria-label="Agent activity drawer"');
  });

  it('renders no aria-expanded anywhere — the drawer does not open, so it must not claim to', () => {
    expect(html).not.toContain('aria-expanded');
  });

  it('renders the trigger label, the highest-priority badge and the honest disclaimer', () => {
    expect(html).toContain(`>${view.triggerLabel}<`);
    expect(view.highestPriorityLabel).not.toBeNull();
    expect(html).toContain(`>${view.highestPriorityLabel}<`);
    expect(html).toContain(`>${view.honestDisclaimer}<`);
  });

  it('renders the portfolio line from portfolioContext', () => {
    expect(html).toContain(
      `${view.portfolioContext.activeUseCases} of ${view.portfolioContext.totalInventory} portfolio items active`,
    );
  });

  it('renders "drawer collapsed · open deferred"', () => {
    expect(html).toContain('>drawer collapsed · open deferred<');
  });

  it('renders one AgentBadge per ACTIVE agent, in canonical order, and none for an inactive one', () => {
    // Non-vacuity: the seed has at least one inactive agent, or this case
    // could not tell "active only" from "every agent".
    expect(view.agentSummaries.some((s) => !s.isActive)).toBe(true);
    expect(renderedBadgeAgents(html)).toEqual([...view.activeAgents]);
  });

  it('renders a supplied view prop instead of the seed', () => {
    const variant = variantView(view);
    const out = renderDrawer(variant);
    expect(out).toContain(`>${variant.triggerLabel}<`);
    expect(out).toContain(`>${variant.highestPriorityLabel}<`);
    expect(out).toContain(`>${variant.honestDisclaimer}<`);
    expect(out).toContain('3 of 7 portfolio items active');
    expect(renderedBadgeAgents(out)).toEqual(['steward']);
    expect(out).not.toContain(`>${view.triggerLabel}<`);
  });

  it('renders no priority badge when the view has no missions', () => {
    const empty: AgentHiddenDrawerView = {
      ...view,
      highestPriorityLabel: null,
      agentSummaries: view.agentSummaries.map((s) => ({ ...s, isActive: false })),
      activeAgents: [],
    };
    const out = renderDrawer(empty);
    for (const label of ['P1 · Critical', 'P2 · High', 'P3 · Medium', 'P4 · Low']) {
      expect(out).not.toContain(label);
    }
    expect(renderedBadgeAgents(out)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AgentHiddenDrawer — server component
// ---------------------------------------------------------------------------

describe('ACT3 — AgentHiddenDrawer is a server component', () => {
  it('can be called as a plain function with no React dispatcher', () => {
    // A hook (useState, useEffect, ...) called outside a render throws
    // "Invalid hook call". A server component uses none, so calling it
    // directly returns an element. This replaces the old grep for
    // 'use client' / useState / useEffect in the file text.
    let element: unknown;
    expect(() => {
      element = AgentHiddenDrawer({});
    }).not.toThrow();
    expect(isValidElement(element)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// View model — determinism and derivation
// ---------------------------------------------------------------------------

describe('ACT3 — view model determinism', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('output is identical under two different clocks and two different Math.random streams', () => {
    // A view that reads the clock (Date.now, new Date) or Math.random would
    // differ between these two builds. The old case grepped the file for
    // those names, which a reference held under another name walked past.
    jest.useFakeTimers({ now: new Date('2020-01-01T00:00:00Z') });
    jest.spyOn(Math, 'random').mockReturnValue(0.01);
    const a = JSON.stringify(buildAgentHiddenDrawerView());

    jest.setSystemTime(new Date('2031-06-15T12:34:56Z'));
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const b = JSON.stringify(buildAgentHiddenDrawerView());

    expect(b).toBe(a);
  });

  it('never calls fetch', () => {
    const fetchSpy = jest.fn(() => {
      throw new Error('agent-hidden-drawer-view must not fetch');
    });
    const g = globalThis as { fetch?: unknown };
    const original = g.fetch;
    g.fetch = fetchSpy;
    try {
      buildAgentHiddenDrawerView();
    } finally {
      g.fetch = original;
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('ACT3 — view model derivation', () => {
  it('panelView is the AG11 hidden_drawer seed', () => {
    expect(buildAgentHiddenDrawerView().panelView).toEqual(
      buildAgentMissionPanelSeedView('hidden_drawer'),
    );
  });

  it('portfolioContext is the ACT2 inventory: total, pilot+production+scaled, discovery', () => {
    const summary = summarizeAiPortfolioInventory(buildAiPortfolioInventory());
    expect(buildAgentHiddenDrawerView().portfolioContext).toEqual({
      totalInventory: summary.totalUseCases,
      activeUseCases:
        summary.byStage['pilot'] + summary.byStage['production'] + summary.byStage['scaled'],
      evaluatingUseCases: summary.byStage['discovery'],
    });
  });
});
