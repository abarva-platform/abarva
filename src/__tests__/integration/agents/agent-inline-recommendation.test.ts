/**
 * @jest-environment jsdom
 */

// AgentInlineRecommendation — the inline "Agent recommendations" card and the
// view model it renders.
//
// T-495: this suite used to read AgentInlineRecommendation.tsx and its view
// module as TEXT — grepping for a data attribute, `aria-label`, the absence of
// `useState`, an import path — and every builder case ran over the AG11 seed,
// in which all four missions are critical or high. So the non-urgent branch
// (medium/low confidence, no urgent chip, the quiet row accent) was never
// reached, and "isUrgent only for critical/high" could not see a false case.
// Every case below either RENDERS the component or runs the builder over
// missions the case controls. Rationale and mutation record:
// docs/architecture/t495-agent-inline-recommendation-triage.json.

import { createElement } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';

import { AgentInlineRecommendation } from '@/components/agents/AgentInlineRecommendation';
import { normalizeAIConfidenceTier } from '@/components/abarva/AIConfidenceIndicator';
import { COLORS } from '@/lib/design/abarva-theme';
import {
  buildAgentInlineRecommendationView,
  describeInlineRecommendation,
  getRecommendationsByAgent,
  getTopRecommendation,
  getUrgentRecommendations,
  type AgentInlineRecommendationView,
  type AgentMissionPanelMission,
} from '@/lib/agent/agent-inline-recommendation-view';

// ── Seam ─────────────────────────────────────────────────────────────────
// The builder's only input is buildAgentMissionPanelSeedView. It is wrapped,
// not replaced: with no override the real seed flows through, so the seed
// cases below run the real module; with an override a case supplies its own
// missions and the real label helpers still format them.

let mockMissionOverride: readonly AgentMissionPanelMission[] | null = null;
const mockSeedViewCalls: unknown[][] = [];

jest.mock('@/lib/agent/agent-mission-view', () => {
  const actual = jest.requireActual('@/lib/agent/agent-mission-view');
  return {
    ...actual,
    buildAgentMissionPanelSeedView: (...args: unknown[]) => {
      mockSeedViewCalls.push(args);
      const real = actual.buildAgentMissionPanelSeedView(...args);
      return mockMissionOverride === null ? real : { ...real, missions: mockMissionOverride };
    },
  };
});

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
    handoffTo: 'steward',
    stopCondition: `Stop when ${id} is done.`,
    ...over,
  } as AgentMissionPanelMission;
}

function buildWith(missions: readonly AgentMissionPanelMission[]): AgentInlineRecommendationView {
  mockMissionOverride = missions;
  try {
    return buildAgentInlineRecommendationView();
  } finally {
    mockMissionOverride = null;
  }
}

/** A style value as jsdom normalises it, for comparing against a token. */
function normalisedBorderLeft(value: string): string {
  const probe = document.createElement('div');
  probe.style.borderLeft = value;
  return probe.style.borderLeft;
}

function card(): HTMLElement {
  const el = document.querySelector<HTMLElement>('[data-agent-inline-recommendation="act2"]');
  if (!el) throw new Error('inline recommendation card did not render');
  return el;
}

/** Each rendered recommendation row, found by the agent badge it carries. */
function rows(): HTMLElement[] {
  return Array.from(card().querySelectorAll<HTMLElement>('span[data-agent]')).map(
    (badge) => badge.parentElement!.parentElement as HTMLElement,
  );
}

beforeEach(() => {
  mockMissionOverride = null;
  mockSeedViewCalls.length = 0;
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// ── Builder over the real seed ───────────────────────────────────────────

describe('buildAgentInlineRecommendationView over the AG11 seed', () => {
  it('asks the mission view for the inline_recommendation variant and reports it', () => {
    const view = buildAgentInlineRecommendationView();
    expect(mockSeedViewCalls).toEqual([['inline_recommendation']]);
    expect(view.panelView.variant).toBe('inline_recommendation');
    expect(view.deterministicSeed).toBe(true);
  });

  it('surfaces one recommendation per agent, in seed order, with unique ids', () => {
    const view = buildAgentInlineRecommendationView();
    expect(view.allRecommendations.map((r) => r.mission.agent)).toEqual([
      'nexus',
      'sentinel',
      'atlas',
      'steward',
    ]);
    expect(view.recommendationCount).toBe(4);
    expect(new Set(view.allRecommendations.map((r) => r.mission.id)).size).toBe(4);
    expect(view.topRecommendation).toBe(view.allRecommendations[0]);
  });

  it('carries the panel disclaimer and the section label through unchanged', () => {
    const view = buildAgentInlineRecommendationView();
    expect(view.honestDisclaimer).toBe(view.panelView.honestDisclaimer);
    expect(view.honestDisclaimer).toMatch(/deterministic/);
    expect(view.sectionLabel).toBe('Agent recommendations');
  });

  it('is byte-equal across calls even when the clock, the RNG and fetch all move or throw', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const first = JSON.stringify(buildAgentInlineRecommendationView());

    jest.setSystemTime(new Date('2031-06-15T12:34:56Z'));
    jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called by a deterministic builder');
    });
    const originalFetch = (globalThis as { fetch?: unknown }).fetch;
    (globalThis as { fetch?: unknown }).fetch = () => {
      throw new Error('fetch called by a deterministic builder');
    };
    try {
      expect(JSON.stringify(buildAgentInlineRecommendationView())).toBe(first);
    } finally {
      (globalThis as { fetch?: unknown }).fetch = originalFetch;
    }
  });
});

