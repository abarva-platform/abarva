/**
 * ADMIN-DATA5 — Verify /admin/data-trust page-view consumes the
 * admin-datasets-adapter (vs. the legacy hardcoded constants that
 * lived in `data-trust-page-view.ts` before this slice).
 *
 * All adapter calls run in fixture mode (default `ADMIN_DATA_MODE`).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildDataTrustPageView,
  type DataTrustPageView,
} from '@/lib/admin/data-trust-page-view';
import {
  getAdminDatasetApprovals,
  getAdminDatasetQualityScores,
  getAdminDatasetsByRung,
} from '@/lib/admin/data/admin-datasets-adapter';

const root = process.cwd();
const PAGE_VIEW_PATH = 'src/lib/admin/data-trust-page-view.ts';
const PAGE_ROUTE_PATH = 'src/app/(maestro)/admin/data-trust/page.tsx';

describe('ADMIN-DATA5 — page-view source no longer carries dataset constants', () => {
  const src = readFileSync(resolve(root, PAGE_VIEW_PATH), 'utf8');

  it('removes the DATASETS_BY_RUNG constant', () => {
    expect(src).not.toContain('DATASETS_BY_RUNG');
  });

  it('removes the DATASET_DETAIL_MAP constant', () => {
    expect(src).not.toContain('DATASET_DETAIL_MAP');
  });

  it('removes the PROMOTION_REQUESTS constant', () => {
    expect(src).not.toContain('PROMOTION_REQUESTS');
  });

  it('imports getAdminDatasetsByRung from the adapter module', () => {
    expect(src).toMatch(/getAdminDatasetsByRung/);
    expect(src).toMatch(/@\/lib\/admin\/data\/admin-datasets-adapter/);
  });

  it('imports getAdminDatasetApprovals from the adapter module', () => {
    expect(src).toMatch(/getAdminDatasetApprovals/);
  });

  it('imports getAdminDatasetQualityScores from the adapter module', () => {
    expect(src).toMatch(/getAdminDatasetQualityScores/);
  });

  it('exposes buildDataTrustPageView as async', () => {
    expect(src).toMatch(/export\s+async\s+function\s+buildDataTrustPageView/);
  });

  it('uses Promise.all to fan out adapter calls', () => {
    expect(src).toMatch(/Promise\.all/);
  });
});

describe('ADMIN-DATA5 — page route awaits the async builder', () => {
  const src = readFileSync(resolve(root, PAGE_ROUTE_PATH), 'utf8');

  it('awaits buildDataTrustPageView', () => {
    expect(src).toMatch(/await\s+buildDataTrustPageView/);
  });

  it('preserves the URL searchParams contract (tab + dataset)', () => {
    expect(src).toMatch(/searchParams/);
    expect(src).toContain('resolveDataTrustTab');
    expect(src).toContain('findDataTrustDataset');
  });
});

describe('ADMIN-DATA5 — wired view-model parity (fixture mode)', () => {
  let view: DataTrustPageView;

  beforeAll(async () => {
    view = await buildDataTrustPageView();
  });

  it('output shape preserves all 5 trust rungs', () => {
    expect(Object.keys(view.datasetsByRung).sort()).toEqual([
      'agent_usable',
      'available',
      'decision_grade',
      'loaded',
      'usable',
    ]);
  });

  it('datasetsByRung row counts match the adapter rows count', async () => {
    const adapterByRung = await getAdminDatasetsByRung('apex-retail');
    expect(view.datasetsByRung.loaded.length).toBe(adapterByRung.loaded.length);
    expect(view.datasetsByRung.available.length).toBe(adapterByRung.available.length);
    expect(view.datasetsByRung.usable.length).toBe(adapterByRung.usable.length);
    expect(view.datasetsByRung.agent_usable.length).toBe(adapterByRung.agent_usable.length);
    expect(view.datasetsByRung.decision_grade.length).toBe(adapterByRung.decision_grade.length);
  });

  it('decision_grade datasets remain approved + evidence-usable', () => {
    for (const d of view.datasetsByRung.decision_grade) {
      expect(d.approvalState).toBe('approved');
      expect(d.evidenceUsable).toBe(true);
    }
  });

  it('loaded datasets remain unapproved', () => {
    for (const d of view.datasetsByRung.loaded) {
      expect(d.approvalState).toBe('unapproved');
      expect(d.evidenceUsable).toBe(false);
    }
  });

  it('datasetDetailMap covers every adapter dataset id', async () => {
    const adapterByRung = await getAdminDatasetsByRung('apex-retail');
    const allIds: string[] = [
      ...adapterByRung.loaded,
      ...adapterByRung.available,
      ...adapterByRung.usable,
      ...adapterByRung.agent_usable,
      ...adapterByRung.decision_grade,
    ].map((r) => r.id);
    for (const id of allIds) {
      expect(view.datasetDetailMap[id]).toBeTruthy();
    }
  });

  it('every datasetDetailMap entry carries provenance + approvalOwner + notes', () => {
    for (const id of Object.keys(view.datasetDetailMap)) {
      const d = view.datasetDetailMap[id];
      expect(d.provenance.length).toBeGreaterThan(0);
      expect(d.approvalOwner).toBeTruthy();
      expect(d.notes).toBeTruthy();
    }
  });

  it('promotionRequests count matches the approvals adapter', async () => {
    const approvals = await getAdminDatasetApprovals('apex-retail');
    expect(view.promotionRequests.length).toBe(approvals.length);
  });

  it('promotionRequests pending / approved / rejected statuses present', () => {
    const statuses = new Set(view.promotionRequests.map((p) => p.status));
    expect(statuses.has('pending')).toBe(true);
    expect(statuses.has('approved')).toBe(true);
    expect(statuses.has('rejected')).toBe(true);
  });

  it('promotionRequests rows preserve legacy shape (document/engagement/org/category)', () => {
    for (const r of view.promotionRequests) {
      expect(r.id).toBeTruthy();
      expect(r.document).toBeTruthy();
      expect(r.engagement).toBeTruthy();
      expect(r.org).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(r.requestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('quality-score adapter returns one entry per dataset', async () => {
    const scores = await getAdminDatasetQualityScores('apex-retail');
    const adapterByRung = await getAdminDatasetsByRung('apex-retail');
    const totalDatasets =
      adapterByRung.loaded.length +
      adapterByRung.available.length +
      adapterByRung.usable.length +
      adapterByRung.agent_usable.length +
      adapterByRung.decision_grade.length;
    expect(scores.length).toBe(totalDatasets);
  });

  it('Approve / Add-policy actions remain hard-gated (Wave 27)', () => {
    const approve = view.actionStrip.find((a) => a.id === 'approve_dataset');
    const addPolicy = view.actionStrip.find((a) => a.id === 'add_policy');
    expect(approve?.status).toBe('hard_gated');
    expect(addPolicy?.status).toBe('hard_gated');
    expect(approve?.reason).toMatch(/Wave 27/);
    expect(addPolicy?.reason).toMatch(/Wave 27/);
  });

  it('does not contain banned hex tokens in the JSON snapshot', () => {
    const s = JSON.stringify(view).toLowerCase();
    expect(s).not.toContain('#14b8a6');
    expect(s).not.toContain('#7c3aed');
    expect(s).not.toContain('#d946ef');
    expect(s).not.toContain('sparkle');
  });

  it('preserves deterministicSeed: true (no live writes coupled in)', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('ladder concept rungs stay deterministic at 5', () => {
    expect(view.ladder.length).toBe(5);
    expect(view.ladder.map((r) => r.id)).toEqual([
      'loaded',
      'available',
      'usable',
      'agent_usable',
      'decision_grade',
    ]);
  });

  it('tabs remain at canonical 5 surfaces', () => {
    expect(view.tabs.length).toBe(5);
    const keys = view.tabs.map((t) => t.key).sort();
    expect(keys).toEqual([
      'audit_trail',
      'loaded_files',
      'promotion_queue',
      'quality_scorecard',
      'trust_ladder',
    ]);
  });
});
