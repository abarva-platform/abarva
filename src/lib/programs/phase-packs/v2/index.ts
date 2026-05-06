/**
 * V2 Pack registry — registers all 6 V2 packs.
 *
 * T-D.2 §2 · v2/index.ts
 *
 * During migration (PHASE_PACK_V2=false): V1 packs serve chat requests.
 * After flag flip (PHASE_PACK_V2=true): V2 packs serve chat requests.
 */
import type { PhaseNumber, PhasePack } from '../types.v2';
import { P0_ORIGINATE_PACK } from './P0_originate.v2';
import { P1_CHARTER_PACK } from './P1_charter.v2';
import { P2_DIAGNOSE_PACK } from './P2_diagnose.v2';
import { P3_DESIGN_PACK } from './P3_design.v2';
import { P4_ROADMAP_PACK } from './P4_roadmap.v2';
import { P5_MOBILIZE_PACK } from './P5_mobilize.v2';

export const PACKS_V2: Record<PhaseNumber, PhasePack> = {
  0: P0_ORIGINATE_PACK,
  1: P1_CHARTER_PACK,
  2: P2_DIAGNOSE_PACK,
  3: P3_DESIGN_PACK,
  4: P4_ROADMAP_PACK,
  5: P5_MOBILIZE_PACK,
};

export function getPhasePackV2(phase: number | null | undefined): PhasePack | null {
  if (phase === null || phase === undefined) return null;
  if (phase < 0 || phase > 5) return null;
  return PACKS_V2[phase as PhaseNumber] ?? null;
}

export type { PhasePack as PhasePackV2, PhaseNumber } from '../types.v2';
