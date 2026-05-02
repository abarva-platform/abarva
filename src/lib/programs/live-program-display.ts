import type { ProgramPhaseId } from '@/lib/programs/programs-types';

export function getLiveProgramDisplayId(currentPhase: ProgramPhaseId): string {
  return `LIVE-P${currentPhase}`;
}
