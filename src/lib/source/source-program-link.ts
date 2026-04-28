// LINK1 — Source Program Link Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SourceProgramLinkType =
  | 'commercial_event_supports_program'
  | 'vendor_selection_informs_delivery'
  | 'bafo_outcome_enables_program_value'
  | 'procurement_risk_impacts_program_timeline';

export type SourceProgramLinkStatus =
  | 'deterministic_seed'
  | 'live_pending'
  | 'evidence_confirmed'
  | 'deferred';

export type SourceProgramLinkEvidenceBasis =
  | 'deterministic_demo_seed'
  | 'live_vendor_response'
  | 'confirmed_procurement_decision'
  | 'deferred_pending_bafo';

export interface SourceProgramLink {
  id: string;
  tenantSlug: string;
  sourceEventId: string;
  linkedProgramCode: string;
  linkType: SourceProgramLinkType;
  status: SourceProgramLinkStatus;
  evidenceBasis: SourceProgramLinkEvidenceBasis;
  rationale: string;
  missingInputs: string[];
  deterministicSeed: true;
  createdAt: string;
}

export interface SourceProgramLinkSummary {
  tenantSlug: string;
  totalLinks: number;
  confirmedLinks: number;
  deferredLinks: number;
  links: SourceProgramLink[];
  evidenceCaveat: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export function buildSourceProgramLinks(): SourceProgramLink[] {
  return [
    {
      id: 'link-apex-retail-ams-cdp-2026',
      tenantSlug: 'apex-retail',
      sourceEventId: 'apex-retail-ams-outsourcing-2026',
      linkedProgramCode: 'APX-CDP-2026',
      linkType: 'commercial_event_supports_program',
      status: 'deterministic_seed',
      evidenceBasis: 'deterministic_demo_seed',
      rationale:
        'The AMS vendor consolidation sourcing event informs programme delivery readiness, commercial staffing assumptions, value hypothesis evidence, and operational risk profile for the CDP Activation programme.',
      missingInputs: [
        'Live vendor response ingestion',
        'Final BAFO response package',
        'Approved pricing evidence',
        'Client procurement owner confirmation',
      ],
      deterministicSeed: true,
      createdAt: '2026-04-26T00:00:00.000Z',
    },
  ];
}

export function getLinksForProgram(programCode: string): SourceProgramLink[] {
  return buildSourceProgramLinks().filter(
    (link) => link.linkedProgramCode === programCode,
  );
}

export function getLinksForSourceEvent(
  sourceEventId: string,
): SourceProgramLink[] {
  return buildSourceProgramLinks().filter(
    (link) => link.sourceEventId === sourceEventId,
  );
}

export function summarizeSourceProgramLinks(
  links: SourceProgramLink[],
): SourceProgramLinkSummary {
  const tenantSlug =
    links.length > 0 ? links[0].tenantSlug : 'unknown';
  const confirmedLinks = links.filter(
    (l) => l.status === 'evidence_confirmed',
  ).length;
  const deferredLinks = links.filter(
    (l) => l.status === 'deferred',
  ).length;

  return {
    tenantSlug,
    totalLinks: links.length,
    confirmedLinks,
    deferredLinks,
    links,
    evidenceCaveat:
      'All links are deterministic seed data. No live procurement decision has been made. Link is advisory and read-model only.',
  };
}
