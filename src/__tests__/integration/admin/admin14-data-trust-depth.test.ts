/**
 * ADMIN14 — Data Trust depth tests.
 *
 * Pure TypeScript Jest tests for:
 *   - DataTrustPageView depth fields (tabs, datasetsByRung, datasetDetailMap,
 *     loadedFiles, promotionRequests, qualityScorecard, auditTrail,
 *     trustProgression, actionStrip)
 *   - resolveDataTrustTab + findDataTrustDataset helpers
 *   - Component module presence + key affordances
 *   - Hard-gated action visibility (disabled buttons w/ reason)
 *   - Legacy MERGE absorption: governance + quality content present
 *
 * No React rendering, no jsdom — fs scans + view-model invocation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildDataTrustPageView,
  resolveDataTrustTab,
  findDataTrustDataset,
  type DataTrustPageView,
  type DataTrustTabKey,
  type TrustRungKey,
} from '@/lib/admin/data-trust-page-view';

const root = process.cwd();

describe('ADMIN14 — Data Trust page-view depth', () => {
  let view: DataTrustPageView;

  beforeEach(async () => {
    view = await buildDataTrustPageView();
  });

  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('preserves the 5-rung ladder (legacy contract)', () => {
    expect(Array.isArray(view.ladder)).toBe(true);
    expect(view.ladder.length).toBe(5);
    const ids = view.ladder.map((r) => r.id);
    expect(ids).toEqual(['loaded', 'available', 'usable', 'agent_usable', 'decision_grade']);
  });

  it('exposes a tabs array with 5 tabs', () => {
    expect(Array.isArray(view.tabs)).toBe(true);
    expect(view.tabs.length).toBe(5);
  });

  it('tab keys match the canonical 5', () => {
    const keys = view.tabs.map((t) => t.key).sort();
    expect(keys).toEqual([
      'audit_trail',
      'loaded_files',
      'promotion_queue',
      'quality_scorecard',
      'trust_ladder',
    ]);
  });

  it('default tab is "trust_ladder"', () => {
    expect(view.defaultTab).toBe('trust_ladder');
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

  it('datasetsByRung covers all 5 rung keys', () => {
    const keys = Object.keys(view.datasetsByRung).sort();
    expect(keys).toEqual([
      'agent_usable',
      'available',
      'decision_grade',
      'loaded',
      'usable',
    ]);
  });

  it('every rung has at least one dataset', () => {
    for (const k of Object.keys(view.datasetsByRung) as TrustRungKey[]) {
      expect(view.datasetsByRung[k].length).toBeGreaterThan(0);
    }
  });

  it('dataset summary rows have required shape', () => {
    for (const items of Object.values(view.datasetsByRung)) {
      for (const d of items) {
        expect(d.id).toBeTruthy();
        expect(d.name).toBeTruthy();
        expect(d.owner).toBeTruthy();
        expect(d.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(['unapproved', 'requested', 'approved', 'revoked']).toContain(d.approvalState);
        expect(typeof d.evidenceUsable).toBe('boolean');
      }
    }
  });

  it('decision_grade datasets are all approved', () => {
    for (const d of view.datasetsByRung.decision_grade) {
      expect(d.approvalState).toBe('approved');
      expect(d.evidenceUsable).toBe(true);
    }
  });

  it('agent_usable datasets are all approved + evidence-usable', () => {
    for (const d of view.datasetsByRung.agent_usable) {
      expect(d.approvalState).toBe('approved');
      expect(d.evidenceUsable).toBe(true);
    }
  });

  it('loaded datasets are unapproved', () => {
    for (const d of view.datasetsByRung.loaded) {
      expect(d.approvalState).toBe('unapproved');
      expect(d.evidenceUsable).toBe(false);
    }
  });

  it('datasetDetailMap covers every dataset id', () => {
    const allIds = Object.values(view.datasetsByRung)
      .flat()
      .map((d) => d.id);
    for (const id of allIds) {
      expect(view.datasetDetailMap[id]).toBeTruthy();
    }
  });

  it('every dataset detail has provenance', () => {
    for (const id of Object.keys(view.datasetDetailMap)) {
      const detail = view.datasetDetailMap[id];
      expect(detail.provenance.length).toBeGreaterThan(0);
      expect(detail.approvalOwner).toBeTruthy();
      expect(detail.notes).toBeTruthy();
    }
  });

  it('approved datasets have a Wave-27-free notes line', () => {
    for (const id of Object.keys(view.datasetDetailMap)) {
      const detail = view.datasetDetailMap[id];
      if (detail.approvalState === 'approved') {
        expect(detail.notes.toLowerCase()).toContain('approved');
      } else {
        expect(detail.notes).toMatch(/Wave 27/);
      }
    }
  });

  it('loadedFiles is non-empty', () => {
    expect(view.loadedFiles.length).toBeGreaterThan(0);
  });

  it('loadedFiles segments include Business / IT / Third Party', () => {
    const segments = new Set(view.loadedFiles.map((f) => f.segment));
    expect(segments.has('Business')).toBe(true);
    expect(segments.has('IT & Technology')).toBe(true);
    expect(segments.has('Third Party')).toBe(true);
  });

  it('loadedFiles status values are canonical', () => {
    for (const f of view.loadedFiles) {
      expect(['approved', 'missing', 'processing']).toContain(f.status);
    }
  });

  it('promotionRequests has pending / approved / rejected entries', () => {
    const statuses = new Set(view.promotionRequests.map((p) => p.status));
    expect(statuses.has('pending')).toBe(true);
    expect(statuses.has('approved')).toBe(true);
    expect(statuses.has('rejected')).toBe(true);
  });

  it('promotionRequests rows have shape', () => {
    for (const p of view.promotionRequests) {
      expect(p.id).toBeTruthy();
      expect(p.document).toBeTruthy();
      expect(p.engagement).toBeTruthy();
      expect(p.org).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.requestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('qualityScorecard has 4 tenant rows', () => {
    expect(view.qualityScorecard.length).toBe(4);
  });

  it('qualityScorecard tenants include Apex / Meridian / FirstCapital / AbarVa', () => {
    const keys = view.qualityScorecard.map((r) => r.tenantKey).sort();
    expect(keys).toEqual(['abarva', 'apexretail', 'firstcapital', 'meridian']);
  });

  it('qualityScorecard rows have all 4 pillars', () => {
    for (const row of view.qualityScorecard) {
      expect(row.pillars.length).toBe(4);
      const pillars = row.pillars.map((p) => p.pillar).sort();
      expect(pillars).toEqual(['data', 'evidence', 'intelligence', 'knowledge']);
      for (const p of row.pillars) {
        expect(p.score).toBeGreaterThanOrEqual(0);
        expect(p.score).toBeLessThanOrEqual(100);
      }
      expect(row.overall).toBeGreaterThanOrEqual(0);
      expect(row.overall).toBeLessThanOrEqual(100);
    }
  });

  it('auditTrail has 20 entries (deterministic)', () => {
    expect(view.auditTrail.length).toBe(20);
  });

  it('auditTrail entries are well-formed', () => {
    for (const e of view.auditTrail) {
      expect(e.id).toBeTruthy();
      expect(e.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(e.actor).toBeTruthy();
      expect(e.role).toBeTruthy();
      expect(e.action).toBeTruthy();
    }
  });

  it('trustProgression has 30 daily points', () => {
    expect(view.trustProgression.length).toBe(30);
  });

  it('trustProgression points are deterministic, non-negative', () => {
    for (const p of view.trustProgression) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.loaded).toBeGreaterThanOrEqual(0);
      expect(p.available).toBeGreaterThanOrEqual(0);
      expect(p.usable).toBeGreaterThanOrEqual(0);
      expect(p.agent_usable).toBeGreaterThanOrEqual(0);
      expect(p.decision_grade).toBeGreaterThanOrEqual(0);
    }
  });

  it('actionStrip contains approve_dataset / add_policy / open_evidence_ledger / export_trust_report', () => {
    const ids = view.actionStrip.map((a) => a.id);
    expect(ids).toContain('approve_dataset');
    expect(ids).toContain('add_policy');
    expect(ids).toContain('open_evidence_ledger');
    expect(ids).toContain('export_trust_report');
  });

  it('approve_dataset action is hard_gated with a Wave-27 reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'approve_dataset');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('add_policy action is hard_gated with a Wave-27 reason', () => {
    const a = view.actionStrip.find((x) => x.id === 'add_policy');
    expect(a?.status).toBe('hard_gated');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('open_evidence_ledger action is safe + has href', () => {
    const a = view.actionStrip.find((x) => x.id === 'open_evidence_ledger');
    expect(a?.status).toBe('safe');
    expect(a?.href).toBeTruthy();
  });

  it('export_trust_report action is safe + has href', () => {
    const a = view.actionStrip.find((x) => x.id === 'export_trust_report');
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

  it('editorial body is non-empty (Steward wiring preserved)', () => {
    expect(view.editorial.body.length).toBeGreaterThan(0);
  });
});

describe('ADMIN14 — resolveDataTrustTab', () => {
  it('returns "trust_ladder" for undefined input', () => {
    expect(resolveDataTrustTab(undefined)).toBe('trust_ladder');
  });

  it('returns "trust_ladder" for empty string', () => {
    expect(resolveDataTrustTab('')).toBe('trust_ladder');
  });

  it('returns the canonical tab when given a valid key', () => {
    const keys: DataTrustTabKey[] = [
      'trust_ladder',
      'loaded_files',
      'promotion_queue',
      'quality_scorecard',
      'audit_trail',
    ];
    for (const k of keys) {
      expect(resolveDataTrustTab(k)).toBe(k);
    }
  });

  it('falls back to "trust_ladder" for an unknown key', () => {
    expect(resolveDataTrustTab('garbage')).toBe('trust_ladder');
    expect(resolveDataTrustTab('all')).toBe('trust_ladder');
  });
});

describe('ADMIN14 — findDataTrustDataset', () => {
  let view: DataTrustPageView;

  beforeAll(async () => {
    view = await buildDataTrustPageView();
  });

  it('returns null for undefined id', () => {
    expect(findDataTrustDataset(view, undefined)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(findDataTrustDataset(view, 'nope_999')).toBeNull();
  });

  it('returns the matching dataset detail for a valid id', () => {
    const firstId = Object.keys(view.datasetDetailMap)[0];
    const found = findDataTrustDataset(view, firstId);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(firstId);
  });
});

describe('ADMIN14 — Component modules exist', () => {
  const components = [
    'src/components/admin/DataTrustTabs.tsx',
    'src/components/admin/RungDatasetList.tsx',
    'src/components/admin/DatasetDetailDrawer.tsx',
    'src/components/admin/DataGovernancePanel.tsx',
    'src/components/admin/DataQualityPanel.tsx',
    'src/components/admin/DataTrustActionStrip.tsx',
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

describe('ADMIN14 — Action strip + drawer hard-gated affordances', () => {
  it('DataTrustActionStrip renders disabled approve / add policy buttons with reason', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/DataTrustActionStrip.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('hard_gated');
  });

  it('DatasetDetailDrawer renders a disabled Approve button with reason', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/DatasetDetailDrawer.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('Approve dataset');
    expect(src).toMatch(/Wave 27/);
  });

  it('DataGovernancePanel renders disabled Approve / Reject buttons for pending rows', () => {
    const src = readFileSync(
      resolve(root, 'src/components/admin/DataGovernancePanel.tsx'),
      'utf8',
    );
    expect(src).toContain('disabled');
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('Approve');
    expect(src).toContain('Reject');
    expect(src).toMatch(/Wave 27/);
  });
});

describe('ADMIN14 — Page integration', () => {
  it('page.tsx imports the new tab + drawer + panel components', () => {
    const src = readFileSync(
      resolve(root, 'src/app/(maestro)/admin/data-trust/page.tsx'),
      'utf8',
    );
    expect(src).toContain('DataTrustTabs');
    expect(src).toContain('RungDatasetList');
    expect(src).toContain('DatasetDetailDrawer');
    expect(src).toContain('DataGovernancePanel');
    expect(src).toContain('DataQualityPanel');
    expect(src).toContain('DataTrustActionStrip');
  });

  it('page.tsx wires resolveDataTrustTab + findDataTrustDataset', () => {
    const src = readFileSync(
      resolve(root, 'src/app/(maestro)/admin/data-trust/page.tsx'),
      'utf8',
    );
    expect(src).toContain('resolveDataTrustTab');
    expect(src).toContain('findDataTrustDataset');
  });
});

describe('ADMIN14 — Legacy MERGE absorption', () => {
  it('promotion-queue tab content is absorbed (legacy /platform/admin/data-governance type)', async () => {
    const view = await buildDataTrustPageView();
    // Type/shape from legacy: id, document, engagement, org, category, status
    const r = view.promotionRequests[0];
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('document');
    expect(r).toHaveProperty('engagement');
    expect(r).toHaveProperty('org');
    expect(r).toHaveProperty('category');
    expect(r).toHaveProperty('status');
  });

  it('quality-scorecard tab content is absorbed (legacy /platform/admin/quality 4×4 grid)', async () => {
    const view = await buildDataTrustPageView();
    expect(view.qualityScorecard.length).toBe(4); // 4 tenants
    expect(view.qualityScorecard[0].pillars.length).toBe(4); // 4 pillars
  });

  it('loaded-files tab content is absorbed (legacy /platform/admin/data file list)', async () => {
    const view = await buildDataTrustPageView();
    // Type/shape from legacy: name, owner, segment, category, status
    const f = view.loadedFiles[0];
    expect(f).toHaveProperty('name');
    expect(f).toHaveProperty('owner');
    expect(f).toHaveProperty('segment');
    expect(f).toHaveProperty('category');
    expect(f).toHaveProperty('status');
  });
});
