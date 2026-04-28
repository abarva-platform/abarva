/**
 * ADMIN-DATA8 — `/admin/production-readiness` wired-to-adapter tests.
 *
 * Asserts that the production-readiness page-view sources its tiles, blockers,
 * gate criteria, and history from the admin-data adapters
 * (`admin-blockers-adapter` + `admin-production-readiness-adapter`) instead of
 * the W32F hardcoded constants.
 *
 * Pure TypeScript Jest tests — no React, no jsdom. Adapter is exercised in
 * fixture mode (default).
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildProductionReadinessPageView,
  type ProductionReadinessPageView,
} from '@/lib/admin/production-readiness-page-view';
import {
  getAllBlockerDetails,
  getCriticalBlockers,
  buildBlockerDetailDrawerView,
} from '@/lib/admin/blocker-detail-view';
import {
  getAdminBlockers,
  getAdminCriticalBlockers,
} from '@/lib/admin/data/admin-blockers-adapter';
import { getAdminProductionReadinessSnapshot } from '@/lib/admin/data/admin-production-readiness-adapter';

const root = process.cwd();
const TENANT = 'apex-retail';

describe('ADMIN-DATA8 — page-view consumes admin-data adapters', () => {
  let view: ProductionReadinessPageView;

  beforeAll(async () => {
    view = await buildProductionReadinessPageView(TENANT);
  });

  it('builder returns a Promise (async API)', () => {
    const result = buildProductionReadinessPageView(TENANT);
    expect(result).toBeInstanceOf(Promise);
  });

  it('view shape preserves deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('view NEVER claims production_ready: true', () => {
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('"production_ready":true');
    expect(s).not.toContain('production_ready: true');
  });

  it('production tile remains blocked (honest posture)', () => {
    const prod = view.tiles.find((t) => t.id === 'production');
    expect(prod?.status).toBe('blocked');
    expect(prod?.statusLabel).toBe('Blocked');
  });

  it('blockerDetailMap is populated from adapter rows', async () => {
    const rows = await getAdminBlockers(TENANT);
    const ids = rows.map((r) => r.id).sort();
    const mapIds = Object.keys(view.blockerDetailMap).sort();
    expect(mapIds).toEqual(ids);
  });

  it('blockerDetailMap entry count matches adapter count', async () => {
    const rows = await getAdminBlockers(TENANT);
    expect(Object.keys(view.blockerDetailMap)).toHaveLength(rows.length);
  });

  it('topBlockers includes every adapter critical blocker', async () => {
    const critical = await getAdminCriticalBlockers(TENANT);
    const topIds = view.topBlockers.map((b) => b.id);
    for (const c of critical) {
      expect(topIds).toContain(c.id);
    }
  });

  it('topBlockers is capped at 5 entries', () => {
    expect(view.topBlockers.length).toBeLessThanOrEqual(5);
  });

  it('topBlockers contains no duplicates', () => {
    const ids = view.topBlockers.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('pilot tile blockerCount equals adapter pilotImpact count', async () => {
    const rows = await getAdminBlockers(TENANT);
    const pilotCount = rows.filter((r) => r.pilotImpact).length;
    const tile = view.tiles.find((t) => t.id === 'pilot');
    expect(tile?.blockerCount).toBe(pilotCount);
  });

  it('production tile blockerCount equals adapter productionImpact count', async () => {
    const rows = await getAdminBlockers(TENANT);
    const prodCount = rows.filter((r) => r.productionImpact).length;
    const tile = view.tiles.find((t) => t.id === 'production');
    expect(tile?.blockerCount).toBe(prodCount);
  });

  it('historyStrip length matches adapter snapshot history length', async () => {
    const snap = await getAdminProductionReadinessSnapshot(TENANT);
    expect(view.historyStrip).toHaveLength(snap.history.length);
  });

  it('historyStrip entries carry adapter notes', async () => {
    const snap = await getAdminProductionReadinessSnapshot(TENANT);
    const adapterNotes = snap.history.map((h) => h.note);
    const viewNotes = view.historyStrip.map((h) => h.note);
    expect(viewNotes).toEqual(adapterNotes);
  });

  it('historyStrip entries have ISO-style timestamps from the adapter', () => {
    for (const h of view.historyStrip) {
      expect(h.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it('gateCriteria covers demo / pilot / production', () => {
    const ids = view.gateCriteria.map((g) => g.gateId).sort();
    expect(ids).toEqual(['demo', 'pilot', 'production']);
  });

  it('gate criteria are honest (production has at least one fail)', () => {
    const prod = view.gateCriteria.find((g) => g.gateId === 'production');
    expect(prod?.criteria.some((c) => c.status === 'fail')).toBe(true);
  });

  it('pilot gate carries partial criteria when adapter blockers have pilotImpact', async () => {
    const rows = await getAdminBlockers(TENANT);
    const pilotImpact = rows.some((r) => r.pilotImpact);
    if (pilotImpact) {
      const pilot = view.gateCriteria.find((g) => g.gateId === 'pilot');
      expect(pilot?.status).not.toBe('ready');
    }
  });

  it('empty tenant returns empty blocker / tile state', async () => {
    const empty = await buildProductionReadinessPageView('does-not-exist');
    expect(empty.topBlockers).toHaveLength(0);
    expect(Object.keys(empty.blockerDetailMap)).toHaveLength(0);
    expect(empty.tileDetailMap.pilot.blockers).toHaveLength(0);
    expect(empty.tileDetailMap.production.blockers).toHaveLength(0);
  });

  it('empty tenant historyStrip is empty', async () => {
    const empty = await buildProductionReadinessPageView('does-not-exist');
    expect(empty.historyStrip).toHaveLength(0);
  });

  it('actionStrip Mark resolved action stays HARD-GATED in adapter mode', () => {
    const approve = view.actionStrip.find((a) => a.id === 'approve_gate');
    expect(approve?.status).toBe('hard_gated');
    const run = view.actionStrip.find((a) => a.id === 'run_readiness_check');
    expect(run?.status).toBe('hard_gated');
  });
});

describe('ADMIN-DATA8 — blocker-detail-view delegates to adapter', () => {
  it('getAllBlockerDetails returns the same count as adapter', async () => {
    const [details, rows] = await Promise.all([
      getAllBlockerDetails(TENANT),
      getAdminBlockers(TENANT),
    ]);
    expect(details).toHaveLength(rows.length);
  });

  it('getAllBlockerDetails preserves adapter row ids', async () => {
    const [details, rows] = await Promise.all([
      getAllBlockerDetails(TENANT),
      getAdminBlockers(TENANT),
    ]);
    expect(details.map((d) => d.id).sort()).toEqual(rows.map((r) => r.id).sort());
  });

  it('getCriticalBlockers returns only critical severity', async () => {
    const critical = await getCriticalBlockers(TENANT);
    for (const b of critical) {
      expect(b.severity).toBe('critical');
    }
  });

  it('buildBlockerDetailDrawerView resolves via adapter for known id', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', TENANT);
    expect(view.blocker).not.toBeNull();
    expect(view.blocker?.id).toBe('blk-apex-001');
  });

  it('buildBlockerDetailDrawerView returns null blocker for unknown id', async () => {
    const view = await buildBlockerDetailDrawerView('nope', TENANT);
    expect(view.blocker).toBeNull();
  });

  it('mapped BlockerDetail.deterministicSeed is always true', async () => {
    const details = await getAllBlockerDetails(TENANT);
    for (const d of details) {
      expect(d.deterministicSeed).toBe(true);
    }
  });

  it('blocker pilotImpact / productionImpact mirror the adapter row', async () => {
    const [details, rows] = await Promise.all([
      getAllBlockerDetails(TENANT),
      getAdminBlockers(TENANT),
    ]);
    const byId = new Map(rows.map((r) => [r.id, r] as const));
    for (const d of details) {
      const row = byId.get(d.id);
      expect(d.pilotImpact).toBe(row?.pilotImpact);
      expect(d.productionImpact).toBe(row?.productionImpact);
    }
  });
});

describe('ADMIN-DATA8 — page-view module no longer hardcodes blockers/history', () => {
  const sourcePath = resolve(root, 'src/lib/admin/production-readiness-page-view.ts');
  const source = readFileSync(sourcePath, 'utf8');

  it('does not contain a HISTORY_STRIP literal', () => {
    expect(source).not.toMatch(/const\s+HISTORY_STRIP\s*[:=]/);
  });

  it('does not redeclare APEX_RETAIL_BLOCKERS', () => {
    expect(source).not.toMatch(/APEX_RETAIL_BLOCKERS/);
  });

  it('imports getAdminBlockers from the adapter', () => {
    expect(source).toMatch(/from '\.\/data\/admin-blockers-adapter'/);
    expect(source).toMatch(/getAdminBlockers/);
  });

  it('imports getAdminProductionReadinessSnapshot from the adapter', () => {
    expect(source).toMatch(/from '\.\/data\/admin-production-readiness-adapter'/);
    expect(source).toMatch(/getAdminProductionReadinessSnapshot/);
  });

  it('builder is async', () => {
    expect(source).toMatch(/export async function buildProductionReadinessPageView/);
  });

  it('contains no banned hex tokens', () => {
    const s = source.toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });
});

describe('ADMIN-DATA8 — page route awaits the async builder', () => {
  const pagePath = resolve(
    root,
    'src/app/(maestro)/admin/production-readiness/page.tsx',
  );

  it('page file exists', () => {
    expect(existsSync(pagePath)).toBe(true);
  });

  it('page awaits buildProductionReadinessPageView', () => {
    const src = readFileSync(pagePath, 'utf8');
    expect(src).toMatch(/await\s+buildProductionReadinessPageView/);
  });

  it('page route stays async and Clerk auth stays in layout (no inline auth)', () => {
    const src = readFileSync(pagePath, 'utf8');
    expect(src).toMatch(/export default async function/);
    expect(src).not.toMatch(/auth\(\)/);
    expect(src).not.toMatch(/currentUser\(\)/);
  });
});
