// PROG22 · Deliverables canvas interaction polish.
//
// Verifies the structural invariants added in PROG22:
//   1. ProgramDetailPage imports buildDeliverablesCanvasView
//   2. Deliverables section uses DeliverablesCanvas (testids present)
//   3. Each canvas item has disabled approve + export actions
//   4. Honest disclaimer present in deliverables section
//   5. deliverable-canvas-polish-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDeliverablesCanvasView } from '@/lib/programs/deliverable-canvas-polish-view';
import type { ProgramDetailView } from '@/lib/programs/programs-types';

const DETAIL_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/programs/deliverable-canvas-polish-view.ts',
);

const detailSrc = readFileSync(DETAIL_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── ProgramDetailPage · imports ─────────────────────────────────────────────

describe('PROG22 · ProgramDetailPage · deliverables canvas imports', () => {
  it('imports buildDeliverablesCanvasView', () => {
    expect(detailSrc).toContain("from '@/lib/programs/deliverable-canvas-polish-view'");
  });

  it('imports DeliverablesCanvasView type', () => {
    expect(detailSrc).toContain('DeliverablesCanvasView');
  });

  it('derives deliverablesCanvasView from view', () => {
    expect(detailSrc).toContain('buildDeliverablesCanvasView(view)');
  });
});

// ─── ProgramDetailPage · deliverables section testids ─────────────────────────

describe('PROG22 · ProgramDetailPage · deliverables canvas testids', () => {
  it('has data-testid="deliverables-canvas"', () => {
    expect(detailSrc).toContain('data-testid="deliverables-canvas"');
  });

  it('has data-testid="deliverable-canvas-item"', () => {
    expect(detailSrc).toContain('data-testid="deliverable-canvas-item"');
  });

  it('has data-testid="deliverable-approve-action"', () => {
    expect(detailSrc).toContain('data-testid="deliverable-approve-action"');
  });

  it('has data-testid="deliverable-export-action"', () => {
    expect(detailSrc).toContain('data-testid="deliverable-export-action"');
  });

  it('has data-testid="deliverables-canvas-disclaimer"', () => {
    expect(detailSrc).toContain('data-testid="deliverables-canvas-disclaimer"');
  });

  it('has data-honest-disclaimer="deliverables-canvas"', () => {
    expect(detailSrc).toContain('data-honest-disclaimer="deliverables-canvas"');
  });

  it('DeliverablesCanvas renders before fallback DeliverablesList', () => {
    const canvasIdx = detailSrc.indexOf('DeliverablesCanvas');
    const listIdx = detailSrc.indexOf('<DeliverablesList');
    expect(canvasIdx).toBeGreaterThan(0);
    expect(listIdx).toBeGreaterThan(0);
    // DeliverablesCanvas component definition comes before usage site
    expect(canvasIdx).toBeLessThan(listIdx);
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    expect(detailSrc).toContain('Deterministic seed');
  });
});

// ─── deliverable-canvas-polish-view · source audit ───────────────────────────

describe('PROG22 · deliverable-canvas-polish-view · source audit', () => {
  it('buildDeliverablesCanvasView is exported', () => {
    expect(libSrc).toContain('export function buildDeliverablesCanvasView');
  });

  it('DeliverablesCanvasView interface is exported', () => {
    expect(libSrc).toContain('export interface DeliverablesCanvasView');
  });

  it('DelCanvasItem interface is exported', () => {
    expect(libSrc).toContain('export interface DelCanvasItem');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });

  it('actions are always disabled (enabled: false)', () => {
    expect(libSrc).toContain('enabled: false');
  });
});

// ─── deliverable-canvas-polish-view · runtime contract ───────────────────────

const baseView: ProgramDetailView = {
  programId: 'apx-cdp-2026',
  displayId: 'APX-CDP-2026',
  name: 'Apex CDP',
  tenant: 'Apex Retail',
  currentPhase: 3,
  viewingPhase: 3,
  phases: [],
  gateStatus: 'pending',
  workbench: { title: '', prose: '', actionsLabel: '', actions: [] },
  agentRail: [],
  phasePanel: {
    deliverables: [
      { label: 'Architecture blueprint', status: 'done' },
      { label: 'Vendor contract review', status: 'pending' },
      { label: 'Privacy sign-off', status: 'blocked' },
    ],
    evidenceItems: [
      {
        id: 'e1',
        citation: 'Gate review · Apr 27 2026',
        source: 'Steward',
        excerpt: 'Architecture approved.',
        confidence: 'high',
      },
    ],
  },
  deterministicSeed: true,
};

const noDeliverables: ProgramDetailView = {
  ...baseView,
  phasePanel: {},
};

describe('PROG22 · deliverable-canvas-polish-view · runtime contract', () => {
  it('returns non-null when deliverables are present', () => {
    expect(buildDeliverablesCanvasView(baseView)).not.toBeNull();
  });

  it('returns null when no deliverables', () => {
    expect(buildDeliverablesCanvasView(noDeliverables)).toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(buildDeliverablesCanvasView(baseView)!.deterministicSeed).toBe(true);
  });

  it('totalCount matches input', () => {
    expect(buildDeliverablesCanvasView(baseView)!.totalCount).toBe(3);
  });

  it('doneCount, pendingCount, blockedCount are correct', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    expect(v.doneCount).toBe(1);
    expect(v.pendingCount).toBe(1);
    expect(v.blockedCount).toBe(1);
  });

  it('blocked items sort before pending before done', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const statuses = v.items.map((i) => i.status);
    expect(statuses[0]).toBe('blocked');
    expect(statuses[1]).toBe('pending');
    expect(statuses[2]).toBe('done');
  });

  it('done item has readiness trustworthy', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const doneItem = v.items.find((i) => i.status === 'done')!;
    expect(doneItem.readiness).toBe('trustworthy');
  });

  it('blocked item has readiness blocked', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const blockedItem = v.items.find((i) => i.status === 'blocked')!;
    expect(blockedItem.readiness).toBe('blocked');
  });

  it('pending item has readiness partial or missing_evidence', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const pendingItem = v.items.find((i) => i.status === 'pending')!;
    expect(['partial', 'missing_evidence']).toContain(pendingItem.readiness);
  });

  it('every item has exactly two disabled actions (approve + export)', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    v.items.forEach((item) => {
      expect(item.actions).toHaveLength(2);
      item.actions.forEach((a) => expect(a.enabled).toBe(false));
      const keys = item.actions.map((a) => a.key);
      expect(keys).toContain('approve');
      expect(keys).toContain('export');
    });
  });

  it('done item has evidence citations', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const doneItem = v.items.find((i) => i.status === 'done')!;
    expect(doneItem.evidenceCitations.length).toBeGreaterThan(0);
  });

  it('done item has no missingInputs', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const doneItem = v.items.find((i) => i.status === 'done')!;
    expect(doneItem.missingInputs).toHaveLength(0);
  });

  it('non-done items have missingInputs', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const nonDone = v.items.filter((i) => i.status !== 'done');
    nonDone.forEach((item) => {
      expect(item.missingInputs.length).toBeGreaterThan(0);
    });
  });

  it('every item has a non-empty nextAction', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    v.items.forEach((item) => {
      expect(item.nextAction.trim().length).toBeGreaterThan(0);
    });
  });

  it('canvasSummary is non-empty', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    expect(v.canvasSummary.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer mentions Deterministic seed', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    expect(v.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildDeliverablesCanvasView(baseView);
    const b = buildDeliverablesCanvasView(baseView);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('approve action reason mentions Steward', () => {
    const v = buildDeliverablesCanvasView(baseView)!;
    const approveAction = v.items[0].actions.find((a) => a.key === 'approve')!;
    expect(approveAction.reason.toLowerCase()).toContain('steward');
  });
});
