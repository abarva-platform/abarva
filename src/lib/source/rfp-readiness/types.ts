// Source RFP Readiness — foundation contracts (PR-1).
//
// Extends the archetype framework (src/lib/source/archetypes) with the approved
// 4-mode section model. A section's DEFAULT mode is declared in config
// (RfpSectionDefinition); its EFFECTIVE mode + readiness status is computed against
// live governed evidence by resolveSectionReadiness — so the hard rule is enforced
// in code: missing evidence can never resolve to AUTO-GOVERNED.

/** The four generation modes for an RFP section. */
export type SectionMode =
  | 'auto_governed' // from governed, cited, agent_ready client evidence
  | 'auto_template' // reusable boilerplate/standard procurement language (no client facts)
  | 'elicit' // needs missing client-specific evidence — Nexus asks / upload / template
  | 'client_complete'; // client judgment / legal / procurement / commercial decision

/** Labels every section MUST carry — no silent weak sections. */
export type ReadinessStatus =
  | 'issue_ready'
  | 'preliminary'
  | 'evidence_missing'
  | 'client_to_complete'
  | 'legal_review_required'
  | 'procurement_review_required'
  | 'pricing_review_required'
  | 'blocked';

/** Disclosure tier — what may appear in a vendor-facing artifact vs internal only. */
export type DisclosureTier = 'vendor_facing' | 'internal_only' | 'aggregate_only';

export type ReviewKind = 'legal' | 'procurement' | 'pricing';
export type OutputArtifactType = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'html';

/** One declared input a section needs (maps to an archetype evidence family or a captured answer). */
export interface SectionInput {
  key: string; // e.g. 'ticket_volumes' (archetype family) or 'evaluation_weights'
  label: string;
  /** archetype evidence family this input is satisfied by, if any. */
  evidenceFamily?: string;
  /** when the input is client judgment/policy rather than capturable evidence. */
  clientDecision?: boolean;
}

/** Data-driven definition of an RFP section (superset config; rfp-canon consumes this). */
export interface RfpSectionDefinition {
  id: string;
  sectionNumber: number;
  title: string;
  description: string;
  archetype: string;
  defaultMode: SectionMode;
  disclosureTier: DisclosureTier;
  requiredInputs: SectionInput[];
  optionalInputs: SectionInput[];
  /** archetype evidence family keys this section draws on. */
  evidenceFamilies: string[];
  citationRequired: boolean;
  legalReviewRequired: boolean;
  procurementReviewRequired: boolean;
  pricingReviewRequired: boolean;
  clientCompleteAllowed: boolean;
  /** if true, a labelled preliminary draft may be produced from assumptions while evidence is missing. */
  preliminaryDraftAllowed: boolean;
  outputArtifactTypes: OutputArtifactType[];
}

/** Computed readiness for one section against live evidence. */
export interface RfpSectionReadiness {
  sectionId: string;
  sectionNumber: number;
  title: string;
  mode: SectionMode; // EFFECTIVE mode (may differ from defaultMode)
  readinessStatus: ReadinessStatus;
  completenessScore: number; // 0..1 over required inputs
  requiredInputs: string[];
  presentInputs: string[];
  missingInputs: string[];
  evidenceFamilies: string[];
  citedSources: string[];
  sourceBasis: string[];
  confidence: 'high' | 'medium' | 'low' | 'insufficient_evidence';
  assumptions: string[];
  clientToCompleteItems: string[];
  reviewsRequired: ReviewKind[];
  issueReady: boolean;
  preliminaryOnly: boolean;
  recommendedNextAction: string;
}

/** A concrete completion path for a missing evidence family (maps to the governed loader). */
export interface SourceIntakeEvidenceTemplate {
  evidenceFamily: string;
  templateId: string;
  templateName: string;
  acceptedFileTypes: string[];
  /** maps onto the context-ingestion ContextDimension + record_type routing. */
  targetContextDimension: string;
  targetRecordType: string;
  requiredColumns: string[];
  optionalColumns: string[];
  validationRules: string[];
  sampleRows: Record<string, string>[];
  affectedRfpSections: string[];
  readinessImpact: string;
}

/** A targeted question Nexus asks to capture a missing input. */
export interface NexusIntakeItem {
  questionId: string;
  sectionId: string;
  evidenceFamily?: string;
  priority: number; // 1 = highest
  questionText: string;
  whyItMatters: string;
  acceptableAnswerFormats: string[];
  acceptedUploadTypes: string[];
  downloadableTemplate?: string; // templateId
  canAnswerInChat: boolean;
  canUploadFile: boolean;
  canMarkClientComplete: boolean;
  canMarkAssumption: boolean;
  canSkipForPreliminaryDraft: boolean;
  impactIfMissing: string;
  ownerRoleSuggestion: string;
  targetContextDimension?: string;
  targetRecordType?: string;
}

/** Live evidence context passed to the resolver (sourced from buildSourceEvidenceReadiness + capture). */
export interface SectionResolutionContext {
  /** evidence families that are genuinely agent_ready (the allow-list). */
  agentReadyFamilies: Set<string>;
  /** captured client answers/inputs by key (user_attested, committed). */
  capturedInputs: Set<string>;
  /** review sign-offs already obtained, by kind. */
  reviewsSignedOff: Set<ReviewKind>;
  /** citation locators available per family (for citedSources). */
  citationsByFamily?: Record<string, string[]>;
  /** whether the operator opted into a preliminary (assumption-based) draft. */
  allowPreliminary?: boolean;
}
