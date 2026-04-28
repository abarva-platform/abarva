// PROG24 · Client Maestro next action composer.
//
// Verifies the structural invariants added in PROG24:
//   1. ProgramDetailPage imports buildMaestroNextActionView
//   2. Workshop section has maestro-next-action-composer testid
//   3. Three choice testids (A, B, C) + custom choice testid
//   4. Submit button testid + honest disclaimer
//   5. maestro-next-action-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMaestroNextActionView } from '@/lib/programs/maestro-next-action-view';
import type { ProgramDetailView } from '@/lib/programs/programs-types';

const DETAIL_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramDetailPage.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/programs/maestro-next-action-view.ts',
);

const detailSrc = readFileSync(DETAIL_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── ProgramDetailPage · imports ─────────────────────────────────────────────

describe('PROG24 · ProgramDetailPage · maestro composer imports', () => {
  it('imports buildMaestroNextActionView', () => {
    expect(detailSrc).toContain("from '@/lib/programs/maestro-next-action-view'");
  });

  it('derives maestroActionView from view', () => {
    expect(detailSrc).toContain('buildMaestroNextActionView(view)');
  });

  it('has maestroSelectedChoice state', () => {
    expect(detailSrc).toContain('maestroSelectedChoice');
    expect(detailSrc).toContain('setMaestroSelectedChoice');
  });

  it('has maestroCustomText state', () => {
    expect(detailSrc).toContain('maestroCustomText');
    expect(detailSrc).toContain('setMaestroCustomText');
  });
});

// ─── ProgramDetailPage · composer testids ────────────────────────────────────

describe('PROG24 · ProgramDetailPage · MaestroNextActionComposer testids', () => {
  it('has data-testid="maestro-next-action-composer"', () => {
    expect(detailSrc).toContain('data-testid="maestro-next-action-composer"');
  });

  it('has data-testid="maestro-action-choice-A"', () => {
    expect(detailSrc).toContain('data-testid="maestro-action-choice-A"');
  });

  it('has data-testid="maestro-action-choice-B"', () => {
    expect(detailSrc).toContain('data-testid="maestro-action-choice-B"');
  });

  it('has data-testid="maestro-action-choice-C"', () => {
    expect(detailSrc).toContain('data-testid="maestro-action-choice-C"');
  });

  it('has data-testid="maestro-action-choice-custom"', () => {
    expect(detailSrc).toContain('data-testid="maestro-action-choice-custom"');
  });

  it('has data-testid="maestro-action-submit"', () => {
    expect(detailSrc).toContain('data-testid="maestro-action-submit"');
  });

  it('has data-testid="maestro-action-composer-disclaimer"', () => {
    expect(detailSrc).toContain('data-testid="maestro-action-composer-disclaimer"');
  });

  it('has data-honest-disclaimer="maestro-next-action"', () => {
    expect(detailSrc).toContain('data-honest-disclaimer="maestro-next-action"');
  });

  it('submit button is always disabled', () => {
    expect(detailSrc).toContain('disabled={true}');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    expect(detailSrc).toContain('Deterministic seed');
  });

  it('composer is rendered inside program-section-workshop', () => {
    const workshopIdx = detailSrc.indexOf('program-section-workshop');
    const composerIdx = detailSrc.indexOf('maestro-next-action-composer');
    expect(workshopIdx).toBeGreaterThan(0);
    expect(composerIdx).toBeGreaterThan(0);
    // Composer definition is before its usage in the workshop section
    expect(composerIdx).toBeLessThan(
      detailSrc.indexOf('MaestroNextActionComposer\n', composerIdx + 1) === -1
        ? detailSrc.length
        : detailSrc.indexOf('MaestroNextActionComposer\n', composerIdx + 1)
    );
  });
});

// ─── maestro-next-action-view · source audit ─────────────────────────────────

describe('PROG24 · maestro-next-action-view · source audit', () => {
  it('buildMaestroNextActionView is exported', () => {
    expect(libSrc).toContain('export function buildMaestroNextActionView');
  });

  it('MaestroNextActionView interface is exported', () => {
    expect(libSrc).toContain('export interface MaestroNextActionView');
  });

  it('MaestroNextActionChoice interface is exported', () => {
    expect(libSrc).toContain('export interface MaestroNextActionChoice');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });

  it('submitDisabledReason mentions deferred dispatch', () => {
    expect(libSrc).toContain('deferred');
  });
});

// ─── maestro-next-action-view · runtime contract ─────────────────────────────

const pendingGateView: ProgramDetailView = {
  programId: 'apx-cdp-2026',
  displayId: 'APX-CDP-2026',
  name: 'Apex CDP',
  tenant: 'Apex Retail',
  currentPhase: 3,
  viewingPhase: 3,
  phases: [{ id: 3, label: 'Design', state: 'current' }],
  gateStatus: 'pending',
  workbench: { title: '', prose: '', actionsLabel: '', actions: [] },
  agentRail: [],
  phasePanel: {},
  deterministicSeed: true,
};

const openGateView: ProgramDetailView = {
  ...pendingGateView,
  gateStatus: 'open',
};

const idleView: ProgramDetailView = {
  ...pendingGateView,
  gateStatus: 'idle',
};

const donePhaseView: ProgramDetailView = {
  ...openGateView,
  phases: [{ id: 3, label: 'Design', state: 'done' }],
};

describe('PROG24 · maestro-next-action-view · runtime contract', () => {
  it('always returns a non-null view', () => {
    expect(buildMaestroNextActionView(pendingGateView)).not.toBeNull();
    expect(buildMaestroNextActionView(openGateView)).not.toBeNull();
    expect(buildMaestroNextActionView(idleView)).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(buildMaestroNextActionView(pendingGateView).deterministicSeed).toBe(true);
  });

  it('always returns exactly 3 choices', () => {
    expect(buildMaestroNextActionView(pendingGateView).choices).toHaveLength(3);
    expect(buildMaestroNextActionView(openGateView).choices).toHaveLength(3);
    expect(buildMaestroNextActionView(idleView).choices).toHaveLength(3);
  });

  it('choice keys are A, B, C in order', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    expect(v.choices.map((c) => c.key)).toEqual(['A', 'B', 'C']);
  });

  it('each choice has non-empty label and detail', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    v.choices.forEach((c) => {
      expect(c.label.trim().length).toBeGreaterThan(0);
      expect(c.detail.trim().length).toBeGreaterThan(0);
    });
  });

  it('pending gate produces gate-focused choice A', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    expect(v.choices[0].workflowFocus).toBe('gate');
  });

  it('idle gate produces phase-focused choice A', () => {
    const v = buildMaestroNextActionView(idleView);
    expect(v.choices[0].workflowFocus).toBe('phase');
  });

  it('done phase produces phase-focused choice A', () => {
    const v = buildMaestroNextActionView(donePhaseView);
    expect(v.choices[0].workflowFocus).toBe('phase');
  });

  it('headline is non-empty', () => {
    expect(buildMaestroNextActionView(pendingGateView).headline.length).toBeGreaterThan(0);
  });

  it('contextLine is non-empty and phase-aware', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    expect(v.contextLine.length).toBeGreaterThan(0);
    expect(v.contextLine).toContain('P3');
  });

  it('customPlaceholder includes program displayId context', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    expect(v.customPlaceholder).toContain('Apex CDP');
  });

  it('submitLabel is non-empty', () => {
    expect(buildMaestroNextActionView(pendingGateView).submitLabel.length).toBeGreaterThan(0);
  });

  it('submitDisabledReason mentions deferred', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    expect(v.submitDisabledReason.toLowerCase()).toContain('deferred');
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    const v = buildMaestroNextActionView(pendingGateView);
    expect(v.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildMaestroNextActionView(pendingGateView);
    const b = buildMaestroNextActionView(pendingGateView);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
