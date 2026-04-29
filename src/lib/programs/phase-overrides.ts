// src/lib/programs/phase-overrides.ts
//
// In-memory demo store for program phase overrides.
// Persists within a single Node.js process lifetime (Vercel serverless = per
// warm instance, dev = until restart). Enough for demo use.
//
// Intentionally NOT a DB write — this is a demo affordance only.

import type { ProgramPhaseId } from './programs-types';

const overrides = new Map<string, ProgramPhaseId>();

export function getPhaseOverride(programId: string): ProgramPhaseId | undefined {
  return overrides.get(programId);
}

export function setPhaseOverride(programId: string, phase: ProgramPhaseId): void {
  overrides.set(programId, phase);
}
