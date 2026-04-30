// P3 Design · OV2-5-P3 tests
//
// Locks in the 9-step decomposition added by slice OV2-5-P3. References:
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.3.4 — the
//     abbreviated step list (architecture expansion, vendor selection,
//     pilot-cohort design, CXO interview, dissenter re-engagement;
//     simple steps for cohort-name, criteria-lock, sign-off).
//   • docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md D.3.1 —
//     failures prevented by P3 (#5 operating-model, #6 governance, #7
//     vendor, #1 sponsor commitment).

import { P3_DESIGN } from '../P3_design';
import type { PhasePack } from '../types';
import { FAILURE_MODES } from '../../failure-modes';

const VALID_FAILURE_MODE_IDS = new Set(FAILURE_MODES.map((m) => m.id));

const EXPECTED_P3_STEP_IDS = [
  'p3-handoff-ingest',
  'p3-architecture-expansion',
  'p3-detailed-design',
  'p3-vendor-selection',
  'p3-pilot-cohort-design',
  'p3-cxo-interview',
  'p3-dissenter-engagement-2',
  'p3-findings-package',
  'p3-design-signoff',
] as const;

// Steps that involve genuine off-platform meetings and therefore expect a
// post-meeting upload. `p3-detailed-design` is complex but is iterative
// artifact composition (compose_artifact role), not a single uploadable
// meeting — so it is excluded.
const EXPECTED_UPLOAD_STEP_IDS = [
  'p3-architecture-expansion',
  'p3-vendor-selection',
  'p3-pilot-cohort-design',
  'p3-cxo-interview',
  'p3-dissenter-engagement-2',
] as const;

describe('P3 Design · PhasePack contract still satisfied', () => {
  it('P3_DESIGN conforms to PhasePack', () => {
    const pack: PhasePack = P3_DESIGN;
    expect(pack.phase).toBe(3);
    expect(pack.label).toBe('P3 Design');
    expect(pack.outcome.length).toBeGreaterThan(80);
    expect(Array.isArray(pack.definitionOfDone)).toBe(true);
    expect(Array.isArray(pack.antiPatterns)).toBe(true);
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });
});

