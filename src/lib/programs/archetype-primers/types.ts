// PR-OV2-3a: Archetype primer pack contract.
//
// Source: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md Section
// D.0.6 (next-phase primer rendered at approval) plus D.0.3 / D.1.3
// (parameterized program-specific tables). The primer is the panel + HTML
// brief Nexus delivers at /programs/<id> the moment a tenant-admin approves
// a new program: it translates the brief into a Phase 1 plan the program
// lead can act on (outcome statement, SMEs, templates, workshops, data
// assets, prep checklist).
//
// This file ships the contract only. Per-archetype primer authoring (CDP
// ships in this slice; Contact Center AI / AMS Consolidation / Demand
// Forecasting follow in OV2-3a-CCAI / -AMS / -FORECAST) and the renderer +
// HTML export (OV2-3b / OV2-3c) are downstream slices.

/** When in P1 a role / data asset is engaged. */
export type PrimerEngagementWindow =
  | 'kickoff'
  | 'data-discovery'
  | 'baseline'
  | 'synthesis-prep';

export interface PrimerSME {
  /** Role title — e.g. 'Data Engineer', 'Privacy Counsel', 'Marketing Operations Lead'. */
  role: string;
  /** Why this role matters for THIS archetype's first phase. ≤ 1 sentence. */
  rationale: string;
  /** When in P1 they're needed. */
  neededAt: PrimerEngagementWindow;
  /** Optional escalation: who to ask if this role isn't already named on the team. */
  escalationHint?: string;
}

export type PrimerTemplateKind =
  | 'workshop_facilitator_guide'
  | 'interview_script'
  | 'capture_template'
  | 'baseline_spreadsheet'
  | 'document';

export interface PrimerTemplate {
  /** Stable id, kebab-case. */
  id: string;
  /** Human title. */
  title: string;
  /** What this template is. */
  kind: PrimerTemplateKind;
  /** ≤ 1 sentence on what the user does with this template. */
  description: string;
  /** Phase pack DoD item ids this template helps satisfy. */
  satisfiesEvidenceItems: string[];
}

export interface PrimerWorkshop {
  /** Stable id, kebab-case. */
  id: string;
  /** Workshop title — e.g. 'CDP data discovery workshop'. */
  title: string;
  /** ≤ 2 sentence description: who attends, what's the desired output. */
  description: string;
  /** Recommended duration. */
  durationHours: number;
  /** Roles that should attend (denormalized from primer.smes for convenience). */
  attendees: string[];
  /** Template ids this workshop uses (denormalized from primer.templates). */
  usesTemplates: string[];
}

export type PrimerDataAssetFormat =
  | 'CSV'
  | 'spreadsheet'
  | 'PDF'
  | 'text-summary'
  | 'structured-export';

export interface PrimerDataAsset {
  /** Stable id. */
  id: string;
  /** Human label — e.g. 'Customer master record sample' or 'Identity match-rate baseline'. */
  label: string;
  /** Why this data is needed in P1. */
  rationale: string;
  /** Suggested format. */
  format: PrimerDataAssetFormat;
  /** When in P1 the data is needed. */
  neededAt: PrimerEngagementWindow;
}

export interface PrimerPrepItem {
  id: string;
  label: string;
  rationale: string;
}

export interface ArchetypePrimer {
  /** Canonical pattern id, e.g. 'PAT-PRG-CDP-001'. Matches program-lifecycle-patterns.ts. */
  patternId: string;
  /** Display name used in UI, e.g. 'CDP Activation'. */
  displayName: string;
  /**
   * One-paragraph contextualized P1 outcome statement (≤ 4 sentences).
   * This OVERRIDES the generic P1 pack outcome on display, but the pack
   * remains the source of truth for evidence DoD.
   */
  p1OutcomeStatement: string;
  /** SMEs needed, in approximately the order they're engaged. */
  smes: PrimerSME[];
  /** Templates the agent surfaces inline as the user works through P1 steps. */
  templates: PrimerTemplate[];
  /** Workshops the agent recommends scheduling. */
  workshops: PrimerWorkshop[];
  /** Data assets the user should gather to bring into P1. */
  dataAssets: PrimerDataAsset[];
  /** Pre-P1 prep checklist — concrete actions the user takes BEFORE Phase 1 starts. */
  prepChecklist: ReadonlyArray<PrimerPrepItem>;
}
