// Expert Kernel — the living Move, Apex back-compat shim.
//
// The living Move is now tenant-agnostic: the composer lives in
// `living-move.ts` and the three kernel-anchored cases (Apex, Meridian, First
// Capital) are resolved through the `living-move-cases.ts` registry — exactly
// as the Expert Review Console resolves its cases.
//
// This module is retained as a thin back-compat re-export for any importer
// still binding to the Apex-specific surface. New code should import the
// generic `buildLivingMoveCase(caseEntry, controls)` from `living-move.ts` and
// resolve a case through `resolveLivingMoveCase` / `LIVING_MOVE_CASES`.
//
// Pure module: deterministic, no I/O.

import {
  buildLivingMoveCase as buildLivingMoveCaseGeneric,
  defaultsFor,
  type LivingMoveCase,
  type LivingMoveControls,
} from './living-move';
import { LIVING_MOVE_CASES } from './living-move-cases';

export type {
  LivingMoveCase,
  LivingMoveControls,
  LivingWaterfallStep,
  LivingBridgeStep,
  LivingTornadoBar,
} from './living-move';

/** The grounded defaults — the Apex living Move opens on the audited case. */
export const LIVING_MOVE_DEFAULTS: LivingMoveControls = defaultsFor(
  LIVING_MOVE_CASES.apexretail,
);

/**
 * Recompile the Apex Contact Center living Move for a control setting.
 *
 * Back-compat wrapper — binds the generic composer to the Apex registry
 * entry. New code should call `buildLivingMoveCase(caseEntry, controls)` from
 * `living-move.ts` directly with a resolved registry entry.
 */
export function buildLivingMoveCase(
  controls: LivingMoveControls,
): LivingMoveCase {
  return buildLivingMoveCaseGeneric(LIVING_MOVE_CASES.apexretail, controls);
}
