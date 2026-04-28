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
 *   - Component source attribute checks
 *   - Module hygiene: no Date.now / Math.random / fetch / new Date
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildAgentHiddenDrawerView,
  getDrawerTriggerLabel,
  getActivePriorityLabel,
  describeAgentHiddenDrawer,
  type AgentHiddenDrawerView,
  type AgentMissionPanelAgent,
} from '@/lib/agent/agent-hidden-drawer-view';

const root = process.cwd();
const VIEW_SOURCE_PATH = 'src/lib/agent/agent-hidden-drawer-view.ts';
const COMPONENT_SOURCE_PATH = 'src/components/agents/AgentHiddenDrawer.tsx';

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
// Component source attribute checks
// ---------------------------------------------------------------------------

describe('ACT3 — AgentHiddenDrawer component source checks', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(resolve(root, COMPONENT_SOURCE_PATH), 'utf8');
  });

  it('has data-agent-hidden-drawer="act3" attribute', () => {
    expect(source).toMatch(/data-agent-hidden-drawer=["']act3["']/);
  });

  it('keeps collapsed state in data attributes without unsupported aria-expanded', () => {
    expect(source).toMatch(/data-drawer-state={view.drawerState}/);
    expect(source).not.toMatch(/aria-expanded=/);
  });

  it('has aria-label for the drawer', () => {
    expect(source).toMatch(/aria-label/);
  });

  it('has data-drawer-state attribute', () => {
    expect(source).toMatch(/data-drawer-state/);
  });

  it('does not have "use client"', () => {
    expect(source).not.toMatch(/'use client'/);
    expect(source).not.toMatch(/"use client"/);
  });

  it('does not use useState or useEffect', () => {
    expect(source).not.toMatch(/useState|useEffect/);
  });

  it('imports from abarva-theme', () => {
    expect(source).toMatch(/@\/lib\/design\/abarva-theme/);
  });

  it('imports AgentBadge from @/components/abarva/AgentBadge', () => {
    expect(source).toMatch(/@\/components\/abarva\/AgentBadge/);
  });

  it('shows "drawer collapsed · open deferred"', () => {
    expect(source).toMatch(/drawer collapsed/);
    expect(source).toMatch(/open deferred/);
  });
});

// ---------------------------------------------------------------------------
// Module hygiene — view model
// ---------------------------------------------------------------------------

describe('ACT3 — view model module hygiene', () => {
  let source: string;

  beforeAll(() => {
    const raw = readFileSync(resolve(root, VIEW_SOURCE_PATH), 'utf8');
    // Strip string literals and comments
    source = raw
      .replace(/`[\s\S]*?`/g, '``')
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('does not call Date.now', () => {
    expect(source).not.toMatch(/Date\.now\s*\(/);
  });

  it('does not call Math.random', () => {
    expect(source).not.toMatch(/Math\.random\s*\(/);
  });

  it('does not call new Date()', () => {
    expect(source).not.toMatch(/new\s+Date\s*\(/);
  });

  it('does not call fetch()', () => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it('imports from @/lib/agent/agent-mission-view', () => {
    const raw = readFileSync(resolve(root, VIEW_SOURCE_PATH), 'utf8');
    expect(raw).toMatch(/@\/lib\/agent\/agent-mission-view/);
  });

  it('imports from @/lib/tower/ai-portfolio-inventory', () => {
    const raw = readFileSync(resolve(root, VIEW_SOURCE_PATH), 'utf8');
    expect(raw).toMatch(/@\/lib\/tower\/ai-portfolio-inventory/);
  });
});
