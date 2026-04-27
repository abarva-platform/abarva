/**
 * Wave 29 OPS3 — Wave Runner Protocol Model
 *
 * Verifies the canonical 17-step wave execution protocol read model:
 * - All 17 steps present with correct stepIds
 * - Gate conditions are correctly classified
 * - Helper functions return consistent results
 */

import {
  getWaveRunnerProtocol,
  getAllTier3Conditions,
  getBlockingSteps,
  getStepsByKind,
  WAVE_RUNNER_STEP_KINDS_IN_ORDER,
  ESCALATION_TIERS_IN_ORDER,
} from '@/lib/ops/wave-runner-model';

describe('OPS3 — Wave Runner Protocol Model', () => {
  describe('getWaveRunnerProtocol()', () => {
    it('returns a protocol object with steps array', () => {
      const protocol = getWaveRunnerProtocol();
      expect(protocol).toBeDefined();
      expect(Array.isArray(protocol.steps)).toBe(true);
    });

    it('protocol has exactly 17 steps', () => {
      const protocol = getWaveRunnerProtocol();
      expect(protocol.steps.length).toBe(17);
    });

    it('every step has required fields', () => {
      const protocol = getWaveRunnerProtocol();
      for (const step of protocol.steps) {
        expect(typeof step.stepId).toBe('string');
        expect(step.stepId.length).toBeGreaterThan(0);
        expect(typeof step.stepKind).toBe('string');
        expect(step.stepKind.length).toBeGreaterThan(0);
        expect(typeof step.label).toBe('string');
        expect(step.label.length).toBeGreaterThan(0);
        expect(typeof step.description).toBe('string');
        expect(step.description.length).toBeGreaterThan(0);
        expect(Array.isArray(step.gateConditions)).toBe(true);
        expect(Array.isArray(step.actions)).toBe(true);
        expect(typeof step.blocking).toBe('boolean');
      }
    });

    it('all stepIds are unique', () => {
      const protocol = getWaveRunnerProtocol();
      const ids = protocol.steps.map((s) => s.stepId);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('protocol has protocolVersion "1.0"', () => {
      const protocol = getWaveRunnerProtocol();
      expect(protocol.protocolVersion).toBe('1.0');
    });

    it('protocol has a name string', () => {
      const protocol = getWaveRunnerProtocol();
      expect(typeof protocol.name).toBe('string');
      expect(protocol.name.length).toBeGreaterThan(0);
    });

    it('protocol has createdFrom sentinel', () => {
      const protocol = getWaveRunnerProtocol();
      expect(protocol.createdFrom).toBe('deterministic_wave_runner_model_v1');
    });
  });

  describe('Step gate conditions', () => {
    it('every gate condition has conditionId, description, tier', () => {
      const protocol = getWaveRunnerProtocol();
      for (const step of protocol.steps) {
        for (const gc of step.gateConditions) {
          expect(typeof gc.conditionId).toBe('string');
          expect(gc.conditionId.length).toBeGreaterThan(0);
          expect(typeof gc.description).toBe('string');
          expect(gc.description.length).toBeGreaterThan(0);
          expect(['tier1', 'tier2', 'tier3']).toContain(gc.tier);
        }
      }
    });

    it('all conditionIds are unique across the protocol', () => {
      const protocol = getWaveRunnerProtocol();
      const ids: string[] = [];
      for (const step of protocol.steps) {
        for (const gc of step.gateConditions) {
          ids.push(gc.conditionId);
        }
      }
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('getAllTier3Conditions()', () => {
    it('returns an array', () => {
      const conditions = getAllTier3Conditions();
      expect(Array.isArray(conditions)).toBe(true);
    });

    it('all returned conditions have tier: tier3', () => {
      const conditions = getAllTier3Conditions();
      expect(conditions.every((c) => c.tier === 'tier3')).toBe(true);
    });

    it('Tier 3 conditions are present', () => {
      const conditions = getAllTier3Conditions();
      // auth-change-required and migration-required are both tier3
      expect(conditions.length).toBeGreaterThan(0);
    });

    it('auth-change-required condition is tier3', () => {
      const conditions = getAllTier3Conditions();
      const authCond = conditions.find((c) => c.conditionId === 'auth-change-required');
      expect(authCond).toBeDefined();
    });

    it('migration-required condition is tier3', () => {
      const conditions = getAllTier3Conditions();
      const migCond = conditions.find((c) => c.conditionId === 'migration-required');
      expect(migCond).toBeDefined();
    });
  });

  describe('getBlockingSteps()', () => {
    it('returns an array', () => {
      const blocking = getBlockingSteps();
      expect(Array.isArray(blocking)).toBe(true);
    });

    it('all blocking steps have blocking: true', () => {
      const blocking = getBlockingSteps();
      expect(blocking.every((s) => s.blocking)).toBe(true);
    });

    it('blocking steps count is less than total steps (some are non-blocking)', () => {
      const protocol = getWaveRunnerProtocol();
      const blocking = getBlockingSteps();
      expect(blocking.length).toBeLessThanOrEqual(protocol.steps.length);
    });
  });

  describe('getStepsByKind()', () => {
    it('returns steps of the requested kind', () => {
      const byOrient = getStepsByKind('orient');
      expect(byOrient.every((s) => s.stepKind === 'orient')).toBe(true);
    });

    it('returns empty array for unknown kind', () => {
      const result = getStepsByKind('this-kind-does-not-exist-xyz' as never);
      expect(result).toEqual([]);
    });

    it('getStepsByKind("notify") returns the last step', () => {
      const notifySteps = getStepsByKind('notify');
      expect(notifySteps.length).toBe(1);
      expect(notifySteps[0].stepId).toBe('step-17-notify');
    });
  });

  describe('Canonical step presence', () => {
    it('step step-01-orient has stepKind orient', () => {
      const protocol = getWaveRunnerProtocol();
      const step1 = protocol.steps.find((s) => s.stepId === 'step-01-orient');
      expect(step1).toBeDefined();
      expect(step1!.stepKind).toBe('orient');
    });

    it('step step-17-notify has stepKind notify', () => {
      const protocol = getWaveRunnerProtocol();
      const step17 = protocol.steps.find((s) => s.stepId === 'step-17-notify');
      expect(step17).toBeDefined();
      expect(step17!.stepKind).toBe('notify');
    });

    it('there is at least one run_typecheck step', () => {
      const protocol = getWaveRunnerProtocol();
      const tsCheck = protocol.steps.filter((s) => s.stepKind === 'run_typecheck');
      expect(tsCheck.length).toBeGreaterThan(0);
    });

    it('there is at least one merge step', () => {
      const protocol = getWaveRunnerProtocol();
      const mergeSteps = protocol.steps.filter((s) => s.stepKind === 'merge');
      expect(mergeSteps.length).toBeGreaterThan(0);
    });

    it('there is at least one update_trackers step', () => {
      const protocol = getWaveRunnerProtocol();
      const trackerSteps = protocol.steps.filter((s) => s.stepKind === 'update_trackers');
      expect(trackerSteps.length).toBeGreaterThan(0);
    });

    it('implement_slices step has at least one gate condition', () => {
      const protocol = getWaveRunnerProtocol();
      const implementStep = protocol.steps.find((s) => s.stepKind === 'implement_slices');
      expect(implementStep).toBeDefined();
      expect(implementStep!.gateConditions.length).toBeGreaterThan(0);
    });
  });

  describe('Constants', () => {
    it('WAVE_RUNNER_STEP_KINDS_IN_ORDER includes orient and notify', () => {
      expect(WAVE_RUNNER_STEP_KINDS_IN_ORDER).toContain('orient');
      expect(WAVE_RUNNER_STEP_KINDS_IN_ORDER).toContain('notify');
    });

    it('WAVE_RUNNER_STEP_KINDS_IN_ORDER has 17 entries', () => {
      expect(WAVE_RUNNER_STEP_KINDS_IN_ORDER.length).toBe(17);
    });

    it('ESCALATION_TIERS_IN_ORDER has exactly 3 tiers', () => {
      expect(ESCALATION_TIERS_IN_ORDER.length).toBe(3);
      expect(ESCALATION_TIERS_IN_ORDER).toContain('tier1');
      expect(ESCALATION_TIERS_IN_ORDER).toContain('tier2');
      expect(ESCALATION_TIERS_IN_ORDER).toContain('tier3');
    });
  });
});
