// OV2-WIRE-CLIENT — BriefSnapshot is the subset of the origination brief
// that StewardChat ships in `surfaceContext.briefSnapshot` to /api/chat/agent.
// The route maps these fields to BriefOverlapInput and runs detectBriefOverlap.
// Only fields the route actually reads live here; do not extend without a
// matching read on the route side.

import type { ProgramBriefDraft } from './ProgramBriefPanel';

export interface BriefSnapshot {
  programName?: string;
  sponsor?: string;
  classification?: string;
  problemStatement?: string;
  lead?: string;
}

/**
 * Project the origination brief down to the snapshot shape consumed by
 * `/api/chat/agent`. Empty strings and `null` collapse to `undefined` so
 * the route's overlap detector only matches on fields the user has
 * actually filled in.
 */
export function buildBriefSnapshot(brief: ProgramBriefDraft): BriefSnapshot {
  return {
    programName: nonEmpty(brief.programName),
    sponsor: nonEmpty(brief.sponsor),
    classification: nonEmpty(brief.classification),
    problemStatement: nonEmpty(brief.problemStatement),
    lead: nonEmpty(brief.lead),
  };
}

function nonEmpty(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
