/**
 * ADMIN16 — Production Readiness depth tests
 *
 * Pure TypeScript Jest tests for:
 *   - ProductionReadinessPageView depth fields (tabs, tileDetailMap,
 *     gateCriteria, historyStrip, blockerDetailMap, actionStrip)
 *   - resolveProductionReadinessTab + findBlockerDetail + resolveExpandedTile
 *   - Component module presence + key affordances
 *   - Hard-gated action visibility (Run readiness check / Approve gate /
 *     Mark resolved)
 *
 * No React rendering, no jsdom — fs scans + view-model invocation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildProductionReadinessPageView,
  resolveProductionReadinessTab,
  resolveExpandedTile,
  findBlockerDetail,
  type ProductionReadinessPageView,
  type ProductionReadinessTabKey,
} from '@/lib/admin/production-readiness-page-view';

const root = process.cwd();

describe('ADMIN16 — Production Readiness page-view depth', () => {
  let view: ProductionReadinessPageView;

  beforeEach(async () => {
    view = await buildProductionReadinessPageView();
  });

  it('still returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('preserves the existing tiles array (legacy contract)', () => {
    expect(view.tiles.length).toBe(3);
    const ids = view.tiles.map((t) => t.id).sort();
    expect(ids).toEqual(['demo', 'pilot', 'production']);
  });

  it('preserves the existing topBlockers array (legacy contract)', () => {
    expect(Array.isArray(view.topBlockers)).toBe(true);
    expect(view.topBlockers.length).toBeGreaterThan(0);
  });

  it('exposes a tabs array with 4 entries', () => {
    expect(Array.isArray(view.tabs)).toBe(true);
    expect(view.tabs.length).toBe(4);
  });

  it('tab keys match the canonical 4 (decision/blockers/gates/history)', () => {
    const keys = view.tabs.map((t) => t.key).sort();
    expect(keys).toEqual(['blockers', 'decision', 'gates', 'history']);
  });

  it('default tab is "decision"', () => {
    expect(view.defaultTab).toBe('decision');
  });

  it('every tab has a non-empty label and description', () => {
    for (const tab of view.tabs) {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.description.length).toBeGreaterThan(0);
    }
  });

  it('tileDetailMap covers all three tiers', () => {
    expect(view.tileDetailMap.demo).toBeTruthy();
    expect(view.tileDetailMap.pilot).toBeTruthy();
    expect(view.tileDetailMap.production).toBeTruthy();
  });

  it('demo tier has empty blocker list', () => {
    expect(view.tileDetailMap.demo.blockers.length).toBe(0);
  });

  it('pilot tier has at least one blocker', () => {
    expect(view.tileDetailMap.pilot.blockers.length).toBeGreaterThan(0);
  });

  it('production tier has at least one blocker', () => {
    expect(view.tileDetailMap.production.blockers.length).toBeGreaterThan(0);
  });

  it('every tile detail has criteria + unblocksNextTier guidance', () => {
    for (const tier of ['demo', 'pilot', 'production'] as const) {
      const detail = view.tileDetailMap[tier];
      expect(detail.criteria.length).toBeGreaterThan(0);
      expect(detail.unblocksNextTier.length).toBeGreaterThan(0);
    }
  });

  it('gateCriteria groups cover all three gates', () => {
    const ids = view.gateCriteria.map((g) => g.gateId).sort();
    expect(ids).toEqual(['demo', 'pilot', 'production']);
  });

  it('every gate criterion has pass/partial/fail status', () => {
    for (const group of view.gateCriteria) {
      for (const c of group.criteria) {
        expect(['pass', 'partial', 'fail']).toContain(c.status);
        expect(c.evidenceBasis.length).toBeGreaterThan(0);
        expect(c.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('demo gate criteria contain deterministic seed + route shell checks', () => {
    const demo = view.gateCriteria.find((g) => g.gateId === 'demo');
    expect(demo).toBeTruthy();
    const labels = (demo?.criteria ?? []).map((c) => c.label.toLowerCase()).join(' ');
    expect(labels).toMatch(/seed/);
    expect(labels).toMatch(/route shell/);
  });

  it('pilot gate criteria contain connectors / evidence / users checks', () => {
    const pilot = view.gateCriteria.find((g) => g.gateId === 'pilot');
    const labels = (pilot?.criteria ?? []).map((c) => c.label.toLowerCase()).join(' ');
    expect(labels).toMatch(/connector/);
    expect(labels).toMatch(/evidence/);
    expect(labels).toMatch(/user/);
  });

  it('production gate criteria contain model gateway / audit log / SOC2', () => {
    const prod = view.gateCriteria.find((g) => g.gateId === 'production');
    const labels = (prod?.criteria ?? []).map((c) => c.label.toLowerCase()).join(' ');
    expect(labels).toMatch(/model gateway/);
    expect(labels).toMatch(/audit log/);
    expect(labels).toMatch(/soc2/);
  });

  it('historyStrip has 5 deterministic entries', () => {
    expect(view.historyStrip.length).toBe(5);
  });

  it('historyStrip entries have required shape', () => {
    for (const h of view.historyStrip) {
      expect(h.id).toBeTruthy();
      expect(h.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(h.who).toBeTruthy();
      expect(h.from).toBeTruthy();
      expect(h.to).toBeTruthy();
      expect(h.note).toBeTruthy();
    }
  });

  it('blockerDetailMap is keyed by blocker id', () => {
    const ids = Object.keys(view.blockerDetailMap);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(view.blockerDetailMap[id].id).toBe(id);
    }
  });

  it('actionStrip contains the four canonical actions', () => {
    const ids = view.actionStrip.map((a) => a.id).sort();
    expect(ids).toEqual([
      'approve_gate',
      'export_readiness_report',
      'open_blocker_drawer',
      'run_readiness_check',
    ]);
  });

  it('open_blocker_drawer is safe with href', () => {
    const a = view.actionStrip.find((x) => x.id === 'open_blocker_drawer');
    expect(a?.status).toBe('safe');
    expect(a?.href).toBeTruthy();
  });

  it('run_readiness_check is hard_gated with Wave 27 reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'run_readiness_check');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('approve_gate is hard_gated with Wave 27 reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'approve_gate');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('export_readiness_report is safe with href', () => {
    const a = view.actionStrip.find((x) => x.id === 'export_readiness_report');
    expect(a?.status).toBe('safe');
    expect(a?.href).toBeTruthy();
  });

  it('NEVER claims production_ready: true', () => {
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

  it('editorial body is non-empty (Steward wiring preserved)', () => {
    expect(view.editorial.body.length).toBeGreaterThan(0);
  });

  it('production tier remains blocked', () => {
    const prod = view.tiles.find((t) => t.id === 'production');
    expect(prod?.status).toBe('blocked');
  });
});

describe('ADMIN16 — resolveProductionReadinessTab', () => {
  it('returns "decision" for undefined input', () => {
    expect(resolveProductionReadinessTab(undefined)).toBe('decision');
  });

  it('returns "decision" for empty string', () => {
    expect(resolveProductionReadinessTab('')).toBe('decision');
  });

  it('returns the canonical tab when given a valid key', () => {
    const keys: ProductionReadinessTabKey[] = ['decision', 'blockers', 'gates', 'history'];
    for (const k of keys) {
      expect(resolveProductionReadinessTab(k)).toBe(k);
    }
  });

  it('falls back to "decision" for unknown keys', () => {
    expect(resolveProductionReadinessTab('audit')).toBe('decision');
    expect(resolveProductionReadinessTab('garbage')).toBe('decision');
  });
});

describe('ADMIN16 — resolveExpandedTile', () => {
  it('returns null for undefined input', () => {
    expect(resolveExpandedTile(undefined)).toBeNull();
  });

  it('returns the tile id when valid', () => {
    expect(resolveExpandedTile('demo')).toBe('demo');
    expect(resolveExpandedTile('pilot')).toBe('pilot');
    expect(resolveExpandedTile('production')).toBe('production');
  });

  it('returns null for unknown keys', () => {
    expect(resolveExpandedTile('staging')).toBeNull();
    expect(resolveExpandedTile('')).toBeNull();
  });
});

describe('ADMIN16 — findBlockerDetail', () => {
  let view: ProductionReadinessPageView;

  beforeAll(async () => {
    view = await buildProductionReadinessPageView();
  });

  it('returns null for undefined id', () => {
    expect(findBlockerDetail(view, undefined)).toBeNull();
  });

  it('returns null for unknown id', () => {
    expect(findBlockerDetail(view, 'blk-nope-999')).toBeNull();
  });

  it('returns the matching blocker for a valid id', () => {
    const ids = Object.keys(view.blockerDetailMap);
    expect(ids.length).toBeGreaterThan(0);
    const found = findBlockerDetail(view, ids[0]);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(ids[0]);
  });
});

describe('ADMIN16 — Component modules exist', () => {
  const components = [
    'src/components/admin/production-readiness/ProductionReadinessTabs.tsx',
    'src/components/admin/production-readiness/ProductionReadinessActionStrip.tsx',
    'src/components/admin/production-readiness/ReadinessTileExpanded.tsx',
    'src/components/admin/production-readiness/BlockerDetailDrawer.tsx',
    'src/components/admin/production-readiness/GateCriteriaMatrix.tsx',
    'src/components/admin/production-readiness/ReadinessHistoryStrip.tsx',
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

describe('ADMIN16 — Hard-gated affordances are disabled', () => {
  it('ProductionReadinessActionStrip renders disabled buttons with reason', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/production-readiness/ProductionReadinessActionStrip.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('hard_gated');
    expect(src).toMatch(/Wave 27/);
  });

  it('BlockerDetailDrawer renders disabled Mark resolved button', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/production-readiness/BlockerDetailDrawer.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('Mark resolved');
    expect(src).toMatch(/Wave 27/);
  });

  it('ProductionReadinessActionStrip never wires onClick handlers', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/production-readiness/ProductionReadinessActionStrip.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/onClick=\{\(/);
  });

  it('BlockerDetailDrawer never wires onClick handlers', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/production-readiness/BlockerDetailDrawer.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/onClick=\{\(/);
  });
});

describe('ADMIN16 — Page route uses the new depth components', () => {
  const pagePath = 'src/app/(maestro)/admin/production-readiness/page.tsx';

  it('exists at canonical path', () => {
    expect(existsSync(resolve(root, pagePath))).toBe(true);
  });

  const src = readFileSync(resolve(root, pagePath), 'utf8');

  it('imports ProductionReadinessTabs', () => {
    expect(src).toContain('ProductionReadinessTabs');
  });

  it('imports ProductionReadinessActionStrip', () => {
    expect(src).toContain('ProductionReadinessActionStrip');
  });

  it('imports ReadinessTileExpanded', () => {
    expect(src).toContain('ReadinessTileExpanded');
  });

  it('imports BlockerDetailDrawer', () => {
    expect(src).toContain('BlockerDetailDrawer');
  });

  it('imports GateCriteriaMatrix', () => {
    expect(src).toContain('GateCriteriaMatrix');
  });

  it('imports ReadinessHistoryStrip', () => {
    expect(src).toContain('ReadinessHistoryStrip');
  });

  it('reads searchParams to drive tab + drawer state', () => {
    expect(src).toMatch(/searchParams/);
    expect(src).toMatch(/resolveProductionReadinessTab/);
    expect(src).toMatch(/findBlockerDetail/);
  });

  it('does not add inline auth checks (relies on /admin/layout.tsx)', () => {
    expect(src).not.toMatch(/auth\(\)/);
    expect(src).not.toMatch(/currentUser\(\)/);
    expect(src).not.toMatch(/redirect\(/);
  });
});

describe('ADMIN16 — page-view module hygiene', () => {
  it('view-model module exists', () => {
    expect(
      existsSync(resolve(root, 'src/lib/admin/production-readiness-page-view.ts')),
    ).toBe(true);
  });

  it('view-model module contains no banned hex tokens', () => {
    const s = readFileSync(
      resolve(root, 'src/lib/admin/production-readiness-page-view.ts'),
      'utf8',
    ).toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
  });

  it('view-model never returns production_ready: true at runtime', async () => {
    const v = await buildProductionReadinessPageView();
    const s = JSON.stringify(v).toLowerCase();
    expect(s).not.toContain('"production_ready":true');
  });
});
