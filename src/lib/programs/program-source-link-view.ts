// PROG16 · Program Source Link View-model.
//
// Pure, deterministic view-model that surfaces the linked Source AMS
// event for a given program code. Used by SourceEventChip on the
// Program Flagship page to give the Maestro a compact commercial
// orientation signal.
//
// This module performs NO live execution, NO writes, NO model calls.
// Data is deterministic and seed-aligned. Live wiring is deferred.

export interface ProgramSourceLinkView {
  sourceEventId: string;            // "apex-retail-ams-outsourcing-2026"
  sourceEventName: string;          // "Application Management Services — Vendor Consolidation 2026"
  commercialReadinessState: string; // "pending_bafo_review"
  topCommercialBlocker: string;     // "BAFO responses incomplete — 2 vendors require follow-up"
  topBafoOpportunity: string;       // "Northstar Managed Services pricing gap: opportunity to negotiate managed services scope reduction"
  deterministicSeedCaveat: string;  // "Deterministic seed data. Not a live commercial signal."
  routeHint: string | null;         // "/source/events/apex-retail-ams-outsourcing-2026" or null
  deterministicSeed: true;
}

const APX_CDP_SOURCE_LINK: ProgramSourceLinkView = {
  sourceEventId: 'apex-retail-ams-outsourcing-2026',
  sourceEventName:
    'Application Management Services — Vendor Consolidation 2026',
  commercialReadinessState: 'pending_bafo_review',
  topCommercialBlocker:
    'BAFO responses incomplete — 2 vendors require follow-up',
  topBafoOpportunity:
    'Northstar Managed Services pricing gap: opportunity to negotiate managed services scope reduction',
  deterministicSeedCaveat:
    'Deterministic seed data. Not a live commercial signal.',
  routeHint: '/source/events/apex-retail-ams-outsourcing-2026',
  deterministicSeed: true,
};

/**
 * Returns the source event link view for a given program code,
 * or null if no source event is linked for that program.
 */
export function buildProgramSourceLinkView(
  programCode: string,
): ProgramSourceLinkView | null {
  if (programCode === 'APX-CDP-2026') {
    return { ...APX_CDP_SOURCE_LINK };
  }
  return null;
}