// ── Builder over controlled missions ─────────────────────────────────────

describe('buildAgentInlineRecommendationView over controlled missions', () => {
  it.each([
    ['critical', 'P1 · Critical', 'high', true],
    ['high', 'P2 · High', 'high', true],
    ['medium', 'P3 · Medium', 'medium', false],
    ['low', 'P4 · Low', 'low', false],
  ] as const)(
    'a %s mission is labelled %s, confidence %s, urgent %s',
    (priority, priorityLabel, confidence, isUrgent) => {
      const [item] = buildWith([mission('m1', { priority })]).allRecommendations;
      expect(item).toMatchObject({ priorityLabel, confidence, isUrgent });
    },
  );

  it('formats agent, state and type labels from the mission', () => {
    const [item] = buildWith([
      mission('m1', { agent: 'sentinel', state: 'waiting', type: 'vendor_response_gap' }),
    ]).allRecommendations;
    expect(item).toMatchObject({
      agentDisplayLabel: 'Sentinel',
      stateLabel: 'Waiting',
      typeLabel: 'Vendor Response Gap',
    });
  });

  it('keeps the order it was given: the top recommendation is the first, not the most urgent', () => {
    const view = buildWith([
      mission('low-first', { priority: 'low' }),
      mission('critical-second', { priority: 'critical' }),
    ]);
    expect(view.topRecommendation?.mission.id).toBe('low-first');
    expect(view.allRecommendations.map((r) => r.mission.id)).toEqual([
      'low-first',
      'critical-second',
    ]);
  });

  it('is urgent when ANY recommendation is urgent, and not when none is', () => {
    expect(
      buildWith([mission('a', { priority: 'low' }), mission('b', { priority: 'high' })])
        .hasUrgentRecommendation,
    ).toBe(true);
    expect(
      buildWith([mission('a', { priority: 'low' }), mission('b', { priority: 'medium' })])
        .hasUrgentRecommendation,
    ).toBe(false);
  });

  it('an empty queue yields no top recommendation, a zero count and no urgency', () => {
    const view = buildWith([]);
    expect(view.topRecommendation).toBeNull();
    expect(view.allRecommendations).toEqual([]);
    expect(view.recommendationCount).toBe(0);
    expect(view.hasUrgentRecommendation).toBe(false);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────

describe('view helpers', () => {
  const mixed = () =>
    buildWith([
      mission('nexus-low', { agent: 'nexus', priority: 'low' }),
      mission('atlas-critical', { agent: 'atlas', priority: 'critical' }),
      mission('nexus-high', { agent: 'nexus', priority: 'high' }),
      mission('steward-medium', { agent: 'steward', priority: 'medium' }),
    ]);

  it('getTopRecommendation returns the first item, and null on an empty queue', () => {
    expect(getTopRecommendation(mixed())?.mission.id).toBe('nexus-low');
    expect(getTopRecommendation(buildWith([]))).toBeNull();
  });

  it('getRecommendationsByAgent returns exactly that agent\'s items, in order', () => {
    const view = mixed();
    expect(getRecommendationsByAgent(view, 'nexus').map((r) => r.mission.id)).toEqual([
      'nexus-low',
      'nexus-high',
    ]);
    expect(getRecommendationsByAgent(view, 'sentinel')).toEqual([]);
  });

  it('getUrgentRecommendations returns exactly the critical and high items', () => {
    expect(getUrgentRecommendations(mixed()).map((r) => r.mission.id)).toEqual([
      'atlas-critical',
      'nexus-high',
    ]);
  });

  it.each([
    ['the seed', () => buildAgentInlineRecommendationView(), 'Agent recommendations · 4 items · 4 urgent'],
    ['a mixed queue', mixed, 'Agent recommendations · 4 items · 2 urgent'],
    ['one quiet item', () => buildWith([mission('only', { priority: 'low' })]), 'Agent recommendations · 1 item'],
    ['an empty queue', () => buildWith([]), 'Agent recommendations · 0 items'],
  ])('describeInlineRecommendation over %s', (_label, build, expected) => {
    expect(describeInlineRecommendation(build())).toBe(expected);
  });
});

// ── The rendered card ────────────────────────────────────────────────────

describe('AgentInlineRecommendation rendered with no view', () => {
  it('renders the seed as a labelled region with one row per recommendation', () => {
    render(createElement(AgentInlineRecommendation));
    const region = screen.getByRole('region', { name: 'Agent recommendations' });
    expect(region).toBe(card());
    expect(rows().map((row) => row.querySelector('[data-agent]')!.getAttribute('data-agent'))).toEqual([
      'nexus',
      'sentinel',
      'atlas',
      'steward',
    ]);
  });

  it('shows each recommendation\'s action, rationale, priority, state and confidence in its own row', () => {
    render(createElement(AgentInlineRecommendation));
    const seed = buildAgentInlineRecommendationView();
    const rendered = rows();
    expect(rendered).toHaveLength(seed.allRecommendations.length);
    seed.allRecommendations.forEach((item, i) => {
      const row = within(rendered[i]!);
      expect(row.getByText(item.mission.recommendedAction)).toBeTruthy();
      expect(row.getByText(item.mission.rationale)).toBeTruthy();
      expect(row.getByText(item.priorityLabel)).toBeTruthy();
      expect(row.getByText(item.stateLabel)).toBeTruthy();
      expect(
        rendered[i]!.querySelector('[data-ai-confidence-tier]')!.getAttribute('data-ai-confidence-tier'),
      ).toBe(normalizeAIConfidenceTier(item.confidence));
      expect(rendered[i]!.querySelector('[data-agent]')!.getAttribute('data-status')).toBe(
        item.mission.type.replace(/_/g, ' '),
      );
    });
  });

  it('shows the urgent chip, the AI-suggested label and the honest disclaimer', () => {
    render(createElement(AgentInlineRecommendation));
    const region = within(card());
    expect(region.getByText('urgent')).toBeTruthy();
    expect(card().querySelector('[data-ai-label-status]')!.getAttribute('data-ai-label-status')).toBe(
      'suggested',
    );
    expect(region.getByText(buildAgentInlineRecommendationView().honestDisclaimer)).toBeTruthy();
  });
});

describe('AgentInlineRecommendation rendered with a supplied view', () => {
  it('a queue with nothing urgent shows no urgent chip, and every row takes the quiet accent', () => {
    const view = buildWith([
      mission('quiet-1', { priority: 'medium' }),
      mission('quiet-2', { agent: 'atlas', priority: 'low' }),
    ]);
    render(createElement(AgentInlineRecommendation, { view }));
    expect(within(card()).queryByText('urgent')).toBeNull();
    expect(rows()).toHaveLength(2);
    for (const row of rows()) {
      expect(row.style.borderLeft).toBe(normalisedBorderLeft(`2px solid ${COLORS.border}`));
    }
    expect(
      rows().map((row) => row.querySelector('[data-ai-confidence-tier]')!.getAttribute('data-ai-confidence-tier')),
    ).toEqual([normalizeAIConfidenceTier('medium'), normalizeAIConfidenceTier('low')]);
  });

  it('an urgent row takes the navy accent and a quiet row beside it does not', () => {
    const view = buildWith([
      mission('urgent', { priority: 'critical' }),
      mission('quiet', { priority: 'low' }),
    ]);
    render(createElement(AgentInlineRecommendation, { view }));
    const [urgentRow, quietRow] = rows();
    expect(urgentRow!.style.borderLeft).toBe(normalisedBorderLeft(`2px solid ${COLORS.navy}`));
    expect(quietRow!.style.borderLeft).toBe(normalisedBorderLeft(`2px solid ${COLORS.border}`));
    expect(within(card()).getByText('urgent')).toBeTruthy();
  });

  it('renders the supplied view, not the seed', () => {
    const view = buildWith([mission('supplied', { agent: 'steward' })]);
    render(createElement(AgentInlineRecommendation, { view }));
    expect(screen.getByText('Do the thing for supplied.')).toBeTruthy();
    expect(screen.queryByText(buildAgentInlineRecommendationView().allRecommendations[0]!.mission.recommendedAction)).toBeNull();
  });

  it('an empty queue says so, renders no rows, and still shows the disclaimer', () => {
    const view = buildWith([]);
    render(createElement(AgentInlineRecommendation, { view }));
    expect(within(card()).getByText('No agent recommendations right now.')).toBeTruthy();
    expect(rows()).toEqual([]);
    expect(within(card()).getByText(view.honestDisclaimer)).toBeTruthy();
    expect(within(card()).queryByText('urgent')).toBeNull();
  });
});

describe('AgentInlineRecommendation is a hook-free server component', () => {
  it('can be called as a plain function outside any React render', () => {
    // A hook called outside a render throws "Invalid hook call"; a server
    // component with no hooks returns its element tree.
    const element = AgentInlineRecommendation({}) as { type: unknown; props: Record<string, unknown> };
    expect(element.type).toBe('section');
    expect(element.props['data-agent-inline-recommendation']).toBe('act2');
    expect(element.props['aria-label']).toBe('Agent recommendations');
  });
});
