// AG11 - Agent Mission Panel test suite.
//
// Deterministic integration tests for the AG11 view-helper and the
// server component source file. Server components do not render via
// the standard react-test-renderer pipeline in this repo, so the
// component is verified via source-file regex assertions for variant
// attributes, banned phrases, and forbidden client-side primitives.
//
// No network calls, no model providers, no time-of-day dependence.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  AGENT_MISSION_PANEL_AGENTS,
  AGENT_MISSION_PANEL_VARIANTS,
  agentDisplayLabel,
  buildAgentMissionPanelSeedView,
  priorityChipLabel,
  stateChipLabel,
  summarizeAgentMissionPanelView,
  type AgentMissionPanelAgent,
  type AgentMissionPanelVariant,
} from '@/lib/agent/agent-mission-view';

// ---------------------------------------------------------------------
// Helper: load source files for regex assertions
// ---------------------------------------------------------------------

function readSourceFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8');
}

const PANEL_SOURCE_PATH = 'src/components/agents/AgentMissionPanel.tsx';
const VIEW_SOURCE_PATH = 'src/lib/agents/agent-mission-view.ts';

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
// Component source: variant attribute coverage
// ---------------------------------------------------------------------

describe('AgentMissionPanel.tsx · variant attribute coverage', () => {
  const source = readSourceFile(PANEL_SOURCE_PATH);

  it('contains the canonical data-agent-mission-panel="ag11" attribute', () => {
    expect(source.includes('data-agent-mission-panel="ag11"')).toBe(true);
  });

  it.each(AGENT_MISSION_PANEL_VARIANTS)(
    'contains data-agent-mission-panel-variant for %s',
    (variant: AgentMissionPanelVariant) => {
      expect(
        source.includes(`data-agent-mission-panel-variant="${variant}"`),
      ).toBe(true);
    },
  );

  it('contains all 5 variant strings as literal occurrences', () => {
    for (const variant of AGENT_MISSION_PANEL_VARIANTS) {
      expect(source.indexOf(variant)).toBeGreaterThan(-1);
    }
  });

  it('renders the honest disclaimer slot via the view-helper field', () => {
    expect(source.includes('view.honestDisclaimer')).toBe(true);
  });

  it('hidden drawer variant declares aria-expanded="false"', () => {
    expect(source.includes('aria-expanded="false"')).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Component source: visual + tone hygiene per File 16
// ---------------------------------------------------------------------

describe('AgentMissionPanel.tsx · File 16 hygiene', () => {
  const source = readSourceFile(PANEL_SOURCE_PATH);

  it('contains no <img tags (no avatars per File 16)', () => {
    expect(/<img[\s>]/i.test(source)).toBe(false);
  });

  it('contains no chatbot phrasing such as "chat" or "ask me"', () => {
    expect(/\b(chat|ask\s+me)\b/i.test(source)).toBe(false);
  });

  it('contains no emoji characters', () => {
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(source)).toBe(false);
  });

  it('contains no forbidden placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(/Coming\s+soon/i.test(source)).toBe(false);
    expect(/\bTBD\b/.test(source)).toBe(false);
    expect(/Lorem\s+ipsum/i.test(source)).toBe(false);
  });
});

// ---------------------------------------------------------------------
// Component source: server-only / no live runtime
// ---------------------------------------------------------------------

describe('AgentMissionPanel.tsx · server-only constraints', () => {
  const source = readSourceFile(PANEL_SOURCE_PATH);

  it('does not declare a "use client" directive', () => {
    expect(/['"]use client['"]/.test(source)).toBe(false);
  });

  it('does not import or call useState', () => {
    expect(/\buseState\b/.test(source)).toBe(false);
  });

  it('does not import or call useEffect', () => {
    expect(/\buseEffect\b/.test(source)).toBe(false);
  });

  it('does not call Date.now or new Date(', () => {
    expect(/Date\.now\s*\(/.test(source)).toBe(false);
    expect(/new\s+Date\s*\(/.test(source)).toBe(false);
  });

  it('does not call Math.random', () => {
    expect(/Math\.random\s*\(/.test(source)).toBe(false);
  });

  it('does not call fetch(', () => {
    expect(/\bfetch\s*\(/.test(source)).toBe(false);
  });

  it('does not import anthropic or openai providers', () => {
    expect(/anthropic/i.test(source)).toBe(false);
    expect(/\bopenai\b/i.test(source)).toBe(false);
  });

  it('does not import from forbidden lib paths', () => {
    expect(/from\s+['"]@\/lib\/source\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/nexus\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/sentinel\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/atlas\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/auth\//.test(source)).toBe(false);
    expect(/from\s+['"]supabase/.test(source)).toBe(false);
  });
});

// ---------------------------------------------------------------------
// View-helper source hygiene
// ---------------------------------------------------------------------

describe('agent-mission-view.ts · helper hygiene', () => {
  const source = readSourceFile(VIEW_SOURCE_PATH);

  it('does not import from forbidden lib paths', () => {
    expect(/from\s+['"]@\/lib\/source\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/nexus\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/sentinel\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/atlas\//.test(source)).toBe(false);
    expect(/from\s+['"]@\/lib\/auth\//.test(source)).toBe(false);
    expect(/from\s+['"]supabase/.test(source)).toBe(false);
  });

  it('does not call Date.now / Math.random / new Date( / fetch(', () => {
    expect(/Date\.now\s*\(/.test(source)).toBe(false);
    expect(/Math\.random\s*\(/.test(source)).toBe(false);
    expect(/new\s+Date\s*\(/.test(source)).toBe(false);
    expect(/\bfetch\s*\(/.test(source)).toBe(false);
  });

  it('does not reference anthropic / openai providers', () => {
    expect(/anthropic/i.test(source)).toBe(false);
    expect(/\bopenai\b/i.test(source)).toBe(false);
  });

  it('does not contain banned placeholder language', () => {
    expect(/Coming\s+soon/i.test(source)).toBe(false);
    expect(/\bTBD\b/.test(source)).toBe(false);
    expect(/Lorem\s+ipsum/i.test(source)).toBe(false);
  });

  it('does not contain chatbot phrasing (chat / ask me)', () => {
    expect(/\b(chat|ask\s+me)\b/i.test(source)).toBe(false);
  });

  it('does not contain emoji characters', () => {
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(source)).toBe(false);
  });

  it('declares the canonical honest disclaimer', () => {
    expect(
      source.includes(
        'Mission queue is deterministic seed; runtime triggers deferred.',
      ),
    ).toBe(true);
  });
});
