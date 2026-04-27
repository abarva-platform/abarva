/**
 * W32B — Intelligence Programs Mode View Model
 *
 * Pure TypeScript read-model for the Intelligence "Programs" mode tab.
 * This view cross-references intelligence patterns to impacted program surfaces,
 * giving the user a direct navigational link from a detected pattern to the
 * relevant programme detail page.
 *
 * No React. No network calls. No model calls. Deterministic seed output only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntelligenceImpactedProgram {
  programCode: string;
  programName: string;
  impactSummary: string;
  patternIds: string[];
  sentinelSignal: string;
  evidenceBasis: string;
}

export interface IntelligenceProgramsMode {
  mode: 'programs';
  impactedPrograms: IntelligenceImpactedProgram[];
  lowContextDisclosure: string | null; // shown for thin/shell tenants
  deterministicSeed: true;
  caveat: string;
}

// ---------------------------------------------------------------------------
// Apex Retail seed data — 4 programs, each with intelligence signal
// ---------------------------------------------------------------------------

const APEX_RETAIL_IMPACTED_PROGRAMS: IntelligenceImpactedProgram[] = [
  {
    programCode: 'APX-CDP-2026',
    programName: 'Customer Data Platform',
    impactSummary:
      'Evidence gap detected: CDP activation decision requires confirmed data-sharing consent ' +
      'framework — not yet evidenced. Sentinel flagged a vendor assumption divergence between ' +
      'Workshop 4 commitments and current connector stubs.',
    patternIds: ['PAT-VENDOR-ASSUMPTION-DIVERGENCE', 'PAT-EVIDENCE-GAP-CDP'],
    sentinelSignal:
      'Vendor assumption divergence: Workshop 4 commitment vs. current connector state diverges ' +
      'on 2 of 4 data-sharing obligations.',
    evidenceBasis:
      'Deterministic Wave 2 seed — Workshop 4 notes, connector readiness stub, AMS BAFO gap analysis.',
  },
  {
    programCode: 'APX-AMS-2026',
    programName: 'AMS Outsourcing',
    impactSummary:
      'BAFO readiness gap: 2 of 4 AMS vendors have not submitted complete BAFO responses. ' +
      'SLA governance terms missing from procurement pack. Evaluation cannot proceed.',
    patternIds: ['PAT-BAFO-READINESS-GAP'],
    sentinelSignal:
      'BAFO deadline pressure: 2 vendors pending, SLA exception unresolved, evaluation stalled.',
    evidenceBasis:
      'Deterministic Wave 2 seed — AMS BAFO tracking document, SLA exception log.',
  },
  {
    programCode: 'APX-CAI-2026',
    programName: 'Contact Center AI',
    impactSummary:
      'Design phase gap: vendor evaluation criteria not finalised. Sentinel detected missing ' +
      'decision criteria evidence from Workshop 3.',
    patternIds: ['PAT-DESIGN-CRITERIA-GAP'],
    sentinelSignal:
      'Decision criteria gap: Workshop 3 evaluation matrix incomplete — 3 of 7 criteria missing evidence.',
    evidenceBasis:
      'Deterministic Wave 2 seed — Workshop 3 notes, evaluation matrix stub.',
  },
];

// ---------------------------------------------------------------------------
// Meridian (thin tenant) seed data
// ---------------------------------------------------------------------------

const MERIDIAN_IMPACTED_PROGRAMS: IntelligenceImpactedProgram[] = [
  {
    programCode: 'MER-AI-2026',
    programName: 'AI Operations Programme',
    impactSummary:
      'Limited intelligence available — this tenant has a thin evidence base. ' +
      'Pattern detection is indicative only.',
    patternIds: ['PAT-LOW-CONTEXT-SIGNAL'],
    sentinelSignal: 'Low-context signal: evidence base is insufficient for high-confidence pattern detection.',
    evidenceBasis:
      'Deterministic stub — Meridian tenant has limited seed data.',
  },
];

const LOW_CONTEXT_DISCLOSURE_MERIDIAN =
  'This tenant has a limited evidence base. Intelligence signals are indicative only and ' +
  'should not be used as a basis for programme decisions without additional evidence upload.';

const DETERMINISTIC_CAVEAT =
  'Programme impact signals are deterministic seed data — not live Sentinel analysis. ' +
  'Cross-references will update when runtime evidence ingestion is wired.';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the Intelligence Programs Mode view for the given tenant.
 */
export function buildIntelligenceProgramsModeView(
  tenantSlug: string,
): IntelligenceProgramsMode {
  if (tenantSlug === 'apex-retail') {
    return {
      mode: 'programs',
      impactedPrograms: APEX_RETAIL_IMPACTED_PROGRAMS,
      lowContextDisclosure: null,
      deterministicSeed: true,
      caveat: DETERMINISTIC_CAVEAT,
    };
  }

  if (tenantSlug === 'meridian') {
    return {
      mode: 'programs',
      impactedPrograms: MERIDIAN_IMPACTED_PROGRAMS,
      lowContextDisclosure: LOW_CONTEXT_DISCLOSURE_MERIDIAN,
      deterministicSeed: true,
      caveat: DETERMINISTIC_CAVEAT,
    };
  }

  // Unknown / shell tenant
  return {
    mode: 'programs',
    impactedPrograms: [],
    lowContextDisclosure:
      'No intelligence data is available for this tenant. ' +
      'Upload evidence to enable programme cross-referencing.',
    deterministicSeed: true,
    caveat: DETERMINISTIC_CAVEAT,
  };
}