describe('P3 Design · 9-step decomposition (D.3.4)', () => {
  it('declares exactly 9 steps with the canonical ids in order', () => {
    expect(P3_DESIGN.steps).toBeDefined();
    expect(P3_DESIGN.steps).toHaveLength(9);
    const ids = (P3_DESIGN.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([...EXPECTED_P3_STEP_IDS]);
  });

  it("every step's outputs reference a real DoD id (or are empty for intermediate artifacts)", () => {
    const dodIds = new Set(P3_DESIGN.definitionOfDone.map((d) => d.id));
    const steps = P3_DESIGN.steps ?? [];
    for (const s of steps) {
      // Empty arrays are allowed (intermediate-artifact producers); but if
      // any output id is present, it MUST match a real DoD id (no invented
      // ids).
      for (const out of s.outputs) {
        expect(dodIds.has(out)).toBe(true);
      }
    }
  });

  it('exactly 6 complex steps, all with intentCaptureRequired=true', () => {
    const steps = P3_DESIGN.steps ?? [];
    const complex = steps.filter((s) => s.complexity === 'complex');
    expect(complex).toHaveLength(6);
    for (const s of complex) {
      expect(s.intentCaptureRequired).toBe(true);
    }
  });

  it('exactly 3 simple steps, all with intentCaptureRequired=false', () => {
    const steps = P3_DESIGN.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    expect(simple).toHaveLength(3);
    for (const s of simple) {
      expect(s.intentCaptureRequired).toBe(false);
    }
  });

  it('the 5 workshop / interview steps have postMeetingUploadExpected=true', () => {
    const steps = P3_DESIGN.steps ?? [];
    const uploadSteps = steps
      .filter((s) => s.postMeetingUploadExpected)
      .map((s) => s.id)
      .sort();
    expect(uploadSteps).toEqual([...EXPECTED_UPLOAD_STEP_IDS].sort());
  });

  it('simple steps have postMeetingUploadExpected=false', () => {
    const steps = P3_DESIGN.steps ?? [];
    const simple = steps.filter((s) => s.complexity === 'simple');
    for (const s of simple) {
      expect(s.postMeetingUploadExpected).toBe(false);
    }
  });

  it('compose_artifact, extract, and request_approval steps have postMeetingUploadExpected=false', () => {
    const steps = P3_DESIGN.steps ?? [];
    const nonMeetingRoles = new Set([
      'compose_artifact',
      'extract',
      'request_approval',
    ]);
    for (const s of steps) {
      if (nonMeetingRoles.has(s.agentRole)) {
        expect(s.postMeetingUploadExpected).toBe(false);
      }
    }
  });

  it('the DAG is wired correctly', () => {
    const stepsById = new Map(
      (P3_DESIGN.steps ?? []).map((s) => [s.id, s] as const),
    );

    // p3-handoff-ingest is the DAG root (empty inputs).
    const handoff = stepsById.get('p3-handoff-ingest');
    expect(handoff).toBeDefined();
    expect(handoff!.inputs).toEqual([]);
    expect(handoff!.outputs).toContain('p2-target-state-path-carried-forward');

    // p3-architecture-expansion consumes the carry-forward.
    const archExp = stepsById.get('p3-architecture-expansion');
    expect(archExp).toBeDefined();
    expect(archExp!.inputs).toContain('p2-target-state-path-carried-forward');
    expect(archExp!.outputs).toContain('architecture-sketch-expanded');

    // p3-detailed-design consumes carry-forward + architecture expansion.
    const detailed = stepsById.get('p3-detailed-design');
    expect(detailed).toBeDefined();
    expect(detailed!.inputs).toContain('p2-target-state-path-carried-forward');
    expect(detailed!.inputs).toContain('architecture-sketch-expanded');

    // p3-vendor-selection runs in parallel from carry-forward.
    const vendor = stepsById.get('p3-vendor-selection');
    expect(vendor).toBeDefined();
    expect(vendor!.inputs).toContain('p2-target-state-path-carried-forward');

    // Pilot cohort design consumes the design draft (intermediate id).
    const pilot = stepsById.get('p3-pilot-cohort-design');
    expect(pilot).toBeDefined();
    expect(pilot!.inputs).toContain('p3-detailed-design-draft');
    expect(pilot!.outputs).toContain('pilot-cohort-named');
    expect(pilot!.outputs).toContain('success-criteria-locked');

    // CXO interview consumes the design draft.
    const cxo = stepsById.get('p3-cxo-interview');
    expect(cxo).toBeDefined();
    expect(cxo!.inputs).toContain('p3-detailed-design-draft');
    expect(cxo!.outputs).toContain('cxo-interview-complete');
    expect(cxo!.outputs).toContain('sponsor-commitment-confirmed');

    // Dissenter engagement-2 consumes the design draft.
    const dissenter = stepsById.get('p3-dissenter-engagement-2');
    expect(dissenter).toBeDefined();
    expect(dissenter!.inputs).toContain('p3-detailed-design-draft');
    expect(dissenter!.outputs).toContain('named-dissenter-engaged');

    // Findings package ingests substantive work + vendor selection
    // intermediate.
    const findings = stepsById.get('p3-findings-package');
    expect(findings).toBeDefined();
    expect(findings!.inputs).toContain('p3-detailed-design-draft');
    expect(findings!.inputs).toContain('architecture-sketch-expanded');
    expect(findings!.inputs).toContain('pilot-cohort-named');
    expect(findings!.inputs).toContain('success-criteria-locked');
    expect(findings!.inputs).toContain('cxo-interview-complete');
    expect(findings!.inputs).toContain('sponsor-commitment-confirmed');
    expect(findings!.inputs).toContain('named-dissenter-engaged');
    expect(findings!.inputs).toContain('p3-vendor-selection-complete');
    expect(findings!.outputs).toContain('phase-3-findings-written');

    // Design sign-off is the terminal node ingesting design draft + vendor
    // intermediate + cohort + criteria + sponsor commitment + dissenter.
    const signoff = stepsById.get('p3-design-signoff');
    expect(signoff).toBeDefined();
    expect(signoff!.inputs).toContain('p3-detailed-design-draft');
    expect(signoff!.inputs).toContain('architecture-sketch-expanded');
    expect(signoff!.inputs).toContain('pilot-cohort-named');
    expect(signoff!.inputs).toContain('success-criteria-locked');
    expect(signoff!.inputs).toContain('sponsor-commitment-confirmed');
    expect(signoff!.inputs).toContain('named-dissenter-engaged');
    expect(signoff!.inputs).toContain('p3-vendor-selection-complete');
    expect(signoff!.outputs).toContain('detailed-design-signed-off');
  });

  it('vendor_selection_approved is NOT listed as a step output (gate-check, not DoD)', () => {
    const steps = P3_DESIGN.steps ?? [];
    for (const s of steps) {
      expect(s.outputs).not.toContain('vendor_selection_approved');
      expect(s.outputs).not.toContain('vendor-selection-approved');
    }
  });

  it('every step has a non-empty preventsFailureModes drawn from valid ids (1..10)', () => {
    const steps = P3_DESIGN.steps ?? [];
    for (const s of steps) {
      expect(Array.isArray(s.preventsFailureModes)).toBe(true);
      expect(s.preventsFailureModes.length).toBeGreaterThan(0);
      for (const id of s.preventsFailureModes) {
        expect(VALID_FAILURE_MODE_IDS.has(id)).toBe(true);
        expect(id).toBeGreaterThanOrEqual(1);
        expect(id).toBeLessThanOrEqual(10);
      }
    }
  });

  it('p3-architecture-expansion preventsFailureModes contains 6 (governance / privacy / risk)', () => {
    const archExp = (P3_DESIGN.steps ?? []).find(
      (s) => s.id === 'p3-architecture-expansion',
    );
    expect(archExp).toBeDefined();
    expect(archExp!.preventsFailureModes).toContain(6);
  });

  it('p3-vendor-selection preventsFailureModes contains 7 (vendor / build-vs-buy)', () => {
    const vendor = (P3_DESIGN.steps ?? []).find(
      (s) => s.id === 'p3-vendor-selection',
    );
    expect(vendor).toBeDefined();
    expect(vendor!.preventsFailureModes).toContain(7);
  });

  it('p3-cxo-interview preventsFailureModes contains 1 (sponsor commitment)', () => {
    const cxo = (P3_DESIGN.steps ?? []).find(
      (s) => s.id === 'p3-cxo-interview',
    );
    expect(cxo).toBeDefined();
    expect(cxo!.preventsFailureModes).toContain(1);
  });

  it('templateRefs is an empty array for every step (primer templates authored separately)', () => {
    const steps = P3_DESIGN.steps ?? [];
    for (const s of steps) {
      expect(s.templateRefs).toEqual([]);
    }
  });

  it('agentRole values match the slice spec (request_approval for sign-off, coach_workshop for workshops, coach_interview for 1:1s, compose_artifact for drafting, extract for handoff)', () => {
    const stepsById = new Map(
      (P3_DESIGN.steps ?? []).map((s) => [s.id, s] as const),
    );
    expect(stepsById.get('p3-handoff-ingest')!.agentRole).toBe('extract');
    expect(stepsById.get('p3-architecture-expansion')!.agentRole).toBe(
      'coach_workshop',
    );
    expect(stepsById.get('p3-detailed-design')!.agentRole).toBe(
      'compose_artifact',
    );
    expect(stepsById.get('p3-vendor-selection')!.agentRole).toBe(
      'coach_workshop',
    );
    expect(stepsById.get('p3-pilot-cohort-design')!.agentRole).toBe(
      'coach_workshop',
    );
    expect(stepsById.get('p3-cxo-interview')!.agentRole).toBe(
      'coach_interview',
    );
    expect(stepsById.get('p3-dissenter-engagement-2')!.agentRole).toBe(
      'coach_interview',
    );
    expect(stepsById.get('p3-findings-package')!.agentRole).toBe(
      'compose_artifact',
    );
    expect(stepsById.get('p3-design-signoff')!.agentRole).toBe(
      'request_approval',
    );
  });
});
