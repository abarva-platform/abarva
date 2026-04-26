import {
  buildFounderLiveWalkChecklist,
  type WalkStepStatus,
  type FounderLiveWalkChecklist,
} from '@/lib/qa/founder-live-walk-checklist';

const VALID_WALK_STEP_STATUSES: ReadonlySet<WalkStepStatus> = new Set<WalkStepStatus>([
  'pass',
  'fail',
  'deferred',
  'not_run',
]);

describe('LIVE1 founder live walk checklist — shape', () => {
  let checklist: FounderLiveWalkChecklist;

  beforeAll(() => {
    checklist = buildFounderLiveWalkChecklist();
  });

  it('buildFounderLiveWalkChecklist() returns a valid checklist', () => {
    expect(checklist).toBeDefined();
    expect(typeof checklist.version).toBe('string');
    expect(typeof checklist.generatedAt).toBe('string');
    expect(typeof checklist.totalSteps).toBe('number');
    expect(Array.isArray(checklist.steps)).toBe(true);
  });

  it('checklist has exactly 12 steps', () => {
    expect(checklist.steps).toHaveLength(12);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(checklist.generatedAt).toBe('2026-04-26');
  });

  it('every step has a non-empty id', () => {
    for (const step of checklist.steps) {
      expect(step.id.trim().length).toBeGreaterThan(0);
    }
  });

  it('every step has a non-empty route', () => {
    for (const step of checklist.steps) {
      expect(step.route.trim().length).toBeGreaterThan(0);
    }
  });

  it('every step has a non-empty purpose', () => {
    for (const step of checklist.steps) {
      expect(step.purpose.trim().length).toBeGreaterThan(0);
    }
  });

  it('every step has a non-empty whatToSay', () => {
    for (const step of checklist.steps) {
      expect(step.whatToSay.trim().length).toBeGreaterThan(0);
    }
  });

  it('every step has a non-empty expectedVisibleSignal', () => {
    for (const step of checklist.steps) {
      expect(step.expectedVisibleSignal.trim().length).toBeGreaterThan(0);
    }
  });

  it('every status is a valid WalkStepStatus value', () => {
    for (const step of checklist.steps) {
      expect(VALID_WALK_STEP_STATUSES.has(step.status)).toBe(true);
    }
  });

  it('all step IDs are unique', () => {
    const ids = checklist.steps.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every step has a non-empty fallbackIfBlocked', () => {
    for (const step of checklist.steps) {
      expect(step.fallbackIfBlocked.trim().length).toBeGreaterThan(0);
    }
  });

  it('every step has a non-empty readinessCaveat', () => {
    for (const step of checklist.steps) {
      expect(step.readinessCaveat.trim().length).toBeGreaterThan(0);
    }
  });

  it('totalSteps equals steps.length', () => {
    expect(checklist.totalSteps).toBe(checklist.steps.length);
  });
});

describe('LIVE1 founder live walk checklist — determinism', () => {
  it('buildFounderLiveWalkChecklist is byte-equal across calls', () => {
    const first = buildFounderLiveWalkChecklist();
    const second = buildFounderLiveWalkChecklist();
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });
});
