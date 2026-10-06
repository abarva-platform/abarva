/**
 * @jest-environment jsdom
 */

// AG11 - Agent Mission Panel test suite.
//
// T-495: this suite used to read AgentMissionPanel.tsx and agent-mission-view.ts
// as TEXT -- 28 of its 41 cases grepped for a data attribute, the literal
// `view.honestDisclaimer`, `aria-expanded="false"`, and the absence of
// `useState`, `Date.now`, `fetch(`, `<img`, emoji and a list of import paths.
// None of them rendered the panel, so a variant that dropped its missions, a
// count that disagreed with the list, or a chip that lied about priority all
// passed. Every case below either RENDERS the component or calls the view
// builder and reads what it returns. The 13 builder and label cases that were
// already behavioural are kept byte-for-byte. Rationale and mutation record:
// docs/architecture/t495-agent-mission-panel-triage.json.
//
// No network calls, no model providers, no time-of-day dependence.

import { Fragment, createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render } from '@testing-library/react';

import { AgentMissionPanel } from '@/components/agent/AgentMissionPanel';
import { COLORS } from '@/lib/design/abarva-theme';
import {
  AGENT_MISSION_PANEL_AGENTS,
  AGENT_MISSION_PANEL_VARIANTS,
  agentDisplayLabel,
  buildAgentMissionPanelSeedView,
  priorityChipLabel,
  stateChipLabel,
  summarizeAgentMissionPanelView,
  type AgentMissionPanelAgent,
  type AgentMissionPanelMission,
  type AgentMissionPanelVariant,
  type AgentMissionPanelView,
} from '@/lib/agent/agent-mission-view';

const DISCLAIMER = 'Mission queue is deterministic seed; runtime triggers deferred.';

function mission(
  id: string,
  over: Partial<AgentMissionPanelMission> = {},
): AgentMissionPanelMission {
  return {
    id,
    agent: 'nexus',
    type: 'evidence_gap',
    state: 'active',
    priority: 'medium',
    workObjectLabel: `Work object ${id}`,
    rationale: `Rationale for ${id}.`,
    recommendedAction: `Do the thing for ${id}.`,
    handoffTo: null,
    stopCondition: `Stop when ${id} is done.`,
    ...over,
  };
}

function viewOf(
  variant: AgentMissionPanelVariant,
  missions: readonly AgentMissionPanelMission[],
  surfaceLabel = `Surface ${variant}`,
): AgentMissionPanelView {
  return { variant, missions, surfaceLabel, honestDisclaimer: DISCLAIMER };
}

function renderPanel(view: AgentMissionPanelView): HTMLElement {
  render(createElement(AgentMissionPanel, { view }));
  const panels = document.querySelectorAll<HTMLElement>('[data-agent-mission-panel="ag11"]');
  expect(panels).toHaveLength(1);
  return panels[0]!;
}

/** A colour as jsdom normalises it, for comparing a rendered style with a token. */
function normalisedColor(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  return probe.style.color;
}

function missionNodes(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('[data-mission-id]'));
}

function missionIds(panel: HTMLElement): string[] {
  return missionNodes(panel).map((node) => node.getAttribute('data-mission-id')!);
}

function countText(panel: HTMLElement): string {
  const el = panel.querySelector('[data-mission-count="true"]');
  if (!el) throw new Error('mission count did not render');
  // The label, a separator dot and the count are sibling spans; join them the
  // way a reader sees them.
  return Array.from(el.children, (child) => child.textContent!.replace(/\s+/g, ' ').trim()).join(' ');
}

/**
 * Invokes every function component in the tree as a plain call, outside any
 * React render. With no dispatcher installed, a component that calls a hook
 * throws. Returns the names of the components it reached, so a case can prove
 * the walk was not vacuous.
 */
function callTreeOutsideRender(node: ReactNode, reached: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) {
    for (const child of node) callTreeOutsideRender(child, reached);
    return reached;
  }
  if (!isValidElement(node)) return reached;
  const { type, props } = node as { type: unknown; props: { children?: ReactNode } };
  if (typeof type === 'function') {
    reached.add((type as { name: string }).name);
    callTreeOutsideRender((type as (p: unknown) => ReactNode)(props), reached);
    return reached;
  }
  if (type === Fragment || typeof type === 'string') {
    callTreeOutsideRender(props.children, reached);
  }
  return reached;
}

