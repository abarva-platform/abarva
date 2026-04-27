// LINK2 — CDP Program Reverse Source Event Link View Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.
//
// This is the reverse of ProgramSourceLinkView (PROG16/LINK1).
// It surfaces from the CDP program page: "This programme is supported by the AMS Outsourcing 2026 event."

export interface CdpSourceReverseLinkView {
  programCode: string;          // "APX-CDP-2026"
  programName: string;          // "CDP Implementation"
  tenantSlug: string;           // "apex-retail"
  sourceEventId: string;        // "apex-retail-ams-outsourcing-2026"
  sourceEventName: string;      // "AMS Outsourcing 2026"
  sourceEventStage: string;     // "Orals/BAFO"
  commercialRisk: string;       // Human-readable risk summary
  routeHint: string | null;     // "/source/events/apex-retail-ams-outsourcing-2026"
  evidenceCaveat: string;
  deterministicSeed: true;
}

const APX_CDP_REVERSE_LINK: CdpSourceReverseLinkView = {
  programCode: 'APX-CDP-2026',
  programName: 'CDP Implementation',
  tenantSlug: 'apex-retail',
  sourceEventId: 'apex-retail-ams-outsourcing-2026',
  sourceEventName: 'AMS Outsourcing 2026',
  sourceEventStage: 'Orals/BAFO',
  commercialRisk:
    'AMS vendor selection outcome affects CDP delivery resourcing. Selection slip past June 2026 compresses the CDP Q3 integration window.',
  routeHint: '/source/events/apex-retail-ams-outsourcing-2026',
  evidenceCaveat:
    'Deterministic seed data. No live procurement decision has been made. Link is advisory and read-model only.',
  deterministicSeed: true,
};

/**
 * Returns the reverse source-event link for a given program code.
 * Returns null if the program has no linked source event.
 */
export function buildCdpSourceReverseLinkView(
  programCode: string,
): CdpSourceReverseLinkView | null {
  if (programCode === 'APX-CDP-2026') {
    return { ...APX_CDP_REVERSE_LINK };
  }
  return null;
}
