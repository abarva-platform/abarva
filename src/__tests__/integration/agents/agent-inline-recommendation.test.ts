/**
 * ACT2 — agent-inline-recommendation integration tests
 *
 * Covers:
 *   - buildAgentInlineRecommendationView() default seed
 *   - panelView.variant === 'inline_recommendation'
 *   - recommendationCount matches allRecommendations.length
 *   - topRecommendation is first allRecommendations entry
 *   - each InlineRecommendationItem has non-empty labels
 *   - confidence is 'high' | 'medium' | 'low'
 *   - isUrgent consistent with priority
 *   - hasUrgentRecommendation = any isUrgent
 *   - sectionLabel is non-empty
 *   - honestDisclaimer is non-empty and contains 'deterministic'
 *   - deterministicSeed: true
 *   - Determinism
 *   - getTopRecommendation, getRecommendationsByAgent, getUrgentRecommendations
 *   - describeInlineRecommendation format
 *   - Component source checks
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildAgentInlineRecommendationView,
  getTopRecommendation,
  getRecommendationsByAgent,
  getUrgentRecommendations,
  describeInlineRecommendation,
  type AgentInlineRecommendationView,
  type AgentMissionPanelAgent,
} from '@/lib/agents/agent-inline-recommendation-view';

const root = process.cwd();
const VIEW_SOURCE_PATH = 'src/lib/agents/agent-inline-recommendation-view.ts';
const COMPONENT_SOURCE_PATH = 'src/components/agents/AgentInlineRecommendation.tsx';

const CANONICAL_AGENTS: AgentMissionPanelAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];
const CONFIDENCE_VALUES = ['high', 'medium', 'low'];

// ---------------------------------------------------------------------------
// buildAgentInlineRecommendationView — default seed
// ---------------------------------------------------------------------------

describe('ACT2 — buildAgentInlineRecommendationView default seed', () => {
  let view: AgentInlineRecommendationView;

  beforeAll(() => {
    view = buildAgentInlineRecommendationView();
  });

  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('panelView.variant is inline_recommendation', () => {
    expect(view.panelView.variant).toBe('inline_recommendation');
  });

  it('recommendationCount matches allRecommendations.length', () => {
    expect(view.recommendationCount).toBe(view.allRecommendations.length);
  });

  it('recommendationCount is positive', () => {
    expect(view.recommendationCount).toBeGreaterThan(0);
  });

  it('topRecommendation is the first allRecommendations entry', () => {
    expect(view.topRecommendation).toBe(view.allRecommendations[0]);
  });

  it('hasUrgentRecommendation is consistent with allRecommendations', () => {
    const anyUrgent = view.allRecommendations.some((r) => r.isUrgent);
    expect(view.hasUrgentRecommendation).toBe(anyUrgent);
  });

  it('sectionLabel is non-empty', () => {
    expect(view.sectionLabel.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer is non-empty', () => {
    expect(view.honestDisclaimer.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains "deterministic"', () => {
    expect(view.honestDisclaimer).toContain('deterministic');
  });
});

// ---------------------------------------------------------------------------
// InlineRecommendationItem fields
// ---------------------------------------------------------------------------

describe('ACT2 — InlineRecommendationItem fields', () => {
  let view: AgentInlineRecommendationView;

  beforeAll(() => {
    view = buildAgentInlineRecommendationView();
  });

  it('each item has a non-empty agentDisplayLabel', () => {
    for (const item of view.allRecommendations) {
      expect(item.agentDisplayLabel.length).toBeGreaterThan(0);
    }
  });

  it('each item has a non-empty priorityLabel', () => {
    for (const item of view.allRecommendations) {
      expect(item.priorityLabel.length).toBeGreaterThan(0);
    }
  });

  it('each item has a non-empty stateLabel', () => {
    for (const item of view.allRecommendations) {
      expect(item.stateLabel.length).toBeGreaterThan(0);
    }
  });

  it('each item has a non-empty typeLabel', () => {
    for (const item of view.allRecommendations) {
      expect(item.typeLabel.length).toBeGreaterThan(0);
    }
  });

  it('each item confidence is a valid value', () => {
    for (const item of view.allRecommendations) {
      expect(CONFIDENCE_VALUES).toContain(item.confidence);
    }
  });

  it('isUrgent is true only for critical/high priority', () => {
    for (const item of view.allRecommendations) {
      const isCriticalOrHigh =
        item.mission.priority === 'critical' || item.mission.priority === 'high';
      expect(item.isUrgent).toBe(isCriticalOrHigh);
    }
  });

  it('confidence is high for critical/high priority items', () => {
    for (const item of view.allRecommendations) {
      if (item.mission.priority === 'critical' || item.mission.priority === 'high') {
        expect(item.confidence).toBe('high');
      }
    }
  });

  it('each item mission has a non-empty id', () => {
    for (const item of view.allRecommendations) {
      expect(item.mission.id.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('ACT2 — helpers', () => {
  let view: AgentInlineRecommendationView;

  beforeAll(() => {
    view = buildAgentInlineRecommendationView();
  });

  it('getTopRecommendation returns view.topRecommendation', () => {
    expect(getTopRecommendation(view)).toBe(view.topRecommendation);
  });

  it.each(CANONICAL_AGENTS)('getRecommendationsByAgent(%s) returns matching items', (agent) => {
    const items = getRecommendationsByAgent(view, agent);
    for (const item of items) {
      expect(item.mission.agent).toBe(agent);
    }
  });

  it('getUrgentRecommendations returns only isUrgent items', () => {
    const urgent = getUrgentRecommendations(view);
    for (const item of urgent) {
      expect(item.isUrgent).toBe(true);
    }
  });

  it('getUrgentRecommendations count matches hasUrgentRecommendation', () => {
    const urgent = getUrgentRecommendations(view);
    if (view.hasUrgentRecommendation) {
      expect(urgent.length).toBeGreaterThan(0);
    } else {
      expect(urgent.length).toBe(0);
    }
  });

  it('describeInlineRecommendation returns non-empty string', () => {
    const desc = describeInlineRecommendation(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('describeInlineRecommendation contains sectionLabel', () => {
    const desc = describeInlineRecommendation(view);
    expect(desc).toContain(view.sectionLabel);
  });

  it('describeInlineRecommendation contains item count', () => {
    const desc = describeInlineRecommendation(view);
    expect(desc).toMatch(/\d+ item/);
  });

  it('describeInlineRecommendation uses dot-separator', () => {
    const desc = describeInlineRecommendation(view);
    expect(desc).toContain(' · ');
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('ACT2 — determinism', () => {
  it('two calls produce identical JSON', () => {
    const a = buildAgentInlineRecommendationView();
    const b = buildAgentInlineRecommendationView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('allRecommendations are byte-equal across calls', () => {
    const a = buildAgentInlineRecommendationView();
    const b = buildAgentInlineRecommendationView();
    expect(JSON.stringify(a.allRecommendations)).toBe(JSON.stringify(b.allRecommendations));
  });
});

// ---------------------------------------------------------------------------
// Component source checks
// ---------------------------------------------------------------------------

describe('ACT2 — AgentInlineRecommendation component source checks', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(resolve(root, COMPONENT_SOURCE_PATH), 'utf8');
  });

  it('has data-agent-inline-recommendation="act2" attribute', () => {
    expect(source).toMatch(/data-agent-inline-recommendation=["']act2["']/);
  });

  it('has aria-label', () => {
    expect(source).toMatch(/aria-label/);
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

  it('imports AgentBadge', () => {
    expect(source).toMatch(/AgentBadge/);
  });

  it('renders honestDisclaimer', () => {
    expect(source).toMatch(/honestDisclaimer/);
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('ACT2 — view model module hygiene', () => {
  let source: string;

  beforeAll(() => {
    const raw = readFileSync(resolve(root, VIEW_SOURCE_PATH), 'utf8');
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
});
