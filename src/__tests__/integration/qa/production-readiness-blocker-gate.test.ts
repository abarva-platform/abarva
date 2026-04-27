// PROD9 — Production Readiness Live Gate Enforcement
//
// Verifies that getEffectiveDisplayStatus returns 'blocked' for components
// with blockerCount > 0 and a "passing" status — preventing a green badge
// from appearing on a component that has open blockers.

import {
  getEffectiveDisplayStatus,
  PRODUCTION_READINESS_STATUSES,
  type ProductionReadinessStatus,
} from '@/lib/admin/production-readiness';

// ---------------------------------------------------------------------------
// Statuses that should be overridden to 'blocked' when blockerCount > 0
// ---------------------------------------------------------------------------

const PASSING_STATUSES: ReadonlyArray<ProductionReadinessStatus> = [
  'tested',
  'full_flow_ready',
  'pilot_ready',
  'production_ready',
];

// Statuses that should NOT be overridden (already non-green or neutral)
const NON_PASSING_STATUSES: ReadonlyArray<ProductionReadinessStatus> = [
  'not_started',
  'scaffolded',
  'code_complete',
  'blocked',
];

// ---------------------------------------------------------------------------
// Core enforcement: passing status + blockers → blocked
// ---------------------------------------------------------------------------

describe('PROD9 — getEffectiveDisplayStatus: passing status with blockers becomes blocked', () => {
  for (const status of PASSING_STATUSES) {
    it(`status "${status}" with 1 blocker → "blocked"`, () => {
      expect(getEffectiveDisplayStatus(status, 1)).toBe('blocked');
    });

    it(`status "${status}" with 3 blockers → "blocked"`, () => {
      expect(getEffectiveDisplayStatus(status, 3)).toBe('blocked');
    });
  }
});

// ---------------------------------------------------------------------------
// No override: passing status with 0 blockers stays unchanged
// ---------------------------------------------------------------------------

describe('PROD9 — getEffectiveDisplayStatus: passing status with 0 blockers stays unchanged', () => {
  for (const status of PASSING_STATUSES) {
    it(`status "${status}" with 0 blockers stays "${status}"`, () => {
      expect(getEffectiveDisplayStatus(status, 0)).toBe(status);
    });
  }
});

// ---------------------------------------------------------------------------
// No override: non-passing status with blockers stays unchanged
// ---------------------------------------------------------------------------

describe('PROD9 — getEffectiveDisplayStatus: non-passing status with blockers stays unchanged', () => {
  for (const status of NON_PASSING_STATUSES) {
    it(`status "${status}" with 2 blockers stays "${status}"`, () => {
      expect(getEffectiveDisplayStatus(status, 2)).toBe(status);
    });
  }
});

// ---------------------------------------------------------------------------
// Identity: 0 blockers → always returns input status unchanged
// ---------------------------------------------------------------------------

describe('PROD9 — getEffectiveDisplayStatus: 0 blockers always returns input status', () => {
  for (const status of PRODUCTION_READINESS_STATUSES) {
    it(`status "${status}" with 0 blockers is unchanged`, () => {
      expect(getEffectiveDisplayStatus(status as ProductionReadinessStatus, 0)).toBe(status);
    });
  }
});

// ---------------------------------------------------------------------------
// Type safety: output is always a valid ProductionReadinessStatus
// ---------------------------------------------------------------------------

describe('PROD9 — getEffectiveDisplayStatus: output is always a valid status', () => {
  const VALID = new Set(PRODUCTION_READINESS_STATUSES);

  const testCases: ReadonlyArray<[ProductionReadinessStatus, number]> = [
    ['production_ready', 0],
    ['production_ready', 1],
    ['pilot_ready', 0],
    ['pilot_ready', 5],
    ['blocked', 0],
    ['blocked', 1],
    ['not_started', 0],
    ['code_complete', 2],
  ];

  for (const [status, blockerCount] of testCases) {
    it(`getEffectiveDisplayStatus(${status}, ${blockerCount}) returns a valid status`, () => {
      const result = getEffectiveDisplayStatus(status, blockerCount);
      expect(VALID.has(result)).toBe(true);
    });
  }
});
