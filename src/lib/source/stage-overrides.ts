// src/lib/source/stage-overrides.ts
//
// In-memory demo store for source event stage overrides.
// Persists within a single Node.js process lifetime (Vercel serverless = per
// warm instance, dev = until restart). Enough for demo use.
//
// Intentionally NOT a DB write — this is a demo affordance only.

import type { SourceStageKey } from './types';

const overrides = new Map<string, SourceStageKey>();

export function getStageOverride(eventId: string): SourceStageKey | undefined {
  return overrides.get(eventId);
}

export function setStageOverride(eventId: string, stageKey: SourceStageKey): void {
  overrides.set(eventId, stageKey);
}
