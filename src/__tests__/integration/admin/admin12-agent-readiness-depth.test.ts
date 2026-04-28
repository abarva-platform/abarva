/**
 * ADMIN12 — Agent Readiness depth tests
 *
 * Pure TypeScript Jest tests covering:
 *   - AgentReadinessPageView depth fields (tabs, agentDetailMap,
 *     contextCoverageMatrix, actionStrip)
 *   - resolveAgentReadinessTab + findAgentDetail helpers
 *   - Component module presence + key affordances
 *   - Hard-gated action visibility (disabled buttons w/ reason)
 *
 * No React rendering, no jsdom — fs scans + view-model invocation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildAgentReadinessPageView,
  resolveAgentReadinessTab,
  findAgentDetail,
  type AgentReadinessPageView,
  type AgentReadinessTabKey,
} from '@/lib/admin/agent-readiness-page-view';

const root = process.cwd();

describe('ADMIN12 — Agent Readiness page-view depth', () => {
  let view: AgentReadinessPageView;

  beforeEach(async () => {
    view = await buildAgentReadinessPageView();
  });

  it('still returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('preserves the existing agents array (legacy contract)', () => {
    expect(Array.isArray(view.agents)).toBe(true);
    expect(view.agents.length).toBe(4);
  });

  it('exposes a tabs array with 5 entries', () => {
    expect(Array.isArray(view.tabs)).toBe(true);
    expect(view.tabs.length).toBe(5);
  });

  it('tab keys match the canonical 5 (overview/steward/nexus/sentinel/atlas)', () => {
    const keys = view.tabs.map((t) => t.key).sort();
    expect(keys).toEqual(['atlas', 'nexus', 'overview', 'sentinel', 'steward']);
  });

  it('default tab is "overview"', () => {
    expect(view.defaultTab).toBe('overview');
  });

  it('every tab has a non-empty label', () => {
    for (const tab of view.tabs) {
      expect(tab.label.length).toBeGreaterThan(0);
    }
  });

  it('every tab has a non-empty description', () => {
    for (const tab of view.tabs) {
      expect(tab.description.length).toBeGreaterThan(0);
    }
  });

  it('agentDetailMap covers all four canonical agents', () => {
    expect(view.agentDetailMap.steward).toBeDefined();
    expect(view.agentDetailMap.nexus).toBeDefined();
    expect(view.agentDetailMap.sentinel).toBeDefined();
    expect(view.agentDetailMap.atlas).toBeDefined();
  });

  it('every agent detail has canDo with at least 3 entries', () => {
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas'] as const) {
      const detail = view.agentDetailMap[id];
      expect(detail.canDo.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every agent detail has cannotDo with at least 2 entries', () => {
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas'] as const) {
      const detail = view.agentDetailMap[id];
      expect(detail.cannotDo.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every agent detail has a non-empty unblockedBy', () => {
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas'] as const) {
      const detail = view.agentDetailMap[id];
      expect(detail.unblockedBy.length).toBeGreaterThan(0);
    }
  });

  it('every agent detail has 5-surface context coverage', () => {
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas'] as const) {
      const detail = view.agentDetailMap[id];
      expect(detail.contextCoverage.length).toBe(5);
      const surfaces = detail.contextCoverage.map((c) => c.surface).sort();
      expect(surfaces).toEqual(['admin', 'intelligence', 'programs', 'source', 'tower']);
    }
  });

  it('coverage cells use only canonical levels', () => {
    const valid = ['decision_grade', 'partial', 'thin', 'none'];
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas'] as const) {
      for (const cell of view.agentDetailMap[id].contextCoverage) {
        expect(valid).toContain(cell.level);
        expect(cell.note.length).toBeGreaterThan(0);
      }
    }
  });

  it('Steward has decision_grade coverage on admin surface', () => {
    const cell = view.agentDetailMap.steward.contextCoverage.find((c) => c.surface === 'admin');
    expect(cell?.level).toBe('decision_grade');
  });

  it('Atlas has decision_grade coverage on tower surface', () => {
    const cell = view.agentDetailMap.atlas.contextCoverage.find((c) => c.surface === 'tower');
    expect(cell?.level).toBe('decision_grade');
  });

  it('Sentinel has decision_grade coverage on intelligence surface', () => {
    const cell = view.agentDetailMap.sentinel.contextCoverage.find(
      (c) => c.surface === 'intelligence',
    );
    expect(cell?.level).toBe('decision_grade');
  });

  it('Nexus has decision_grade coverage on programs surface', () => {
    const cell = view.agentDetailMap.nexus.contextCoverage.find((c) => c.surface === 'programs');
    expect(cell?.level).toBe('decision_grade');
  });

  it('contextCoverageMatrix has 4 rows', () => {
    expect(view.contextCoverageMatrix.length).toBe(4);
  });

  it('contextCoverageMatrix rows include all 4 canonical agents', () => {
    const ids = view.contextCoverageMatrix.map((r) => r.agent).sort();
    expect(ids).toEqual(['atlas', 'nexus', 'sentinel', 'steward']);
  });

  it('contextCoverageMatrix every row has 5 cells', () => {
    for (const row of view.contextCoverageMatrix) {
      expect(row.cells.length).toBe(5);
    }
  });

  it('contextCoverageMatrix surface order is consistent across rows', () => {
    const expected = ['programs', 'source', 'intelligence', 'tower', 'admin'];
    for (const row of view.contextCoverageMatrix) {
      expect(row.cells.map((c) => c.surface)).toEqual(expected);
    }
  });

  it('actionStrip contains open_runtime_config + review_contracts', () => {
    const ids = view.actionStrip.map((a) => a.id).sort();
    expect(ids).toEqual(['open_runtime_config', 'review_contracts']);
  });

  it('open_runtime_config action is hard_gated with a Wave 27 reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'open_runtime_config');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toBeTruthy();
    expect(a?.reason).toMatch(/Wave 27/);
    expect(a?.reason).toMatch(/model gateway/i);
  });

  it('review_contracts action is safe and has an href', () => {
    const a = view.actionStrip.find((x) => x.id === 'review_contracts');
    expect(a?.status).toBe('safe');
    expect(a?.href).toBeTruthy();
  });

  it('does not include production_ready: true anywhere', () => {
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('"production_ready":true');
  });

  it('does not contain banned hex tokens', () => {
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });

  it('agentChoices is populated (AGENT1 wiring intact)', () => {
    expect(Array.isArray(view.agentChoices)).toBe(true);
    expect((view.agentChoices ?? []).length).toBeGreaterThan(0);
  });

  it('agentPostures is populated (AGENT1 wiring intact)', () => {
    expect(Array.isArray(view.agentPostures)).toBe(true);
    expect((view.agentPostures ?? []).length).toBe(4);
  });

  it('editorial body is non-empty (Steward wiring preserved)', () => {
    expect(view.editorial.body.length).toBeGreaterThan(0);
  });

  it('every agent detail has a non-empty postureReason', () => {
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas'] as const) {
      expect(view.agentDetailMap[id].postureReason.length).toBeGreaterThan(0);
    }
  });
});

describe('ADMIN12 — resolveAgentReadinessTab', () => {
  it('returns "overview" for undefined input', () => {
    expect(resolveAgentReadinessTab(undefined)).toBe('overview');
  });

  it('returns "overview" for empty string', () => {
    expect(resolveAgentReadinessTab('')).toBe('overview');
  });

  it('returns the canonical tab when given a valid key', () => {
    const keys: AgentReadinessTabKey[] = [
      'overview',
      'steward',
      'nexus',
      'sentinel',
      'atlas',
    ];
    for (const k of keys) {
      expect(resolveAgentReadinessTab(k)).toBe(k);
    }
  });

  it('falls back to "overview" for an unknown key', () => {
    expect(resolveAgentReadinessTab('garbage')).toBe('overview');
    expect(resolveAgentReadinessTab('audit')).toBe('overview');
  });
});

describe('ADMIN12 — findAgentDetail', () => {
  let view: AgentReadinessPageView;

  beforeAll(async () => {
    view = await buildAgentReadinessPageView();
  });

  it('returns null for undefined id', () => {
    expect(findAgentDetail(view, undefined)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(findAgentDetail(view, 'overview')).toBeNull();
    expect(findAgentDetail(view, 'foobar')).toBeNull();
  });

  it('returns the matching agent detail for a valid id', () => {
    const found = findAgentDetail(view, 'steward');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('steward');
    expect(found?.label).toBe('Steward');
  });

  it('returns details for all four canonical agents', () => {
    for (const id of ['steward', 'nexus', 'sentinel', 'atlas']) {
      const found = findAgentDetail(view, id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(id);
    }
  });
});

describe('ADMIN12 — Component modules exist', () => {
  const components = [
    'src/components/admin/AgentExpandableCard.tsx',
    'src/components/admin/ContextCoverageMatrix.tsx',
    'src/components/admin/AgentReadinessTabs.tsx',
    'src/components/admin/AgentReadinessActionStrip.tsx',
  ];

  components.forEach((rel) => {
    it(`${rel} exists on disk`, () => {
      expect(existsSync(resolve(root, rel))).toBe(true);
    });

    it(`${rel} contains no banned hex tokens`, () => {
      const s = readFileSync(resolve(root, rel), 'utf8').toLowerCase();
      expect(s).not.toContain('#14b8a6');
      expect(s).not.toContain('#7c3aed');
      expect(s).not.toContain('#d946ef');
      expect(s).not.toContain('sparkle');
    });

    it(`${rel} imports design tokens from the canonical module`, () => {
      const s = readFileSync(resolve(root, rel), 'utf8');
      expect(s).toMatch(/@\/lib\/design\/design-tokens/);
    });
  });
});

describe('ADMIN12 — Action strip + hard-gated affordances', () => {
  it('AgentReadinessActionStrip renders a disabled button with reason', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/AgentReadinessActionStrip.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('hard_gated');
    expect(src).toMatch(/Wave 27/);
  });

  it('AgentReadinessActionStrip never wires onClick on a disabled action', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/AgentReadinessActionStrip.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/onClick=\{\(/);
  });

  it('AgentExpandableCard renders posture, capabilities, and unblock', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/AgentExpandableCard.tsx'),
      'utf8',
    );
    expect(src).toContain('data-agent-can-do');
    expect(src).toContain('data-agent-cannot-do');
    expect(src).toContain('data-agent-unblocked-by');
    expect(src).toContain('data-agent-context-coverage');
  });

  it('ContextCoverageMatrix renders cells for all 4 levels', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/ContextCoverageMatrix.tsx'),
      'utf8',
    );
    expect(src).toContain('decision_grade');
    expect(src).toContain('partial');
    expect(src).toContain('thin');
    expect(src).toContain('none');
  });
});

describe('ADMIN12 — Page route uses the new depth components', () => {
  const pagePath = 'src/app/(maestro)/admin/agent-readiness/page.tsx';

  it('exists at canonical path', () => {
    expect(existsSync(resolve(root, pagePath))).toBe(true);
  });

  const src = readFileSync(resolve(root, pagePath), 'utf8');

  it('imports AgentReadinessTabs', () => {
    expect(src).toContain('AgentReadinessTabs');
  });

  it('imports AgentReadinessActionStrip', () => {
    expect(src).toContain('AgentReadinessActionStrip');
  });

  it('imports AgentExpandableCard', () => {
    expect(src).toContain('AgentExpandableCard');
  });

  it('imports ContextCoverageMatrix', () => {
    expect(src).toContain('ContextCoverageMatrix');
  });

  it('reads searchParams (Next 15+ async signature)', () => {
    expect(src).toContain('searchParams');
    expect(src).toContain('await searchParams');
  });

  it('still imports the canonical AdminCanonShellV2', () => {
    expect(src).toContain('AdminCanonShellV2');
  });

  it('still imports the StewardEditorial', () => {
    expect(src).toContain('StewardEditorial');
  });

  it('still imports the AgentPostureGrid (legacy canvas preserved)', () => {
    expect(src).toContain('AgentPostureGrid');
  });

  it('contains no banned tokens', () => {
    const s = src.toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });

  it('does not contain <input> or <textarea>', () => {
    expect(src).not.toMatch(/<input\b/);
    expect(src).not.toMatch(/<textarea\b/);
  });

  it('uses the ?agent= URL parameter (not ?tab=)', () => {
    expect(src).toMatch(/agent\?:\s*string/);
  });
});