const realFetch = (globalThis as { fetch?: unknown }).fetch;

afterEach(() => {
  (globalThis as { fetch?: unknown }).fetch = realFetch;
  cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------
// Determinism + seed coverage
// ---------------------------------------------------------------------

describe('buildAgentMissionPanelSeedView · determinism', () => {
  it('returns byte-equal serialized output across repeated calls per variant', () => {
    for (const variant of AGENT_MISSION_PANEL_VARIANTS) {
      const a = JSON.stringify(buildAgentMissionPanelSeedView(variant));
      const b = JSON.stringify(buildAgentMissionPanelSeedView(variant));
      const c = JSON.stringify(buildAgentMissionPanelSeedView(variant));
      expect(b).toBe(a);
      expect(c).toBe(a);
    }
  });

  it('exposes 5 canonical variants in canonical order', () => {
    expect(AGENT_MISSION_PANEL_VARIANTS).toEqual([
      'compact_strip',
      'right_panel',
      'inline_recommendation',
      'executive_brief',
      'hidden_drawer',
    ]);
  });

  it('exposes 4 canonical agents in canonical order', () => {
    expect(AGENT_MISSION_PANEL_AGENTS).toEqual([
      'nexus',
      'sentinel',
      'atlas',
      'steward',
    ]);
  });
});

describe('buildAgentMissionPanelSeedView · seed coverage', () => {
  it('produces at least one mission per variant', () => {
    for (const variant of AGENT_MISSION_PANEL_VARIANTS) {
      const view = buildAgentMissionPanelSeedView(variant);
      expect(view.missions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('represents all 4 agents at least once across the canonical seed (right_panel)', () => {
    const view = buildAgentMissionPanelSeedView('right_panel');
    const seen = new Set<AgentMissionPanelAgent>();
    for (const mission of view.missions) {
      seen.add(mission.agent);
    }
    for (const agent of AGENT_MISSION_PANEL_AGENTS) {
      expect(seen.has(agent)).toBe(true);
    }
  });

  it('represents all 4 agents in the executive_brief seed', () => {
    const view = buildAgentMissionPanelSeedView('executive_brief');
    const seen = new Set<AgentMissionPanelAgent>();
    for (const mission of view.missions) {
      seen.add(mission.agent);
    }
    for (const agent of AGENT_MISSION_PANEL_AGENTS) {
      expect(seen.has(agent)).toBe(true);
    }
  });

  it('represents all 4 agents in the compact_strip seed', () => {
    const view = buildAgentMissionPanelSeedView('compact_strip');
    const seen = new Set<AgentMissionPanelAgent>();
    for (const mission of view.missions) {
      seen.add(mission.agent);
    }
    for (const agent of AGENT_MISSION_PANEL_AGENTS) {
      expect(seen.has(agent)).toBe(true);
    }
  });

  it('every mission has non-empty rationale, recommendedAction, and stopCondition', () => {
    const view = buildAgentMissionPanelSeedView('right_panel');
    for (const mission of view.missions) {
      expect(mission.rationale.length).toBeGreaterThan(0);
      expect(mission.recommendedAction.length).toBeGreaterThan(0);
      expect(mission.stopCondition.length).toBeGreaterThan(0);
    }
  });

  it('every mission id starts with ag11-seed-', () => {
    const view = buildAgentMissionPanelSeedView('right_panel');
    for (const mission of view.missions) {
      expect(mission.id.startsWith('ag11-seed-')).toBe(true);
    }
  });
});

describe('buildAgentMissionPanelSeedView · what each variant is given', () => {
  const FOUR = [
    'ag11-seed-nexus-next-action',
    'ag11-seed-sentinel-evidence-gap',
    'ag11-seed-atlas-executive-brief',
    'ag11-seed-steward-gate-check',
  ];

  it('gives the right panel and the drawer the full nine-mission seed, and the other three one mission per agent', () => {
    const full = buildAgentMissionPanelSeedView('right_panel').missions.map((m) => m.id);
    expect(full).toHaveLength(9);
    expect(new Set(full).size).toBe(9);
    expect(buildAgentMissionPanelSeedView('hidden_drawer').missions.map((m) => m.id)).toEqual(full);
    for (const variant of ['compact_strip', 'inline_recommendation', 'executive_brief'] as const) {
      expect(buildAgentMissionPanelSeedView(variant).missions.map((m) => m.id)).toEqual(FOUR);
    }
  });

  it('reports the requested variant, the canonical disclaimer, a per-variant label, and an override label when one is passed', () => {
    const labels = new Set<string>();
    for (const variant of AGENT_MISSION_PANEL_VARIANTS) {
      const view = buildAgentMissionPanelSeedView(variant);
      expect(view.variant).toBe(variant);
      expect(view.honestDisclaimer).toBe(DISCLAIMER);
      labels.add(view.surfaceLabel);
      expect(buildAgentMissionPanelSeedView(variant, 'Custom surface').surfaceLabel).toBe('Custom surface');
    }
    expect(labels.size).toBe(AGENT_MISSION_PANEL_VARIANTS.length);
  });

  it('does not read the clock, Math.random or the network', () => {
    const before = AGENT_MISSION_PANEL_VARIANTS.map((v) => JSON.stringify(buildAgentMissionPanelSeedView(v)));
    jest.useFakeTimers({ now: new Date('2031-01-01T00:00:00Z') });
    jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called');
    });
    const fetchSpy = jest.fn(() => {
      throw new Error('fetch called');
    });
    (globalThis as { fetch?: unknown }).fetch = fetchSpy;
    const after = AGENT_MISSION_PANEL_VARIANTS.map((v) => JSON.stringify(buildAgentMissionPanelSeedView(v)));
    expect(after).toEqual(before);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------
// Summarize + display labels
// ---------------------------------------------------------------------

describe('summarizeAgentMissionPanelView', () => {
  it('reconciles totals with byAgent and byPriority sums', () => {
    const view = buildAgentMissionPanelSeedView('right_panel');
    const summary = summarizeAgentMissionPanelView(view);
    const byAgentSum = Object.values(summary.byAgent).reduce(
      (a, b) => a + b,
      0,
    );
    const byPrioritySum = Object.values(summary.byPriority).reduce(
      (a, b) => a + b,
      0,
    );
    expect(byAgentSum).toBe(summary.totalMissions);
    expect(byPrioritySum).toBe(summary.totalMissions);
    expect(summary.totalMissions).toBe(view.missions.length);
  });

  it('puts each mission in its own agent and priority bucket, not merely a bucket that sums right', () => {
    const summary = summarizeAgentMissionPanelView(
      viewOf('right_panel', [
        mission('a', { agent: 'atlas', priority: 'low' }),
        mission('b', { agent: 'atlas', priority: 'critical' }),
        mission('c', { agent: 'steward', priority: 'low' }),
      ]),
    );
    expect(summary).toEqual({
      totalMissions: 3,
      byAgent: { nexus: 0, sentinel: 0, atlas: 2, steward: 1 },
      byPriority: { critical: 1, high: 0, medium: 0, low: 2 },
    });
  });
});

describe('agentDisplayLabel / priorityChipLabel / stateChipLabel', () => {
  it('returns canonical display labels per agent', () => {
    expect(agentDisplayLabel('nexus')).toBe('Nexus');
    expect(agentDisplayLabel('sentinel')).toBe('Sentinel');
    expect(agentDisplayLabel('atlas')).toBe('Atlas');
    expect(agentDisplayLabel('steward')).toBe('Steward');
  });

  it('returns canonical priority chip labels with P-tier prefix', () => {
    expect(priorityChipLabel('critical')).toBe('P1 · Critical');
    expect(priorityChipLabel('high')).toBe('P2 · High');
    expect(priorityChipLabel('medium')).toBe('P3 · Medium');
    expect(priorityChipLabel('low')).toBe('P4 · Low');
  });

  it('returns canonical state chip labels', () => {
    expect(stateChipLabel('proposed')).toBe('Proposed');
    expect(stateChipLabel('active')).toBe('Active');
    expect(stateChipLabel('waiting')).toBe('Waiting');
    expect(stateChipLabel('blocked')).toBe('Blocked');
    expect(stateChipLabel('completed')).toBe('Completed');
    expect(stateChipLabel('dismissed')).toBe('Dismissed');
    expect(stateChipLabel('escalated')).toBe('Escalated');
    expect(stateChipLabel('deferred')).toBe('Deferred');
  });
});

// ---------------------------------------------------------------------
// Component: every variant, rendered
// ---------------------------------------------------------------------

describe('AgentMissionPanel · every variant renders its own panel', () => {
  it.each(AGENT_MISSION_PANEL_VARIANTS)(
    '%s renders one ag11 region carrying its variant, its surface label and the disclaimer',
    (variant: AgentMissionPanelVariant) => {
      const view = buildAgentMissionPanelSeedView(variant, `Label for ${variant}`);
      const panel = renderPanel(view);
      expect(panel.getAttribute('data-agent-mission-panel-variant')).toBe(variant);
      expect(panel.getAttribute('aria-label')).toBe(`Label for ${variant}`);
      const disclaimers = panel.querySelectorAll('[data-honest-disclaimer="true"]');
      expect(disclaimers).toHaveLength(1);
      expect(disclaimers[0]!.textContent).toBe(DISCLAIMER);
    },
  );

  it('renders the disclaimer the view carries, not a constant', () => {
    const panel = renderPanel({ ...viewOf('right_panel', [mission('x')]), honestDisclaimer: 'Supplied disclaimer.' });
    expect(panel.querySelector('[data-honest-disclaimer="true"]')!.textContent).toBe('Supplied disclaimer.');
  });

  it('only the hidden drawer is a collapsed shell', () => {
    for (const variant of AGENT_MISSION_PANEL_VARIANTS) {
      const panel = renderPanel(buildAgentMissionPanelSeedView(variant));
      expect(panel.getAttribute('aria-expanded')).toBe(variant === 'hidden_drawer' ? 'false' : null);
      cleanup();
    }
  });

  it('renders no image, emoji, chatbot phrasing or placeholder copy in any seed variant', () => {
    for (const variant of AGENT_MISSION_PANEL_VARIANTS) {
      const panel = renderPanel(buildAgentMissionPanelSeedView(variant));
      expect(panel.querySelectorAll('img')).toHaveLength(0);
      const text = panel.textContent!;
      expect(text.length).toBeGreaterThan(DISCLAIMER.length);
      expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)).toBe(false);
      expect(/\b(chat|ask\s+me)\b/i.test(text)).toBe(false);
      expect(/Coming\s+soon|\bTBD\b|Lorem\s+ipsum/i.test(text)).toBe(false);
      cleanup();
    }
  });
});

describe('AgentMissionPanel · compact strip', () => {
  it('counts the queue, badges every mission by agent and type, and leads with the first mission', () => {
    const missions = [
      mission('m1', { agent: 'sentinel', type: 'vendor_response_gap', workObjectLabel: 'Lead object' }),
      mission('m2', { agent: 'atlas', type: 'value_risk' }),
      mission('m3', { agent: 'steward', type: 'gate_check' }),
    ];
    const panel = renderPanel(viewOf('compact_strip', missions));
    expect(countText(panel)).toBe('Surface compact_strip · 3 missions queued');
    expect(missionIds(panel)).toEqual(['m1', 'm2', 'm3']);
    const badges = missionNodes(panel).map((node) => {
      const badge = node.querySelector('[data-agent]')!;
      return [badge.getAttribute('data-agent'), badge.getAttribute('data-status')];
    });
    expect(badges).toEqual([
      ['sentinel', 'vendor response gap'],
      ['atlas', 'value risk'],
      ['steward', 'gate check'],
    ]);
    expect(panel.textContent).toContain('Sentinel·Lead object');
    expect(panel.textContent).not.toContain('Work object m2');
  });

  it('says "1 mission" for one, and renders no lead line for an empty queue', () => {
    let panel = renderPanel(viewOf('compact_strip', [mission('solo')]));
    expect(countText(panel)).toBe('Surface compact_strip · 1 mission queued');
    cleanup();
    panel = renderPanel(viewOf('compact_strip', []));
    expect(countText(panel)).toBe('Surface compact_strip · 0 missions queued');
    expect(panel.querySelector('strong')).toBeNull();
    expect(missionNodes(panel)).toHaveLength(0);
  });
});

describe('AgentMissionPanel · right panel', () => {
  it('renders one card per mission, in order, each with its whole mission', () => {
    const missions = [
      mission('r1', { agent: 'atlas', type: 'executive_brief', state: 'escalated', priority: 'critical' }),
      mission('r2', { agent: 'steward', type: 'approval_follow_up', state: 'deferred', priority: 'low' }),
      mission('r3', { agent: 'nexus', type: 'next_action', state: 'blocked', priority: 'high' }),
    ];
    const panel = renderPanel(viewOf('right_panel', missions));
    expect(countText(panel)).toBe('Surface right_panel · 3 missions queued');
    const cards = panel.querySelectorAll<HTMLElement>('article[data-mission-id]');
    expect(Array.from(cards).map((c) => c.getAttribute('data-mission-id'))).toEqual(['r1', 'r2', 'r3']);
    cards.forEach((card, i) => {
      const m = missions[i]!;
      const text = card.textContent!;
      expect(card.querySelector('[data-agent]')!.getAttribute('data-agent')).toBe(m.agent);
      expect(card.querySelector('[data-mission-type]')!.textContent).toBe(m.type.replace(/_/g, ' '));
      expect(card.querySelector('[data-priority]')!.getAttribute('data-priority')).toBe(m.priority);
      expect(card.querySelector('[data-priority]')!.textContent).toBe(priorityChipLabel(m.priority));
      expect(card.querySelector('[data-state]')!.getAttribute('data-state')).toBe(m.state);
      expect(card.querySelector('[data-state]')!.textContent).toBe(stateChipLabel(m.state));
      expect(text).toContain(m.workObjectLabel);
      expect(text).toContain(m.rationale);
      expect(text).toContain(m.recommendedAction);
      expect(text).toContain(`stops when · ${m.stopCondition}`);
    });
  });

  it('renders every mission of the nine-mission seed', () => {
    const view = buildAgentMissionPanelSeedView('right_panel');
    const panel = renderPanel(view);
    expect(missionIds(panel)).toEqual(view.missions.map((m) => m.id));
    expect(countText(panel)).toBe('Mission panel · 9 missions queued');
  });

  it('colours the priority chip navy for critical and high only', () => {
    const priorities = ['critical', 'high', 'medium', 'low'] as const;
    const panel = renderPanel(
      viewOf('right_panel', priorities.map((p) => mission(`p-${p}`, { priority: p }))),
    );
    const colors = priorities.map(
      (p) => panel.querySelector<HTMLElement>(`[data-priority="${p}"]`)!.style.color,
    );
    expect(colors).toEqual([
      normalisedColor(COLORS.navy),
      normalisedColor(COLORS.navy),
      normalisedColor(COLORS.muted),
      normalisedColor(COLORS.muted),
    ]);
  });
});

describe('AgentMissionPanel · inline recommendation', () => {
  it('renders the first mission only', () => {
    const panel = renderPanel(
      viewOf('inline_recommendation', [
        mission('first', { agent: 'atlas', priority: 'low' }),
        mission('second', { agent: 'nexus', priority: 'critical' }),
      ]),
    );
    const text = panel.textContent!;
    expect(text).toContain('Rationale for first.');
    expect(text).toContain('Do the thing for first.');
    expect(text).not.toContain('second');
    expect(panel.querySelector('[data-agent]')!.getAttribute('data-agent')).toBe('atlas');
    expect(panel.querySelectorAll('[data-priority]')).toHaveLength(1);
    expect(panel.querySelector('[data-priority]')!.getAttribute('data-priority')).toBe('low');
  });

  it('says there is no recommendation for an empty queue', () => {
    const panel = renderPanel(viewOf('inline_recommendation', []));
    expect(panel.textContent).toContain('No agent recommendation right now.');
    expect(panel.querySelector('[data-agent]')).toBeNull();
  });
});

describe('AgentMissionPanel · executive brief', () => {
  it('states the queue in numbers and lists the first three missions only', () => {
    const missions = [
      mission('e1', { agent: 'atlas', priority: 'critical', workObjectLabel: 'Object one' }),
      mission('e2', { agent: 'atlas', priority: 'high' }),
      mission('e3', { agent: 'steward', priority: 'medium' }),
      mission('e4', { agent: 'nexus', priority: 'low' }),
      mission('e5', { agent: 'nexus', priority: 'high' }),
    ];
    const panel = renderPanel(viewOf('executive_brief', missions, 'Board view'));
    expect(panel.querySelector('h2')!.textContent).toBe('Board view');
    const stats = Array.from(
      panel.querySelector('[data-summary-stat-row="true"]')!.children,
      (stat) => Array.from(stat.children, (c) => c.textContent),
    );
    // 5 queued, 1 critical, 2 high, 3 distinct agents -- all four differ, so a
    // stat that reads the wrong bucket cannot land on the right number.
    expect(stats).toEqual([
      ['5', 'Missions queued'],
      ['1', 'Critical'],
      ['2', 'High'],
      ['3', 'Agents'],
    ]);
    expect(missionIds(panel)).toEqual(['e1', 'e2', 'e3']);
    const first = missionNodes(panel)[0]!.textContent!;
    expect(first).toContain('Decision · Object one');
    expect(first).toContain('Rationale for e1.');
    expect(first).toContain('Recommended · Do the thing for e1.');
  });
});

describe('AgentMissionPanel · hidden drawer', () => {
  it('shows the count and nothing of the missions themselves', () => {
    const view = buildAgentMissionPanelSeedView('hidden_drawer');
    const panel = renderPanel(view);
    expect(panel.textContent).toContain(`${view.missions.length} missions queued`);
    expect(panel.textContent).toContain('drawer collapsed · open deferred');
    expect(missionNodes(panel)).toHaveLength(0);
    for (const m of view.missions) {
      expect(panel.textContent).not.toContain(m.recommendedAction);
      expect(panel.textContent).not.toContain(m.workObjectLabel);
    }
  });

  it('counts a supplied queue, not the seed', () => {
    const panel = renderPanel(viewOf('hidden_drawer', [mission('d1'), mission('d2')]));
    expect(panel.textContent).toContain('2 missions queued');
  });
});

// ---------------------------------------------------------------------
// Component: server-component properties, observed
// ---------------------------------------------------------------------

describe('AgentMissionPanel · server-component properties', () => {
  it.each(AGENT_MISSION_PANEL_VARIANTS)(
    '%s calls no hook anywhere in its tree (every component invoked outside a render)',
    (variant: AgentMissionPanelVariant) => {
      const reached = callTreeOutsideRender(
        createElement(AgentMissionPanel, { view: buildAgentMissionPanelSeedView(variant) }),
      );
      expect(reached.has('AgentMissionPanel')).toBe(true);
      expect(reached.has('HonestDisclaimer')).toBe(true);
      if (variant !== 'hidden_drawer') {
        expect(reached.has('AgentBadge')).toBe(true);
        expect(reached.has('PriorityChip') || variant === 'compact_strip').toBe(true);
      }
      if (variant === 'right_panel') {
        for (const name of ['MissionCard', 'TypeChip', 'StateChip', 'MissionCount']) {
          expect(reached.has(name)).toBe(true);
        }
      }
    },
  );

  it('renders byte-equal markup under a different clock, with Math.random and fetch throwing', () => {
    const markup = () =>
      AGENT_MISSION_PANEL_VARIANTS.map((v) =>
        renderToStaticMarkup(createElement(AgentMissionPanel, { view: buildAgentMissionPanelSeedView(v) })),
      );
    jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    const first = markup();
    jest.setSystemTime(new Date('2040-06-15T12:34:56Z'));
    jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called');
    });
    const fetchSpy = jest.fn(() => {
      throw new Error('fetch called');
    });
    (globalThis as { fetch?: unknown }).fetch = fetchSpy;
    expect(markup()).toEqual(first);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
